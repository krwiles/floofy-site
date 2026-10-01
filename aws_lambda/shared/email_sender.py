"""Email settings shared by every Lambda that sends mail through Resend."""

import os

# The verified sending address on the site's own domain; a constant, not a setting — see spec.md "Configuration".
EMAIL_FROM = "FloofySite <no-reply@summerfloofy.com>"


def admin_recipients():
    """Every admin address in FLOOFY_EMAIL, which may hold several separated by commas."""
    # Split on commas and drop blanks, so spaces or a trailing comma in the console don't matter
    return [address.strip() for address in os.environ["FLOOFY_EMAIL"].split(",") if address.strip()]
