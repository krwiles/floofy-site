"""Shared test setup: import paths, fake database, fake email sender, and a Lambda loader.

Nothing here touches the network: the database connection and `resend.Emails.send` are replaced per test.
"""

import importlib.util
import json
import re
import sys
from pathlib import Path

import pytest
import resend

LAMBDA_ROOT = Path(__file__).resolve().parent.parent

# Put shared/ on the import path, the same way build.sh puts its files beside each lambda_function.py.
sys.path.insert(0, str(LAMBDA_ROOT / "shared"))

TEST_SECRET = "test-secret-that-is-long-enough-to-pass-the-length-check"
TEST_ADMIN_URL = "https://admin.example/"


def normalise_sql(query):
    """Collapse whitespace so tests can match SQL fragments regardless of indentation."""
    return " ".join(query.split())


class FakeCursor:
    """Stands in for a psycopg cursor: records every query and answers from scripted rules."""

    def __init__(self):
        # Every query run so far, the scripted answers, and the last query's results.
        self.executed = []
        self.rules = []
        self.rowcount = -1
        self._rows = []

    def on(self, fragment, rows=(), rowcount=None):
        """Answer any query containing `fragment` with `rows` (later rules win over earlier ones)."""
        self.rules.append((fragment, list(rows), rowcount))

    def execute(self, query, params=None):
        # Record the call so tests can assert on the exact SQL and parameters.
        sql = normalise_sql(query)
        self.executed.append((sql, params))

        # Answer from the newest matching rule; unmatched queries return no rows.
        for fragment, rows, rowcount in reversed(self.rules):
            if fragment in sql:
                self._rows = list(rows)
                self.rowcount = len(rows) if rowcount is None else rowcount
                return
        self._rows = []
        self.rowcount = 0

    def fetchone(self):
        # The first row of the last query's answer, or None, like psycopg.
        return self._rows[0] if self._rows else None

    def fetchall(self):
        # Every row of the last query's answer.
        return list(self._rows)

    def queries(self, fragment):
        """Every executed (sql, params) pair whose SQL contains `fragment`."""
        return [(sql, params) for sql, params in self.executed if fragment in sql]

    def __enter__(self):
        # `with conn.cursor() as cur:` hands back the cursor itself.
        return self

    def __exit__(self, *exc):
        # Never swallow an exception raised inside the `with` block.
        return False


class FakeConnection:
    """Stands in for a psycopg connection; `with conn:` commits on success like the real one."""

    def __init__(self, cursor):
        # The one shared cursor, plus counters tests can assert on.
        self._cursor = cursor
        self.commits = 0
        self.closed = False

    def cursor(self, row_factory=None):
        # Always the same cursor, whatever row factory is asked for.
        return self._cursor

    def commit(self):
        # Count commits, so tests can check a write was saved.
        self.commits += 1

    def close(self):
        # Remember that the connection was closed.
        self.closed = True

    def __enter__(self):
        # `with connect_to_db() as conn:` hands back the connection itself.
        return self

    def __exit__(self, exc_type, *rest):
        # Real psycopg commits when the block succeeds, then closes either way.
        if exc_type is None:
            self.commit()
        self.close()
        return False


class FakeResend:
    """Records emails instead of sending them; set `fail = True` to make every send raise, or add addresses to
    `fail_for` to make only emails to them raise."""

    def __init__(self):
        # Every email "sent", whether sending should fail, and the addresses whose emails should fail.
        self.sent = []
        self.fail = False
        self.fail_for = set()

    def send(self, params, options=None):
        # Simulate an outage, or a send refused for one recipient (e.g. a mistyped customer address).
        if self.fail or self.fail_for & set(params["to"]):
            raise RuntimeError("resend is down")
        self.sent.append(params)
        return {"id": f"fake-{len(self.sent)}"}


@pytest.fixture(autouse=True)
def lambda_env(monkeypatch):
    """The environment variables every Lambda expects, with harmless test values."""
    monkeypatch.setenv("ADMIN_LINK_SECRET", TEST_SECRET)
    monkeypatch.setenv("ADMIN_URL", TEST_ADMIN_URL)
    monkeypatch.setenv("FLOOFY_EMAIL", "owner@example.com")
    monkeypatch.setenv("RESEND_API_KEY", "re_test")


@pytest.fixture
def cursor():
    # A fresh fake database cursor for each test.
    return FakeCursor()


@pytest.fixture
def connection(cursor):
    # A fake connection wrapping that cursor.
    return FakeConnection(cursor)


@pytest.fixture
def emails(monkeypatch):
    """Swap Resend's real send for the recorder, so no email ever leaves the machine."""
    fake = FakeResend()
    monkeypatch.setattr(resend.Emails, "send", fake.send)
    return fake


@pytest.fixture
def load_lambda(monkeypatch, connection):
    """Import `<name>/lambda_function.py` fresh, with its database connection replaced by the fake."""

    def load(name):
        # Every Lambda file is called lambda_function.py, so load each by path under a unique module name.
        module_name = name.replace("-", "_")
        spec = importlib.util.spec_from_file_location(module_name, LAMBDA_ROOT / name / "lambda_function.py")
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)

        # Point the Lambda's connect_to_db at the fake, if it talks to the database at all.
        if hasattr(module, "connect_to_db"):
            monkeypatch.setattr(module, "connect_to_db", lambda: connection)
        return module

    return load


def body_of(result):
    """The decoded JSON body of a Lambda response."""
    return json.loads(result["body"])


def admin_tokens(html):
    """Every admin-link token found in an email body."""
    return re.findall(r"https://admin\.example/\?token=([A-Za-z0-9_\-.]+)", html)


def logged(capsys):
    """Every structured log line printed so far, parsed from JSON (other output is ignored)."""
    lines = capsys.readouterr().out.splitlines()
    return [json.loads(line) for line in lines if line.startswith("{")]


def make_event(method, body=None, ip="203.0.113.7", query=None, base64_body=False):
    """Build the minimal Lambda function URL event the handlers read."""
    return {
        "requestContext": {"http": {"method": method, "sourceIp": ip, "path": "/", "userAgent": "test-agent/1.0"}},
        "body": body if isinstance(body, str) or body is None else json.dumps(body),
        "isBase64Encoded": base64_body,
        "queryStringParameters": query,
    }
