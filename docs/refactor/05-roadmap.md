# 05 — Roadmap

Status legend: `[ ]` todo · `[~]` in progress · `[x]` done · **⏸ blocked** = waiting on the owner.
Status as of 2026-09-23: Phases 0–2 done and merged into `working`. Phase 3 Stages 3a, 3b done and merged into
`working` (PR #21, PR #23). Stage 3c executed on `refactor/phase-3c-data-consolidation`, PR open pending owner
review/merge (real diff on `donate` per decision #2 means it ships as a PR, not a direct merge). Phases 4–8 not
started.

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
blocker is resolved (finished, see Phase 0) but its *application* across the site is also Phase 3 work, not this
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
      `rounded-2xl`, 47 usages) — no custom radius token needed. `rounded-sm`/`rounded-lg` were *also* silently
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
      the actual box geometry by hand: a `::before` with `inset:0` resolves against the parent's *padding*
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
       losses, not part of the plan's decision #2 (which standardizes chip *sizing* onto about/contact's, not
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

- [ ] `app-hero`; migrate pages one by one (donate → gallery → reviews → contact → streaming → about → commission → home).
- [ ] Own `app-carousel`; remove `initCarousels()`; remove static id; migrate home + commission.
- [ ] Navbar disclosure + `app-language-toggle`; remove `initFlowbite()` and `data-collapse-toggle`.
- [ ] `app-parallax` clean-up (single scroll source, reduced motion, tests).

## Phase 5 — Forms and backend access

- [ ] `app-form-field`, `appControl`, `app-choice`, `app-form-status`, `FormSubmission` helper.
- [ ] `ApiService` + config for the three Lambda URLs; slim the services; consider `httpResource` for reviews.
- [ ] Migrate contact → reviews → commission forms; remove `console.log`s and `getElementById`.
- [ ] Verify Flowbite form-style dependency; **then** remove the Flowbite theme/plugin/`@source` CSS and uninstall
      `flowbite`.
- [ ] Move `totalPriceUsd` into `PricingService`.

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

- [ ] Move all remaining hardcoded English into the locale JSON; key-parity test.
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
3. **Forms should get tone options** — Phase 5's `app-form-field`/`appControl`/etc. should offer `light`/`middle`/
   `dark` tone options, matching the Card/Button pattern established in Stage 3b, so a form embedded on any
   section reads correctly.

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

| Risk | Mitigation |
| --- | --- |
| Visual drift while consolidating styles | screenshot baseline per phase; move markup without changing classes first, then tidy |
| Angular 22 breaking changes in Signal Forms | upgrade in isolation (Phase 1) with the three forms manually exercised |
| Node / TypeScript peer conflicts | Node ≥ 24.15, TS pinned `~6.0`, Vitest 4 (documented in 04) |
| Hidden Flowbite CSS dependency | staged removal (JS first, CSS last), built-CSS diff |
| Large mechanical moves break imports | one folder per commit; the compiler finds every break |
| Refactor stalls on unfinished card design | primitives that don't depend on cards go first |

## Definition of done

- `ng build` (prod) and `ng test` green; AXE clean on every page; no `any`, no `console.log`, no
  `document.getElementById`/`classList` in components, no `@HostListener`/`@HostBinding`.
- No page template longer than ~150 lines; no repeated 3+ line markup block that isn't a component.
- No Flowbite dependency; Angular 22.x; Tailwind 4.3.x; TypeScript 6.0.x; Node pinned in `engines` and CI.
- All copy comes from the locale files; key parity test passes.
- `docs/refactor/` updated to reflect what was actually built.
