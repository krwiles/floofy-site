"""Signed one-action links for the admin emails — see docs/features/review-moderation/spec.md.

A token is `base64url("<action>.<target_id>.<expires_unix>") + "." + base64url(HMAC-SHA256(secret, payload))`.
Only someone holding ADMIN_LINK_SECRET can make one, and changing any part of it breaks the signature.
"""

import base64
import binascii
import hashlib
import hmac
import os
import time

ACTIONS = frozenset({"delete-review", "block-review-ip", "block-commission-ip"})
LINK_LIFETIME_SECONDS = 7 * 24 * 60 * 60
MIN_SECRET_LENGTH = 32


def _secret():
    """The signing key from the environment, refusing an empty or short one that would make tokens guessable."""
    secret = os.environ.get("ADMIN_LINK_SECRET", "")
    if len(secret) < MIN_SECRET_LENGTH:
        raise RuntimeError("ADMIN_LINK_SECRET is missing or too short")
    return secret.encode("utf-8")


def _b64encode(raw):
    # URL-safe alphabet without "=" padding, so the token can sit in a query string untouched.
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def _b64decode(text):
    # Put back the padding _b64encode stripped; raises ValueError (binascii.Error) on bad input.
    return base64.b64decode(text + "=" * (-len(text) % 4), altchars=b"-_", validate=True)


def _signature(payload):
    # HMAC-SHA256 of the payload under the secret: 32 bytes only the key holder can produce.
    return hmac.new(_secret(), payload, hashlib.sha256).digest()


def sign(action, target_id, expires_at):
    """Return a token allowing `action` on `target_id` until the unix time `expires_at`."""
    # Catch typos in calling code here, rather than emailing a link that can never work.
    if action not in ACTIONS:
        raise ValueError(f"unknown admin action: {action}")

    # Sign the dotted payload and join the two encoded halves with a dot.
    payload = f"{action}.{int(target_id)}.{int(expires_at)}".encode("ascii")
    return _b64encode(payload) + "." + _b64encode(_signature(payload))


def verify(token, now):
    """Return `(action, target_id)` for a genuine, unexpired token, or None for anything else. Never raises on bad input."""
    # Split into payload and signature, decoding both; any malformed shape is a refusal.
    if not isinstance(token, str):
        return None
    try:
        encoded_payload, encoded_signature = token.split(".")
        payload = _b64decode(encoded_payload)
        signature = _b64decode(encoded_signature)
    except ValueError:
        return None

    # Check the signature before trusting anything in the payload; compare_digest takes the same time however many bytes match.
    if not hmac.compare_digest(signature, _signature(payload)):
        return None

    # Unpack the three payload parts, refusing anything the server doesn't understand.
    try:
        action, target_id, expires_at = payload.decode("ascii").split(".")
        target_id = int(target_id)
        expires_at = int(expires_at)
    except ValueError:
        return None
    if action not in ACTIONS:
        return None

    # A genuine token still stops working at its expiry time.
    if now >= expires_at:
        return None
    return action, target_id


def link(admin_url, action, target_id):
    """The full admin URL for one action on one target, valid for seven days from now."""
    expires_at = int(time.time()) + LINK_LIFETIME_SECONDS
    return f"{admin_url}?token={sign(action, target_id, expires_at)}"
