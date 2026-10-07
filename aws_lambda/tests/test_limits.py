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
