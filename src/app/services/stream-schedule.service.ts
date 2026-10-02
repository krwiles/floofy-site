import { Injectable } from '@angular/core';
import scheduleJson from '../../assets/data/stream-schedule.json';
import { StreamSchedule, StreamSlot, WEEKDAYS, Weekday } from '../models/stream-schedule';

const MINUTE_MS = 60_000;

/**
 * The weekly stream slot from `stream-schedule.json`, turned into the next start instant and the per-zone schedule
 * cards. Stored once in its home zone; every shown day and time is derived -- see
 * docs/features/streaming-refresh/plan.md.
 */
@Injectable({ providedIn: 'root' })
export class StreamScheduleService {
  private readonly schedule: StreamSchedule = { ...scheduleJson, weekday: scheduleJson.weekday as Weekday };

  /** The next stream's start: the coming scheduled weekday and time in the home zone, or next week's once started. */
  nextStream(now: Date = new Date()): Date {
    // The schedule's weekday as a number, and its start time in hours and minutes.
    const targetDay = WEEKDAYS.indexOf(this.schedule.weekday);
    const [hour, minute] = this.schedule.time.split(':').map(Number);

    // Today's calendar date as the home zone sees it (it may differ from UTC's).
    const today = zonedDate(now, this.schedule.timeZone);

    // Walk forward day by day from today: the first matching weekday whose start is still ahead is the next stream.
    for (let offset = 0; offset < 14; offset++) {
      const day = new Date(Date.UTC(today.year, today.month - 1, today.day + offset));
      if (day.getUTCDay() !== targetDay) continue;

      // That date at the start time, in the home zone, as an exact instant.
      const start = zonedTimeToInstant(
        day.getUTCFullYear(),
        day.getUTCMonth() + 1,
        day.getUTCDate(),
        hour,
        minute,
        this.schedule.timeZone,
      );
      if (start.getTime() > now.getTime()) return start;
    }

    // Unreachable: two weeks always contain an upcoming match.
    throw new Error('StreamScheduleService: no upcoming stream found');
  }

  /**
   * One card per zone for the next stream: the home zone, each `alsoShowIn` zone, then the visitor's own. Formatted
   * in `locale`, so names, times and weekdays follow the site's language.
   */
  slots(
    locale: string,
    now: Date = new Date(),
    localTimeZone: string = Intl.DateTimeFormat().resolvedOptions().timeZone,
  ): StreamSlot[] {
    // Every card describes the same instant, so daylight saving and day changes come out right in each zone.
    const start = this.nextStream(now);

    // The listed zones, then the visitor's own, which is always shown as the featured card.
    const zones = [this.schedule.timeZone, ...this.schedule.alsoShowIn];
    return [
      ...zones.map((zone) => formatSlot(start, zone, locale, false)),
      formatSlot(start, localTimeZone, locale, true),
    ];
  }
}

/** One card's text: how the `start` instant reads in `timeZone`, in `locale`. */
function formatSlot(start: Date, timeZone: string, locale: string, isLocal: boolean): StreamSlot {
  // Each Intl formatter renders one piece of the instant as seen from this zone.
  const format = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, { timeZone, ...options });
  return {
    zoneName: partOf(format({ timeZoneName: 'longGeneric' }), start, 'timeZoneName'),
    time: format({ hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(start),
    weekday: format({ weekday: 'long' }).format(start),
    isLocal,
  };
}

/** The calendar date (year, month 1–12, day) that `instant` falls on in `timeZone`. */
function zonedDate(instant: Date, timeZone: string): { year: number; month: number; day: number } {
  // en-CA formats dates as YYYY-MM-DD, which splits cleanly into numbers.
  const [year, month, day] = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(instant)
    .split('-')
    .map(Number);
  return { year, month, day };
}

/** The exact instant when the wall clock in `timeZone` reads the given date and time. */
function zonedTimeToInstant(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  // First guess: read the wall time as if it were UTC, then shift by the zone's offset at that moment.
  const asUtc = Date.UTC(year, month - 1, day, hour, minute);
  const firstGuess = asUtc - offsetMinutes(asUtc, timeZone) * MINUTE_MS;

  // Re-check the offset at the corrected instant, in case a daylight-saving switch falls between the two.
  return new Date(asUtc - offsetMinutes(firstGuess, timeZone) * MINUTE_MS);
}

/** The zone's offset from UTC in minutes at `instant`, e.g. -240 for New York in summer. */
function offsetMinutes(instant: number, timeZone: string): number {
  // shortOffset gives text like "GMT-4", "GMT+5:30" or plain "GMT".
  const text = partOf(
    new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'shortOffset' }),
    new Date(instant),
    'timeZoneName',
  );
  const match = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(text);

  // Plain "GMT" means no offset; otherwise combine the sign, hours and optional minutes.
  if (!match) return 0;
  const minutes = Number(match[2]) * 60 + Number(match[3] ?? 0);
  return match[1] === '-' ? -minutes : minutes;
}

/** One named part (e.g. the time-zone name) of a formatted date. */
function partOf(formatter: Intl.DateTimeFormat, date: Date, type: Intl.DateTimeFormatPartTypes): string {
  // formatToParts splits the formatted text into labelled pieces; take the one asked for.
  return formatter.formatToParts(date).find((part) => part.type === type)?.value ?? '';
}
