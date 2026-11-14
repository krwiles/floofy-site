import ipaddress
import time

import pytest

import admin_links
from conftest import admin_tokens, body_of, logged, make_event

EVIL = '<a href="//evil.example">x</a>'


@pytest.fixture
def contact(load_lambda, cursor):
    # Default database state: no recent messages, from this visitor or anyone.
    cursor.on("FROM contact_messages", rows=[{"recent": 0}])

    # Load floof-contact with the fake database in place of Neon.
    return load_lambda("floof-contact")


def send(contact, name="Robin", email="robin@example.com", message="Hello!"):
    """Send a contact message through the handler, the way the site does."""
    return contact.lambda_handler(make_event("POST", {"name": name, "email": email, "message": message}), None)


def test_every_user_value_is_escaped_in_the_email(contact, emails):
    # Arrange: an injected link in each field (the email field is short, so it gets a shorter payload).
    body = {"name": "<b>x</b>", "email": '<a href="//e">', "message": EVIL}

    # Act: send the contact message.
    result = contact.lambda_handler(make_event("POST", body), None)

    # Assert: the owner email shows the markup as text, not live HTML.
    assert result["statusCode"] == 200
    [sent] = emails.sent
    assert "&lt;a href=" in sent["html"]
    assert "&lt;b&gt;x&lt;/b&gt;" in sent["html"]
    assert '<a href="//evil.example">' not in sent["html"]
    assert "<b>x</b>" not in sent["html"]


def test_blocked_ip_gets_the_vague_403_and_no_email(contact, emails, cursor, connection):
    # Arrange: this IP is in blocked_ips.
    cursor.on("FROM blocked_ips", rows=[{"blocked": 1}])

    # Act: try to send a message from it.
    result = contact.lambda_handler(make_event("POST", {"name": "a", "email": "b", "message": "c"}), None)

    # Assert: the same deliberately vague reply as reviews, the IP was checked, and nothing was sent.
    assert result["statusCode"] == 403
    assert body_of(result) == {"code": "error"}
    assert cursor.queries("FROM blocked_ips")[0][1] == ("203.0.113.7",)
    assert emails.sent == []
    assert connection.closed


def test_unblocked_ip_still_sends_from_the_site_address(contact, emails, connection):
    # Act: send from an IP with no blocked_ips row (the fake returns none by default).
    result = contact.lambda_handler(make_event("POST", {"name": "a", "email": "b", "message": "c"}), None)

    # Assert: one email to the owner, from the shared sender constant, and the connection was closed.
    assert result["statusCode"] == 200
    [sent] = emails.sent
    assert sent["from"] == "FloofySite <no-reply@summerfloofy.com>"
    assert sent["to"] == ["owner@example.com"]
    assert connection.closed


@pytest.mark.parametrize("ip", ["203.0.113.7", "2001:db8::1"])
def test_owner_email_has_a_block_link_for_the_sender_ip(contact, emails, ip):
    # Act: send a message from this IP.
    contact.lambda_handler(make_event("POST", {"name": "a", "email": "b", "message": "c"}, ip=ip), None)

    # Assert: one admin link, which decodes to "block this sender's IP".
    [sent] = emails.sent
    [token] = admin_tokens(sent["html"])
    action, target = admin_links.verify(token, now=time.time())
    assert action == "block-contact-ip"
    assert str(ipaddress.ip_address(target)) == ip
    assert "Block this sender" in sent["html"]


# --- Response contract: a code, never prose -----------------------------------------------------------------


def test_sent_message_replies_ok(contact, emails):
    # Act and assert: 200 with just the code.
    result = contact.lambda_handler(make_event("POST", {"name": "a", "email": "b", "message": "c"}), None)
    assert (result["statusCode"], body_of(result)) == (200, {"code": "ok"})


def test_too_long_field_replies_invalid(contact, emails):
    # Act and assert: 400 with no per-field detail.
    result = contact.lambda_handler(make_event("POST", {"name": "x" * 60, "email": "b", "message": "c"}), None)
    assert (result["statusCode"], body_of(result)) == (400, {"code": "invalid"})


# --- Anything unexpected still answers with a code ------------------------------------------------------------


@pytest.mark.parametrize(
    "field, limit",
    [("name", 50), ("email", 50), ("message", 2000)],
)
def test_a_field_exactly_at_its_limit_is_sent(contact, emails, field, limit):
    # Act: send a message with one field exactly as long as the form allows.
    result = send(contact, **{field: "x" * limit})

    # Assert: accepted and emailed, not refused.
    assert (result["statusCode"], body_of(result)) == (200, {"code": "ok"})
    assert len(emails.sent) == 1


@pytest.mark.parametrize(
    "field, limit",
    [("name", 50), ("email", 50), ("message", 2000)],
)
def test_a_field_one_past_its_limit_replies_invalid(contact, emails, field, limit):
    # Act: send a message with one field a character too long.
    result = send(contact, **{field: "x" * (limit + 1)})

    # Assert: refused, with nothing emailed.
    assert (result["statusCode"], body_of(result)) == (400, {"code": "invalid"})
    assert emails.sent == []


@pytest.mark.parametrize("field", ["name", "email", "message"])
def test_a_blank_field_replies_invalid(contact, cursor, emails, field):
    # Act: send a message with one field that is only whitespace.
    result = send(contact, **{field: " \n "})

    # Assert: refused before the database is touched, with nothing emailed.
    assert (result["statusCode"], body_of(result)) == (400, {"code": "invalid"})
    assert cursor.executed == []
    assert emails.sent == []


# --- Abuse protection: the per-visitor limit, the global cap and the record they count ---------------------------


def test_each_message_is_recorded_with_only_its_ip_before_emailing(contact, cursor, connection, emails):
    # Arrange: Resend is down, so only the record could survive.
    emails.fail = True

    # Act: send a message.
    send(contact)

    # Assert: the IP (and nothing the visitor typed) was saved and committed, so a failed send still counts.
    [(sql, params)] = cursor.queries("INSERT INTO contact_messages")
    assert params == ("203.0.113.7",)
    assert connection.commits >= 1


def test_fourth_message_in_24_hours_is_rate_limited(contact, cursor, emails):
    # Arrange: this visitor already sent three today.
    cursor.on("FROM contact_messages", rows=[{"recent": 3}])

    # Act: send a fourth.
    result = send(contact)

    # Assert: refused with the rule, with nothing recorded or emailed.
    assert (result["statusCode"], body_of(result)) == (429, {"code": "rate_limited", "limit": 3, "window_hours": 24})
    assert cursor.queries("INSERT") == []
    assert emails.sent == []


def test_rate_limit_counts_an_ipv6_visitors_whole_64(contact, cursor, emails):
    # Act: send from an IPv6 address.
    contact.lambda_handler(
        make_event("POST", {"name": "Robin", "email": "robin@example.com", "message": "Hi"}, ip="2001:db8:1:2::9"), None
    )

    # Assert: the per-visitor count covers the whole /64.
    [(sql, params)] = cursor.queries("INTERVAL '1 hour'")
    assert "ip_address <<= %s::inet" in sql
    assert params == ("2001:db8:1:2::/64", 24)


def test_global_cap_refuses_with_busy(contact, cursor, emails, capsys):
    # Arrange: 20 messages in the last day, from everyone together.
    cursor.on("INTERVAL '24 hours'", rows=[{"recent": 20}])

    # Act: a new visitor sends a message.
    result = send(contact)

    # Assert: refused as busy and logged, with nothing recorded or emailed.
    assert (result["statusCode"], body_of(result)) == (503, {"code": "busy"})
    assert any(line["event"] == "global_cap_reached" for line in logged(capsys))
    assert cursor.queries("INSERT") == []
    assert emails.sent == []


def test_email_failure_is_logged_with_its_recipient(contact, emails, capsys):
    # Arrange: Resend is down.
    emails.fail = True

    # Act: send a message.
    send(contact)

    # Assert: the shared email_failed event, saying the owner's email was the one that failed.
    [failure] = [line for line in logged(capsys) if line["event"] == "email_failed"]
    assert failure["to"] == "owner"
