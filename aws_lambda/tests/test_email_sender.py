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
