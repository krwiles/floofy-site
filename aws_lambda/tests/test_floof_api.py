import json
import re
import time
from datetime import datetime, timezone

import pytest

import admin_links
from conftest import admin_tokens, make_event


@pytest.fixture
def api(load_lambda, cursor):
    # Default database state: not blocked, no review this hour, new review #7 saved at 04:00 UTC, and 3 earlier reviews.
    cursor.on("INTERVAL '1 hour'", rows=[{"count": 0}])
    cursor.on("INSERT INTO reviews", rows=[{"id": 7, "created_at": datetime(2026, 9, 30, 4, 0, tzinfo=timezone.utc)}])
    cursor.on("AS earlier", rows=[{"earlier": 3}])
    return load_lambda("floof-api")


def post_review(api, author="Robin", comment="Lovely art!"):
    """Submit a review through the handler, the way the site does."""
    return api.lambda_handler(make_event("POST", {"author": author, "comment": comment}), None)


def test_new_review_emails_the_owner_with_delete_and_block_links(api, emails):
    # Act: post a review (the fake insert returns id 7).
    result = post_review(api)

    # Assert: saved, and exactly one email went to the owner from the site address.
    assert result["statusCode"] == 201
    [sent] = emails.sent
    assert sent["to"] == ["owner@example.com"]
    assert sent["from"] == "FloofySite <no-reply@summerfloofy.com>"

    # Its two links decode to "delete review #7" and "block review #7's IP".
    actions = [admin_links.verify(token, now=time.time()) for token in admin_tokens(sent["html"])]
    assert actions == [("delete-review", 7), ("block-review-ip", 7)]
    assert "Delete this review" in sent["html"]
    assert "Block this reviewer" in sent["html"]


def test_email_shows_the_review_details_and_earlier_review_count(api, cursor, emails):
    # Act: post a review.
    post_review(api)

    # Assert: the body names the review number, author, comment, saved time (in SGT), IP and earlier-review count.
    html = emails.sent[0]["html"]
    posted = "Wednesday, 30 September 2026 at 12:00 PM (SGT)"
    for expected in ["#7", "Robin", "Lovely art!", posted, "203.0.113.7", "Earlier reviews from this IP:</strong> 3"]:
        assert expected in html

    # The count covers this IP's reviews before the new one, passed as parameters.
    [(sql, params)] = cursor.queries("AS earlier")
    assert params == ("203.0.113.7", 7)


def test_author_and_comment_are_escaped(api, emails):
    # Act: post a review with markup in both fields.
    post_review(api, author="<b>Robin</b>", comment='<a href="//evil.example">Delete this review</a>')

    # Assert: the markup shows as text, and the only live links are the two genuine admin ones.
    html = emails.sent[0]["html"]
    assert "&lt;b&gt;Robin&lt;/b&gt;" in html
    assert "&lt;a href=" in html
    assert '<a href="//evil.example">' not in html
    assert len(re.findall(r"<a ", html)) == 2


def test_insert_returns_the_new_id_and_is_committed(api, cursor, connection, emails):
    # Act: post a review.
    post_review(api)

    # Assert: the insert asks for the new id and saved time back, and the review was committed.
    [(sql, params)] = cursor.queries("INSERT INTO reviews")
    assert "RETURNING id, created_at" in sql
    assert params == ("Robin", "Lovely art!", "203.0.113.7")
    assert connection.commits >= 1


def test_email_failure_still_returns_201(api, connection, emails, capsys):
    # Arrange: Resend is down.
    emails.fail = True

    # Act: post a review.
    result = post_review(api)

    # Assert: the visitor still sees success, the review was committed, and the failure was logged for CloudWatch.
    assert result["statusCode"] == 201
    assert connection.commits >= 1
    assert "#7" in capsys.readouterr().out


def test_missing_admin_config_still_returns_201(api, emails, monkeypatch):
    # Arrange: the Lambda was deployed without its link secret.
    monkeypatch.delenv("ADMIN_LINK_SECRET")

    # Act and assert: the review is still accepted; only the email is skipped.
    assert post_review(api)["statusCode"] == 201
    assert emails.sent == []


def test_blocked_ip_gets_no_review_and_no_email(api, cursor, emails):
    # Arrange: this IP is in blocked_ips.
    cursor.on("FROM blocked_ips", rows=[{"exists": True}])

    # Act: try to post.
    result = post_review(api)

    # Assert: the existing vague refusal, with nothing inserted or emailed.
    assert result["statusCode"] == 403
    assert json.loads(result["body"]) == {"message": "Internal Server Error"}
    assert cursor.queries("INSERT") == []
    assert emails.sent == []


def test_rate_limited_review_sends_no_email(api, cursor, emails):
    # Arrange: this IP already posted within the hour.
    cursor.on("INTERVAL '1 hour'", rows=[{"count": 1}])

    # Act and assert: the existing 429, with nothing inserted or emailed.
    assert post_review(api)["statusCode"] == 429
    assert cursor.queries("INSERT") == []
    assert emails.sent == []
