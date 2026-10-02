# Streaming page refresh — plan

A rebuild of the streaming page with the shared components, fully translated, plus the streaming half of Phase 6
Stage 4 (`docs/refactor/17-phase-6-plan.md`). It also fixes `B4` and removes `B6` from the
[2026-10-02 review](../../review/2026-10-02-full-repo-review.md). Every decision below was settled with the owner in
three grilling rounds on 2026-10-02.

**Branch:** `feat/streaming-refresh`, off `working`, PR back into `working`.

**The look is expected to change.** The 0% visual-diff rule doesn't apply: this is new content, and the owner reviews
the result by eye. Shared components are used as they are; none is changed to fit this page.

## Scope

**In:**

- **Schedule:** a `StreamScheduleService` with tests (fixes `B4`), fed by one JSON file.
- **Script loading:** a `ScriptLoader` service, used for the Twitch script.
- **Page:** rebuilt from `app-hero`, `app-section`, `app-section-header`, `appCard` and `app-social-links`, with
  every string in `en.json` / `ja.json`.
- **Player:** rebuilt only when the width changes.
- **Domains:** the old Twitch embed domains are removed.

**Out:** lazy-loading Twitter's widgets (the rest of Stage 4, which will reuse `ScriptLoader`).

## Decisions

| #   | Topic               | Decision                                                                                                                                                                                                                                        |
| --- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Scope               | The schedule service and `ScriptLoader` (for Twitch) now; Twitter later.                                                                                                                                                                        |
| 2   | One source of truth | `src/assets/data/stream-schedule.json` holds the weekday, time, home zone and extra zones. No weekday, time or zone name is hard-coded anywhere else.                                                                                           |
| 3   | Cards               | One card per zone, in order: the home zone, each `alsoShowIn` zone, then "Your time" (always shown, the featured card).                                                                                                                         |
| 4   | Derived, not stored | Each card's weekday and time are worked out for the **next** stream, in that card's zone, so daylight saving and day changes (Saturday in New York is Sunday in Tokyo) are always right.                                                        |
| 5   | Card content        | Label: the zone's name from the browser, in the site's language ("Japan Standard Time" / "日本標準時"). Big line: the time with its short zone name ("12:00 AM JST"). Under it: "Every {weekday}" from i18n, with the weekday from the browser. |
| 6   | Card layout         | `md:grid-cols-3`, stacked on phones. There are always three or more cards; extra ones wrap.                                                                                                                                                     |
| 7   | Hero                | The existing `streaming.hero.*` keys (now with the tagline). Background, pattern, artwork, dark tone and left-hand card stay; the `titleClass` override goes. Both buttons go, which also removes `B6`.                                         |
| 8   | Schedule section    | `app-section tone="light"` with an `app-section-header`; cards are `appCard tone="light"`, the "Your time" card `special`.                                                                                                                      |
| 9   | Live section        | `app-section tone="dark"` with an `app-section-header`; the player in a Card Shadow (`appCard noBackground tone="dark"`); a Twitch `app-social-links` chip with a short line, like donate's Ko-fi chip.                                         |
| 10  | Content             | Claude writes every eyebrow, title, description, the chip line and card wording, in English and Japanese; the owner reviews it in the PR. No component slot is left empty.                                                                      |
| 11  | CSS                 | All `.stream-*` rules go; only the player's size rules stay in `streaming.css`.                                                                                                                                                                 |
| 12  | Player resizing     | Still rebuilt to fit (Twitch's player can't resize after it's built), but only when the width changes, after resizing has paused for 300 ms. Phone toolbars sliding in and out no longer restart the stream.                                    |
| 13  | Embed domains       | `summerfloofy.com`, `www.summerfloofy.com`, `localhost`, `127.0.0.1`.                                                                                                                                                                           |
| 14  | `ScriptLoader`      | A root service, `load(src): Promise<void>`: adds the `<script>` once per URL, reuses the same promise on a repeat call, and rejects on a failed load.                                                                                           |

## The schedule file

`src/assets/data/stream-schedule.json`:

```json
{
  "weekday": "Saturday",
  "time": "11:00",
  "timeZone": "America/New_York",
  "alsoShowIn": ["Asia/Tokyo"]
}
```

- `weekday` and `time` are in `timeZone`, the stream's home zone; the browser's time-zone data handles daylight
  saving.
- A typed model, `StreamSchedule`, in `models/stream-schedule.ts`.

## `StreamScheduleService` (`services/stream-schedule.service.ts`)

- **`nextStream(now = new Date()): Date`:** the next start instant. It finds the next date in the home zone whose
  weekday matches, at `time` in that zone, and moves a week on if that instant is already past. `now` is a parameter
  so tests can fix the clock.
- **`slots(locale, now = new Date()): StreamSlot[]`:** one `{ zoneName, time, weekday, isLocal }` per card, in the
  decision 3 order, each formatted with `Intl.DateTimeFormat` in `locale` for the next stream:
  - `zoneName`: `timeZoneName: 'long'`;
  - `time`: hour, minute and `timeZoneName: 'short'`;
  - `weekday`: `weekday: 'long'`.
- **Converting "11:00 in New York" to an instant:** guess the instant as if the zone were UTC, read the zone's offset
  at that instant with `Intl` (`shortOffset`), and correct by it. Then check the offset again at the corrected instant,
  so a daylight-saving switch that week is handled.
- The visitor's zone comes from `Intl.DateTimeFormat().resolvedOptions().timeZone`.

**Behaviour change:** before, the local card showed a full date. Now every card shows a weekday and time, as decided.

## `ScriptLoader` (`services/script-loader.service.ts`)

- `load(src)` keeps a `Map<string, Promise<void>>`. On the first call for a URL it appends
  `<script src async>` to `document.body` (through `DOCUMENT`), resolving on `load` and rejecting on `error`.
- A failed load is removed from the map, so a later visit can retry.

## Page changes

- **`streaming.ts`:**
  - In `ngAfterViewInit`: `await scriptLoader.load(TWITCH_EMBED_SRC)`, then build the player. On failure, the player
    area is left empty, as it is today.
  - Resizing: the `host` `(window:resize)` listener schedules a 300 ms debounce, which rebuilds only if
    `calculateWidth()` changed since the last build. The timer is cleared on destroy (`DestroyRef`).
  - **Removed:** `twitchUrl`, the schedule getters, `getNextStreamInstant` and `isEasternDaylightSavingTime`. Cards
    come from `StreamScheduleService.slots(i18n.locale(), …)` in a `computed`, so they follow the site's language.
- **`streaming.html`:**
  - **Hero:** the translated keys, no buttons, no `titleClass`.
  - **Schedule section:** an `@for` over the slots. Each card shows the zone name (or "Your time" plus the zone name
    for the local card), the time, and `streaming.schedule.every` filled with `{weekday}`.
  - **Live section:** the header, the Card Shadow around `#twitch-embed`, and the Twitch chip row.
- **`streaming.css`:** only the `#twitch-embed` size rules.
- **i18n:** new keys in both files, all filled in:
  - `streaming.schedule.{eyebrow,title,description,your_time,every}`;
  - `streaming.live.{eyebrow,title,description,channel_note}`.

## Tests

- **`stream-schedule.service.spec.ts`:**
  - `nextStream`: a Saturday before 11:00 ET gives the same day (the `B4` bug); a Saturday after 11:00 ET gives the
    next week; a Friday evening ET that is already Saturday in UTC gives the next morning; and the weeks of the March
    and November daylight-saving switches give 15:00 and 16:00 UTC.
  - `slots`: three slots in the right order, with the last one local. Tokyo gives Sunday 12:00 AM in summer and
    1:00 AM in winter; Japanese gives "日曜日"; and a visitor zone equal to the home zone still gives a local card.
- **`script-loader.service.spec.ts`:**
  - one `<script>` per URL, and the same promise twice;
  - resolves on `load`, rejects on `error`;
  - a retry after a failure adds a new tag.
- **`streaming.spec.ts`:**
  - **Rendered page:** the hero has no buttons and has the tagline; there are three cards, the last featured; there
    are no hard-coded weekdays (the text comes from the service); the Twitch chip links to the channel.
  - **Player:** it's built with the four allowed domains; a resize that changes the width rebuilds it once after
    300 ms; a height-only resize doesn't.
  - **Locale:** both files keep identical keys (the existing parity test covers this).
  - **Clean-up:** fakes and stubs are restored in `afterEach`, not at the end of a test.

## Docs

- `05-roadmap.md`: Stage 4 is split, with the streaming half done here and lazy Twitter left.
- `17-phase-6-plan.md` Stage 4 gets a pointer to this plan.
- The review doc: `B4` and `B6` are done here.
- `CONTEXT.md`: a short **Stream schedule** entry ("the weekly stream slot, stored once in its home time zone; every
  displayed day and time is derived from it").

## Steps

Each step is test-first; commit at each green step.

1. **The schedule JSON and model.**
2. **`StreamScheduleService`:** `nextStream` tests, then the code; then `slots`.
3. **`ScriptLoader`.**
4. **The page:** the template, `streaming.ts`, the i18n keys and the new spec. Then delete the old CSS and getters.
5. **Resizing:** the debounced, width-only rebuild.
6. **Docs.**
7. **Final checks:** `npm test`, `npm run build`, Prettier and the comment check on changed files.
8. **Review:** two-axis review, a follow-up commit, then ask the owner before pushing.

## Risks and assumptions

- **No screenshots:** the page shows art, so the change is checked through the DOM and tests. The owner reviews it by
  eye.
- **Time-zone data:** this relies on the browser's `Intl` time-zone support, which every current browser has (Node 24
  for tests too). A zone name that's missing falls back to its offset ("GMT+9").
- **jsdom has no layout:** resize tests set `window.innerWidth` and use fake timers.
- **Twitch's player:** it still restarts on a real width change (a rotation, full screen). That's accepted.
- **Japanese copy:** Claude's draft; the owner will do a full translation pass later.
