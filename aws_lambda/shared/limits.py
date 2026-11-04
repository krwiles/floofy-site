"""Whether a visitor may submit a form: not blocked, under their own limit, and under the form's daily cap across
everyone (so a crowd of IPs can't drain the email quota).
See docs/review/2026-10-02-pr2-plan.md and docs/review/2026-10-02-pr4-plan.md."""

from dataclasses import dataclass

from blocklist import is_blocked
from ip_scope import ip_scope
from replies import reply
from request_log import log

# One fixed per-visitor count per table, picked by name: rows from this visitor's IP scope within the window
VISITOR_COUNT_QUERIES = {
    "reviews": """
SELECT COUNT(*) AS recent
FROM reviews
WHERE ip_address <<= %s::inet
    AND created_at >= NOW() - %s * INTERVAL '1 hour'
""",
    "commission_requests": """
SELECT COUNT(*) AS recent
FROM commission_requests
WHERE ip_address <<= %s::inet
    AND created_at >= NOW() - %s * INTERVAL '1 hour'
""",
    "contact_messages": """
SELECT COUNT(*) AS recent
FROM contact_messages
WHERE ip_address <<= %s::inet
    AND created_at >= NOW() - %s * INTERVAL '1 hour'
""",
}

# One fixed count per table, picked by name, so a table name can never come from input
GLOBAL_CAP_QUERIES = {
    "reviews": "SELECT COUNT(*) AS recent FROM reviews WHERE created_at >= NOW() - INTERVAL '24 hours'",
    "commission_requests": (
        "SELECT COUNT(*) AS recent FROM commission_requests WHERE created_at >= NOW() - INTERVAL '24 hours'"
    ),
    "contact_messages": "SELECT COUNT(*) AS recent FROM contact_messages WHERE created_at >= NOW() - INTERVAL '24 hours'",
}


def over_global_cap(cur, table, cap):
    """True once `table` holds `cap` or more rows from the last 24 hours. `cur` must return dict rows."""
    # Look up the table's fixed query (an unknown name raises KeyError) and run it
    query = GLOBAL_CAP_QUERIES[table]
    cur.execute(query)

    # No row back means nothing counted
    row = cur.fetchone()
    return row is not None and row["recent"] >= cap


def busy_reply(form):
    """The reply when `form`'s global cap is reached: logged for CloudWatch, then 503 with the "busy" code."""
    log("global_cap_reached", form=form)
    return reply(503, "busy")


@dataclass(frozen=True)
class FormLimits:
    """One form's limits: its table, its name in logs, the per-visitor rule and the daily cap across everyone."""

    # The table the form saves into, counted for both limits
    table: str
    # The form's name in the global_cap_reached log
    form: str
    # At most this many submissions per visitor within window_hours (the reply carries both)
    per_visitor: int
    window_hours: int
    # At most this many per rolling day from everyone together
    per_day: int

    # Only tables with both fixed queries, so a table name can never come from input
    def __post_init__(self):
        if self.table not in VISITOR_COUNT_QUERIES or self.table not in GLOBAL_CAP_QUERIES:
            raise ValueError(f"no limit queries for table {self.table!r}")


def check_visitor(cur, limits, ip):
    """The refusal reply for a blocked, over-limit or capped visitor (already logged), or None to carry on. `cur`
    must return dict rows."""
    # Blocked IPs get the same vague reply as a real failure
    if is_blocked(cur, ip):
        log("refused", reason="blocked", ip=ip)
        return reply(403, "error")

    # The visitor (their IPv4 address, or IPv6 /64) has reached their limit within the window
    query = VISITOR_COUNT_QUERIES[limits.table]
    cur.execute(query, (ip_scope(ip), limits.window_hours))
    row = cur.fetchone()
    if row is not None and row["recent"] >= limits.per_visitor:
        log("refused", reason="rate_limited", ip=ip)
        return reply(429, "rate_limited", limit=limits.per_visitor, window_hours=limits.window_hours)

    # Everyone together has used up today's cap
    if over_global_cap(cur, limits.table, limits.per_day):
        return busy_reply(limits.form)
    return None
