import blocklist


def test_is_blocked_true_when_the_ip_has_a_row(cursor):
    # Arrange: the database has a blocked_ips row for this IP.
    cursor.on("FROM blocked_ips", rows=[{"blocked": 1}])

    # Act and assert: the helper reports it blocked, passing the IP as a parameter.
    assert blocklist.is_blocked(cursor, "203.0.113.7") is True
    assert cursor.executed[-1][1] == ("203.0.113.7",)


def test_is_blocked_matches_any_block_that_covers_the_ip(cursor):
    # Act: check an IPv6 visitor.
    blocklist.is_blocked(cursor, "2001:db8:1:2::9")

    # Assert: the query asks for a block containing the address (a /64 block or the exact address).
    [(sql, params)] = cursor.queries("FROM blocked_ips")
    assert "ip_address >>= %s::inet" in sql
    assert params == ("2001:db8:1:2::9",)


def test_is_blocked_false_when_there_is_no_row(cursor):
    # No rule is set up, so the fake returns no rows, like an IP that was never blocked.
    assert blocklist.is_blocked(cursor, "203.0.113.7") is False


def test_block_issues_the_conflict_safe_insert(cursor):
    # Arrange: the insert adds one row.
    cursor.on("INSERT INTO blocked_ips", rowcount=1)

    # Act: block the IP with a reason.
    newly_blocked = blocklist.block(cursor, "203.0.113.7", "admin email: review #5")

    # Assert: one parameterised insert that ignores an existing block, reported as new.
    [(sql, params)] = cursor.queries("INSERT INTO blocked_ips")
    assert "ON CONFLICT (ip_address) DO NOTHING" in sql
    assert params == ("203.0.113.7", "admin email: review #5")
    assert newly_blocked is True


def test_block_reports_an_ip_that_was_already_blocked(cursor):
    # Arrange: the conflict clause skipped the insert, so no rows changed.
    cursor.on("INSERT INTO blocked_ips", rowcount=0)

    # Act and assert: the caller can tell it was already done.
    assert blocklist.block(cursor, "203.0.113.7", "admin email: review #5") is False


def test_block_stores_an_ipv6_visitors_whole_64(cursor):
    # Arrange: the insert adds one row.
    cursor.on("INSERT INTO blocked_ips", rowcount=1)

    # Act: block one IPv6 address.
    blocklist.block(cursor, "2001:db8:1:2::9", "admin email: review #5")

    # Assert: the stored block is the /64 that address belongs to, so a rotated address stays blocked.
    [(sql, params)] = cursor.queries("INSERT INTO blocked_ips")
    assert params == ("2001:db8:1:2::/64", "admin email: review #5")
