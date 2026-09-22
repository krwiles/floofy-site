# 10 — Phase 3 execution plan (Stage 3b: surfaces & controls)

Concrete plan for `05-roadmap.md` → Phase 3 → Stage 3b, settled 2026-09-22 via `mattpocock-skills:grilling` +
`domain-modeling`. **This document is a plan. Nothing in it has been executed yet.**

Unlike Stage 3a, this is a **real visual landing** on every page: the finished `cards.css` system gets applied
where it was never applied before, and every button on the site gets standardized onto one accessible look. Per
`09-phase-3-plan.md`'s decision #5, this always goes through a PR regardless of what the visual diff shows.

## Decisions locked in this round

| # | Decision | Answer |
| --- | --- | --- |
| 1 | Card system shape | `[appCard]` attribute directive (confirmed, not revisited from `09-phase-3-plan.md`) |
| 2 | Card scope | Apply the finished `card-on-section-*` tone system site-wide, wherever a card-shaped element exists today — not a mechanical no-visual-change wrap. The owner finished these styles specifically to use them |
| 3 | Card `tone` values | `light \| middle \| dark` only — `cards.css` has no `-alt` variants (those exist for `app-section`'s background tone, not for cards) |
| 4 | Card `special` | Kept in the API even though zero current templates use it — the owner has a known upcoming use (streaming's local-time display) once that page gets its own pass |
| 5 | Card `noBackground` (renamed from the original sketch's `shadowOnly`) | Standardized `rounded-2xl` radius + a **tone-aware** shadow (reusing the exact per-tone `box-shadow` values already in `cards.css`) + no fill/border. `tone` is therefore required in every mode, including `noBackground` |
| 6 | Flag exclusivity (`noBackground`/`glass`/`tone`/`special`) | Left unenforced — documented only, matching every other directive in this codebase so far |
| 7 | `appButton` shape | `variant: 'primary' \| 'secondary' \| 'pill'` × `tone: 'light' \| 'middle' \| 'dark'`, fully orthogonal — same two-axis pattern as `[appCard]` |
| 8 | Button visual contrast rule | Opposite of Card: a Card's fill matches its Tone's own color family (reads as a native surface); a Button's fill *contrasts* against its Tone so it stands out — light/middle-tone buttons render darker than their background, dark-tone buttons render lighter, mirroring the contrast direction of that Tone's text colors |
| 9 | Who authors `buttons.css` | Claude writes it now (starting from `cards.css`'s gradient/`saturate()` technique as a base), owner tweaks afterward — explicitly not blocking on the owner finishing it first (reversed from this round's earlier answer, once the owner decided not to wait) |
| 10 | Button standardization | Every button site-wide gets migrated onto one accessible "primary" look — the two different real class strings found in production (with vs. without a focus ring + hover transition) collapse to the fuller, accessible one everywhere, including reviews/contact's submit buttons |
| 11 | Streaming page | **Zero changes**, including `.stream-cta` — not touched, and not used as a pattern reference for anything built in this stage (explicit owner instruction: it's a known outlier due for its own pass, possibly owner-led) |
| 12 | Navbar buttons, form radio-labels, gallery close-btn | All out of scope for 3b (see "Explicitly out of scope" below) |

`CONTEXT.md` updated this round: **Card Shadow** is now documented as tone-aware; a new **Button** term captures
the variant/tone axes and the contrast-direction rule.

## Facts found this session

- `card-on-section-{light,middle,dark}` (the finished tone system) is used in exactly **one** place today
  (`contact.html:157`). Every other card-shaped element (~20 across home/commission/about/donate/streaming/reviews)
  uses the standalone `card-shadow` utility plus hand-rolled `border`/`bg-white/N` that approximates but doesn't
  match the finished design — confirming `CONTEXT.md`'s existing "not yet applied" note.
- Every real non-image card container already uses `rounded-4xl` (2rem), which happens to exactly match the radius
  `card-on-section-*` bakes into its own CSS (`border-radius: 2rem`) — no radius conflict when migrating those.
  One exception: `home.html:52` uses `rounded-3xl` (1.5rem) despite otherwise matching the card-container shape
  (`border`/`bg-white/5`) — gets standardized to 2rem when it becomes a real `[appCard]`.
- Real `card-shadow`-only (no fill/border) usages are almost all on `<img>` tags and already use `rounded-2xl`
  (1rem) consistently, with one outlier: `about.html:225` (the lightbox zoomed image, `max-h-[90svh] w-auto`, no
  radius at all) — an overlooked image, not a deliberate exception; gets the same standardized treatment, keeping
  its positioning classes.
- Two spots stack a redundant *second* shadow on top of `card-shadow` — `about.html:58` (`drop-shadow-xl`) and
  `about.html:191` (`shadow-2xl`) — almost certainly leftover from before `card-shadow` existed. Cleaned up as part
  of migration.
- Button-shaped elements found, by real class string (not the plan's earlier rough summary, which undercounted the
  variance):
  - **"Primary" — accessible version** (focus ring + hover transition): `home.html:75,224,243,262`;
    `commission.html:138,215,287`. 7 instances.
  - **"Primary" — bare version** (no focus ring, no transition): `reviews.html:181`; `contact.html:141`;
    `commission.html:871`. 3 instances — standardized onto the accessible version per decision #10.
  - **"Secondary"**: `home.html:120,143,187`. 3 identical instances.
  - **"Pill"**: `about.html:242` (the fan-art hashtag link). 1 instance — the only pill-shaped CTA on the site.
  - **Navbar** (`navbar.html:17,60`): shares `bg-brand-subtle`/`rounded-xl`/focus-ring with Secondary, but adds
    `border border-border` and a fixed `h-10` size not seen elsewhere. Out of scope (decision #12).
  - **`streaming.css`'s `.stream-cta`/`--primary`/`--secondary`** (`streaming.html:40,43`): a visually distinct
    gradient/uppercase/pill treatment. Out of scope (decision #11) — the owner likes this look and wants its
    gradient/saturation technique folded into `appButton` generally, but streaming's own instance stays untouched.
  - **Commission's 7 radio-styled option `<label>`s** (`commission.html:635,644,658,721,730,740,750,760`): share
    `bg-brand`/`border-brand-strong` via `peer-checked:`, but are driven by a hidden `<input type="radio">` — a
    forms concern, out of scope (decision #12).
  - **Gallery's `.close-btn`** (`gallery.css:42`): icon-only lightbox close, no `bg-brand`/pill styling at all —
    confirmed unrelated to this family, out of scope (decision #12).
- The circular icon-link "chip" buttons on about/contact/donate (`rounded-2xl border bg-white/65 p-4 text-5xl ...`)
  are **not** `appButton` or `appCard` candidates — they're Stage 3c's `app-social-links[variant=chip]` territory.
  Noted here so nothing double-builds them.

## `[appCard]` (`src/app/directives/card.ts`)

`selector: '[appCard]'`. Inputs:

```ts
tone = input.required<'light' | 'middle' | 'dark'>();
special = input(false);        // featured variant — no current usage, kept for a known upcoming need
noBackground = input(false);   // shadow + standardized radius only, no fill/border — for images and bare elevation
glass = input(false);          // wraps glass-panel instead of a tone-painted surface
```

Host binding computes the class list from these four inputs (`class.card-on-section-{tone}[-special]`,
`class.card-shadow-{tone}` for `noBackground`, `class.glass-panel` for `glass`). `noBackground` and `glass` are
mutually exclusive with the tone-painted surface in practice but not runtime-enforced (decision #6) — misuse is a
visible CSS mistake, not a silent data bug.

**New CSS needed in `cards.css`**: three tone-aware shadow-only classes (`.card-shadow-light`,
`.card-shadow-middle`, `.card-shadow-dark`), each reusing the exact `box-shadow` values already defined inside the
matching `.card-on-section-{tone}` rule — not new values, just extracted into a fill-less variant. The existing
flat `.card-shadow` utility can be removed once every usage migrates (grep to confirm zero remain before deleting).

**TDD test plan**: applies `card-on-section-{tone}` for each tone value; applies the `-special` suffix when
`special` is true; applies `card-shadow-{tone}` and omits the tone-painted classes when `noBackground` is true;
applies `glass-panel` when `glass` is true.

**Migration** (enumerate exact call sites at execution time, same reasoning as 3a's `app-section-header`/
`app-section` — real per-instance tone assignment to get right, not just a class swap):
- ~20 `card-shadow` + manual `border`/`bg-white/N` containers → `[appCard]` with the tone matching their actual
  section (not assumed — check each section's `tone` input).
- `contact.html:157`'s existing `card-on-section-middle` → `[appCard tone="middle"]` (already correct, just
  wrapped in the directive now).
- `home.html:52` → `[appCard tone="light"]` (or whichever tone its section actually is), radius standardizes from
  `rounded-3xl` to the baked-in 2rem.
- ~6 `card-shadow`-only images → `[appCard tone="..." noBackground]`, dropping their own `rounded-2xl` class (now
  baked into the directive).
- `about.html:225` (lightbox image) → same `noBackground` treatment, keep `max-h-[90svh] w-auto`, drop the missing
  radius/shadow gap.
- 9 `glass-panel` usages (8 heroes + `about.html:84`) → `[appCard glass]`, keeping `hero-reveal-surface` and other
  positioning classes as host content exactly as today.
- Cleanup: remove the redundant `drop-shadow-xl`/`shadow-2xl` from `about.html:58`/`:191`.

## `appButton` (`src/app/directives/button.ts`)

`selector: 'a[appButton], button[appButton]'`. Inputs:

```ts
variant = input<'primary' | 'secondary' | 'pill'>('primary');
tone = input<'light' | 'middle' | 'dark'>('light');
```

**New file: `src/styles/components/buttons.css`**, written by Claude this stage as a first pass — copying
`cards.css`'s gradient + `saturate()` technique, applied per tone with the *contrast* rule from decision #8 (button
fill contrasts against its tone rather than matching it, unlike Card). Nine combinations total (3 variants × 3
tones). The owner reviews and adjusts the actual color/gradient values afterward; this stage is not blocked on
that happening first.

**TDD test plan**: applies the right variant class for each of `primary`/`secondary`/`pill`; applies the right tone
class for each of `light`/`middle`/`dark`; defaults to `primary`/`light` when inputs are omitted.

**Migration**: all 13 non-navbar, non-streaming button instances found this session (7 accessible-primary + 3
bare-primary + 3 secondary + 1 pill) → `[appButton variant="..." tone="..."]`, with `tone` assigned per each
button's actual containing section/card (not assumed uniform) and every instance landing on the single accessible
class shape regardless of which of the two originals it came from.

## Explicitly out of scope for Stage 3b

- **Streaming page** (`streaming.html`/`.css`, including `.stream-cta`) — zero changes, not used as a pattern
  source. Logged as a future open item below.
- **Navbar's login/menu-toggle buttons** — too few instances (2), not part of the card/button consolidation this
  stage scoped. Logged as a future open item below.
- **Commission's radio-styled option labels** — a forms concern (driven by a hidden `<input type="radio">`),
  belongs to Phase 5. Logged as a future open item below.
- **Gallery's `.close-btn`** — confirmed unrelated to either family, not touched.
- **The social-link "chip" buttons** (about/contact/donate) — Stage 3c's `app-social-links[variant=chip]`.

## New open items for `05-roadmap.md`

1. Streaming page needs a formatting/consistency pass — owner may redesign it directly with the finished
   primitives once they exist, or it becomes its own future phase.
2. Navbar's login/menu-toggle buttons could get their own `appButton` variant (or stay hand-styled) — revisit once
   there's a second real consumer of nav-specific button styling.
3. Future forms styling (Phase 5: `app-form-field`, `appControl`, etc.) should get `light`/`middle`/`dark` tone
   options, matching the Card/Button pattern established in this stage.
4. Once the whole refactor finishes, move accumulated open items like these three into a dedicated `backlog.md`
   instead of the roadmap's "Open decisions" list.

## Process

Branch `refactor/phase-3b-surfaces-controls` off `working`. TDD for `[appCard]` and `appButton` themselves; the
migration is mechanical class-swapping guided by the enumerated site list above, verified per-instance against the
original rendered look where a tone assignment isn't obvious from context. **Always a PR** (decision from
`09-phase-3-plan.md`, reaffirmed — this is a real visual landing, not a mechanical reorganization a `0.00%` diff
could validate alone). Visual diff still run and reported in the PR, but a non-zero diff here is expected and does
not block the PR the way it would in a zero-visual-risk stage.

## Rollback

Lives on its own branch until merged, independent of 3a/3c. Small commits within the stage (directives first,
`buttons.css` second, migration third) revert individually if needed.
