"""Each form's global cap: a most-per-day across every visitor, so a crowd of IPs can't drain the email quota.
See docs/review/2026-10-02-pr2-plan.md."""

from replies import reply
from request_log import log

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
