"""Rules that stop the commission form's customer confirmation being used to send spam or phishing -- see
docs/review/2026-10-02-pr2-plan.md (S1)."""

import re

# The longest customer address accepted, matching the commission_requests.email column
MAX_ADDRESS_LENGTH = 100

# One address: no spaces or list/name characters, a single @, and a dot somewhere in the domain
PLAIN_ADDRESS = re.compile(r'[^\s@<>,;"]+@[^\s@<>,;"]+\.[^\s@<>,;"]+')

# A link's scheme ("https://"), and a dot between a word and 2+ letters (a domain, as in evil.example)
LINK_SCHEME = re.compile(r"\b(h)tt(ps?)://", re.IGNORECASE)
DOMAIN_DOT = re.compile(r"(?<=\w)\.(?=[A-Za-z]{2,})")


def is_plain_address(email):
    """True only for a single, ordinary email address no longer than MAX_ADDRESS_LENGTH."""
    return len(email) <= MAX_ADDRESS_LENGTH and PLAIN_ADDRESS.fullmatch(email) is not None


def defuse_links(text):
    """`text` with nothing a mail client would turn into a link: https://evil.example -> hxxps[:]//evil[.]example."""
    # Break the scheme, then every domain-style dot, so neither a full URL nor a bare domain stays clickable
    text = LINK_SCHEME.sub(r"\1xx\2[:]//", text)
    return DOMAIN_DOT.sub("[.]", text)
