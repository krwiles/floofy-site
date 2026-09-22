# 08 — Phase 2 execution plan (design foundations)

Concrete plan for `05-roadmap.md` → Phase 2, settled 2026-09-22 via `mattpocock-skills:grill-with-docs`
(`grilling` + `domain-modeling`). **This document is a plan. Nothing in it has been executed** beyond two files
already written this session: `CONTEXT.md` (domain glossary) and this plan itself.

Scope is deliberately narrower than `05-roadmap.md`'s original Phase 2 wishlist — seeing the owner's answers on the
card system and hero colors made clear that a shared shadow scale, z-index scale, and section-padding scale would
all be speculative (no consumer yet); they're deferred to Phase 3, when `app-card`/`app-section`/etc. actually get
built and need them.

## Decisions locked in this round

| # | Decision | Answer |
| --- | --- | --- |
| 1 | Branch/commits/review | `refactor/phase-2-design-foundations` off `working`, small commits. Visual diff at the end decides direct-merge (all `0.00%`, like Phase 0) vs. PR (anything real changed, like Phase 1) |
| 2 | Flowbite's "empty sub-selector" build warning | Tolerate — it's Flowbite's own theme CSS, not ours, and disappears when Flowbite is removed in Phase 4/5. Not worth throwaway suppression code |
| 3 | Fonts | Keep Google Fonts (may change fonts later, so no self-hosting investment now); move out of the CSS `@import` into `<link>` tags in `index.html` |
| 4 | Card/Glass Panel system | **Leave `cards.css`'s values exactly as finished — relocate only, no extraction into a shared scale.** The owner built these classes to eventually replace the current manually-styled cards across the site, but hasn't applied them yet. That application (and any shadow-scale unification) is Phase 3 work, not a side effect of this reorganization |
| 5 | Hero/backdrop color naming | Per-page bespoke tokens (`--color-hero-<page>`), not a shared palette. Each hero color is sampled directly from that page's own hero image and isn't designed to relate to the others — if a hero image changes later, its token gets re-sampled independently |
| 6 | Radius de-Flowbiting | Swap all three Flowbite-dependent radius classes to native Tailwind classes with matching values — **no custom `--radius-base` token at all**. Found while answering the owner's question: `rounded-sm` and `rounded-lg` template usages are *also* silently relying on Flowbite-overridden values, not Tailwind's own defaults, so all three get fixed together |

## Facts found this session (verified, not assumed)

- `tailwind.config.js` is dead: removing it and rebuilding produces an identical build (Tailwind v4's CSS-first
  `@theme` in `styles.css` does all the real work). Confirmed by temporarily removing and rebuilding, then restored.
- The build's "2 rules skipped due to selector errors: Empty sub-selector" warning was isolated to
  `@import 'flowbite/src/themes/default'` — removing just that import makes it disappear. Confirmed the same way,
  then restored via `git checkout`.
- Tailwind v4's actual installed default radius scale (`node_modules/tailwindcss/theme.css`):
  `xs: 0.125rem, sm: 0.25rem, md: 0.375rem, lg: 0.5rem, xl: 0.75rem, 2xl: 1rem, 3xl: 1.5rem, 4xl: 2rem`.
- Flowbite's theme (`node_modules/flowbite/src/themes/default.css`) **overrides** three of those names to
  different raw-pixel values, plus adds one Flowbite-only name:

  | Class | Flowbite's rendered value (px, fixed) | Tailwind's own default (rem, scales with root font-size) | Exact-value native replacement |
  | --- | --- | --- | --- |
  | `rounded-sm` | 6px | 4px (`0.25rem`) | `rounded-md` (`0.375rem` = 6px) |
  | `rounded-lg` | 16px | 8px (`0.5rem`) — Flowbite is literally double | `rounded-2xl` (`1rem` = 16px) |
  | `rounded-base` | 12px | *(doesn't exist without Flowbite)* | `rounded-xl` (`0.75rem` = 12px) |

  Every one has an exact-at-16px-root native Tailwind equivalent under a different name. The only wrinkle: Flowbite's
  values are raw px (fixed regardless of screen size); Tailwind's replacements are `rem`-based, so they scale with
  `styles.css`'s existing `html { font-size: 14px }` media query below 768px width — a 0.75–2px difference on mobile
  only, confirmed acceptable by the owner ("doesn't have to be an exact match, just close").
- Current usage counts confirmed by grep, no responsive/state-variant prefixes on any of them (e.g. no
  `md:rounded-lg`), so a plain whole-class-name replace is safe: `rounded-base` × 38, `rounded-sm` × 4,
  `rounded-lg` × 5.
- 8 raw-hex usages found: `about` `#FFFFF8`, `commission` `#FAF8FB`, `contact` `#787495`, `gallery` (hero)
  `#D3DCC7`, `home` `#DBE0FD`, `reviews` `#FFFFE3`, `streaming` `#5A696E`, plus the gallery lightbox backdrop
  `#222` (not a hero — a fixed neutral scrim, per `CONTEXT.md`).
- `streaming.css`'s `.stream-cta--primary` background gradient (`linear-gradient(135deg, #a9bedb, #7d9ec8)`) hand-
  duplicates `--color-brand` / `--color-brand-strong` exactly. The rule's other values (border/shadow alpha
  blends) are not token matches and are left alone per decision #4's scope.
- `src/styles/utilities/` and `src/styles/components/` already exist and are already correctly organized per
  `03-target-architecture.md`'s target layout — only `styles.css` itself (currently 99 lines of imports *and*
  rules mixed together) needs splitting.

## Execution steps

1. **Branch.** `git checkout -b refactor/phase-2-design-foundations` off `working`.
2. **Create `src/styles/tokens.css`**: move the entire current `@theme { … }` block from `styles.css` here
   verbatim, then append a new commented section:
   ```css
   /* ── Hero backgrounds ────────────────────────────────────────────────────
      Each sampled directly from that page's own hero parallax image. Not a
      designed palette relationship -- re-sample independently if a hero
      image changes. See CONTEXT.md ("Hero color").
   ── */
   --color-hero-about: #fffff8;
   --color-hero-commission: #faf8fb;
   --color-hero-contact: #787495;
   --color-hero-gallery: #d3dcc7;
   --color-hero-home: #dbe0fd;
   --color-hero-reviews: #ffffe3;
   --color-hero-streaming: #5a696e;

   /* Fixed neutral scrim behind the gallery lightbox -- not sampled from
      anything, see CONTEXT.md ("Lightbox backdrop"). */
   --color-lightbox-backdrop: #222222;
   ```
3. **Create `src/styles/base.css`**: move these rules out of `styles.css` verbatim:
   - the `h1..h6` font-family rule
   - the `body, *:not(...)` font-family rule
   - `body { background-color: var(--color-bg); }`
   - the `@media (max-width: 767px) { html { font-size: 14px; } }` block
4. **Rewrite `src/styles.css`** to imports only:
   ```css
   @import 'flowbite/src/themes/default';
   @import 'tailwindcss';
   @import './styles/tokens.css';
   @import './styles/base.css';
   @import './styles/utilities/masks.css';
   @import './styles/utilities/flourishes.css';
   @import './styles/utilities/motion.css';
   @import './styles/components/cards.css';
   @import './styles/utilities/icons.css';
   @plugin 'flowbite/plugin';
   @source '../node_modules/flowbite';
   ```
   (The Google Fonts `@import` line is dropped here — see step 5. Relative import order otherwise preserved
   exactly from the current file to minimize risk.)
5. **Move fonts to `index.html`**: add
   ```html
   <link rel="preconnect" href="https://fonts.googleapis.com" />
   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
   <link
     rel="stylesheet"
     href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Noto+Sans+JP:wght@300;400;500;600;700;800&display=swap"
   />
   ```
   in `<head>`, before the existing `<link rel="icon">`.
6. **Replace the 8 raw-hex usages** with the new tokens (exact same visual color, just named):
   `bg-[#FFFFF8]` → `bg-hero-about`, `bg-[#FAF8FB]` → `bg-hero-commission`, `bg-[#787495]` → `bg-hero-contact`,
   `bg-[#D3DCC7]` → `bg-hero-gallery` (gallery's hero, line 3), `bg-[#DBE0FD]` → `bg-hero-home`,
   `bg-[#FFFFE3]` → `bg-hero-reviews`, `bg-[#5A696E]` → `bg-hero-streaming`, and gallery's lightbox
   `bg-[#222]` → `bg-lightbox-backdrop` (line 99 — leave `shadow-[0_0_3rem_rgb(0,0,0)]` on that line untouched,
   out of scope).
7. **Radius de-Flowbiting** (47 whole-class-name replacements across the files the earlier grep found — `about`,
   `commission`, `carousel`, `reviews`, `home`, `navbar`, `contact`): `rounded-base` → `rounded-xl`,
   `rounded-sm` → `rounded-md`, `rounded-lg` → `rounded-2xl`. No other class on any of those lines changes.
8. **Fix `streaming.css`**: in `.stream-cta--primary`, replace
   `background: linear-gradient(135deg, #a9bedb, #7d9ec8);` with
   `background: linear-gradient(135deg, var(--color-brand), var(--color-brand-strong));`. No other line in that
   rule changes.
9. **Delete `tailwind.config.js`.**
10. **Build and test.** `ng build` (confirm the two-rule Flowbite warning is still the *only* warning, nothing new)
    and `ng test`.
11. **Visual regression.** Same method as Phase 1: fresh dev server on a scratch port (not whatever's already
    running on 4200), `npm run baseline:capture -- --label phase-2` pointed at it via `BASELINE_URL`, then
    `npm run baseline:diff -- --against baseline --current phase-2`. Expect `0.00%` everywhere except possibly the
    375px-width captures on routes using the swapped radius classes, where a sub-2px difference could show a
    small non-zero percentage — if so, that's the known, accepted mobile rem/px wrinkle from step 7, not a bug.
12. **Merge per decision #1**: all `0.00%` (or only the expected tiny 375px radius diff) → merge directly into
    `working`. Anything else → stop and open a PR instead, same as Phase 1.

## Explicitly out of scope for Phase 2

- Any shared shadow scale, z-index scale, or section-padding scale (deferred to Phase 3).
- Applying the Card/Glass Panel classes to any currently-manually-styled card (deferred to Phase 3).
- Any change to `streaming.css`'s border/shadow alpha values, or any other rgba/hex value not an exact token
  duplicate.
- Self-hosting fonts.

## Rollback

Everything lives on `refactor/phase-2-design-foundations` until merged (or, if escalated, until the PR is merged).
Every step is a small, separately-committable change; `git revert` any single one without affecting the rest.
