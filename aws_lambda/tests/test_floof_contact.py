import pytest

from conftest import make_event

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
