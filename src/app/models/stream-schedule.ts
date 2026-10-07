/** The weekdays as `stream-schedule.json` spells them, in `Date.getUTCDay()` order (Sunday is 0). */
export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
export type Weekday = (typeof WEEKDAYS)[number];

/**
 * The weekly stream slot, stored once in its home time zone -- see CONTEXT.md's "Stream schedule" entry. Every day
 * and time the site shows is derived from it; see docs/features/streaming-refresh/plan.md.
 */
export interface StreamSchedule {
  /** The stream's weekday in `timeZone`. */
  weekday: Weekday;
  /** The start time in `timeZone`, as 24-hour `HH:MM`. */
  time: string;
  /** The stream's home time zone (IANA name); the browser applies its daylight saving. */
  timeZone: string;
  /** Extra time zones to show a card for, between the home zone's card and the visitor's own. */
  alsoShowIn: string[];
}

/** One schedule card: the next stream as seen from one time zone, already formatted in the site's language. */
export interface StreamSlot {
  /** The zone's season-free name, e.g. "Eastern Time" / "米国東部時間". */
  zoneName: string;
  /** The start time with the zone's short name, e.g. "11:00 AM EDT". */
  time: string;
  /** The weekday in that zone, e.g. "Sunday" / "日曜日". */
  weekday: string;
  /** Whether this is the visitor's own time zone (the featured card). */
  isLocal: boolean;
}
