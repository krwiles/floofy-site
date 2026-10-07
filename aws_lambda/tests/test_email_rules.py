import pytest

from email_rules import defuse_links, is_plain_address


@pytest.mark.parametrize("email", ["sam@example.com", "sam.fox+art@mail.example.co.jp", "a" * 88 + "@example.com"])
def test_plain_addresses_pass(email):
    # Act and assert: one ordinary address (up to 100 characters) is accepted.
    assert is_plain_address(email) is True


@pytest.mark.parametrize(
    "email",
    [
        "a@b.com, victim@x.com",
        "a@b.com;victim@x.com",
        "Sam <sam@example.com>",
        'sam"@example.com',
        "sam @example.com",
        "sam@localhost",
        "sam@@example.com",
        "sam@ex@ample.com",
        "a" * 89 + "@example.com",
        "",
    ],
    ids=["comma-list", "semicolon-list", "display-name", "quote", "space", "no-dot", "double-at", "two-ats", "101-chars", "empty"],
)
def test_anything_but_one_plain_address_fails(email):
    # Act and assert: lists, names, quotes, spaces and overlong text are all refused.
    assert is_plain_address(email) is False


@pytest.mark.parametrize(
    "text, expected",
    [
        ("Verify at https://evil.example/login", "Verify at hxxps[:]//evil[.]example/login"),
        ("see http://x.example", "see hxxp[:]//x[.]example"),
        ("go to evil.example now", "go to evil[.]example now"),
        ("mail me@mail.example", "mail me@mail[.]example"),
        ("A fox. In a scarf, e.g. red; 3.5 inches", "A fox. In a scarf, e.g. red; 3.5 inches"),
    ],
    ids=["https-url", "http-url", "bare-domain", "address", "ordinary-text-unchanged"],
)
def test_defuse_links_leaves_nothing_clickable(text, expected):
    # Act and assert: links and domains are broken up; ordinary punctuation is left alone.
    assert defuse_links(text) == expected
