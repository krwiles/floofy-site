import base64
import json
import html
import ipaddress
import re
import time
from datetime import datetime, timezone
from urllib.parse import urlencode

import pytest

import admin_links
from conftest import logged, make_event

IP = ipaddress.ip_address("203.0.113.7")
POSTED = datetime(2026, 9, 30, 4, 0, tzinfo=timezone.utc)
SECURITY_HEADERS = {
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer",
    "X-Robots-Tag": "noindex",
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'",
    "X-Content-Type-Options": "nosniff",
}


def review_row(**overrides):
    """A reviews row as the admin query returns it (psycopg gives inet columns back as ipaddress objects)."""
    row = {"who": "<b>Robin</b>", "text": "<script>alert(1)</script> nice", "created_at": POSTED, "ip_address": IP, "deleted": False}
    row.update(overrides)
    return row


def commission_row(**overrides):
    """A commission_requests row in the same shape."""
    row = {"who": "Sam", "text": "A fox in a scarf", "created_at": POSTED, "ip_address": IP, "deleted": False}
    row.update(overrides)
    return row


@pytest.fixture
def admin(load_lambda, cursor):
    # Default database state: review #7 and commission request #42 exist, nothing blocked yet.
    cursor.on("FROM reviews", rows=[review_row()])
    cursor.on("FROM commission_requests", rows=[commission_row()])
    cursor.on("INSERT INTO blocked_ips", rowcount=1)
    cursor.on("UPDATE reviews", rowcount=1)
    return load_lambda("floof-admin")


def token_for(action, target_id, expires_in=3600):
    # A genuine signed link token for this action and target, valid for an hour by default.
    return admin_links.sign(action, target_id, int(time.time()) + expires_in)


def bad_token(kind):
    """Each kind of unusable token; built at test time because signing needs the test secret."""
    expired = admin_links.sign("delete-review", 7, int(time.time()) - 1)
    return {"missing": None, "empty": "", "malformed": "garbage", "expired": expired}[kind]


def get(admin, token):
    """Open an admin link, the way a browser (or an email scanner) does."""
    query = None if token is None else {"token": token}
    return admin.lambda_handler(make_event("GET", query=query), None)


def post(admin, token, base64_body=False):
    """Press Confirm: the form posts the token back as a url-encoded body."""
    body = urlencode({"token": token})
    if base64_body:
        body = base64.b64encode(body.encode()).decode()
    return admin.lambda_handler(make_event("POST", body=body, base64_body=base64_body), None)


def writes(cursor):
    """Every INSERT/UPDATE/DELETE the Lambda ran."""
    return [sql for sql, _ in cursor.executed if sql.split()[0] in {"INSERT", "UPDATE", "DELETE"}]


# --- GET: the confirmation page -------------------------------------------------------------------------------


def test_get_renders_the_escaped_review_and_a_confirm_form(admin, cursor):
    # Act: open a delete link for review #7.
    token = token_for("delete-review", 7)
    result = get(admin, token)

    # Assert: a page naming the review, with the author and comment shown as text rather than markup.
    assert result["statusCode"] == 200
    page = result["body"]
    assert "review #7" in page
    assert "&lt;b&gt;Robin&lt;/b&gt;" in page
    assert "&lt;script&gt;" in page and "<script>" not in page

    # It holds a POST form carrying the same token back, and the lookup was parameterised.
    assert re.search(r'<form method="post">', page)
    assert f'name="token" value="{html.escape(token)}"' in page
    assert cursor.queries("FROM reviews")[0][1] == (7,)


def test_get_never_writes(admin, cursor):
    # Act: open every kind of link, like a link scanner would.
    for action, target_id in [("delete-review", 7), ("block-review-ip", 7), ("block-commission-ip", 42)]:
        get(admin, token_for(action, target_id))

    # Assert: only reads happened.
    assert writes(cursor) == []


def test_get_block_link_shows_the_ip_and_who_it_belongs_to(admin):
    # Act: open a block link for commission request #42.
    page = get(admin, token_for("block-commission-ip", 42))["body"]

    # Assert: it names the request, the requester and the IP about to be blocked.
    assert "commission request #42" in page
    assert "Sam" in page
    assert "203.0.113.7" in page


def test_get_says_already_done_without_a_form(admin, cursor):
    # Arrange: the IP behind review #7 is already blocked.
    cursor.on("FROM blocked_ips", rows=[{"blocked": 1}])

    # Act: open a block link for it.
    page = get(admin, token_for("block-review-ip", 7))["body"]

    # Assert: the page says so, and offers nothing to confirm.
    assert "already" in page.lower()
    assert "<form" not in page


@pytest.mark.parametrize("kind", ["missing", "empty", "malformed", "expired"])
def test_get_with_a_bad_token_is_403_with_no_database_work(admin, cursor, connection, kind):
    # Act: open the link.
    result = get(admin, bad_token(kind))

    # Assert: refused before the database is touched at all.
    assert result["statusCode"] == 403
    assert "This link is invalid or has expired" in result["body"]
    assert cursor.executed == []
    assert connection.commits == 0 and not connection.closed


def test_get_for_a_missing_target_is_not_found(admin, cursor):
    # Arrange: review #999 doesn't exist.
    cursor.on("FROM reviews", rows=[])

    # Act and assert: a plain "not found" page.
    result = get(admin, token_for("delete-review", 999))
    assert result["statusCode"] == 404
    assert "not found" in result["body"].lower()


# --- POST: performing the action ------------------------------------------------------------------------------


def test_post_delete_soft_deletes_the_review(admin, cursor, connection):
    # Act: confirm deleting review #7.
    result = post(admin, token_for("delete-review", 7))

    # Assert: the flag was set with a parameterised update, committed, and the page says Done.
    assert result["statusCode"] == 200
    assert "Done" in result["body"]
    [(sql, params)] = cursor.queries("UPDATE reviews")
    assert sql == "UPDATE reviews SET deleted = TRUE WHERE id = %s"
    assert params == (7,)
    assert connection.commits == 1


def test_post_delete_on_an_already_deleted_review_is_already_done(admin, cursor):
    # Arrange: review #7 was deleted earlier.
    cursor.on("FROM reviews", rows=[review_row(deleted=True)])

    # Act: confirm the same link again.
    result = post(admin, token_for("delete-review", 7))

    # Assert: nothing is written, and the page says it was already done.
    assert result["statusCode"] == 200
    assert "already done" in result["body"].lower()
    assert writes(cursor) == []


def test_post_block_review_ip_looks_up_the_ip_and_records_the_source(admin, cursor):
    # Act: confirm blocking review #7's IP.
    result = post(admin, token_for("block-review-ip", 7))

    # Assert: the IP came from the review row, and the reason names the review.
    assert "Done" in result["body"]
    assert cursor.queries("FROM reviews")[0][1] == (7,)
    [(sql, params)] = cursor.queries("INSERT INTO blocked_ips")
    assert "ON CONFLICT (ip_address) DO NOTHING" in sql
    assert params == (str(IP), "admin email: review #7")


def test_post_block_commission_ip_records_the_request_as_the_source(admin, cursor):
    # Act: confirm blocking commission request #42's IP.
    post(admin, token_for("block-commission-ip", 42))

    # Assert: the IP came from commission_requests, and the reason names the request.
    assert cursor.queries("FROM commission_requests")[0][1] == (42,)
    [(_, params)] = cursor.queries("INSERT INTO blocked_ips")
    assert params == (str(IP), "admin email: commission #42")


def test_post_block_on_an_already_blocked_ip_is_already_done(admin, cursor):
    # Arrange: the insert hits the existing row, so nothing changes.
    cursor.on("INSERT INTO blocked_ips", rowcount=0)

    # Act and assert: the page says it was already done.
    result = post(admin, token_for("block-review-ip", 7))
    assert "already done" in result["body"].lower()


def test_post_accepts_a_base64_encoded_body(admin, cursor):
    # Act: Lambda function URLs may deliver a form body base64-encoded.
    result = post(admin, token_for("delete-review", 7), base64_body=True)

    # Assert: it's decoded and acted on like a plain one.
    assert "Done" in result["body"]
    assert cursor.queries("UPDATE reviews")


@pytest.mark.parametrize("kind", ["empty", "malformed", "expired"])
def test_post_with_a_bad_token_is_403_with_no_database_work(admin, cursor, kind):
    # Act and assert: refused before the database is touched.
    result = post(admin, bad_token(kind))
    assert result["statusCode"] == 403
    assert cursor.executed == []


def test_post_with_no_body_is_403(admin, cursor):
    # Act: a POST with nothing in it at all.
    result = admin.lambda_handler(make_event("POST", body=None), None)

    # Assert: treated as a bad token.
    assert result["statusCode"] == 403
    assert cursor.executed == []


def test_post_for_a_missing_target_is_not_found(admin, cursor):
    # Arrange: commission request #999 doesn't exist.
    cursor.on("FROM commission_requests", rows=[])

    # Act and assert: "not found", with nothing written.
    result = post(admin, token_for("block-commission-ip", 999))
    assert result["statusCode"] == 404
    assert writes(cursor) == []


# --- Everything else ------------------------------------------------------------------------------------------


@pytest.mark.parametrize("method", ["PUT", "DELETE", "HEAD", "PATCH"])
def test_other_methods_are_405(admin, method):
    # Act and assert: anything but GET/POST is refused outright.
    assert admin.lambda_handler(make_event(method), None)["statusCode"] == 405


@pytest.mark.parametrize(
    "call",
    [
        lambda admin: get(admin, token_for("delete-review", 7)),
        lambda admin: get(admin, "garbage"),
        lambda admin: post(admin, token_for("block-review-ip", 7)),
        lambda admin: post(admin, "garbage"),
        lambda admin: admin.lambda_handler(make_event("PUT"), None),
    ],
    ids=["get-ok", "get-403", "post-ok", "post-403", "405"],
)
def test_every_response_carries_the_security_headers(admin, call):
    # Act: produce each kind of response.
    headers = call(admin)["headers"]

    # Assert: all the spec's headers are present, and it's served as HTML.
    for name, value in SECURITY_HEADERS.items():
        assert headers[name] == value
    assert headers["Content-Type"] == "text/html; charset=utf-8"


@pytest.mark.parametrize("method", ["GET", "POST"])
def test_an_unexpected_crash_shows_a_safe_error_page(admin, monkeypatch, capsys, method):
    # Arrange: a valid link, but the database can't be reached.
    token = token_for("delete-review", 7)

    def unreachable():
        raise ConnectionError("neon is down")

    monkeypatch.setattr(admin, "connect_to_db", unreachable)

    # Act: open the link, or press Confirm.
    result = get(admin, token) if method == "GET" else post(admin, token)

    # Assert: a 500 page saying what to do, with every security header, instead of AWS's raw 502.
    assert result["statusCode"] == 500
    assert "Something went wrong" in result["body"]
    assert "try the link again" in result["body"]
    for name, value in SECURITY_HEADERS.items():
        assert result["headers"][name] == value

    # The crash is logged for CloudWatch, but the token (a credential) never is.
    lines = logged(capsys)
    assert any(line["event"] == "unexpected_error" for line in lines)
    assert token not in json.dumps(lines)


def test_ipv6_block_says_it_covers_the_whole_64(admin, cursor):
    # Arrange: the review came from an IPv6 address.
    cursor.on("FROM reviews", rows=[review_row(ip_address=ipaddress.ip_address("2001:db8:1:2::9"))])

    # Act: open its Block link.
    result = get(admin, token_for("block-review-ip", 7))

    # Assert: the page names the range the block will cover, not just the one address.
    assert "IP range 2001:db8:1:2::/64 will no longer be able to" in result["body"]


def test_ipv4_block_names_the_single_address(admin):
    # Act: open a Block link for an IPv4 review.
    result = get(admin, token_for("block-review-ip", 7))

    # Assert: the page names exactly that address.
    assert "IP 203.0.113.7 will no longer be able to" in result["body"]


# --- Contact-message blocks (the link carries the IP, as a number) -------------------------------------------


def contact_token(ip="203.0.113.7"):
    """A block link for a contact message's sender."""
    return token_for("block-contact-ip", int(ipaddress.ip_address(ip)))


def test_get_contact_block_shows_the_ip_and_a_confirm_form(admin, cursor):
    # Act: open a contact block link.
    page = get(admin, contact_token())["body"]

    # Assert: it names the IP and offers Confirm, after only checking the blocklist (no message to look up).
    assert "203.0.113.7" in page
    assert "contact message" in page
    assert '<form method="post">' in page
    assert [sql for sql, _ in cursor.executed if "FROM blocked_ips" not in sql] == []


def test_get_contact_block_for_an_already_blocked_ip_says_so(admin, cursor):
    # Arrange: the IP is already blocked.
    cursor.on("FROM blocked_ips", rows=[{"blocked": 1}])

    # Act and assert: no form, just "already done".
    page = get(admin, contact_token())["body"]
    assert "already" in page.lower()
    assert "<form" not in page


@pytest.mark.parametrize(
    "ip, blocked",
    [("203.0.113.7", "203.0.113.7"), ("2001:db8::1", "2001:db8::/64")],
    ids=["ipv4-exact", "ipv6-whole-64"],
)
def test_post_contact_block_blocks_the_ip_from_the_link(admin, cursor, ip, blocked):
    # Act: confirm the block.
    result = post(admin, contact_token(ip))

    # Assert: the sender's scope is blocked (an IPv4 address, or an IPv6 /64), with the contact message as the reason.
    assert "Done" in result["body"]
    [(_, params)] = cursor.queries("INSERT INTO blocked_ips")
    assert params == (blocked, "admin email: contact message")


def test_post_contact_block_on_an_already_blocked_ip_is_already_done(admin, cursor):
    # Arrange: the insert hits the existing row.
    cursor.on("INSERT INTO blocked_ips", rowcount=0)

    # Act and assert: nothing changed.
    assert "already done" in post(admin, contact_token())["body"].lower()
