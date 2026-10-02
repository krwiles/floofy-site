"""Every Lambda logs each request it receives, and the key outcomes, as one JSON line each (never secrets or tokens)."""

import time
from datetime import datetime, timezone

import pytest

import admin_links
import request_log
from conftest import logged, make_event
from test_floof_comm import commission_body


def test_log_prints_one_json_line_with_the_event_name(capsys):
    # Act: log an outcome with a couple of fields.
    request_log.log("review_saved", review_id=7, ip="203.0.113.7")

    # Assert: exactly one parseable line carrying the name and the fields.
    assert logged(capsys) == [{"event": "review_saved", "review_id": 7, "ip": "203.0.113.7"}]


def test_log_request_records_who_called_but_never_the_body_or_query(capsys):
    # Arrange: a request carrying a body and a token in the query string.
    event = make_event("POST", body={"comment": "private words"}, query={"token": "secret-token"})

    # Act: log it.
    request_log.log_request(event)

    # Assert: method, path, IP and user agent only; nothing the visitor typed, and no token.
    [line] = logged(capsys)
    assert line == {"event": "request", "method": "POST", "path": "/", "ip": "203.0.113.7", "user_agent": "test-agent/1.0"}


@pytest.mark.parametrize("name", ["floof-api", "floof-comm", "floof-contact", "floof-admin"])
def test_every_lambda_logs_every_request_even_refused_ones(load_lambda, capsys, name):
    # Act: send a method no Lambda supports.
    load_lambda(name).lambda_handler(make_event("PATCH"), None)

    # Assert: the attempt is still on record, with the caller's IP.
    assert {"event": "request", "method": "PATCH", "ip": "203.0.113.7"}.items() <= logged(capsys)[0].items()


# --- floof-api --------------------------------------------------------------------------------------------------


@pytest.fixture
def api(load_lambda, cursor):
    # Not blocked, no review this hour, and the insert returns review #7.
    cursor.on("INTERVAL '1 hour'", rows=[{"count": 0}])
    cursor.on("INSERT INTO reviews", rows=[{"id": 7, "created_at": datetime.now(timezone.utc)}])
    cursor.on("AS earlier", rows=[{"earlier": 0}])
    return load_lambda("floof-api")


def review_event():
    return make_event("POST", {"author": "Robin", "comment": "Lovely"})


def test_api_logs_a_saved_review_and_its_email(api, emails, capsys):
    # Act: post a review.
    api.lambda_handler(review_event(), None)

    # Assert: the save and the notification are both recorded, by id.
    names = [(line["event"], line.get("review_id")) for line in logged(capsys)]
    assert ("review_saved", 7) in names
    assert ("owner_email_sent", 7) in names


def test_api_logs_why_a_review_was_refused(api, cursor, emails, capsys):
    # Arrange: this IP is blocked.
    cursor.on("FROM blocked_ips", rows=[{"blocked": 1}])

    # Act: try to post.
    api.lambda_handler(review_event(), None)

    # Assert: the refusal and its reason are recorded.
    assert {"event": "refused", "reason": "blocked", "ip": "203.0.113.7"} in logged(capsys)


def test_api_logs_an_email_failure(api, emails, capsys):
    # Arrange: Resend is down.
    emails.fail = True

    # Act: post a review.
    api.lambda_handler(review_event(), None)

    # Assert: the failure names the review and the error.
    [failure] = [line for line in logged(capsys) if line["event"] == "owner_email_failed"]
    assert failure["review_id"] == 7
    assert "resend is down" in failure["error"]


# --- floof-comm -------------------------------------------------------------------------------------------------


@pytest.fixture
def comm(load_lambda, cursor):
    # Not blocked, no recent requests, and the insert returns request #42.
    cursor.on("FROM commission_requests", rows=[{"recent": 0}])
    cursor.on("INSERT INTO commission_requests", rows=[{"id": 42}])
    return load_lambda("floof-comm")


def test_comm_logs_a_rate_limited_request(comm, cursor, emails, capsys):
    # Arrange: two requests already today.
    cursor.on("FROM commission_requests", rows=[{"recent": 2}])

    # Act: send a third.
    comm.lambda_handler(make_event("POST", commission_body()), None)

    # Assert: the refusal and its reason are recorded.
    assert {"event": "refused", "reason": "rate_limited", "ip": "203.0.113.7"} in logged(capsys)


def test_comm_logs_invalid_input(comm, emails, capsys):
    # Act: send a request with an impossible price.
    comm.lambda_handler(make_event("POST", commission_body(estimatedPrice=-5)), None)

    # Assert: recorded as refused for bad input.
    assert {"event": "refused", "reason": "invalid", "ip": "203.0.113.7"} in logged(capsys)


def test_comm_logs_the_saved_request_and_an_email_failure(comm, emails, capsys):
    # Arrange: Resend is down.
    emails.fail = True

    # Act: submit a valid request.
    comm.lambda_handler(make_event("POST", commission_body()), None)

    # Assert: the saved id is recorded, and so is the email error that used to be swallowed silently.
    lines = logged(capsys)
    assert {"event": "commission_saved", "request_id": 42, "ip": "203.0.113.7"} in lines
    [failure] = [line for line in lines if line["event"] == "email_failed"]
    assert "resend is down" in failure["error"]


# --- floof-contact ----------------------------------------------------------------------------------------------


def test_contact_logs_blocked_and_sent_messages(load_lambda, cursor, emails, capsys):
    # Act: one message from an unblocked IP, then block it and try again.
    contact = load_lambda("floof-contact")
    body = {"name": "a", "email": "b", "message": "c"}
    contact.lambda_handler(make_event("POST", body), None)
    cursor.on("FROM blocked_ips", rows=[{"blocked": 1}])
    contact.lambda_handler(make_event("POST", body), None)

    # Assert: both outcomes are on record.
    lines = logged(capsys)
    assert {"event": "contact_email_sent", "ip": "203.0.113.7"} in lines
    assert {"event": "refused", "reason": "blocked", "ip": "203.0.113.7"} in lines


# --- floof-admin ------------------------------------------------------------------------------------------------


@pytest.fixture
def admin(load_lambda, cursor):
    # Review #7 exists and isn't deleted.
    cursor.on("FROM reviews", rows=[{"who": "R", "text": "t", "created_at": datetime.now(timezone.utc), "ip_address": "203.0.113.7", "deleted": False}])
    cursor.on("UPDATE reviews", rowcount=1)
    return load_lambda("floof-admin")


def test_admin_logs_a_bad_link_without_the_token(admin, capsys):
    # Act: open a link with a forged token.
    admin.lambda_handler(make_event("GET", query={"token": "forged-token-value"}), None)

    # Assert: the attempt is recorded, and the token text appears nowhere in the logs.
    lines = logged(capsys)
    assert {"event": "admin_invalid_link", "method": "GET", "ip": "203.0.113.7"} in lines
    assert "forged-token-value" not in str(lines)


def test_admin_logs_what_was_viewed_and_what_was_done(admin, capsys):
    # Act: open a delete link, then confirm it.
    token = admin_links.sign("delete-review", 7, int(time.time()) + 60)
    admin.lambda_handler(make_event("GET", query={"token": token}), None)
    admin.lambda_handler(make_event("POST", body=f"token={token}"), None)

    # Assert: both steps are recorded by action and id, with the outcome, and never the token.
    lines = logged(capsys)
    assert {"event": "admin_confirm_shown", "action": "delete-review", "target_id": 7, "ip": "203.0.113.7"} in lines
    assert {"event": "admin_action", "action": "delete-review", "target_id": 7, "result": "done", "ip": "203.0.113.7"} in lines
    assert token not in str(lines)
