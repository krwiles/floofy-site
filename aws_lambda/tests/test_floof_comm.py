import json
import time

import pytest

import admin_links
from conftest import admin_tokens, make_event

EVIL = '<a href="//evil.example">x</a>'


def commission_body(**overrides):
    """A valid request, in the shape the frontend's CreateCommissionRequest sends."""
    body = {
        "name": "Sam",
        "email": "sam@example.com",
        "commissionType": "portrait",
        "description": "A fox in a scarf",
        "referenceLinks": "https://ref.example/fox",
        "usageType": "personal",
        "usageExplanation": "Profile picture",
        "estimatedPrice": 120,
        "deadline": "December",
        "additionalNotes": "Thanks!",
    }
    body.update(overrides)
    return body


@pytest.fixture
def comm(load_lambda, cursor):
    # Default database state: IP not blocked, no recent requests, and the insert hands back id 42.
    cursor.on("FROM commission_requests", rows=[{"recent": 0}])
    cursor.on("INSERT INTO commission_requests", rows=[{"id": 42}])
    return load_lambda("floof-comm")


def test_every_user_value_is_escaped_in_both_emails(comm, emails):
    # Arrange: put an injected link in every free-text field.
    fields = ["name", "commissionType", "description", "referenceLinks", "usageType", "usageExplanation", "deadline", "additionalNotes"]
    body = commission_body(**{field: EVIL for field in fields})

    # Act: submit the request.
    result = comm.lambda_handler(make_event("POST", body), None)

    # Assert: both emails went out, showing the markup as text rather than a live link.
    assert result["statusCode"] == 200
    assert len(emails.sent) == 2
    for sent in emails.sent:
        assert "&lt;a href=" in sent["html"]
        assert '<a href="//evil.example">' not in sent["html"]


def test_blocked_ip_gets_the_vague_403_with_no_insert_or_email(comm, cursor, emails):
    # Arrange: this IP is in blocked_ips.
    cursor.on("FROM blocked_ips", rows=[{"blocked": 1}])

    # Act: submit a valid request from it.
    result = comm.lambda_handler(make_event("POST", commission_body()), None)

    # Assert: vague refusal, nothing recorded, nothing sent.
    assert result["statusCode"] == 403
    assert json.loads(result["body"]) == {"message": "Internal Server Error"}
    assert cursor.queries("INSERT") == []
    assert emails.sent == []


def test_third_request_in_24_hours_is_refused(comm, cursor, emails):
    # Arrange: this IP already sent two requests in the last day.
    cursor.on("FROM commission_requests", rows=[{"recent": 2}])

    # Act: send a third.
    result = comm.lambda_handler(make_event("POST", commission_body()), None)

    # Assert: 429 with a "try again later" message, nothing recorded, nothing sent.
    assert result["statusCode"] == 429
    assert "try again later" in json.loads(result["body"])["message"].lower()
    assert cursor.queries("INSERT") == []
    assert emails.sent == []

    # The count covers this IP over exactly the last 24 hours.
    [(sql, params)] = cursor.queries("COUNT(*)")
    assert "INTERVAL '24 hours'" in sql
    assert params == ("203.0.113.7",)


def test_second_request_in_24_hours_still_goes_through(comm, cursor, emails):
    # Arrange: one earlier request today.
    cursor.on("FROM commission_requests", rows=[{"recent": 1}])

    # Act and assert: the second is accepted and emailed.
    result = comm.lambda_handler(make_event("POST", commission_body()), None)
    assert result["statusCode"] == 200
    assert len(emails.sent) == 2


def test_valid_request_is_recorded_with_every_field_and_the_ip(comm, cursor, connection, emails):
    # Act: submit a valid request.
    comm.lambda_handler(make_event("POST", commission_body()), None)

    # Assert: one parameterised insert carrying every field plus the sender's IP.
    [(sql, params)] = cursor.queries("INSERT INTO commission_requests")
    assert "RETURNING id" in sql
    assert params == (
        "203.0.113.7", "Sam", "sam@example.com", "portrait", "personal", "A fox in a scarf",
        "https://ref.example/fox", "Profile picture", 120.0, "December", "Thanks!",
    )

    # It was committed before any email went out, so an email failure can't lose it.
    assert connection.commits == 1


def test_owner_email_has_a_block_link_for_the_new_request(comm, emails):
    # Act: submit a valid request (the fake insert returns id 42).
    comm.lambda_handler(make_event("POST", commission_body()), None)

    # Assert: the owner's email carries one admin link, which decodes to "block request #42".
    owner, customer = emails.sent
    [token] = admin_tokens(owner["html"])
    assert admin_links.verify(token, now=time.time()) == ("block-commission-ip", 42)
    assert "Block this requester" in owner["html"]

    # The customer's copy must never contain an admin link.
    assert admin_tokens(customer["html"]) == []
    assert customer["to"] == ["sam@example.com"]


def test_email_failure_is_reported_but_the_request_is_already_saved(comm, connection, emails):
    # Arrange: Resend is down.
    emails.fail = True

    # Act: submit a valid request.
    result = comm.lambda_handler(make_event("POST", commission_body()), None)

    # Assert: an error reaches the visitor, as today, but the row was committed first.
    assert result["statusCode"] == 500
    assert connection.commits == 1


def test_emails_come_from_the_site_address(comm, emails):
    # Act: submit a valid request.
    comm.lambda_handler(make_event("POST", commission_body()), None)

    # Assert: both emails use the shared sender constant.
    assert {sent["from"] for sent in emails.sent} == {"FloofySite <no-reply@summerfloofy.com>"}


@pytest.mark.parametrize(
    "price",
    [None, -5, 100_000_000, float("inf"), float("nan")],
    ids=["missing", "negative", "too-big-for-numeric-10-2", "infinity", "nan"],
)
def test_unusable_price_is_rejected_before_touching_the_database(comm, cursor, emails, price):
    # Arrange: a request whose price the database column numeric(10, 2) can't store (or that makes no sense).
    body = commission_body(estimatedPrice=price)
    if price is None:
        del body["estimatedPrice"]

    # Act: submit it (json.dumps writes inf/nan as Infinity/NaN, which json.loads accepts).
    result = comm.lambda_handler(make_event("POST", body), None)

    # Assert: a 400 about the price, with no database work and no email.
    assert result["statusCode"] == 400
    assert "price" in json.loads(result["body"])["message"].lower()
    assert cursor.executed == []
    assert emails.sent == []


def test_zero_price_is_allowed(comm, emails):
    # A price of 0 is a valid choice (e.g. "not sure yet"), so it must still go through.
    assert comm.lambda_handler(make_event("POST", commission_body(estimatedPrice=0)), None)["statusCode"] == 200


def test_owner_email_goes_to_every_admin(comm, emails, monkeypatch):
    # Arrange: two admins in FLOOFY_EMAIL.
    monkeypatch.setenv("FLOOFY_EMAIL", "a@example.com, b@example.com")

    # Act: trigger the owner email.
    comm.lambda_handler(make_event("POST", commission_body()), None)

    # Assert: the first email (the owner's) lists both admins as separate recipients.
    assert emails.sent[0]["to"] == ["a@example.com", "b@example.com"]


def test_every_email_has_a_full_html_document_and_a_text_version(comm, emails):
    # Act: trigger this Lambda's emails.
    comm.lambda_handler(make_event("POST", commission_body()), None)

    # Assert: each one is a complete HTML page plus a tag-free plain-text copy.
    assert emails.sent
    for sent in emails.sent:
        assert sent["html"].startswith("<!doctype html>")
        assert sent["text"].strip() and "<p>" not in sent["text"]


def test_customer_confirmation_replies_to_the_admins(comm, emails, monkeypatch):
    # Arrange: two admins.
    monkeypatch.setenv("FLOOFY_EMAIL", "a@example.com,b@example.com")

    # Act: submit a request.
    comm.lambda_handler(make_event("POST", commission_body()), None)

    # Assert: a customer's reply goes to the admins, not to the unanswered no-reply address.
    owner, customer = emails.sent
    assert customer["reply_to"] == ["a@example.com", "b@example.com"]
