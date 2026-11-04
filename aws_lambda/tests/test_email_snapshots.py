"""Byte-for-byte snapshots of what visitors and the owner actually receive: each form Lambda's reply and every email it
sends, and floof-admin's pages, for fixed requests at a fixed time. A refactor must leave these unchanged.

The snapshots live in tests/snapshots/. After a deliberate change to an email or page, regenerate them with
`UPDATE_SNAPSHOTS=1 .venv/bin/pytest tests/test_email_snapshots.py` and review the diff before committing.
"""

import ipaddress
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace
from urllib.parse import urlencode

import pytest

import admin_links
from conftest import make_event

SNAPSHOT_DIR = Path(__file__).parent / "snapshots"

# The fixed moment every snapshot is taken at: Wednesday 30 September 2026, 04:00 UTC (12:00 PM in Singapore)
FIXED_NOW = datetime(2026, 9, 30, 4, 0, tzinfo=timezone.utc)


class FixedDatetime(datetime):
    """A datetime whose now() is always FIXED_NOW (in whatever zone is asked for)."""

    @classmethod
    def now(cls, tz=None):
        # The fixed moment, converted to the requested zone, like the real now() would give
        return FIXED_NOW.astimezone(tz) if tz else FIXED_NOW.replace(tzinfo=None)


@pytest.fixture(autouse=True)
def fixed_clock(monkeypatch):
    """Freeze every clock the Lambdas read, wherever it was imported, so emails and link tokens are reproducible."""
    # Admin-link expiry reads time.time() inside admin_links
    monkeypatch.setattr(admin_links, "time", SimpleNamespace(time=lambda: FIXED_NOW.timestamp()))

    # Any loaded module holding the datetime class (a Lambda, or a shared helper) gets the frozen one instead
    for module in list(sys.modules.values()):
        if getattr(module, "datetime", None) is datetime and module is not sys.modules[__name__]:
            monkeypatch.setattr(module, "datetime", FixedDatetime)
    yield


def freeze_lambda(module, monkeypatch):
    """A freshly loaded Lambda imports datetime after the fixture ran, so freeze its own copy too."""
    # Swap the Lambda's datetime for the frozen one, if it uses datetime at all
    if getattr(module, "datetime", None) is datetime:
        monkeypatch.setattr(module, "datetime", FixedDatetime)
    return module


def matches_snapshot(name, value):
    """Compare `value` with tests/snapshots/<name>.json, or (re)write it when UPDATE_SNAPSHOTS=1."""
    path = SNAPSHOT_DIR / f"{name}.json"
    text = json.dumps(value, indent=2, ensure_ascii=False, sort_keys=True) + "\n"

    # Regenerate on request (a deliberate change), never silently
    if os.environ.get("UPDATE_SNAPSHOTS") == "1":
        SNAPSHOT_DIR.mkdir(exist_ok=True)
        path.write_text(text)

    # Byte-for-byte comparison, so whitespace changes count too
    assert path.exists(), f"missing snapshot {path.name}; run with UPDATE_SNAPSHOTS=1 to create it"
    assert text == path.read_text()


def captured(result, emails):
    """The parts of a run that reach people: the reply, plus every email's envelope and both bodies."""
    # Each email's sender, recipients, subject, reply-to and both bodies (missing ones as None)
    keys = ("from", "to", "subject", "reply_to", "html", "text")
    return {"reply": result, "emails": [{key: sent.get(key) for key in keys} for sent in emails.sent]}


# --- The three form Lambdas -------------------------------------------------------------------------------------


def test_review_snapshot(load_lambda, cursor, emails, monkeypatch):
    # Arrange: no recent reviews, review #7 saved at the fixed time, and 3 earlier reviews from this IP.
    cursor.on("FROM reviews", rows=[{"count": 0, "recent": 0}])
    cursor.on("INSERT INTO reviews", rows=[{"id": 7, "created_at": FIXED_NOW}])
    cursor.on("AS earlier", rows=[{"earlier": 3}])
    api = freeze_lambda(load_lambda("floof-api"), monkeypatch)

    # Act: post a review with markup and a link in it.
    body = {"author": "Robin <b>", "comment": "Lovely art! See https://ref.example & more"}
    result = api.lambda_handler(make_event("POST", body), None)

    # Assert: the reply and the owner email are exactly as before.
    matches_snapshot("review", captured(result, emails))


def test_commission_snapshot(load_lambda, cursor, emails, monkeypatch):
    # Arrange: no recent requests, and the insert hands back request #42.
    cursor.on("FROM commission_requests", rows=[{"recent": 0}])
    cursor.on("INSERT INTO commission_requests", rows=[{"id": 42}])
    comm = freeze_lambda(load_lambda("floof-comm"), monkeypatch)

    # Act: submit a request whose text has markup and a link (escaped for both, defused for the customer).
    body = {
        "name": "Sam <i>",
        "email": "sam@example.com",
        "commissionType": "chibi",
        "description": "A fox in a scarf, see https://ref.example/fox",
        "referenceLinks": "https://ref.example/a & https://ref.example/b",
        "usageType": "personal",
        "usageExplanation": "Profile picture",
        "estimatedPrice": 120.5,
        "deadline": "December",
        "additionalNotes": "Thanks!",
    }
    result = comm.lambda_handler(make_event("POST", body), None)

    # Assert: the reply and both emails (owner, then customer) are exactly as before.
    matches_snapshot("commission", captured(result, emails))


def test_contact_snapshot(load_lambda, cursor, emails, monkeypatch):
    # Arrange: no recent messages.
    cursor.on("FROM contact_messages", rows=[{"recent": 0}])
    contact = freeze_lambda(load_lambda("floof-contact"), monkeypatch)

    # Act: send a message with markup in it, from an IPv6 address (its Block link carries the IP as a number).
    body = {"name": "Robin <b>", "email": "robin@example.com", "message": "Hello & welcome"}
    result = contact.lambda_handler(make_event("POST", body, ip="2001:db8:1:2::9"), None)

    # Assert: the reply and the owner email are exactly as before.
    matches_snapshot("contact", captured(result, emails))


# --- floof-admin's pages ----------------------------------------------------------------------------------------


@pytest.fixture
def admin(load_lambda, cursor, monkeypatch):
    # Review #7 and commission #42 exist, from an IPv4 and an IPv6 address; nothing is blocked or deleted yet.
    ipv4, ipv6 = ipaddress.ip_address("203.0.113.7"), ipaddress.ip_address("2001:db8:1:2::9")
    review = {
        "who": "Robin <b>", "text": "Lovely & kind", "created_at": FIXED_NOW, "ip_address": ipv4, "deleted": False
    }
    long_text = "A fox in a scarf " * 20
    commission = {"who": "Sam", "text": long_text, "created_at": FIXED_NOW, "ip_address": ipv6, "deleted": False}
    cursor.on("FROM reviews", rows=[review])
    cursor.on("FROM commission_requests", rows=[commission])
    cursor.on("INSERT INTO blocked_ips", rowcount=1)
    cursor.on("UPDATE reviews", rowcount=1)
    return load_lambda("floof-admin")


def admin_token(action, target_id):
    """A valid token for `action`, signed at the fixed time."""
    return admin_links.sign(action, target_id, int(FIXED_NOW.timestamp()) + 3600)


@pytest.mark.parametrize(
    "action, target_id",
    [
        ("delete-review", 7),
        ("block-review-ip", 7),
        ("block-commission-ip", 42),
        ("block-contact-ip", int(ipaddress.ip_address("198.51.100.4"))),
    ],
)
def test_admin_confirm_page_snapshot(admin, monkeypatch, action, target_id):
    # Arrange: freeze the admin's own clock, used to check the token's expiry.
    monkeypatch.setattr(admin, "time", SimpleNamespace(time=lambda: FIXED_NOW.timestamp()))

    # Act: open the link, then press Confirm.
    token = admin_token(action, target_id)
    shown = admin.lambda_handler(make_event("GET", query={"token": token}), None)
    confirmed = admin.lambda_handler(make_event("POST", body=urlencode({"token": token})), None)

    # Assert: both pages, headers included, are exactly as before.
    matches_snapshot(f"admin-{action}", {"get": shown, "post": confirmed})
