"""Checks every form Lambda (reviews, commissions, contact) must pass, written once and run against each."""

from datetime import datetime, timezone

import pytest

from conftest import body_of, commission_body, make_event

# Each form Lambda: its database state for an ordinary accepted submission, and a valid body to post
FORMS = {
    "floof-api": {
        "rows": [
            ("INTERVAL '1 hour'", [{"recent": 0}]),
            ("INSERT INTO reviews", [{"id": 7, "created_at": datetime(2026, 9, 30, 4, 0, tzinfo=timezone.utc)}]),
            ("AS earlier", [{"earlier": 3}]),
        ],
        "body": lambda: {"author": "Robin", "comment": "Lovely"},
    },
    "floof-comm": {
        "rows": [("FROM commission_requests", [{"recent": 0}]), ("INSERT INTO commission_requests", [{"id": 42}])],
        "body": commission_body,
    },
    "floof-contact": {
        "rows": [("FROM contact_messages", [{"recent": 0}])],
        "body": lambda: {"name": "Robin", "email": "robin@example.com", "message": "Hello!"},
    },
}


@pytest.fixture(params=list(FORMS))
def form(request, load_lambda, cursor):
    """One form Lambda, loaded with its ordinary database state, plus a helper that posts a valid submission."""
    # This form's rows: nothing recent, and the insert hands back an id
    setup = FORMS[request.param]
    for fragment, rows in setup["rows"]:
        cursor.on(fragment, rows=rows)

    # Load it, and give tests one call that submits a valid form
    module = load_lambda(request.param)
    module.post = lambda: module.lambda_handler(make_event("POST", setup["body"]()), None)
    return module


def test_owner_email_goes_to_every_admin(form, emails, monkeypatch):
    # Arrange: two admins in FLOOFY_EMAIL.
    monkeypatch.setenv("FLOOFY_EMAIL", "a@example.com, b@example.com")

    # Act: trigger the owner email.
    form.post()

    # Assert: the first email (the owner's) lists both admins as separate recipients.
    assert emails.sent[0]["to"] == ["a@example.com", "b@example.com"]


def test_every_email_has_a_full_html_document_and_a_text_version(form, emails):
    # Act: trigger this Lambda's emails.
    form.post()

    # Assert: each one is a complete HTML page plus a tag-free plain-text copy.
    assert emails.sent
    for sent in emails.sent:
        assert sent["html"].startswith("<!doctype html>")
        assert sent["text"].strip() and "<p>" not in sent["text"]


def test_email_failure_reply_never_reveals_admin_addresses(form, emails, monkeypatch):
    # Arrange: two admins, and Resend is down.
    monkeypatch.setenv("FLOOFY_EMAIL", "secret-admin@example.com,other-admin@example.com")
    emails.fail = True

    # Act: submit the form.
    result = form.post()

    # Assert: a coded reply (ok for a saved review, error otherwise) that names no admin address.
    assert "admin@example.com" not in result["body"]
    assert body_of(result)["code"] in {"ok", "error"}


def test_unsupported_method_replies_error(form):
    # Act: call it with a method no form uses.
    result = form.lambda_handler(make_event("PATCH"), None)

    # Assert: 405 with the generic code.
    assert (result["statusCode"], body_of(result)) == (405, {"code": "error"})


@pytest.mark.parametrize("body", ["not json", None], ids=["malformed", "missing"])
def test_unreadable_body_replies_error(form, emails, capsys, body):
    # Act: post a body that isn't JSON at all.
    result = form.lambda_handler(make_event("POST", body=body), None)

    # Assert: a coded 500 rather than a crash, with the real cause logged for CloudWatch.
    assert (result["statusCode"], body_of(result)) == (500, {"code": "error"})
    assert "unexpected_error" in capsys.readouterr().out


def test_database_outage_replies_error(form, emails, monkeypatch):
    # Arrange: the database can't be reached.
    def unreachable():
        raise ConnectionError("neon is down")

    monkeypatch.setattr(form, "connect_to_db", unreachable)

    # Act: submit a valid form.
    result = form.post()

    # Assert: a coded 500, and nothing was emailed.
    assert (result["statusCode"], body_of(result)) == (500, {"code": "error"})
    assert emails.sent == []
