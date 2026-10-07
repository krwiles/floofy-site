"""Reading and writing the `blocked_ips` table, shared by every Lambda that accepts visitor input."""

from ip_scope import canonical_ip, ip_scope

# A row may be one address or an IPv6 /64; >>= means "the row's address or network contains the visitor's address"
IS_BLOCKED_QUERY = """
SELECT 1 AS blocked
FROM blocked_ips
WHERE ip_address >>= %s::inet
"""

BLOCK_QUERY = """
INSERT INTO blocked_ips (ip_address, reason)
VALUES (%s, %s)
ON CONFLICT (ip_address) DO NOTHING
"""


def is_blocked(cur, ip_address):
    """True if any blocked_ips row covers `ip_address` (the exact address, or the IPv6 /64 it belongs to)."""
    # Any row at all means blocked; checking for None works whichever row factory the cursor uses.
    cur.execute(IS_BLOCKED_QUERY, (canonical_ip(ip_address),))
    return cur.fetchone() is not None


def block(cur, ip_address, reason):
    """Block `ip_address`'s scope (an IPv4 address, or its IPv6 /64). Returns True if newly blocked, False if it already
    was. The caller commits."""
    # ON CONFLICT DO NOTHING makes repeats harmless; rowcount says whether a row was actually added.
    cur.execute(BLOCK_QUERY, (ip_scope(ip_address), reason))
    return cur.rowcount == 1
