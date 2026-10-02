"""Reading and writing the `blocked_ips` table, shared by every Lambda that accepts visitor input."""

IS_BLOCKED_QUERY = """
SELECT 1 AS blocked
FROM blocked_ips
WHERE ip_address = %s
"""

BLOCK_QUERY = """
INSERT INTO blocked_ips (ip_address, reason)
VALUES (%s, %s)
ON CONFLICT (ip_address) DO NOTHING
"""


def is_blocked(cur, ip_address):
    """True if `ip_address` has a row in blocked_ips."""
    # Any row at all means blocked; checking for None works whichever row factory the cursor uses.
    cur.execute(IS_BLOCKED_QUERY, (ip_address,))
    return cur.fetchone() is not None


def block(cur, ip_address, reason):
    """Add `ip_address` to blocked_ips. Returns True if newly blocked, False if it already was. The caller commits."""
    # ON CONFLICT DO NOTHING makes repeats harmless; rowcount says whether a row was actually added.
    cur.execute(BLOCK_QUERY, (ip_address, reason))
    return cur.rowcount == 1
