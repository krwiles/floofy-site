from datetime import datetime, timedelta, timezone

from dates import format_sgt


def test_format_sgt_shows_the_time_in_singapore():
    # Act: format 04:00 UTC, which is noon in Singapore.
    text = format_sgt(datetime(2026, 9, 30, 4, 0, tzinfo=timezone.utc))

    # Assert: the long Singapore-time form every email and admin page uses.
    assert text == "Wednesday, 30 September 2026 at 12:00 PM (SGT)"


def test_format_sgt_converts_from_any_zone():
    # Act: format the same moment given in New York time (UTC-4 in September).
    text = format_sgt(datetime(2026, 9, 30, 0, 0, tzinfo=timezone(timedelta(hours=-4))))

    # Assert: still noon in Singapore.
    assert text == "Wednesday, 30 September 2026 at 12:00 PM (SGT)"
