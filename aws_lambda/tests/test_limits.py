import pytest

import limits
from conftest import body_of, logged


@pytest.mark.parametrize("table", ["reviews", "commission_requests", "contact_messages"])
def test_over_global_cap_counts_the_last_24_hours_of_that_table(cursor, table):
    # Arrange: the table already holds exactly the cap within the window.
    cursor.on(f"FROM {table}", rows=[{"recent": 5}])

    # Act and assert: at the cap counts as over it; below it doesn't.
    assert limits.over_global_cap(cursor, table, 5) is True
    assert limits.over_global_cap(cursor, table, 6) is False

    # The count covers every visitor over a rolling day, with no parameters spliced in.
    [(sql, params), _] = cursor.queries(f"FROM {table}")
    assert "created_at >= NOW() - INTERVAL '24 hours'" in sql
    assert params is None


def test_over_global_cap_refuses_a_table_it_does_not_know(cursor):
    # Act and assert: only the fixed tables are allowed, so a name can never come from input.
    with pytest.raises(KeyError):
        limits.over_global_cap(cursor, "reviews; DROP TABLE reviews", 5)


def test_busy_reply_is_a_coded_503_and_is_logged(capsys):
    # Act: build the reply for a form whose cap was reached.
    result = limits.busy_reply("review")

    # Assert: the site gets the busy code, and CloudWatch records which form hit its cap.
    assert (result["statusCode"], body_of(result)) == (503, {"code": "busy"})
    assert {"event": "global_cap_reached", "form": "review"} in logged(capsys)


# --- check_visitor: the blocklist, the per-visitor limit and the daily cap, in that order -------------------------

LIMITS = limits.FormLimits(table="reviews", form="review", per_visitor=2, window_hours=24, per_day=20)


def test_check_visitor_lets_an_ordinary_visitor_through(cursor):
    # Arrange: not blocked, nothing sent recently, by them or anyone.
    cursor.on("FROM reviews", rows=[{"recent": 0}])

    # Act and assert: no refusal.
    assert limits.check_visitor(cursor, LIMITS, "203.0.113.7") is None


def test_check_visitor_refuses_a_blocked_visitor_first(cursor, capsys):
    # Arrange: blocked, and also over both limits.
    cursor.on("FROM blocked_ips", rows=[{"blocked": 1}])
    cursor.on("FROM reviews", rows=[{"recent": 99}])

    # Act: check the visitor.
    result = limits.check_visitor(cursor, LIMITS, "203.0.113.7")

    # Assert: the vague 403, logged as blocked, and no limit was even counted.
    assert (result["statusCode"], body_of(result)) == (403, {"code": "error"})
    assert {"event": "refused", "reason": "blocked", "ip": "203.0.113.7"} in logged(capsys)
    assert cursor.queries("FROM reviews") == []


def test_check_visitor_refuses_a_visitor_over_their_limit_with_the_rule(cursor, capsys):
    # Arrange: this visitor (by IP scope) has reached their limit.
    cursor.on("FROM reviews", rows=[{"recent": 2}])

    # Act: check an IPv6 visitor.
    result = limits.check_visitor(cursor, LIMITS, "2001:db8:1:2::9")

    # Assert: 429 with the form's rule, logged, and counted across the visitor's whole /64.
    assert (result["statusCode"], body_of(result)) == (429, {"code": "rate_limited", "limit": 2, "window_hours": 24})
    assert {"event": "refused", "reason": "rate_limited", "ip": "2001:db8:1:2::9"} in logged(capsys)
    [(sql, params)] = cursor.queries("INTERVAL '1 hour'")
    assert "ip_address <<= %s::inet" in sql
    assert params == ("2001:db8:1:2::/64", 24)


def test_check_visitor_refuses_everyone_once_the_daily_cap_is_reached(cursor):
    # Arrange: this visitor has sent nothing, but everyone together has reached the cap.
    cursor.on("FROM reviews", rows=[{"recent": 0}])
    cursor.on("INTERVAL '24 hours'", rows=[{"recent": 20}])

    # Act and assert: the busy reply.
    result = limits.check_visitor(cursor, LIMITS, "203.0.113.7")
    assert (result["statusCode"], body_of(result)) == (503, {"code": "busy"})


def test_form_limits_only_accept_known_tables():
    # Act and assert: a table name never comes from anywhere but the fixed list, checked as soon as it's set up.
    with pytest.raises(ValueError):
        limits.FormLimits(table="users", form="x", per_visitor=1, window_hours=1, per_day=1)
