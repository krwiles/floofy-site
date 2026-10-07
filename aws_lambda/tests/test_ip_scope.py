import ipaddress

import pytest

from ip_scope import canonical_ip, ip_scope


@pytest.mark.parametrize(
    "ip, expected",
    [
        ("203.0.113.7", "203.0.113.7"),
        ("2001:db8:1:2:aaaa:bbbb:cccc:dddd", "2001:db8:1:2::/64"),
        ("2001:db8:1:2::1", "2001:db8:1:2::/64"),
        ("::ffff:203.0.113.7", "203.0.113.7"),
        (ipaddress.ip_address("2001:db8:1:2::9"), "2001:db8:1:2::/64"),
    ],
    ids=["ipv4-unchanged", "ipv6-to-its-64", "ipv6-short-form", "ipv4-mapped-ipv6-is-ipv4", "ipaddress-object"],
)
def test_ip_scope(ip, expected):
    # Act and assert: IPv4 stays one address; IPv6 widens to the /64 one connection owns.
    assert ip_scope(ip) == expected


@pytest.mark.parametrize(
    "ip, expected",
    [("::ffff:203.0.113.7", "203.0.113.7"), ("203.0.113.7", "203.0.113.7"), ("2001:DB8::0001", "2001:db8::1")],
    ids=["ipv4-in-ipv6-form-unwrapped", "ipv4-unchanged", "ipv6-standard-spelling"],
)
def test_canonical_ip(ip, expected):
    # Act and assert: one spelling per visitor, so stored rows and later checks always agree.
    assert canonical_ip(ip) == expected
