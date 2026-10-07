import ipaddress

import pytest

from ip_scope import ip_scope


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
