"""Dates as the owner reads them: in Singapore time, in every email and on every admin page."""

from zoneinfo import ZoneInfo

SGT = ZoneInfo("Asia/Singapore")


def format_sgt(when):
    """`when` (any timezone-aware datetime) as Singapore time, e.g. "Wednesday, 30 September 2026 at 12:00 PM (SGT)"."""
    return when.astimezone(SGT).strftime("%A, %d %B %Y at %I:%M %p (SGT)")
