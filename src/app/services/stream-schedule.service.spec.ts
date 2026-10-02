import { TestBed } from '@angular/core/testing';

import { StreamScheduleService } from './stream-schedule.service';

// These tests use the real stream-schedule.json: Saturdays at 11:00 New York time, also shown in Tokyo.
describe('StreamScheduleService', () => {
  let service: StreamScheduleService;

  beforeEach(() => {
    // A fresh service per test; it has no state, but this keeps each test independent.
    service = TestBed.inject(StreamScheduleService);
  });

  describe('nextStream()', () => {
    it.each([
      ['a Saturday morning before the stream (the B4 bug)', '2026-10-03T14:00:00Z', '2026-10-03T15:00:00Z'],
      ['a Saturday afternoon after the stream', '2026-10-03T16:00:00Z', '2026-10-10T15:00:00Z'],
      ['a Friday evening in New York that is already Saturday in UTC', '2026-10-03T01:00:00Z', '2026-10-03T15:00:00Z'],
      ['a Monday', '2026-10-05T12:00:00Z', '2026-10-10T15:00:00Z'],
      ['the exact start, which counts as started', '2026-10-03T15:00:00Z', '2026-10-10T15:00:00Z'],
    ])('from %s, finds 11:00 New York time on the right Saturday', (_label, now, expected) => {
      // Act and assert: the next start, as an exact instant.
      expect(service.nextStream(new Date(now)).toISOString()).toBe(new Date(expected).toISOString());
    });

    it.each([
      ['across the November switch to standard time (EST, UTC-5)', '2026-10-31T20:00:00Z', '2026-11-07T16:00:00Z'],
      ['across the March switch to daylight time (EDT, UTC-4)', '2027-03-13T17:00:00Z', '2027-03-20T15:00:00Z'],
    ])('stays at 11:00 New York time %s', (_label, now, expected) => {
      // Act and assert: the UTC hour moves so the New York hour doesn't.
      expect(service.nextStream(new Date(now)).toISOString()).toBe(new Date(expected).toISOString());
    });
  });

  describe('slots()', () => {
    // A Thursday in October, when New York is on daylight time.
    const october = new Date('2026-10-01T12:00:00Z');

    it('gives the home zone, then each extra zone, then the visitor’s own zone', () => {
      // Act: the cards for a visitor in Singapore.
      const slots = service.slots('en', october, 'Asia/Singapore');

      // Assert: three cards in order, each with its own weekday and time; only the last is the visitor's.
      expect(slots).toEqual([
        { zoneName: 'Eastern Time', time: '11:00 AM EDT', weekday: 'Saturday', isLocal: false },
        { zoneName: 'Japan Standard Time', time: '12:00 AM GMT+9', weekday: 'Sunday', isLocal: false },
        { zoneName: 'Singapore Standard Time', time: '11:00 PM GMT+8', weekday: 'Saturday', isLocal: true },
      ]);
    });

    it('moves the other zones’ times when New York changes to standard time', () => {
      // Act: the cards for the first stream after the November switch.
      const slots = service.slots('en', new Date('2026-11-02T12:00:00Z'), 'Asia/Singapore');

      // Assert: still 11:00 in New York, an hour later everywhere without daylight saving (Singapore rolls to Sunday).
      expect(slots.map(({ time, weekday }) => `${weekday} ${time}`)).toEqual([
        'Saturday 11:00 AM EST',
        'Sunday 1:00 AM GMT+9',
        'Sunday 12:00 AM GMT+8',
      ]);
    });

    it('writes zone names and weekdays in the site’s language', () => {
      // Act: the Tokyo card in Japanese.
      const tokyo = service.slots('ja', october, 'Asia/Singapore')[1];

      // Assert: Japanese zone name, 24-hour time and weekday.
      expect(tokyo).toEqual({ zoneName: '日本標準時', time: '0:00 JST', weekday: '日曜日', isLocal: false });
    });

    it('still gives the visitor’s own card when they live in the home zone', () => {
      // Act: the cards for a visitor in New York.
      const slots = service.slots('en', october, 'America/New_York');

      // Assert: three cards, the last one theirs, matching the home card.
      expect(slots.length).toBe(3);
      expect(slots[2]).toEqual({ ...slots[0], isLocal: true });
    });
  });
});
