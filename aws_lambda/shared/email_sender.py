"""Email settings shared by every Lambda that sends mail through Resend."""

import html
import os
import re

import resend

# The verified sending address on the site's own domain; a constant, not a setting — see spec.md "Configuration".
EMAIL_FROM = "FloofySite <no-reply@summerfloofy.com>"

# Resend waits 30 s by default, longer than the Lambda's limit; give up sooner so the failure is logged and answered
EMAIL_TIMEOUT_SECONDS = 8
resend.default_http_client = resend.RequestsClient(timeout=EMAIL_TIMEOUT_SECONDS)


def admin_recipients():
    """Every admin address in FLOOFY_EMAIL, which may hold several separated by commas."""
    # Split on commas and drop blanks, so spaces or a trailing comma in the console don't matter
    return [address.strip() for address in os.environ["FLOOFY_EMAIL"].split(",") if address.strip()]


def email_content(body_html):
    """The `html` and `text` fields for a Resend email: a full HTML document plus a plain-text copy, which help
    keep mail out of spam folders."""
    # Wrap the body fragment in a complete document
    document = f'<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body>{body_html}</body></html>'
    return {"html": document, "text": _plain_text(body_html)}


def _plain_text(body_html):
    """The same email as plain text, derived from its HTML so the two can't drift apart."""
    # Spell out each link as "label: url", since plain text can't hide a URL behind a button
    text = re.sub(
        r'<a\s[^>]*href="([^"]*)"[^>]*>(.*?)</a>',
        lambda match: f"{match[2]}: {match[1]}",
        body_html,
        flags=re.S | re.I,
    )

    # End a line after each heading, paragraph or list item, then drop every remaining tag
    text = re.sub(r"</(?:p|h[1-6]|li|ul|ol|div)>|<br\s*/?>", "\n", text, flags=re.I)
    text = re.sub(r"<[^>]+>", "", text)

    # Turn entities like &lt; back into characters, then tidy spacing and drop blank lines
    lines = [" ".join(line.split()) for line in html.unescape(text).splitlines()]
    return "\n".join(line for line in lines if line)
