import json

import pytest
import resend

import email_sender
from conftest import logged


@pytest.mark.parametrize(
    "value, expected",
    [
        ("owner@example.com", ["owner@example.com"]),
        ("a@example.com,b@example.com", ["a@example.com", "b@example.com"]),
        (" a@example.com , b@example.com ,", ["a@example.com", "b@example.com"]),
    ],
    ids=["one", "two", "spaces-and-trailing-comma"],
)
def test_admin_recipients_splits_floofy_email_on_commas(monkeypatch, value, expected):
    # Arrange: FLOOFY_EMAIL as the owner would type it in the Lambda console.
    monkeypatch.setenv("FLOOFY_EMAIL", value)

    # Act and assert: one clean address per admin.
    assert email_sender.admin_recipients() == expected


def test_email_content_wraps_the_html_in_a_full_document():
    # Act: build an email from a body fragment.
    content = email_sender.email_content("<h1>Hi</h1><p>Body</p>")

    # Assert: a complete HTML document around the original body.
    assert content["html"].startswith("<!doctype html>")
    assert "<body><h1>Hi</h1><p>Body</p></body>" in content["html"]


def test_email_content_derives_a_plain_text_version():
    # Arrange: a body with escaped user text, a list and a button link.
    body = (
        "<h1>New review #7</h1>"
        "<p><strong>Comment:</strong> 5 &lt; 6 &amp; fine</p>"
        "<ul><li>One</li><li>Two</li></ul>"
        '<p><a href="https://admin.example/?token=abc">Delete this review</a></p>'
    )

    # Act: build the email.
    text = email_sender.email_content(body)["text"]

    # Assert: no tags, entities turned back into characters, one item per line, and the link spelled out.
    assert "<" not in text.replace("5 < 6", "")
    assert "Comment: 5 < 6 & fine" in text
    assert "One\nTwo" in text
    assert "Delete this review: https://admin.example/?token=abc" in text


def test_resend_gives_up_before_the_lambda_is_cut_off():
    # Assert: importing email_sender swapped Resend's 30 second default for an 8 second timeout.
    assert isinstance(resend.default_http_client, resend.RequestsClient)
    assert resend.default_http_client._timeout == email_sender.EMAIL_TIMEOUT_SECONDS == 8


def test_send_delivers_a_full_email_and_reports_success(emails):
    # Act: send one email with a reply-to address.
    sent = email_sender.send(["a@example.com"], "Hi", "<p>Body</p>", reply_to=["owner@example.com"], to="customer")

    # Assert: True, and exactly one email from the site address, with both bodies and the reply-to.
    assert sent is True
    [params] = emails.sent
    assert params["from"] == email_sender.EMAIL_FROM
    assert params["to"] == ["a@example.com"]
    assert params["subject"] == "Hi"
    assert params["reply_to"] == ["owner@example.com"]
    assert params["html"].startswith("<!doctype html>") and params["text"] == "Body"


def test_send_leaves_out_reply_to_when_none_is_given(emails):
    # Act: send without a reply-to.
    email_sender.send(["a@example.com"], "Hi", "<p>Body</p>", to="owner")

    # Assert: no reply_to key at all, so Resend uses the sender.
    assert "reply_to" not in emails.sent[0]


def test_send_failure_is_logged_with_context_and_reported_as_false(emails, capsys):
    # Arrange: Resend is down.
    emails.fail = True

    # Act: try to send, naming which saved request and recipient this was.
    sent = email_sender.send(["secret@example.com"], "Hi", "<p>Body</p>", request_id=42, to="customer")

    # Assert: False, with one email_failed line carrying the context and the error, but never the address.
    assert sent is False
    [line] = logged(capsys)
    assert (line["event"], line["request_id"], line["to"]) == ("email_failed", 42, "customer")
    assert "resend is down" in line["error"]
    assert "secret@example.com" not in json.dumps(line)
