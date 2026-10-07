import json
import time

import pytest

import admin_links
from conftest import LAMBDA_ROOT, admin_tokens, body_of, logged, make_event

EVIL = '<a href="//evil.example">x</a>'


def commission_body(**overrides):
    """A valid request, in the shape the frontend's CreateCommissionRequest sends."""
    body = {
        "name": "Sam",
        "email": "sam@example.com",
        "commissionType": "chibi",
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
    fields = ["name", "description", "referenceLinks", "usageExplanation", "deadline", "additionalNotes"]
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
    assert body_of(result) == {"code": "error"}
    assert cursor.queries("INSERT") == []
    assert emails.sent == []


def test_third_request_in_24_hours_is_refused(comm, cursor, emails):
    # Arrange: this IP already sent two requests in the last day.
    cursor.on("FROM commission_requests", rows=[{"recent": 2}])

    # Act: send a third.
    result = comm.lambda_handler(make_event("POST", commission_body()), None)

    # Assert: 429 carrying the rule, nothing recorded, nothing sent.
    assert result["statusCode"] == 429
    assert body_of(result) == {"code": "rate_limited", "limit": 2, "window_hours": 24}
    assert cursor.queries("INSERT") == []
    assert emails.sent == []

    # The count covers this IP over exactly the last 24 hours (the window is a parameter, shared with the reply).
    [(sql, params)] = cursor.queries("COUNT(*)")
    assert "%s * INTERVAL '1 hour'" in sql
    assert params == ("203.0.113.7", 24)


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
        "203.0.113.7", "Sam", "sam@example.com", "chibi", "personal", "A fox in a scarf",
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


def test_owner_email_failure_replies_error_and_skips_the_customer_email(comm, connection, emails, capsys):
    # Arrange: Resend refuses the owner's email.
    emails.fail_for = {"owner@example.com"}

    # Act: submit a valid request.
    result = comm.lambda_handler(make_event("POST", commission_body()), None)

    # Assert: the visitor sees an error, the row was committed first, and no customer confirmation was sent.
    assert (result["statusCode"], body_of(result)) == (500, {"code": "error"})
    assert connection.commits == 1
    assert emails.sent == []

    # The failure names the saved request and which email failed, so the owner can find it in the database.
    [failure] = [line for line in logged(capsys) if line["event"] == "email_failed"]
    assert (failure["request_id"], failure["to"]) == (42, "owner")


def test_customer_email_failure_still_replies_ok(comm, connection, emails, capsys):
    # Arrange: the owner's email goes out, but the customer's is refused.
    emails.fail_for = {"sam@example.com"}

    # Act: submit a valid request.
    result = comm.lambda_handler(make_event("POST", commission_body()), None)

    # Assert: the owner has the request, so the visitor is told it worked rather than prompted to resubmit.
    assert (result["statusCode"], body_of(result)) == (200, {"code": "ok"})
    assert connection.commits == 1
    assert [sent["to"] for sent in emails.sent] == [["owner@example.com"]]

    # The failure is still logged against the saved request.
    [failure] = [line for line in logged(capsys) if line["event"] == "email_failed"]
    assert (failure["request_id"], failure["to"]) == (42, "customer")


def test_emails_come_from_the_site_address(comm, emails):
    # Act: submit a valid request.
    comm.lambda_handler(make_event("POST", commission_body()), None)

    # Assert: both emails use the shared sender constant.
    assert {sent["from"] for sent in emails.sent} == {"FloofySite <no-reply@summerfloofy.com>"}


@pytest.mark.parametrize(
    "field",
    ["name", "email", "commissionType", "description", "usageType", "usageExplanation"],
)
def test_a_blank_required_field_replies_invalid(comm, cursor, emails, field):
    # Act: submit a request with one required field that is only whitespace.
    result = comm.lambda_handler(make_event("POST", commission_body(**{field: "  \n "})), None)

    # Assert: refused before the database is touched, with nothing emailed.
    assert (result["statusCode"], body_of(result)) == (400, {"code": "invalid"})
    assert cursor.executed == []
    assert emails.sent == []


def test_blank_optional_fields_are_still_accepted(comm, emails):
    # Act: submit a request leaving every optional field empty.
    body = commission_body(referenceLinks="", deadline="", additionalNotes="")
    result = comm.lambda_handler(make_event("POST", body), None)

    # Assert: accepted as normal.
    assert (result["statusCode"], body_of(result)) == (200, {"code": "ok"})


@pytest.mark.parametrize(
    "price",
    [None, -5, 100_000_000, 99_999_999.996, float("inf"), float("nan")],
    ids=["missing", "negative", "too-big-for-numeric-10-2", "rounds-up-to-too-big", "infinity", "nan"],
)
def test_unusable_price_is_rejected_before_touching_the_database(comm, cursor, emails, price):
    # Arrange: a request whose price the database column numeric(10, 2) can't store (or that makes no sense).
    body = commission_body(estimatedPrice=price)
    if price is None:
        del body["estimatedPrice"]

    # Act: submit it (json.dumps writes inf/nan as Infinity/NaN, which json.loads accepts).
    result = comm.lambda_handler(make_event("POST", body), None)

    # Assert: a plain invalid 400, with no database work and no email.
    assert result["statusCode"] == 400
    assert body_of(result) == {"code": "invalid"}
    assert cursor.executed == []
    assert emails.sent == []


@pytest.mark.parametrize(
    "price, stored",
    [(99_999_999.99, 99_999_999.99), (12.345, 12.35), (12.344, 12.34)],
    ids=["largest-storable", "rounds-up", "rounds-down"],
)
def test_price_is_stored_rounded_to_cents(comm, cursor, emails, price, stored):
    # Act: submit a request with this price.
    result = comm.lambda_handler(make_event("POST", commission_body(estimatedPrice=price)), None)

    # Assert: accepted, and the row stores the price rounded to cents, as numeric(10, 2) would.
    assert result["statusCode"] == 200
    [(sql, params)] = cursor.queries("INSERT INTO commission_requests")
    assert stored in params


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


def test_email_failure_reply_never_reveals_admin_addresses(comm, emails, monkeypatch):
    # Arrange: two admins, and Resend is down.
    monkeypatch.setenv("FLOOFY_EMAIL", "secret-admin@example.com,other-admin@example.com")
    emails.fail = True

    # Act: submit the form.
    result = comm.lambda_handler(make_event("POST", commission_body()), None)

    # Assert: a generic 500 for the visitor, naming no admin address.
    assert result["statusCode"] == 500
    assert "admin@example.com" not in result["body"]
    assert body_of(result) == {"code": "error"}


# --- Response contract: a code (plus the rule, for rate limits), never prose -----------------------------------


def test_successful_request_replies_ok(comm, emails):
    # Act and assert: 200 with just the code.
    result = comm.lambda_handler(make_event("POST", commission_body()), None)
    assert (result["statusCode"], body_of(result)) == (200, {"code": "ok"})


def test_too_long_field_replies_invalid(comm, emails):
    # Act and assert: 400 with no per-field detail.
    result = comm.lambda_handler(make_event("POST", commission_body(name="x" * 60)), None)
    assert (result["statusCode"], body_of(result)) == (400, {"code": "invalid"})


def test_unsupported_method_replies_error(comm):
    # Act and assert: 405 with the generic code.
    result = comm.lambda_handler(make_event("PATCH"), None)
    assert (result["statusCode"], body_of(result)) == (405, {"code": "error"})


# --- Anything unexpected still answers with a code ------------------------------------------------------------


@pytest.mark.parametrize("body", ["not json", None], ids=["malformed", "missing"])
def test_unreadable_body_replies_error(comm, emails, capsys, body):
    # Act: post a body that isn't JSON at all.
    result = comm.lambda_handler(make_event("POST", body=body), None)

    # Assert: a coded 500 rather than a crash, with the real cause logged for CloudWatch.
    assert (result["statusCode"], body_of(result)) == (500, {"code": "error"})
    assert "unexpected_error" in capsys.readouterr().out


def test_database_outage_replies_error(comm, emails, monkeypatch):
    # Arrange: the database can't be reached.
    def unreachable():
        raise ConnectionError("neon is down")

    monkeypatch.setattr(comm, "connect_to_db", unreachable)

    # Act and assert: a coded 500, and nothing was emailed.
    result = comm.lambda_handler(make_event("POST", commission_body()), None)
    assert (result["statusCode"], body_of(result)) == (500, {"code": "error"})
    assert emails.sent == []


def test_non_numeric_price_replies_error(comm, emails):
    # Act: a price that can't be read as a number at all.
    result = comm.lambda_handler(make_event("POST", commission_body(estimatedPrice="lots")), None)

    # Assert: a coded 500 rather than a crash.
    assert (result["statusCode"], body_of(result)) == (500, {"code": "error"})


# --- Abuse protection: the customer address, fixed lists, defused copy, IP scope and the global cap -------------


@pytest.mark.parametrize("email", ["a@b.com, victim@x.com", "Sam <sam@example.com>", "sam@localhost"])
def test_anything_but_one_plain_customer_address_is_invalid(comm, cursor, emails, email):
    # Act: submit with an address the confirmation could be abused through.
    result = comm.lambda_handler(make_event("POST", commission_body(email=email)), None)

    # Assert: refused before the database is touched, with nothing emailed.
    assert (result["statusCode"], body_of(result)) == (400, {"code": "invalid"})
    assert cursor.executed == []
    assert emails.sent == []


@pytest.mark.parametrize(
    "field, value",
    [("commissionType", "portrait"), ("usageType", "Click https://evil.example")],
    ids=["unknown-type", "text-in-usage"],
)
def test_type_and_usage_must_come_from_the_fixed_lists(comm, cursor, emails, field, value):
    # Act: submit a value the form never offers.
    result = comm.lambda_handler(make_event("POST", commission_body(**{field: value})), None)

    # Assert: refused, with nothing saved or emailed.
    assert (result["statusCode"], body_of(result)) == (400, {"code": "invalid"})
    assert cursor.executed == []


def test_fixed_lists_match_the_sites_pricing_data(comm):
    # Arrange: the ids the site's commission form offers, from its pricing data (plus the form's extra "unsure").
    pricing = json.loads((LAMBDA_ROOT.parent / "src/assets/data/pricing.json").read_text())
    types = {category["id"] for category in pricing["artworkCategories"]}
    usages = {usage["id"] for usage in pricing["usageTypes"]} | {"unsure"}

    # Assert: the Lambda accepts exactly what the form can send.
    assert set(comm.COMMISSION_TYPES) == types
    assert set(comm.USAGE_TYPES) == usages


def test_links_are_defused_only_in_the_customers_copy(comm, emails):
    # Act: submit with a link in the description.
    comm.lambda_handler(make_event("POST", commission_body(description="See https://ref.example/fox")), None)

    # Assert: the owner can click it; the customer's copy has nothing clickable.
    owner, customer = emails.sent
    assert "https://ref.example/fox" in owner["html"]
    assert "hxxps[:]//ref[.]example/fox" in customer["html"]
    assert "https://ref.example" not in customer["html"] + customer["text"]


def test_rate_limit_counts_an_ipv6_visitors_whole_64(comm, cursor, emails):
    # Act: submit from an IPv6 address.
    comm.lambda_handler(make_event("POST", commission_body(), ip="2001:db8:1:2::9"), None)

    # Assert: the per-visitor count covers the whole /64.
    [(sql, params)] = cursor.queries("INTERVAL '1 hour'")
    assert "ip_address <<= %s::inet" in sql
    assert params == ("2001:db8:1:2::/64", 24)


def test_global_cap_refuses_with_busy(comm, cursor, emails, capsys):
    # Arrange: this visitor has sent none today, but 10 requests came from everyone together.
    cursor.on("INTERVAL '24 hours'", rows=[{"recent": 10}])

    # Act: submit.
    result = comm.lambda_handler(make_event("POST", commission_body()), None)

    # Assert: refused as busy and logged, with nothing saved or emailed.
    assert (result["statusCode"], body_of(result)) == (503, {"code": "busy"})
    assert any(line["event"] == "global_cap_reached" for line in logged(capsys))
    assert cursor.queries("INSERT") == []
    assert emails.sent == []
