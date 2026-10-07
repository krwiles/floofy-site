"""The address a rate limit or block applies to -- see CONTEXT.md's "IP scope" and docs/review/2026-10-02-pr2-plan.md."""

import ipaddress

# One IPv6 home or phone connection owns a whole /64 and rotates through it, so that's what counts as one visitor
IPV6_SCOPE_PREFIX = 64


def ip_scope(ip):
    """An IPv4 address as itself (e.g. "203.0.113.7"); an IPv6 address as its /64 network ("2001:db8:1:2::/64")."""
    # Accept text or an ipaddress object (psycopg returns inet columns as the latter)
    address = ipaddress.ip_address(str(ip))

    # An IPv4 address written in IPv6 form is still that IPv4 address
    if address.version == 6 and address.ipv4_mapped:
        address = address.ipv4_mapped

    # IPv4 stays one address; IPv6 widens to the network its connection owns
    if address.version == 4:
        return str(address)
    return str(ipaddress.ip_network(f"{address}/{IPV6_SCOPE_PREFIX}", strict=False))
