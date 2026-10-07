"""The address a rate limit or block applies to -- see CONTEXT.md's "IP scope" and docs/review/2026-10-02-pr2-plan.md."""

import ipaddress

# How much of an IPv6 address counts as one visitor -- see CONTEXT.md's "IP scope"
IPV6_SCOPE_PREFIX = 64


def canonical_ip(ip):
    """`ip` as text in one standard form: an IPv4 address written in IPv6 form (::ffff:203.0.113.7) becomes plain IPv4,
    so it's stored, counted and blocked as the same visitor."""
    # Accept text or an ipaddress object (psycopg returns inet columns as the latter)
    address = ipaddress.ip_address(str(ip))

    # Unwrap an IPv4 address written in IPv6 form
    if address.version == 6 and address.ipv4_mapped:
        address = address.ipv4_mapped
    return str(address)


def ip_scope(ip):
    """An IPv4 address as itself (e.g. "203.0.113.7"); an IPv6 address as its /64 network ("2001:db8:1:2::/64")."""
    # Start from the standard form, so IPv4 written as IPv6 is treated as IPv4
    address = ipaddress.ip_address(canonical_ip(ip))

    # IPv4 stays one address; IPv6 widens to the network its connection owns
    if address.version == 4:
        return str(address)
    return str(ipaddress.ip_network(f"{address}/{IPV6_SCOPE_PREFIX}", strict=False))
