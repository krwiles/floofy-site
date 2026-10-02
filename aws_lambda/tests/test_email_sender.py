import pytest

import email_sender


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
