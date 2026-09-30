import base64
import hashlib
import hmac
import time
from urllib.parse import parse_qs, urlparse

import pytest

import admin_links

NOW = 1_800_000_000
LATER = NOW + 60


def b64(raw):
    """Unpadded base64url, the same encoding the tokens use."""
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def forge(payload, secret):
    """Build a token by hand from any payload and secret, to simulate tampering."""
    signature = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).digest()
    return b64(payload.encode()) + "." + b64(signature)


def test_signed_token_verifies_to_its_action_and_id():
    # Sign a link that expires in an hour.
    token = admin_links.sign("delete-review", 123, NOW + 3600)

    # It decodes back to exactly what was signed.
    assert admin_links.verify(token, now=NOW) == ("delete-review", 123)


@pytest.mark.parametrize(
    "payload",
    [
        "delete-review.124.1800003600",  # a different id
        "block-review-ip.123.1800003600",  # a different action
        "delete-review.123.1900000000",  # a pushed-back expiry
    ],
)
def test_editing_the_payload_breaks_the_signature(payload):
    # Take a genuine signature and pair it with an edited payload.
    genuine = admin_links.sign("delete-review", 123, NOW + 3600)
    tampered = b64(payload.encode()) + "." + genuine.split(".")[1]

    # The signature no longer matches, so the token is refused.
    assert admin_links.verify(tampered, now=NOW) is None


def test_expired_token_is_refused():
    # Sign a link that expired one second before "now".
    token = admin_links.sign("delete-review", 123, NOW - 1)

    # A valid signature alone isn't enough once it's past expiry.
    assert admin_links.verify(token, now=NOW) is None


def test_token_is_refused_at_the_exact_expiry_second():
    # Expiry is exclusive: the link dies at expires_at, not one second after.
    token = admin_links.sign("delete-review", 123, NOW)
    assert admin_links.verify(token, now=NOW) is None


@pytest.mark.parametrize(
    "token",
    [
        None,
        "",
        "no-dot-at-all",
        "one.two.three",
        "!!!notbase64.???",
        b64(b"delete-review.123.1800003600"),  # payload with no signature
        "." + b64(b"x" * 32),  # signature with no payload
    ],
)
def test_malformed_tokens_are_refused_without_raising(token):
    # Garbage in must mean a clean refusal, never an exception (which would become a 500).
    assert admin_links.verify(token, now=NOW) is None


@pytest.mark.parametrize(
    "payload",
    [
        "drop-tables.123.1800003600",  # unknown action
        "delete-review.abc.1800003600",  # non-numeric id
        "delete-review.123.soon",  # non-numeric expiry
        "delete-review.123",  # missing expiry
        "delete-review.1.2.3",  # extra part
    ],
)
def test_correctly_signed_but_nonsensical_payloads_are_refused(payload):
    # Even with the real secret, a payload the server doesn't understand is refused.
    token = forge(payload, admin_links._secret().decode())
    assert admin_links.verify(token, now=NOW) is None


def test_token_signed_with_a_different_secret_is_refused():
    # An attacker who guesses the format but not the key can't produce a valid token.
    token = forge("delete-review.123.1800003600", "attacker-guess-at-the-secret-value-xxxxxxxx")
    assert admin_links.verify(token, now=NOW) is None


def test_sign_rejects_unknown_actions():
    # A typo in calling code should fail loudly, not produce a link that can never work.
    with pytest.raises(ValueError):
        admin_links.sign("delete-reveiw", 123, NOW)


@pytest.mark.parametrize("secret", ["", "short"])
def test_missing_or_weak_secret_is_a_hard_error(monkeypatch, secret):
    # An empty or short key would make tokens guessable, so refuse to sign with one.
    monkeypatch.setenv("ADMIN_LINK_SECRET", secret)
    with pytest.raises(RuntimeError):
        admin_links.sign("delete-review", 123, NOW)


def test_link_points_at_the_admin_url_and_lasts_seven_days():
    # Build a link the way the emails do.
    url = admin_links.link("https://admin.example/", "block-commission-ip", 42)

    # It targets the admin Lambda with a token query parameter.
    parsed = urlparse(url)
    assert f"{parsed.scheme}://{parsed.netloc}{parsed.path}" == "https://admin.example/"
    token = parse_qs(parsed.query)["token"][0]

    # The token works now and just before seven days, but not just after.
    seven_days = 7 * 24 * 60 * 60
    assert admin_links.verify(token, now=time.time()) == ("block-commission-ip", 42)
    assert admin_links.verify(token, now=time.time() + seven_days - 60) == ("block-commission-ip", 42)
    assert admin_links.verify(token, now=time.time() + seven_days + 60) is None
