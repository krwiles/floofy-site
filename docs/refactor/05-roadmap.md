# 05 — Roadmap

Status legend: `[ ]` todo · `[~]` in progress · `[x]` done · **⏸ blocked** = waiting on the owner.
Status as of 2026-09-23: Phases 0–2 done and merged into `working`. Phase 3 (Stages 3a, 3b, 3c) fully done and
merged into `working` (PR #21, #23, #24). 3 `<app-flourish>` bugs found and fixed outside phase work, merged
(PR #25). Phase 4 has a concrete plan (see below); step 1 (image asset model) executed and merged. A 4th
`<app-flourish>`/`app-section-divider` bug found outside phase work, [PR #26](https://github.com/krwiles/floofy-site/pull/26) — merged — caused real mobile horizontal overflow site-wide. Phase 4 step 2
(`app-rolling-carousel`, home page) executed and merged, [PR #27](https://github.com/krwiles/floofy-site/pull/27),
including an owner-requested follow-up (card-shadow padding + edge fade mask). Phase 4 step 3
(`app-slideshow-carousel`, commission) executed and **merged into `working`**,
[PR #28](https://github.com/krwiles/floofy-site/pull/28) — including both owner-requested follow-up rounds (see
below). Phase 4 step 4 (`app-language-toggle`) executed and **merged into `working`**,
[PR #29](https://github.com/krwiles/floofy-site/pull/29). Phase 4 step 5 (navbar disclosure) executed and
**merged into `working`**, [PR #30](https://github.com/krwiles/floofy-site/pull/30) — this was the real
Flowbite-JS removal (`initFlowbite()`, `data-collapse-toggle`); no interactive Flowbite JS remains anywhere in
the site as of this merge. An owner-requested follow-up round on top of it (mobile-menu corner rounding + a
dimming backdrop + click-outside-to-close) executed and **merged into `working`**,
[PR #31](https://github.com/krwiles/floofy-site/pull/31). Phase 4 step 6 (`app-hero`, all 8 pages) executed and
**merged into `working`**, [PR #32](https://github.com/krwiles/floofy-site/pull/32); parity-preserving (Track B),
0.00% visual diff verified on every route/width, then an owner-requested simplification round on the same PR
that deliberately changed 3 pages' visual output (home/gallery/contact) to remove one-page-only overrides —
see below. Phase 4 step 7 (`app-parallax` clean-up) executed and **merged into `working`**, [PR #34]
(https://github.com/krwiles/floofy-site/pull/34) — same Track B/no-direct-push situation as step 6, opened as a
normal PR instead. **Phase 4 is now fully done.** Phase 5 (forms and backend access) planning started
2026-09-25 via `/grill-with-docs`, design docs merged into `working` as [PR #35]
(https://github.com/krwiles/floofy-site/pull/35) (docs only, no code). Phase 5 page 1 (contact) executed and
**merged into `working`**, [PR #36](https://github.com/krwiles/floofy-site/pull/36) — builds every shared piece
from scratch. Phase 5 page 2 (reviews) executed, [PR #37](https://github.com/krwiles/floofy-site/pull/37) —
pending owner review; adds `CheckboxField`. Phase 5 page 3 (commission), the last page, executed, [PR #38]
(https://github.com/krwiles/floofy-site/pull/38) — pending owner review, **stacked on PR #37** (targets
`refactor/phase-5-reviews`, not `working`, since it needs `CheckboxField`; retarget once #37 merges); adds
`RadioGroup` — see below. Phases 6–8 not started.

**Known issue carried over from PR #28, surfaced by `/code-review` while working on step 4, not yet fixed:**
`slideshow-carousel.ts`'s `navigate()` can leave its `instant` signal stuck `true` forever. When a move lands on a
clone slot, `instant.set(true)` is set and a `0ms` resync retry is scheduled; only that retry's own callback ever
sets `instant` back to `false`. If a fresh, opposite-direction `navigate()` call arrives before the retry fires, the
guard that cancels the stale retry clears the timer _without_ running its callback — so `instant` never resets.
Once stuck, the auto-advance-restart effect (gated on `!instant()`) stops rescheduling (auto-advance silently
stops), and every future manual navigation snaps instantly with no transition. This is a plausible contributor to
the still-unreproduced "occasionally jumps/reverses after the arrows are used" symptom already documented in the
component's own doc comment. Reported to the owner rather than fixed inline — it's a step-3 bug, not step-4 —
awaiting a decision on a follow-up fix.

**Branch/PR housekeeping note (2026-09-23):** the roadmap-doc commit recording PR #28's two follow-up rounds was
pushed a few minutes _after_ the owner had already merged #28 on GitHub, so it landed on the now-merged,
dangling `refactor/phase-4-slideshow-carousel` branch instead of `working`. Step 4's work was initially committed
on top of that same stale branch by mistake. Both commits were moved onto a fresh `refactor/phase-4-language-toggle`
branch based on the real `working` tip before pushing, so PR #29 contains only the roadmap-doc commit plus step 4's
own commit — nothing already-merged is being re-proposed.

**Same mixup, a third time (2026-09-24):** an owner-requested follow-up round for step 5 (corner rounding +
backdrop overlay + click-outside-close) was committed on `refactor/phase-4-navbar-disclosure`, then a `/code-review`
pass was kicked off in the background before that commit was pushed — and the owner merged PR #30 while that
review was still running, so the follow-up commit never made it in either. Same fix as before: moved onto a fresh
`refactor/phase-4-navbar-followup` branch off the real `working` tip, PR #31 opened there instead. Noting the
pattern plainly since it's now happened three times (#28→#29, #29→#30, #30→#31): a commit that hasn't been pushed
yet is at risk the moment the current PR might be merged, and a backgrounded `/code-review` run extends that
window rather than closing it — worth pushing work-in-progress commits promptly rather than batching them behind
a still-running background task.

**Diff-decides-merge can't actually be executed as a direct push from this environment (2026-09-24):** step 6
(`app-hero`) is Track B, whose pre-agreed process (`12-phase-4-plan.md`) is a direct merge into `working` — no PR
— once the visual diff comes back clean, skipping owner review same as the Stage 3a/3c and image-asset-model
zero-diff merges earlier in this refactor. Attempting that here (`git push origin <branch>:working`) was blocked
by this environment's own permission guard ("Merge Without Review"), which doesn't distinguish a verified-clean
parity-preserving merge from any other push straight to the trunk. Opened as a normal PR instead ([PR #32]
(https://github.com/krwiles/floofy-site/pull/32)) — same thing happened for step 7 (`app-parallax` clean-up, the
only remaining Track B item), opened as [PR #34](https://github.com/krwiles/floofy-site/pull/34).

**3 bugs found outside phase work, [PR #25](https://github.com/krwiles/floofy-site/pull/25) — merged into
`working` — all in `<app-flourish>`, all from the same root gap:** every caller-facing sizing/positioning class (a
height utility like `h-8`/`h-12`, `absolute`, `hidden md:inline-block`) goes on the `<app-flourish>` _host_, one
element above the `<span class="flourish">` that actually has the mask/`aspect-ratio` CSS — so none of those
classes ever reached the element that needed them.

1. **Invisible** (the owner's original report, `variant="end" [flip]="true"`): `.flourish` never set its own
   `display`, so it was a plain `display: inline` span — `aspect-ratio`/`min-height`/`width: auto` have no effect
   on a non-replaced inline box, making it a genuine 0×0 box everywhere. It only ever looked like it worked when a
   caller's classes happened to blockify the host by accident. Confirmed via computed-style inspection (never
   viewed rendered art/screenshots) that this affected **every** `<app-flourish>` usage on every page. Fix:
   `display: inline-block` on `.flourish`.
2. **Wrong-sized** (found immediately after fixing #1): every flourish sized itself from `min-height: 1em` — the
   ambient font-size at that point in the DOM — ignoring the host's own height utility entirely; a `h-12` (48px)
   hero flourish rendered at 16px, `app-section-header`'s `h-8` flourish likewise. Fix: a `Flourish`-component-
   _scoped_ `.flourish { height: 100%; }` (in `flourish.ts`'s own `styles`, not the shared CSS file) — deliberately
   not shared, since `app-section-divider` uses `.flourish` directly (unwrapped) with its own height utility on the
   same element, and an unscoped `height: 100%` there would be unlayered CSS unconditionally beating that
   utility's layered Tailwind rule, breaking the one usage that already worked.
3. **Misaligned**: `end`/`end-short` flourishes sitting inline next to heading text rendered visibly above center.
   `vertical-align: -0.08em` was a flat, untuned magic number, wrong for every font-size context it was used in.
   Fix: `vertical-align: middle` — verified within ~2-3px of true visual center (font-metrics noise, not a further
   bug) in both a flex-centered heading and genuine inline text.

`flourish.spec.ts` only asserts class names, so jsdom's lack of real CSS layout let all three ship unnoticed (same
category of gap as the Stage 3a `bg-section` bug). All three verified via `getComputedStyle`/`getBoundingClientRect`
against the real DOM, never via screenshots.

**4th bug found outside phase work, 2026-09-23, [PR #26](https://github.com/krwiles/floofy-site/pull/26) —
merged into `working` — a different root gap from the 3 above, same components:** every caller-facing `hidden ...
md:inline-block` on `<app-flourish>` or `app-section-divider`'s own `.flourish` span (meant to hide the flourish
below the `md` breakpoint) never actually worked below `md` — the owner noticed flourishes always showing on
mobile and suspected (correctly) that this was pushing pages wider than the screen. Root cause: `flourish.ts`'s
`:host { display: inline-block; }` and `flourishes.css`'s shared `.flourish { display: inline-block; }` are both
unlayered CSS, which always wins over Tailwind's layered utilities (`hidden`/`md:inline-block` included in
`@layer utilities`) regardless of specificity or source order — the same underlying cascade-layers mechanism
already documented above for the `height: 100%` fix, just hitting `display` instead. Confirmed live via
Playwright (`scrollWidth` vs `innerWidth`, never a screenshot): real horizontal overflow up to 522px at a 375px
viewport on every one of 8 routes; some flourishes are absolutely positioned and up to ~670px wide once visible.
Fix: wrap the conflicting CSS in Tailwind's own `base` layer (ranked below `utilities` in Tailwind's own
`@layer theme,base,components,utilities;`), so a caller's utility class correctly overrides the component
default — widened to the whole `.flourish` rule (not just `display`) per a code-review finding, since the same
latent gap exists for every property in that rule, not just the one that's actually been hit. Present since
Stage 3a first shipped these two components — not a recent regression. Disclosed, not fixed: no unit test
asserts computed display, so a regression back to unlayered CSS wouldn't be caught by `ng test` — same jsdom
limitation as the 3 bugs above.

## Guiding order

Baseline → upgrade → design foundations → primitives → hero/section → forms → Flowbite replacement → pages one at a
time → polish. Each phase is one branch/PR (or a small series), leaves `ng build` green and, unless it says
otherwise, does not change how the site looks.

---

## Phase 0 — Baseline and safety net ✅ done (2026-09-21)

Executed via **[06-phase-0-plan.md](06-phase-0-plan.md)** on branch `refactor/phase-0-baseline`, fast-forward merged
into `working` at `5d54109`. `ng build` and `ng test` both exit 0 (20/20 spec files, 27/27 tests).

- [x] Owner finished `src/styles/components/cards.css` (card design) — committed.
- [x] Owner upgraded Node to 24.21.0 (Angular 22 requires ≥ 24.15).
- [x] Branch `refactor/phase-0-baseline` off `working`, fast-forward merged, branch deleted.
- [x] Fixed all 7 failing spec files (11 commits — one more than planned; see note below).
- [x] `.gitattributes` (`* text=auto eol=lf`); `--renormalize` found nothing to change (files were already LF).
- [x] Removed the unused `RouterLink` import in `About`.
- [x] `CLAUDE.md` created (short version).
- [x] Scripted visual baseline (Playwright + pixelmatch) added and run: 24 screenshots captured
      (8 routes × 3 widths, English only) to `__screenshots__/baseline/` (gitignored, not committed). Diff script
      self-tested (baseline vs. baseline → 0.00% everywhere). Claude only ever saw file paths/sizes and the diff
      percent table — never the images. See [[feedback-art-privacy]].
- [ ] Still open, not part of Phase 0: decide what to do with the unfinished "Reviews, donate, contact" section in
      `contact.html` (~180 lines) — ask the owner before Phase 6 touches `contact.html`.

## Phase 1 — Angular 22 upgrade ✅ done (2026-09-22)

Executed via **[07-phase-1-plan.md](07-phase-1-plan.md)** on branch `refactor/phase-1-angular-22`, merged into
`working` via [PR #20](https://github.com/krwiles/floofy-site/pull/20) at `c9fca2d`. `ng build` clean; `ng test`
27/27 green.

- [x] `@angular/core`/`cli`/`build`/`common`/`compiler`/`compiler-cli`/`forms`/`platform-browser`/`router` → 22.1.7/22.1.8.
- [x] `typescript` pinned `~6.0.3` (auto-pinned by `ng update` itself — matched the plan exactly).
- [x] `tailwindcss`/`@tailwindcss/postcss` pinned `^4.3.2` explicitly (was already resolved on disk from Phase 0).
- [x] `vitest` unchanged at `4.1.10`.
- [x] Automated migrations from `ng update`: `provideHttpClient(withXhr())` in `app.config.ts` (preserves old HTTP
      backend); `ChangeDetectionStrategy.Eager` added to `App` and `Gallery` (preserves their pre-v22 non-`OnPush`
      behavior — the only two components with no explicit strategy; the tool defending against a silent behavior
      change, not one happening); `$safeNavigationMigration()` wrapping two optional-chaining expressions in
      `gallery.html`; two new extended diagnostics suppressed in `tsconfig.app.json`.
- [x] Signal Forms `min`/`max` string-value breaking change: re-grepped, not used anywhere in this codebase.
- [x] `Gallery` smoke test (non-visual): `@defer (on viewport)` and the lightbox both work correctly.
- [x] Form validation smoke test (non-visual, no real submission): all three forms validate and fire zero network
      calls on an empty submit.
- [x] Visual regression: 21/24 captures pixel-identical to the Phase 0 baseline; the 3 `reviews` mismatches traced
      to the live reviews Lambda returning `503` during capture (confirmed via console log + PNG height comparison,
      not a rendering regression — see PR #20 for detail). **Refined in Phase 2**: the `503` was real but not the
      full story — the reviews Lambda's CORS policy only allow-lists `http://localhost:4200`, so this same symptom
      shows up from any other origin regardless of the Lambda's health. See the Phase 2 section below.
- [x] PR opened and merged by the owner directly — the GitHub MCP server's token didn't have PR-creation permission
      even after the owner updated repo access (still `403` on retry); `gh` CLI isn't installed in either shell. Not
      a blocker, just means I handed off the PR body for the owner to paste rather than opening it myself.

**Not a Phase 1 bug (methodology note)**: while smoke-testing the gallery lightbox close behavior via scripted
synthetic DOM events (`dispatchEvent`, no real paint/animation-frame timing — chosen to avoid viewing the site's
art, see [[feedback-art-privacy]]), the close animation appeared to get permanently stuck. The owner reproduced it
directly with real interaction and confirmed it closes correctly via all three methods (Escape, close button,
backdrop click). Recorded here only as a testing-method caveat: scripted event dispatch is not a fully reliable way
to verify CSS-animation-gated DOM removal (`animate.leave`) in this kind of automated check — not an app issue, and
not a claim to repeat in future phases without re-verifying by hand first.

**For future phases (not acted on in Phase 1, out of its declared scope)**: `get_best_practices` now says explicit
`OnPush` is unnecessary in v22 (it's the default) — nearly every component here still sets it. Signal Forms are now
marked **stable** in v22 (was experimental-adjacent before Phase 1).

**Found during execution, not in the original plan**: fixing `App`'s router-provider issue let `App`'s lifecycle run
for the first time in a test, which exposed that `ngAfterViewInit` → `observerInit()` calls
`new IntersectionObserver(...)`, undefined in jsdom — an unhandled exception that made `ng test` exit 1 even though
all tests "passed". Fixed with a `vi.stubGlobal('IntersectionObserver', …)` shim scoped to `app.spec.ts`
(`beforeAll`, not `beforeEach`/`afterEach` — a per-test stub raced the deferred `setTimeout` and didn't work). Zero
change to `App`'s real behavior. The underlying scroll-reveal design (`App.observerInit`) is unchanged and is still
slated for replacement by `appReveal`/`RevealService` in Phase 3.

## Phase 2 — Design foundations

Concrete, ready-to-execute plan: **[08-phase-2-plan.md](08-phase-2-plan.md)** (settled 2026-09-22 via
`grill-with-docs`). Narrower than originally sketched below — a shared shadow scale, z-index scale, and
section-padding scale are all deferred to Phase 3 (no consumer yet; would be speculative). The card/glass system
blocker is resolved (finished, see Phase 0) but its _application_ across the site is also Phase 3 work, not this
reorganization.

✅ Done (2026-09-22). Executed via `08-phase-2-plan.md` on `refactor/phase-2-design-foundations`, fast-forward
merged into `working`. `ng build` clean, `ng test` 27/27, code review clean (no findings). Visual diff: 20/24 exactly
`0.00%`, one negligible `0.01%` (`streaming/375`, almost certainly gradient sub-pixel interpolation from the
`var()` dedup, not a real change), `reviews` shows `size-mismatch` — see the CORS finding below, unrelated to this
phase's changes.

- [x] Split `styles.css` into `tokens.css` + `base.css` (`utilities/`/`components/` already existed, already correct).
- [x] Added 8 hero/backdrop color tokens (bespoke per page, sampled from each page's hero image — not a shared
      palette; see `CONTEXT.md`). Verified every value matches its original hex exactly in the built CSS.
- [x] De-Flowbited three radius classes (`rounded-base`/`rounded-sm`/`rounded-lg` → `rounded-xl`/`rounded-md`/
      `rounded-2xl`, 47 usages) — no custom radius token needed. `rounded-sm`/`rounded-lg` were _also_ silently
      Flowbite-dependent, not just `rounded-base`; verified exact pixel-value matches (12px/6px/16px) in the built
      CSS.
- [x] Fixed `streaming.css`'s hand-duplicated brand-color gradient to reference `var(--color-brand)`/
      `var(--color-brand-strong)`.
- [x] Removed `tailwind.config.js` (confirmed dead — verified by removing it and rebuilding, identical output).
- [x] Moved the Google Fonts `@import` out of CSS into `<link>` tags in `index.html` (kept Google Fonts, not
      self-hosting).
- [x] The Flowbite "empty sub-selector" build warning is tolerated, not fixed — confirmed traced to Flowbite's own
      theme CSS by temporarily removing that one import and rebuilding.

**Found during execution, not part of this phase's scope — a real production bug**: chasing the `reviews`
visual-diff mismatch (present in both this phase's and Phase 1's captures) led to discovering that the **reviews
and contact Lambdas have their CORS allow-list hardcoded to `http://localhost:4200` only** — confirmed directly:
`Origin: http://localhost:4200` gets `Access-Control-Allow-Origin: http://localhost:4200` echoed back;
`Origin: https://www.floofy.site` (and `floofy-site.vercel.app`, `floofy.site`) gets **no CORS header at all**. The
commission Lambda is correctly configured (`Access-Control-Allow-Origin: *`) for comparison. This means **the real
production site cannot currently fetch reviews or submit the contact form** — a live bug, not a refactor artifact.
It also retroactively refines the Phase 1 note above: the `503` observed then was real, but incomplete as an
explanation — this CORS gap is the deeper, persistent cause, and explains why Phase 0's baseline (captured via the
one dev server that happens to already run on the allow-listed port) succeeded while every scratch-port
verification since has shown the same empty-state height. Backend fix, out of scope for this frontend phase — not
touched, flagged here for the owner to prioritize.

## Phase 3 — Primitives

Concrete, ready-to-execute plan for stage 3a (stages 3b/3c settled but detailed just before each executes):
**[09-phase-3-plan.md](09-phase-3-plan.md)** (settled 2026-09-22 via `grill-with-docs`). Split into three
sub-phases, each its own branch and merge decision — they have very different risk profiles.

- [x] **3a — Motion & structure** — executed on `refactor/phase-3a-motion-structure`, merged into `working` via
      [PR #21](https://github.com/krwiles/floofy-site/pull/21) (the GitHub MCP token's `403` got fixed mid-phase —
      re-scoping its fine-grained PAT permissions — so PR creation worked directly from here on). **Not zero
      visual risk in practice** — a real bug was found and fixed during verification (see below), and the
      diff-decides-merge rule from Phase 0/2 was overridden: this went through a PR despite the plan's original
      "zero visual risk" expectation, because the diff came back far from clean and needed the owner's own eyes.
      Two follow-up commits landed on the same PR after the owner noticed `app-section-header` wasn't applied
      everywhere it should be: the 3 remaining "exceptions" from the original migration turned out not to be real
      exceptions (dead scroll-anchor CSS, traced via `commission.ts`'s `scrollToElement()`) except one genuine
      extra-paragraph case, and the site's `descriptionSize` sm/base split was an unintended inconsistency,
      standardized on `base` (input removed entirely).
  - [x] `RevealService` + `appReveal` (TDD); deleted `App.observerInit`/its router-subscription re-scan, the
        `Reviews → App` dependency, and the Phase 0 `IntersectionObserver` test stub (replaced by a project-wide
        one in `src/test-setup.ts`, needed because every `appReveal`-using component now hits the same
        `matchMedia`/`IntersectionObserver` jsdom gaps Phase 0 only fixed for `App`). Migrated 110 usages.
  - [x] `app-flourish` (TDD); migrated 29 usages via a scripted regex replace (verified exact counts).
  - [x] `app-section-divider` (TDD, zero inputs — confirmed byte-identical across all 13 usages); migrated 13.
  - [x] `app-section-header` (TDD); investigated all ~17 candidates before designing — 8 matched the plain shape
        and got migrated, 3 were deliberately left as hand-written markup (scroll-anchor classes, an extra
        paragraph — not forced to fit). Added `flourish`/`descriptionSize` inputs for real variance found (2
        instances have no flourish, 2 lack `text-sm`).
  - [x] `app-section` (TDD); investigated all 16 candidates and found the inner width/padding wrapper varies on
        nearly every instance, so narrowed scope to just the outer tone/pattern shell — the padding stays as the
        caller's own content, not a parametrized input.
  - **Real bug found during the visual-diff step, not by `ng build`/`ng test`**: `app-section`'s pattern-mode
    content rendered completely empty (about's OC section, gallery's whole image grid, commission's inquire
    section all silently disappeared) — two `<ng-content>` tags across `@if`/`@else` branches, which Angular
    resolves at compile time rather than per the active runtime branch, so only one branch ever received
    projected content. Fixed with `<ng-template>` + `*ngTemplateOutlet` (the standard idiom for this). Also
    fixed: `app-section`/`app-section-header` both defaulted to `display: inline` (confirmed via computed
    style), breaking layout height everywhere they're used — both now set `:host { display: block }`. The
    test meant to catch the `ng-content` bug didn't, because it asserted content projection via a manual
    `appendChild()` that never exercises Angular's real projection mechanism — replaced with a proper
    host-component test, verified to fail pre-fix and pass post-fix.
  - **Correction (found during Stage 3b): the "honest, unresolved uncertainty" below was wrong.** At the time,
    the visual diff against the Phase 0 baseline still showed 30–79% changed on most routes even after both
    fixes above, and the best guess was below-the-fold `appReveal` content being legitimately unrevealed at
    capture time. That guess was never actually verified, and it wasn't the real cause: `Section` computes
    its tone class as a runtime string (`` `bg-section-${tone}` ``), which Tailwind's content scanner can
    never see as a literal candidate — `bg-section-middle`/`bg-section-dark` were silently never generated,
    so every `app-section` using either tone rendered with **no background color at all** from the moment
    this component shipped. Found while investigating an owner report during Stage 3b (see that section
    below); fixing it alone dropped the diff on unaffected routes from 30–79% down to 0.00–0.16%. Left here
    rather than edited away, as a record that the original diagnosis was a guess that turned out incomplete,
    not a verified fact — exactly the distinction this note tried to draw at the time.
  - **PR creation blocked again, then fixed mid-phase**: the GitHub MCP token still returned `403` at first
    (same issue as Phase 1); branch pushed, PR body handed to the owner to paste manually. The owner then
    re-scoped the fine-grained PAT's permissions and it started working — see the PR #21 note above. PRs
    #22 and #23 (and this note's own correction) were all created directly from here on.
- [x] **3b — Surfaces & controls** (real visual change on every page — **always a PR**, regardless of diff) —
      executed on `refactor/phase-3b-surfaces-controls`, per **[10-phase-3b-plan.md](10-phase-3b-plan.md)**.
      `[appCard]` (`tone`/`special`/`noBackground`/`glass`) and `appButton` (`variant` × `tone`) directives,
      TDD throughout, migrated every in-scope card/button instance across about/commission/home/gallery/contact/
      donate/reviews. Streaming, navbar buttons, and commission's form radio-labels excluded as planned.
  - **Real bugs found by `/code-review`, all verified before fixing (not caught by `ng build`/`ng test`)**:
    - `donate.html`'s Ko-fi `<iframe>` was migrated to a full `[appCard tone]`, but the directive's fill/border
      paint via a `::before` layer, and browsers never render `::before`/`::after` on replaced elements like
      `<iframe>` — the card's whole surface would have silently never appeared. Moved `appCard` to a wrapper
      `<div>` around the iframe instead.
    - Every full-card migration kept its original `border-white/N` utility alongside `[appCard]`, reasoning
      (wrongly) from `contact.html`'s one pre-existing `card-on-section-middle` usage as precedent. Worked out
      the actual box geometry by hand: a `::before` with `inset:0` resolves against the parent's _padding_
      edge, so its own 1px border paints in the ring immediately inside the parent's own border — two adjacent,
      differently-colored 1px rings, not one hidden behind the other the way the already-removed `bg-white/N`
      classes were. Removed the redundant border from all ~15 instances, including retroactively fixing
      `contact.html`'s original usage, which turned out to have the same defect already — the trusted precedent
      was itself buggy.
    - `tone` was fully optional on `[appCard]` to accommodate `glass`, leaving the far more common non-glass
      case with no safety net at all. Now throws immediately if missing outside `glass` mode, instead of
      silently emitting a class matching no CSS rule.
    - `buttons.css`: `variant="secondary"` rendered identically to `primary` (only `.btn-on-{tone}` set color).
      White text on `btn-on-light`/`btn-on-middle`'s lighter gradient stop computed to ~2.76:1 contrast against
      WCAG AA's 4.5:1 floor — both fixed (secondary gets its own lighter-but-still-contrasting fill; every
      gradient stop now verified ≥4.5:1, not just checked at one end).
    - Deduplicated the `Tone` type (identical in both directives) into `src/app/models/tone.ts`.
  - **Pre-existing Stage 3a bug, found while investigating an owner report** ("something you did broke all of
    the app-sections — none of them show their correct color"): traced it to `Section`, not this branch —
    it computes its tone class as a runtime string (`` `bg-section-${tone}` ``), invisible to Tailwind's content
    scanner. `bg-section-light` only kept working by accident (that exact string also happens to appear
    literally elsewhere, in form input styling); `bg-section-middle`/`bg-section-dark` never appeared literally
    anywhere, so Tailwind silently never generated them — every `app-section` using either tone has had no
    background color since Stage 3a shipped, not since this PR. Confirmed this predates Stage 3b by checking out
    `working` directly and reproducing the identical bug there via `getComputedStyle` in a real browser (not
    jsdom, which doesn't exercise real Tailwind generation and wouldn't have caught this). Fixed with
    `@source inline()` in `tokens.css`, force-generating all 6 `bg-section-{tone}` utilities regardless of
    scanner detection — the standard Tailwind v4 answer for a dynamically-built class name.
  - **Disclosed, not fixed**: 3 commission carousel-thumbnail wrappers go from `rounded-2xl` (1rem) to the
    card system's fixed 2rem radius — a real, visible size increase and a design call for the owner, not a code
    defect; no clean way to override it without fighting the directive's own cascade.
  - Visual diff vs. the Phase 0 baseline, re-captured after the `bg-section` fix: real changes everywhere a
    card/button actually changed, several `size-mismatch` entries (expected — full-page height changes with real
    content/spacing changes). Routes untouched by card/button work dropped to **0.00–0.16%** once the color fix
    landed (was 30–79%, see the corrected Stage 3a note above) — strong evidence that bug, not reveal-timing,
    was the real cause of Stage 3a's entire unresolved diff. `streaming` (0.01–0.15%) confirmed via
    `git diff working -- src/app/streaming/` (empty) that this branch touched nothing there; the residual
    fraction of a percent is capture noise (font hinting/anti-aliasing), not a real change.
- [x] **3c — Data-driven consolidation**: executed 2026-09-23 on `refactor/phase-3c-data-consolidation`
      (branched off `working`), per **[11-phase-3c-plan.md](11-phase-3c-plan.md)**. `SOCIALS` typed data (7
      entries incl. `email`, explicit per-entry `ariaLabel` text, standardizing email's aria-label from "Email
      SummerFloofy" to "SummerFloofy on Email" per the plan's decision #6), `app-social-links` (`ids` +
      `variant: 'plain' | 'chip'` — owns individual items + their sizing, not the wrapping grid/flex layout,
      which stays real per-page variance), `app-brand` (owns only the shared link/image/text core; footer's
      `<h2 id="footer-brand">` landmark heading and navbar's `nav-brand-intro` entrance animation stay at the
      call site, confirming the plan's correction that they were never byte-identical).
  - **Code-review findings, all fixed:**
    1. `app-social-links` needed `:host { display: contents; }`. Without it, the component's own element
       became a single grid/flex item instead of letting its `<a>` children participate directly in the
       caller's grid/flex — silently collapsing about/contact/donate's icon grids into one cell. Caught by
       visual-diff (`size-mismatch` on every route/width, not just the pages with visible social icons —
       footer's shared `flex-wrap` row was affected everywhere).
    2. Donate's migration to the shared chip dropped its `text-on-middle-heading` color and `shrink-0` — real
       losses, not part of the plan's decision #2 (which standardizes chip _sizing_ onto about/contact's, not
       color or flex-shrink behavior). Restored via a forwarded class on the component's host.
    3. `app-brand`'s `<img>` needed `alt=""` (decorative), not `alt="Floofy"`: the adjacent wordmark text
       already names the link, and inside footer's `<h2 id="footer-brand">` (wrapping the whole component,
       correctly per the plan) a real alt corrupted that heading's accessible name into "Floofy Floofy".
    4. `SOCIALS.find()!` non-null assertion replaced with a lookup that throws a clear error on a missing id,
       matching `[appCard]`'s established convention from Stage 3b.
    5. Prettier formatting on the new `social.ts`.
  - **`app-brand`'s host is `display: block`, not `contents`** (the plan flagged this as worth confirming
    during implementation): `display: contents` breaks navbar's `nav-brand-intro` entrance animation, since an
    element with no generated box has nothing for `opacity`/`animation` to apply to.
  - **Visual diff**: `0.00%` on every route/width except `donate` (`size-mismatch`, all three widths) — the
    intended, plan-approved chip-size standardization (decision #2), not a regression. Per diff-decides-merge,
    a real diff means this stage ships as a PR rather than a direct merge.

## Phase 4 — Hero and Flowbite JS removal

Concrete plan: **[12-phase-4-plan.md](12-phase-4-plan.md)** (settled 2026-09-23 via `grill-with-docs`). Component
specs for the genuinely-new pieces live in **[specs/](specs/)**. Today's single `app-carousel` (Flowbite-wrapped)
turned out to not cleanly match either real usage — it's replaced by two separate components, not one with a
mode: `app-rolling-carousel` (home's continuous strip) and `app-slideshow-carousel` (commission's 3 pricing-card
slideshows). `app-hero` and `app-parallax` clean-up stay parity-preserving (no formal spec, no visual change);
the rest (carousels, navbar disclosure) get a from-scratch, no-parity redesign per the owner's standing direction
for Flowbite-JS-driven pieces.

- [x] [Image asset model](specs/image-asset-model.md) — consolidate `CarouselImage`/`GalleryImage` into one type
      (prerequisite for both carousels below). Direct-merged into `working` (diff-decides-merge, `0.00%` on every
      route/width). Code review caught and fixed two real issues: `illustrationImages`' entry for
      `GyfSzJfaIAAn9qh.jfif` had the wrong dimensions vs. `galleryImages`' entry for the same file (verified the
      real file via metadata, corrected it — zero visual effect either way, since `carousel.html` hardcodes its
      `<img>` width/height rather than binding them); `ImageAsset`'s fields are `readonly`, matching the
      immutability the deleted `GalleryImage` class had via constructor params. **Disclosed, not fixed**:
      `GalleryImageService` is still named after the gallery page despite now equally serving carousel-only image
      sets that `commission.ts` consumes with no gallery dependency; `home.ts`'s carousel images remain a third,
      independently-maintained literal duplicating images already in `GalleryImageService` (already caught
      drifting once, per the dimension bug above) — both out of scope for this step, flagged for later.
      Also fixed in passing, unrelated to this step: `scripts/visual-baseline/capture.mjs` now emulates
      `prefers-reduced-motion` so `appReveal` content no longer captures as invisible below the fold.
- [x] [`app-rolling-carousel`](specs/app-rolling-carousel.md); migrate home. Executed and merged,
      [PR #27](https://github.com/krwiles/floofy-site/pull/27) (real, intentional redesign on home only —
      always a PR, not diff-decides-merge). Two real bugs found and fixed _before_ code review even
      ran, neither showing as page overflow (masked by the strip's own `overflow: hidden`, so only computed-
      style inspection caught them): `align-items: center` on the outer container meant its flex child never got
      a definite height via flex stretch, so `height: 100%` resolved to `auto` per spec and every image rendered
      at its own intrinsic pixel size; the track itself had no `flex-shrink: 0` (a different flex context than
      its own children), so the browser compressed the whole track to the container's width instead of sizing
      to `max-content`, squashing every image. Code review then found and fixed five more: the loop's
      `translateX(-50%)` was short of the true seamless-loop period by exactly half the gap value (verified both
      algebraically and empirically, offset-based, to within 0.11px after the fix); the height fix patched one
      level below the real cause (`align-items: center` was removed instead of just compensated for); the whole
      strip is now `aria-hidden` (resolves a 12-images-at-once accessibility finding and an `aria-hidden`
      placement inconsistency together); a dead no-op nested CSS rule was deleted; `will-change: transform` was
      added for the animation that runs for as long as the page is open; a stale line in the spec document
      itself was corrected. **Disclosed, not fixed at first**: per-image card-shadow frames get hard-clipped at
      the scroll window's edges by the container's own `overflow: hidden`; `home.ts`'s image-list duplication
      with `GalleryImageService` (already flagged in the step above, still not fixed, out of scope); no unit
      test asserts real computed height or loop-period geometry (jsdom doesn't do real CSS layout — exactly why
      every bug above needed a real-browser check, not `ng test`, to find — still an open gap).
      **Owner-requested follow-up, same PR**: the shadow-clipping disclosure above got addressed after the
      owner saw the shipped component running — vertical padding (`padding-block`, tuned by the owner to
      `2.5rem`) added automatically whenever `cardTone` is set (no new input — the component sizes its own
      shadow headroom from `cards.css`'s real values), `box-sizing: content-box` so the padding grows the
      component's total footprint rather than shrinking the images to fit inside it. A rounded-corner viewport
      (matching the per-image card radius, so images would vanish/emerge behind a rounded edge) was considered
      and dropped — the owner realized rounding and padding fight each other, since the rounded clip wouldn't
      line up with the images once there's padding between them and the edge. Went with a horizontal
      `mask-image` fade at both edges instead (owner-tuned to `3rem`), unconditional in both plain and framed
      mode, vertical edges untouched (padding's job). Verified live: total height = image height + padding
      exactly, image height itself unchanged; mask resolves to real pixel gradients.
- [x] [`app-slideshow-carousel`](specs/app-slideshow-carousel.md); migrate commission's 3 instances; delete the
      old `app-carousel`/`initCarousels()`/its static id. Executed, [PR #28](https://github.com/krwiles/floofy-site/pull/28)
      (real, intentional redesign on commission only — always a PR, not diff-decides-merge) — **merged into
      `working`**. Looping technique: the image list is rendered with one clone of the last image prepended and one
      clone of the first appended, so there's always a real neighbor to slide to in either direction and the
      transition always runs the correct way, even on the wrap; landing on a clone slot is harmless (pixel-
      identical to the real slide) and gets silently resynced the next time a real move is requested. `/code-
review` found and fixed two real issues: touch handlers never claimed the gesture, so a swipe could be
      fought by page scroll or a mobile browser's own swipe-back navigation (fixed via a conditional
      `preventDefault` once horizontal intent is clear); a loop-boundary crossing restarted the auto-advance
      timer twice in quick succession instead of once (harmless churn, fixed by skipping the restart during the
      resync's own transient state). **Disclosed, not fixed**: the loop-boundary resync uses a plain
      `setTimeout(0)` rather than a double-`requestAnimationFrame` guarantee — a deliberate simplicity/
      testability trade-off, documented inline.

      **Owner-requested follow-up round, same PR**: after seeing the shipped component running, the owner
                          found two real bugs and asked for a spec change.
                          1. **Arrows permanently invisible, even while hovering.** Root cause: the reveal rule was written as a
                             plain descendant selector on the host's *own class* (`.slideshow-carousel:hover .slideshow-carousel__arrow`)
                             — Angular's emulated view encapsulation tags every element *inside* a component's template with an
                             `_ngcontent-*` attribute, but the host element itself gets `_nghost-*` instead, so a selector like this,
                             written from inside that same component's own stylesheet, can never match the host. Fixed with
                             `:host(:hover)`/`:host(:focus-within)`. This environment's `getComputedStyle` proved unreliable for
                             reading back `opacity` specifically (even a forced inline `!important` override wasn't reflected), so
                             verified structurally instead — the fixed selector matches the exact arrow element with higher
                             specificity than the base rule, confirmed via the live stylesheet's own compiled selector text.
                          2. **Spec change: no card framing of its own, at all.** The disclosed `cardTone` shadow-clipping item above
                             turned out to be the wrong thing to fix — the owner decided this component shouldn't have `[appCard]`
                             framing logic internally in the first place. `cardTone`, the `Card` import, and the per-slide
                             `[appCard][noBackground]` wrapper are all removed; every slide is now unconditionally a plain
                             rectangular `<img>`. Commission's 3 usages now apply `appCard tone="dark"` directly to the
                             `<app-slideshow-carousel>` tag instead — `card-on-section-dark`'s own `overflow: hidden` +
                             `border-radius` clips the image to match automatically, confirmed live, no extra CSS needed.

                          **Second follow-up round, two more owner-reported issues**:
                          3. **Sub-pixel image seam**: a column of the neighboring image visible through the transparent edge of
                             alpha-background images (the emote/chibi art), since two adjacent slides — each `translateX()`'d by
                             exactly 100% of the viewport's own (rarely whole-number) pixel width — don't always tile perfectly
                             under the browser's sub-pixel rounding. First fix attempt (uniformly growing every slide via
                             `scale()`) made it *worse*, per the owner's live testing: growing every slide the same amount makes
                             adjacent (still 100%-apart) slides overlap *each other*, and plain DOM/array order — not which one is
                             actually current — decided whose edge won that overlap, letting an off-screen neighbor's transparent
                             edge paint right over the active slide. Corrected, per the owner's own suggested approach: shrink every
                             *inactive* slide slightly (`scaleX(0.99)`) instead, leaving the current slide at full size. No
                             equivalent failure mode — nothing here ever grows into a neighbor. The current slide's own position
                             (`translateX(0%)`) has zero rounding error to begin with; only adjacent slides' percentages are subject
                             to it, and shrinking them inward by a safety margin (~1.6px on a ~319px slide) larger than any possible
                             rounding error (~1px) leaves nothing at the seam for a neighbor to creep into. Verified via direct
                             `getBoundingClientRect` measurements (not just trusting the transform value): the active slide's
                             rendered width exactly matches the viewport's; every inactive slide's edge sits measurably inside the
                             viewport boundary.
                          4. **Occasional direction-reversal/jump-back**, reported as hard to reliably reproduce, more with 4 images
                             than 3, only after using the arrows. Root-caused via a deterministic unit test rather than chased live:
                             the loop-boundary resync's deferred retry captures its delta in a closure at schedule time; a
                             *different* navigate() call (opposite direction) landing before that 0ms-deferred retry fires would get
                             silently overridden once the retry fires and blindly replays its now-stale delta. First fix attempt
                             (clear any pending retry on every fresh call) was too broad — it also cancelled *same-direction* pending
                             retries, silently dropping a legitimate step out of a rapid burst, breaking the existing loop-point
                             test. Corrected to the narrower, direction-aware fix: only cancel the pending retry when the fresh
                             call's direction actually differs from what it was going to do. **This fix is confirmed correct for the
                             specific race it targets (a dedicated regression test proves it), but the owner's original symptom
                             persisted afterward and remains unreproduced** — documented as a known, deferred issue in the
                             component's own doc comment per the owner's explicit direction, rather than continued to be chased
                             without a reliable repro.

                          **New candidate lead on the deferred symptom, found by `/code-review` during step 4's work, not yet
                          fixed**: that same direction-aware cancellation clears `resyncTimer`/`pendingResyncDelta` on a stale,
                          opposite-direction retry, but never resets `instant` back to `false` — only the timer callback it just
                          cancelled does that. `instant` can get stuck permanently `true`, silently stopping auto-advance (the
                          restart effect is gated on `!instant()`) and forcing every later manual move to snap with no transition.
                          Plausible contributor to point 4 above; reported to the owner as a follow-up candidate rather than fixed
                          inline, since PR #28 is already merged.

                          `ng build`/`tsc --noEmit`/`ng test` (101/101) all clean after both follow-up rounds. Verified live in a
                          real browser throughout (not just jsdom, per this refactor's established practice for anything touch/
                          timing/rendering-dependent): 3 independent instances, correct wraparound both directions, hover-pause/
                          resume, auto-advance timing, `appCard`-on-the-tag framing, i18n aria-labels, no console errors, no
                          horizontal page overflow, no sub-pixel seam.

- [x] [`app-language-toggle`](specs/app-language-toggle.md); extract out of `navbar.html`, move the two flag
      `<svg>`s to real image files. Executed and **merged into `working`**,
      [PR #29](https://github.com/krwiles/floofy-site/pull/29). A plain extraction per the spec's own scope (not
      Flowbite-related, no visual/behavioral change intended). `LanguageToggle` injects `I18nService` directly,
      same as `Navbar` already did; flags now live at `src/assets/flag-{en,ja}.svg`. `/code-review` found and
      fixed two real issues: `aria-label="Toggle language"` was hardcoded English rather than sourced from the
      i18n JSON files (this repo's own convention, already followed by `slideshow-carousel`'s arrow labels) —
      added `components.language_toggle.toggle` to both locale files, wired through `TranslatePipe`; the
      near-duplicate `@if`/`@else` template branches were collapsed into one computed flag-display lookup. The
      visible `"EN/日本語"`/`"日本語/EN"` label was deliberately left as a plain constant (not translated) — it
      names both languages together regardless of current locale, so there's no per-locale variant to look up.
      Also surfaced, out of scope for this step and reported to the owner rather than fixed here: the
      `instant`-stuck bug noted above, plus two low-severity, currently-inert latent issues in already-merged
      PR #28 code (`commission.ts`'s carousel image arrays now alias `GalleryImageService`'s mutable fields
      directly instead of defensively copying them; `position`'s `-1`-sentinel correction only ever runs once,
      so a future caller that changes `images()`'s length after first settle wouldn't get `position`
      re-validated against the new padded track).
- [x] [Navbar disclosure](specs/navbar-disclosure.md) — the real Flowbite-JS removal (`initFlowbite()`,
      `data-collapse-toggle`), unlike the language toggle above genuinely tied to the plugin, so freed from
      visual/behavioral parity by the spec itself. Executed and **merged into `working`**,
      [PR #30](https://github.com/krwiles/floofy-site/pull/30). `Navbar` now owns an `isMenuOpen` signal instead of Flowbite's own toggle state:
      `aria-expanded` is bound to it (was a static `"false"`, so screen readers were told the menu was always
      collapsed even while open — one of the two real problems the spec called out); the panel's `hidden` class
      is bound to `!isMenuOpen()`, under the same `lg:flex` that already made it always-visible on larger
      screens (unchanged there, per the spec's constraint). Escape closes it via a document-level `host: {}`
      listener (not scoped to the component's own host element, since focus is never moved into the menu on
      open, so it can legitimately be anywhere on the page when Escape is pressed). Tapping a link now calls
      `closeMenu()` directly, replacing the old `navDropdown.click()` re-click trick that only worked by leaning
      on how Flowbite happened to wire the toggle button — the spec's other named problem. Any other navigation
      (router-driven back/forward, a redirect, etc.) closes it via a `Router.events` subscription filtered to
      `NavigationStart`. `initFlowbite()` and its import removed from `app.ts` — the last real dependency on
      Flowbite's interactive JS; confirmed via the prod JS bundle shrinking ~15KB. Flowbite's Tailwind CSS
      plugin/theme in `styles.css` is untouched (a styling concern, not interactive behavior, out of scope
      here). **Focus-handling decision, since the spec explicitly left it open**: opening the menu never moves
      focus into it (same as any other newly-visible content, a visitor tabs into it next); closing it returns
      focus to the toggle button only if focus was inside the panel when it closed, otherwise focus is left
      alone. `/code-review` found and fixed two real issues: the focus-restore called `.focus()` on the toggle
      button even at the `lg` breakpoint, where that button is `lg:hidden` and therefore unfocusable — silently
      stranding focus on `<body>` instead of honoring its own contract, fixed with a live `matchMedia` check;
      while fixing this, also implemented a spec edge case missed during design — widening past `lg` while the
      menu is left open now force-closes it, so it can't silently reappear "open" once the viewport narrows
      again without the visitor tapping the button (not exercised by a real event in unit tests, since this
      project's jsdom `matchMedia` stub has inert listeners — documented inline); a test's stray `<input>`
      cleanup was moved into a `try`/`finally` so a failed assertion couldn't leave it behind for later tests.
      12 tests (TDD, written first); full suite 117/117.
- [x] [Navbar disclosure follow-up](specs/navbar-disclosure.md) — owner-requested, same PR at first (seen it
      running live), moved to [PR #31](https://github.com/krwiles/floofy-site/pull/31) after a branch mixup (see
      the housekeeping note above): rounds the nav-links list's border (`rounded-xl`, replacing a typo'd,
      non-functional `rounded-bas`), rounds the navbar's own bottom corners while the mobile menu is open
      (`rounded-b-2xl`, bound to `isMenuOpen()`, a no-op on desktop), adds a dimming backdrop behind the navbar
      matching the gallery lightbox's own (`bg-black/80`, `z-90` under the navbar's `z-100`), and click-outside-
      to-close on that same backdrop. `/code-review` found and fixed two real issues: the new backdrop visually
      implied a modal, but nothing stopped keyboard focus tabbing into now visually-buried, still fully-
      interactive page content underneath it — `App`'s template now wraps `<router-outlet>` + `<app-footer>` in
      a container bound to `[inert]="navbar.isMenuOpen()"` (read off `Navbar`'s own public signal via a template
      reference); the backdrop's leave-animation could visibly jump to full opacity on a rapid re-toggle, and
      more commonly could still be fading out over a page the router had already navigated to (tapping a link
      closes the menu and starts routing in the same instant, independently of the fade) — fixed by dropping the
      leave-animation entirely, so it disappears instantly on any close and only ever fades in on open; that
      fade-in was also extracted into a shared `.overlay-fade-in` class in the already-global `motion.css`
      rather than a second copy living in `navbar.css` (migrating the gallery lightbox's own near-identical fade
      onto it is left as a follow-up, not done here). **Disclosed, not fixed**: a mousedown/mouseup split can
      defeat the backdrop's click-to-close (matches the gallery lightbox's own pre-existing equivalent
      limitation); the "mobile-only" invariant is now enforced three separate ways across this component
      (deliberate defense-in-depth, not accidental duplication); the backdrop's `z-90` is another ad-hoc
      stacking number with no shared z-index scale anywhere in this codebase yet. 5 new tests across both
      commits. Full suite 122/122.
- [x] `app-hero`; migrated all 8 pages (donate → gallery → reviews → contact → streaming → about → commission →
      home, per the plan's order). Executed and **merged into `working`**, [PR #32]
      (https://github.com/krwiles/floofy-site/pull/32) (see the housekeeping note above for why this Track B,
      diff-decides-merge step still went through a PR). Consolidates the 8 near-identical parallax-hero blocks
      (each hand-copied, each with real per-page variation) into one component, `src/app/components/hero/`.
      Inputs model every genuine difference
      found while cataloguing all 8: image/parallax config for both layers, `tone` (light/dark, via a
      `TONE_CLASSES` lookup), card width/padding/alignment (`cardAlign` alone derives both the content's
      `justify-*` and the image's `ml-auto`, since every page pairs them the same way with no exception), plus
      documented one-off escape hatches for the genuine structural outliers: commission's extra `mt-14` +
      `lg:absolute`-only image positioning and capitalized `"Hero Section"` aria-label; home's larger card
      padding, always-visible flourish, bespoke kicker/title/tagline typography, and two-line name (via the
      `heroTitle` content slot the plan called for). `heroActions` (the plan's other named slot) covers
      streaming's CTA row, replacing its tagline. Verified via this project's scripted visual-diff tool: **0.00%
      pixel change across all 8 routes × 3 widths**, before and after both a formatting pass and the code-review
      fixes below. One real bug caught this way mid-migration: home's tagline shares gallery/contact's existing
      heading-color quirk (uses `text-on-*-heading`, not `text-on-*-body`) — missed on the first pass, caught by
      a small but genuine nonzero diff (confirmed not capture noise by diffing a page against a second,
      independent capture of itself first, which came back exactly 0.00%), fixed. `/code-review` found and fixed
      two real issues: the tone→color mapping was ad hoc `computed()`/ternary logic instead of a lookup table
      (now `TONE_CLASSES`, mirroring `section-header.ts`'s own pattern of the same name); several classes were
      built via manual template-literal concatenation across 7 sites, fragile to a missing/doubled space — a
      `joinClasses()` helper replaces it, and 3 inline template concatenations moved into named computed
      signals. **Disclosed, not fixed**: streaming's hero content (kicker/description/title/both CTA labels) is
      hardcoded English, not translated, unlike every other page's hero — carried over unchanged from the
      markup it replaced (same pre-existing gap as `reviews.html`'s own hardcoded section heading, left for
      Phase 7). Also found, unrelated to correctness: this app runs zoneless Angular (no `zone.js` dependency) —
      a test-host pattern of mutating a plain property _after_ the first `detectChanges()` is silently never
      picked up by a child's input signal; saved to memory, since it'll affect any future spec using that
      pattern, not just this component's own. 12 new tests (TDD, written first); full suite 134/134; per-page
      and main bundle sizes dropped meaningfully now that the duplicated hero markup is shared.

      **Owner-requested simplification round, same PR**: reviewing the new component, the owner asked for fewer
      inputs — several of the one-off overrides were judged worth standardizing away rather than preserving.
      Removed 6 inputs: `bodyTextUsesHeadingColor` (gallery/contact/home's description/tagline now use the
      standard body color, like every other page, instead of the heading color they used to — the very
      inconsistency the original parity-preserving pass had deliberately kept); `cardPaddingClass` (home's card
      now uses the same padding as everyone else); `contentWrapperExtraClass` (dropped home's extra `h-full`,
      redundant next to `min-h-screen` in practice); `heroSectionAriaLabel` (commission's hero image now
      announces "Hero section" like every other page — screen-reader text only, no visual change);
      `outerParallaxStrength`/`heroImageParallaxStrength` (about's hero now scrolls at the same speed as every
      other page instead of its own slightly faster one). `flourishSizeClasses` stays, by explicit owner choice:
      home's always-visible flourish is a real, deliberate difference worth keeping, not a bug to iron out.
      Commission's `mt-14`/`lg:absolute`-only image-positioning overrides also stay — riskier structural quirks
      not raised in this round. Verified via a targeted before/after diff (`git stash` to capture the
      pre-simplification state, then the post-simplification one): only home/gallery/contact show any visual
      change at all (0.06%–0.92%, matching exactly what's described above); every other page — including about
      and commission, whose only changes were the two invisible-by-design normalizations — stays byte-for-byte
      0.00%. 11 tests (1 removed, matching the removed input); full suite 133/133.

      **Second simplification round, same PR**: asked to keep pushing further, naming `imageWrapperExtraClass`,
      `backgroundClass`, `flourishSizeClasses`, `heroImagePositionClasses`, and a merge of `cardAlign`/
      `contentJustifyClass` into one left/right input. Two of those five turned out not to need any change:
      `backgroundClass` holds each page's own distinct hero color — bespoke design tokens sampled from that
      page's image (see Phase 2's own notes), not incidental duplication, so left alone; `contentJustifyClass`
      was already a single computed value derived from the one `cardAlign` input, not a second input needing to
      be merged, so also left alone. The other three were removed: `flourishSizeClasses` — standardized *to*
      home's own original always-visible behavior rather than away from it, reversing the previous round's
      explicit decision to keep it as a one-page difference; `heroImagePositionClasses`/`imageWrapperExtraClass`
      — commission's inner hero image now positions the same way as every other page (plain `absolute inset-0`,
      no `mt-14` offset), the two riskier, structural quirks the previous round had deliberately left alone.
      Verified via another targeted before/after diff: home stays 0.00% (it already had the standardized
      flourish behavior); every other page shows a small diff only at the 375px width (0.01%–0.11% — the
      flourish was already visible at md/lg, so only the smallest breakpoint's "hidden" removal is visible);
      commission shows a larger, consistent diff across all three widths (1.8%–2.9%, from losing both the
      `mt-14` offset and the `lg:absolute`-only positioning at every width, not just below `lg`). 12 tests (1
      added, replacing the removed default-value check with a behavioral "always visible" one); full suite
      134/134.

      **Input audit, no further changes**: asked for a full list of every remaining input, categorized by
      whether it's genuinely page-specific (content strings, image src/position — never reducible),
      genuinely-split design values with no single outlier to fix (`tone` 4/4, `cardAlign` 5/3,
      `heroImageHeight` 4/4, `backgroundPatternImage` 6/2, plus the already-settled `backgroundClass`,
      `cardMaxWidthClass`, `heroImageMaxWidthClass`), or one-outlier overrides worth a further look
      (`titleClass`: streaming/commission/home; `kickerClass`/`taglineClass`: home only — the same shape
      `flourishSizeClasses` had before that round standardized *to* home's behavior). Owner's call: lean
      enough for now, stop here — `titleClass`/`kickerClass`/`taglineClass` left as one-outlier overrides,
      not pursued further this pass. Component's final input count: 15 (down from roughly 24 before the two
      simplification rounds).

- [x] `app-parallax` clean-up. Executed and **merged into `working`**, [PR #34]
  (https://github.com/krwiles/floofy-site/pull/34) — same Track B/no-direct-push situation as step 6, see the
  housekeeping note above — parity-preserving (Track B), no formal spec. Adds `ParallaxScrollService`
  (`src/app/services/`), mirroring `RevealService`'s own
  shared-registry pattern: one passive `window` scroll listener for the whole app, lazily attached on first
  registration, fanning out to every registered callback. `ParallaxSection` registers/unregisters a callback
  instead of managing its own listener — a page with a hero (2 layers) plus a couple of patterned
  `app-section`s used to run several independent listeners at once. Same rect-based transform math as
  before, unchanged; no visual difference by construction. Verified via unit tests (service + component, TDD)
  plus typecheck/full-suite/build; also a real-browser check via `claude-in-chrome` — jsdom can't fire actual
  `scroll` events, and even a script-driven `window.scrollTo()` didn't trigger one in that harness, so the
  check used a real wheel-scroll instead, confirming multiple parallax layers on one page all update
  correctly and independently from the single shared listener (each layer's observed translate matched its
  own `parallaxStrength` exactly). 4 new service tests, 3 new/changed component tests; full suite 141/141.

  **Owner question, same session, no code change**: whether a more conventional/modern technique exists for the
  parallax effect itself, and whether the Angular MCP had anything useful — asked after this step's work was
  already committed and pushed, mid-`/code-review`. It did: v22's `afterRenderEffect` (via `search_documentation`)
  is the framework-native replacement for hand-rolled scroll+rAF throttling, with explicit
  `earlyRead`/`write`/`mixedReadWrite`/`read` phases specifically to avoid the layout-thrashing this component's
  own read-then-write-in-one-synchronous-tick pattern risks — a plausible contributor to the motion lag noted
  below. Other real options surfaced: plain rAF-batching (smaller, hand-rolled, superseded by the above); Angular
  CDK's `ScrollDispatcher` (does roughly what `ParallaxScrollService` now does, built-in and battle-tested, but
  this repo has no CDK dependency today and already has the `RevealService`-style hand-rolled-shared-service
  convention, so adding CDK for just this would be inconsistent); pure CSS scroll-driven animations
  (`animation-timeline: scroll()`) — no JS listener at all, compositor-driven, immune to main-thread lag by
  construction, broad enough browser support now to be viable, but a full rewrite of the mechanism, not a tweak.
  Owner's call: defer — ship this step as scoped (shared listener only), keep `afterRenderEffect` phases and CSS
  scroll-driven animations on record as the two candidate follow-ups if the motion lag isn't actually resolved by
  the listener consolidation alone.

  **`/code-review` found and fixed 3 real issues, same PR, all in `ParallaxScrollService`**: (1) `notify()`
  looped over every registered callback with no per-callback isolation — before this step, each
  `ParallaxSection` had its own listener, so one throwing didn't affect another; sharing one loop needed that
  same isolation, now a `try`/`catch` per callback. (2) `unregister()` deleted from the callback set but never
  removed the actual DOM listener (nor could it — the listener was an inline anonymous arrow, no reference ever
  kept to remove), so a real `scroll` listener stayed attached forever once anything had ever registered, even
  after every consumer unregistered — now the listener is a stable, stored reference, removed once the set is
  empty and re-attached on the next registration. (3) `started = true` latched one line before the
  `defaultView?.addEventListener(...)` call it was meant to guard, so a null `defaultView` (unreachable today —
  this app has no SSR/prerender target — but a live trap for one) would permanently disable all future
  registration with nothing thrown; now the flag is only set once the listener actually attaches. Fixing (2) also
  resolved an unflagged-but-real test-hygiene gap (4): `hero.spec.ts`/`section.spec.ts` mount real
  `ParallaxSection` trees without mocking the service (no established convention needed one, since `RevealService`
  sidesteps the equivalent problem via `test-setup.ts`'s global `IntersectionObserver` stub, not per-spec mocking)
  — every test's fresh `providedIn: 'root'` instance was attaching a real, unremovable listener to jsdom's shared
  `window`, one per test, for the rest of each file's run; now that `unregister()` actually tears down once empty,
  each test's own `fixture.destroy()` cleans up after itself instead of leaking. 4 more tests (teardown,
  re-attachment, per-callback error isolation, missing-`defaultView` guard); full suite 145/145.

## Phase 5 — Forms and backend access

Settled via `/grill-with-docs` (grilling + domain-modeling), 2026-09-25 — see
[13-phase-5-plan.md](13-phase-5-plan.md) for the full component/service design and
[14](14-phase-5-contact-plan.md)/[15](15-phase-5-reviews-plan.md)/[16](16-phase-5-commission-plan.md) for each
page's own execution plan, merged as [PR #35](https://github.com/krwiles/floofy-site/pull/35) (docs only).

- [x] **Page 1: contact.** Executed and **merged into `working`**, [PR #36]
  (https://github.com/krwiles/floofy-site/pull/36). Builds every shared piece from scratch, since contact needs
  almost all of them on day one:
  `FormFieldGroup` (`app-form-field`, owns label/required-marker/error list, projects the control) and `Control`
  (`appControl`, shared input styling — needs no explicit inputs of its own, reads the sibling `[formField]`
  directive's own `state` signal via `inject(FormField, { self: true })` rather than a redundant second
  binding); `FormStatus` (`app-form-status`, one discriminated-signal source of truth, replacing the old plain
  string signal + `getElementById`/`classList` split); `createFormSubmission()` (a factory returning Signal
  Forms' own `{ action, onInvalid }` shape, fire-and-forget on the returned action matching today's exact
  behavior); `ApiService` (replaces `ContactService`, deleted — normalizes every failure to a plain `{ message }`
  shape once instead of each form's own fallback chain; also adds `getReviews`/`submitReview`/`submitCommission`
  now even though unused until their own PRs, cheaper than three separate edits; URLs moved to
  `src/app/config/api-urls.ts`). `contact.ts`/`contact.html` migrated onto all of it; `console.log`s and the
  `getElementById` status lookup are gone. One deliberate, small addition beyond today's exact pixel output,
  settled across two grilling rounds before this PR: an error-colored border on a field once it's invalid *and*
  touched (today only the error text above it turns red). 31 new tests (TDD throughout); full suite 175/175;
  visual diff against contact's pre-migration render 0.00% at all 3 widths (the error-border only shows on
  invalid+touched fields, which nothing at page load exercises); real-browser check of the actual submit flow
  (error border + status text appear/clear correctly) — stopped short of an actual submission, which would send
  a real message through the live contact Lambda.

  `/code-review` found and fixed 3 real issues: `Control`'s placeholder color was built as a
  `` placeholder:text-on-${tone}-body-subtle `` template literal — Tailwind only generates a utility class it
  finds as a complete literal string somewhere in scanned source, so only whichever tone happened to appear
  verbatim elsewhere (here, `dark`, because it appears literally in a test assertion) got its CSS generated;
  `light` silently rendered with no themed placeholder color at all, no build error, no warning. Verified by
  building and inspecting the compiled CSS before and after the fix. Fixed with a `PLACEHOLDER_CLASS` lookup
  table — the same lesson `hero.ts`'s own `TONE_CLASSES` map already encodes, that should have been applied here
  from the start. `joinClasses` was duplicated verbatim between `hero.ts` and the new `control.ts` — extracted
  to `src/app/utils/join-classes.ts`. `FormFieldGroup` lived in `form-field.ts`/`form-field/`, not matching
  CLAUDE.md's file-naming convention (files named after the class they define) — renamed to
  `form-field-group.ts`/`form-field-group/` (the `app-form-field` selector itself is unchanged). Two findings
  considered, not fixed: `inject(FormField, { self: true })` throws Angular's own generic error if `appControl`
  is ever applied without a sibling `[formField]` — true, but every current and planned usage always pairs
  them, so this is robustness for a misuse scenario that doesn't exist yet; hardcoded English field labels/
  validation/status messages were re-flagged, but this is the same already-tracked, deliberately-deferred
  decision from Phase 5 grilling (Phase 7's checklist), not a new finding.
- [~] **Page 2: reviews.** Executed, [PR #37](https://github.com/krwiles/floofy-site/pull/37) — pending owner
  review. Found a real gap in `15-phase-5-reviews-plan.md` during implementation: it said "no new shared
  components" while also referencing `<app-checkbox-field>`, not noticing contact has no checkbox so nothing had
  built it yet. Reviews is actually the first page with a checkbox to migrate, ahead of commission, so **this PR
  builds `CheckboxField`** (`app-checkbox-field`) — per `16-phase-5-commission-plan.md`'s own "whichever page
  needs it first creates it" note; both plan docs corrected. Renders the checkbox directly (unchanged
  `class="h-4 w-4"`), not via `appControl` (built for text-like controls); derives its own required-asterisk
  from the field's `required` signal, matching `FormFieldGroup`. `reviews.ts`/`reviews.html` migrated onto
  `FormFieldGroup`/`Control`/`CheckboxField`/`FormStatus`/`createFormSubmission()`/`ApiService` (which already
  had `getReviews`/`submitReview` built, unused until now); `ReviewsService` deleted. Kept reviews' one
  page-specific behavior: refreshing the list via `requestReviews()` after a successful post. 18 new tests; full
  suite 188/188; visual diff against reviews' pre-migration render 0.00% at all 3 widths; real-browser check of
  the submit flow — stopped short of an actual submission, which would post a real, public review to the live
  site.

  `/code-review` found and fixed 3 real issues: `reviewForm` was never reset after a successful submission
  (unlike contact's own established pattern), leaving it populated/valid/re-submittable — a double-click could
  silently duplicate-post; the original pre-migration code didn't reset it either, so this is a deliberate small
  fix, not preserved behavior. `RequiredMarker`/`FieldErrorList` extracted — `FormFieldGroup` and `CheckboxField`
  had duplicated this markup verbatim (`RadioGroup`, coming next, would have made it a third copy); both new
  components' hosts use `display: contents`, since Angular custom elements default to `display: inline` and
  without this each host would always occupy a flex-item slot in the `gap`-based row even while rendering
  nothing — re-verified 0.00% visual diff (on both reviews and contact, since `FormFieldGroup` changed) after
  the fix. `CheckboxField`'s hardcoded `gap-2` gave commission's PR no way to keep its existing `gap-1` short of
  forking the component — added a `rowGapClass` input, defaulting to `gap-2`; the decision itself is still
  commission's PR's to raise with the owner. One finding considered, not fixed: the GET error handler went from
  a `console.log` to a true no-op — matches this phase's explicit, roadmap-tracked console.log removal;
  user-visible behavior (silently staying on the loading placeholder) is unchanged, since the original handler
  never updated any UI state either.
- [~] **Page 3: commission**, the last page. Executed, [PR #38](https://github.com/krwiles/floofy-site/pull/38)
  — pending owner review, stacked on PR #37 (see the summary note above). Adds `RadioGroup` (`app-radio-group`,
  Choice's pill-radio-group presentation, sharing `RequiredMarker`/`FieldErrorList` with `FormFieldGroup`/
  `CheckboxField`) and an optional `[labelExtra]` projected slot on both `RadioGroup` and `CheckboxField`, for
  commission's own jump-to-detail "?" buttons. `usageType`'s option labels append a live percent-addon suffix
  for 3 of 5 options, built in TypeScript (`I18nService.t()` + a small percent formatter) rather than template
  pipes, since `RadioGroup`'s options are plain data — verified in a real browser: picking a type updates the
  price display correctly (e.g. illustration $80 × 1.5 promotion addon = $120), and `scrollToForm()` still
  pre-selects the right pill. Migrated the rest onto `FormFieldGroup`/`Control`/`FormStatus`/
  `createFormSubmission()`/`ApiService` (`submitCommission` already built, unused until now); `CommissionService`
  deleted. Moved `totalPriceUsd` onto `PricingService` as `getTotalPriceUsd` (mechanical, 3 new tests). Added a
  `required()` validator for `commissionType`, previously undeclared even though its label always showed a
  required asterisk unconditionally — `RadioGroup` derives that asterisk from the field's own signal now, so
  this keeps the marker showing with no behavioral change (a radio group always has a default value selected,
  so this can never actually fail in practice). `scrollToElement`/focus-highlight left completely untouched,
  out of scope. 19 new tests; full suite 200/200; real-browser check of the submit flow (price updates, pill
  pre-selection, all 5 genuinely-invalidatable fields' errors) — stopped short of an actual submission, which
  would send a real commission request through the live Lambda.

  **Three real, pre-existing discrepancies found and standardized, per the owner's explicit call** (same
  "standardize rather than preserve" direction as Stage 3b/Phase 4's own precedent): `FormFieldGroup`'s label
  row is `gap-2`, commission's fields used `gap-1`; `CheckboxField`'s row is `gap-2`, commission's ToS row used
  `gap-1`; `FormFieldGroup`'s label is `text-sm font-semibold`, commission's own labels were plain
  `font-semibold` (base text size) — this third one found only once the rendered page height came out
  *shorter* than expected after the gap changes, not caught in the initial design pass. Root-caused via
  real-browser landmark-position measurements (confirmed deterministic via two independent captures of the
  unchanged original before trusting it, ruling out capture-timing noise) rather than accepted as an
  unexplained size-mismatch in the scripted visual diff, which can't produce a percentage once page height
  itself changes. All three are small, deliberate, disclosed visual changes on this one page.

  `/code-review` found and fixed 3 minor issues: `CheckboxField`'s `rowGapClass` input turned out genuinely
  dead — no caller ever overrode it, since commission standardized on the default instead of using `gap-1` —
  removed while PR #37 (which introduced it) was still open, rather than left in place. `RequiredMarker`'s and
  `FieldErrorList`'s doc comments still said "and, soon, `RadioGroup`" even though this PR adds `RadioGroup`
  and already wires it in as a consumer of both — updated to reflect that.

  **Phase 5 is now fully executed** (all 3 pages), pending merge of PR #37 and PR #38.
- [~] **Flowbite removal.** Executed, [PR #39](https://github.com/krwiles/floofy-site/pull/39) — pending owner
  review, stacked on PR #38 (which stacks on #37 — see the summary note above; retarget once earlier PRs
  merge). Verified fresh (not just trusting earlier grepping) that no Flowbite-provided class or JS hook
  remains anywhere in `src/app`, including the 3 now-migrated forms — confirmed zero matches for `flowbite`
  imports, `rounded-base`, and every Flowbite JS data-attribute (`data-collapse-toggle`, `data-dropdown`,
  `data-modal`, etc.) across the whole app. Removed all 3 Flowbite lines from `src/styles.css` (`@import
  'flowbite/src/themes/default'`, `@plugin 'flowbite/plugin'`, `@source '../node_modules/flowbite'`);
  uninstalled the `flowbite` package (14 packages removed with its own deps). **No interactive Flowbite JS or
  CSS remains anywhere in the project** — the removal effort that spanned Phase 4 and Phase 5 is complete.
  Bonus find: removing Flowbite's own CSS also silently fixed a "2 rules skipped due to selector errors: Empty
  sub-selector" build warning that had appeared in every build all session — it was coming from Flowbite's own
  stylesheet, not this project's code. CSS bundle dropped from 115 KB to 51 KB. Verified: typecheck, full suite
  200/200, production build clean, visual diff **0.00% across all 8 routes × 3 widths** — confirming the
  earlier grep-based verification was genuinely thorough, not just assumed.

## Phase 6 — Restructure

- [ ] Move pages into `features/`, shared UI into `shared/`, singletons into `core/` (mechanical moves, one commit
      per folder, imports fixed by the build).
- [ ] **Name and organise all image/media assets by type** (owner-requested; details in `03-target-architecture.md`):
      generate a manifest → owner supplies names/alt text → scripted `git mv` + reference rewrite → `ng build`. Decide
      the 3 unreferenced files. Do together with the next item.
- [ ] Extract `gallery.json`; derive home carousel, commission carousels and gallery page from it; real alt text.
- [ ] Split `commission.html` into pricing card ×3, terms card ×7, form, usage picker.
- [ ] Lightbox + gallery grid (a11y, focus trap, keyboard, `ScrollLockService`, invisible defer placeholder).
- [ ] Twitch embed + `ScriptLoader`; `StreamScheduleService` with tests; lazy Twitter widgets.

## Phase 7 — i18n completion and polish

- [ ] Move all remaining hardcoded English into the locale JSON; key-parity test. **Known from Phase 5 grilling
      (2026-09-25), don't miss on the sweep:** every validation message (`'Name is required.'`, etc.) and every
      status message (`'Submitting review...'`, success/error text) across all 3 forms (contact, reviews,
      commission) is hardcoded English in the component TS, not translated — deliberately deferred out of Phase
      5's scope (structure/duplication only), same precedent as `reviews.html`'s hardcoded section-header text.
- [ ] Lazy-load locales; make `t()` signal-friendly; safe storage.
- [ ] Per-route titles/meta; verify direct-URL loads (`/gallery`) on the real hosts.
- [ ] AXE pass on every page; fix contrast/ARIA findings.
- [ ] UI polish pass with the owner (spacing scale, type scale, motion tuning).
- [ ] Image optimisation (WebP/AVIF, `srcset`), budgets review.

## Phase 8 — Backend hygiene (independent, can run any time)

- [ ] Stop tracking vendored Lambda dependencies; add `requirements.txt` + build script + `.gitignore` entries
      (**⏸** owner decision on history rewrite — default: no rewrite).
- [ ] Document how each Lambda is deployed and its env vars (no secrets in the repo).

---

## Open ideas / future work

Found during Stage 3b planning (2026-09-22), deliberately excluded from that stage's scope — not lost track of,
just not this stage's job. Move these into a dedicated `backlog.md` once the whole refactor finishes.

1. **Streaming page pass** — `streaming.html`/`.css` (including `.stream-cta`) is a known formatting/consistency
   outlier; not touched or used as a pattern reference anywhere in Phase 3. Owner may redesign it directly with
   the finished primitives once they exist, or it becomes its own future phase.
2. **Navbar button styling** — the login/menu-toggle buttons share most of `appButton`'s classes but add
   `border border-border` and a fixed `h-10` size; too few instances (2) to justify a variant in Stage 3b. Revisit
   once there's a second real consumer of nav-specific button styling.
3. ~~Forms should get tone options~~ — **resolved in Phase 5 planning**: `app-form-field`/`appControl` take a
   `tone` input defaulting to `'middle'` (the only value in use today), matching the Card/Button pattern — see
   [13-phase-5-plan.md](13-phase-5-plan.md).
4. **`httpResource` for reviews' GET** — raised during Phase 5 grilling (2026-09-25); owner deferred adopting it
   for `reviews.ts`'s read (manual `.subscribe()` fits today's pattern more directly, since it also needs manual
   re-triggering after a successful post), but asked to keep it flagged as worth investigating separately later,
   independent of Phase 5's `ApiService` work.
5. **Move `GalleryImageService`'s hardcoded image arrays into a JSON file** — raised by the owner during Phase 5
   planning (2026-09-25), unrelated to forms; `galleryImages`/`emoteImages`/`chibiImages`/`illustrationImages`
   are currently hardcoded TS array literals on the service class, unlike `PricingService`, which already reads
   from `assets/data/pricing.json`. Worth the same treatment, as its own small future piece of work.

## Open decisions for the owner

1. ~~Card system shape~~ — **resolved in Stage 3b planning**: `[appCard]` directive, not a component or plain
   classes — see [10-phase-3b-plan.md](10-phase-3b-plan.md).
2. **Hero text API** — pass translated strings as inputs (proposed) vs pass an i18n key prefix
   (`heroKey="donate.hero"`), which is shorter but couples the component to the i18n key layout.
3. **i18n approach** — keep custom (lazy-loaded, signal-friendly; proposed) vs a library.
4. **Flowbite removal** — confirm removing entirely (proposed) rather than keeping the CSS theme/plugin.
5. **Folder layout** — `features/ shared/ core/` (proposed) vs staying flat.
6. ~~Visual regression tooling~~ — **resolved in Phase 0**: local Playwright capture + pixelmatch diff, numbers only.
7. **Deployment targets** — GitHub Pages only, or also Vercel / custom domain? (drives Twitch `parent`, base-href and
   404 fallback handling.)
8. ~~Fonts~~ — **resolved in Phase 2 planning**: keep Google Fonts (link tags), not self-hosting.
9. **Lambda vendored deps** — stop tracking going forward only, or rewrite history?
10. ~~Branching~~ — **resolved**: one branch per phase off `working`, small commits, PR vs. direct-merge decided
    per-phase by whether the visual diff comes back clean.

## Risks

| Risk                                        | Mitigation                                                                           |
| ------------------------------------------- | ------------------------------------------------------------------------------------ |
| Visual drift while consolidating styles     | screenshot baseline per phase; move markup without changing classes first, then tidy |
| Angular 22 breaking changes in Signal Forms | upgrade in isolation (Phase 1) with the three forms manually exercised               |
| Node / TypeScript peer conflicts            | Node ≥ 24.15, TS pinned `~6.0`, Vitest 4 (documented in 04)                          |
| Hidden Flowbite CSS dependency              | staged removal (JS first, CSS last), built-CSS diff                                  |
| Large mechanical moves break imports        | one folder per commit; the compiler finds every break                                |
| Refactor stalls on unfinished card design   | primitives that don't depend on cards go first                                       |

## Definition of done

- `ng build` (prod) and `ng test` green; AXE clean on every page; no `any`, no `console.log`, no
  `document.getElementById`/`classList` in components, no `@HostListener`/`@HostBinding`.
- No page template longer than ~150 lines; no repeated 3+ line markup block that isn't a component.
- No Flowbite dependency; Angular 22.x; Tailwind 4.3.x; TypeScript 6.0.x; Node pinned in `engines` and CI.
- All copy comes from the locale files; key parity test passes.
- `docs/refactor/` updated to reflect what was actually built.
