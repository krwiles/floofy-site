import json

import pytest

from conftest import make_event

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
