import ipaddress
import json
import time

import pytest

import admin_links
from conftest import admin_tokens, make_event

EVIL = '<a href="//evil.example">x</a>'


@pytest.fixture
def contact(load_lambda):
    return load_lambda("floof-contact")


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
    assert json.loads(result["body"]) == {"message": "Internal Server Error"}
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


def test_owner_email_goes_to_every_admin(contact, emails, monkeypatch):
    # Arrange: two admins in FLOOFY_EMAIL.
    monkeypatch.setenv("FLOOFY_EMAIL", "a@example.com, b@example.com")

    # Act: trigger the owner email.
    contact.lambda_handler(make_event("POST", {"name": "a", "email": "b", "message": "c"}), None)

    # Assert: the first email (the owner's) lists both admins as separate recipients.
    assert emails.sent[0]["to"] == ["a@example.com", "b@example.com"]
