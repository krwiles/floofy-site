# 05 — Roadmap

Status legend: `[ ]` todo · `[~]` in progress · `[x]` done · **⏸ blocked** = waiting on the owner.
Nothing below has been started (planning only, 2026-09-21).

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

## Phase 1 — Angular 22 upgrade

Concrete, ready-to-execute plan: **[07-phase-1-plan.md](07-phase-1-plan.md)** (settled 2026-09-22 via
`superpowers:brainstorming`). Unlike Phase 0, this phase merges via a PR the owner reviews, not a direct merge —
it's the first phase that changes real runtime behavior rather than just test infrastructure. Key facts locked in:
TypeScript pinned to `~6.0.3` (not `latest`, which is `7.0.2` and outside `@angular/compiler-cli`'s peer range),
Tailwind pinned to `4.3.x` (already resolved on disk from Phase 0's `npm install`, now made intentional), Vitest
stays on `4.x`. `Gallery` gets an explicit smoke test since Angular 22 makes `OnPush` the default and it's the one
component that doesn't set it explicitly. Form verification is validation-only — no real submission, since that
would hit production Lambda URLs (real emails via Resend, real review rows in the live database).

**Found during execution, not in the original plan**: fixing `App`'s router-provider issue let `App`'s lifecycle run
for the first time in a test, which exposed that `ngAfterViewInit` → `observerInit()` calls
`new IntersectionObserver(...)`, undefined in jsdom — an unhandled exception that made `ng test` exit 1 even though
all tests "passed". Fixed with a `vi.stubGlobal('IntersectionObserver', …)` shim scoped to `app.spec.ts`
(`beforeAll`, not `beforeEach`/`afterEach` — a per-test stub raced the deferred `setTimeout` and didn't work). Zero
change to `App`'s real behavior. The underlying scroll-reveal design (`App.observerInit`) is unchanged and is still
slated for replacement by `appReveal`/`RevealService` in Phase 3.

## Phase 1 — Upgrade (see `04-upgrade-plan.md`)

- [ ] Read the Angular 22 update guide / `ng update` output.
- [ ] `ng update` to 22.1.x; pin `typescript ~6.0`; keep Vitest 4; add `engines`; pin CI Node.
- [ ] Fix compile/test regressions; verify Signal Forms API on 22.
- [ ] Tailwind 4.2.2 → 4.3.x; verify Prettier plugin and visual baseline.
- [ ] Verify production and GitHub Pages builds.

## Phase 2 — Design foundations

- [ ] Split `styles.css` into `tokens.css`, `base.css`, `utilities/`, `components/` (see architecture).
- [ ] Add missing tokens: `--radius-base`, shadow scale, z-index scale, hero background colours, section padding scale.
- [ ] Replace raw hex/rgba (`bg-[#…]`, `streaming.css`) with tokens.
- [ ] Remove `tailwind.config.js`; fix the two "empty sub-selector" CSS warnings.
- [ ] Fonts: move out of the CSS `@import` (decision needed: Google Fonts link vs self-host).
- [ ] **⏸** Finalise card/glass system with the owner; document the variants in this folder.

## Phase 3 — Primitives (no page visibly changes)

- [ ] `appReveal` directive + `RevealService`; delete `App.observerInit`; replace `.animate-on-scroll` usages
      (mechanical) and the `Reviews → App` dependency.
- [ ] `app-flourish`, `app-section-divider`.
- [ ] `app-section-header`.
- [ ] `app-section` (tone/pattern/width/padding).
- [ ] `app-card` / `appCard` **⏸ after card styles**.
- [ ] `appButton` (consolidate 3 implementations).
- [ ] `app-social-links` + `SOCIALS` data; use in footer/about/contact/donate.
- [ ] `app-brand`.
- [ ] Unit tests for each.

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

## Open decisions for the owner

1. **Card system shape** — `app-card` component vs `[appCard]` directive vs plain CSS classes (after seeing final styles).
2. **Hero text API** — pass translated strings as inputs (proposed) vs pass an i18n key prefix
   (`heroKey="donate.hero"`), which is shorter but couples the component to the i18n key layout.
3. **i18n approach** — keep custom (lazy-loaded, signal-friendly; proposed) vs a library.
4. **Flowbite removal** — confirm removing entirely (proposed) rather than keeping the CSS theme/plugin.
5. **Folder layout** — `features/ shared/ core/` (proposed) vs staying flat.
6. **Visual regression tooling** — must keep the art out of Claude's view (owner request). Options: local Playwright
   capture + pixel-diff that reports only numbers (adds dev dependencies), or headless Chrome CLI screenshots + a
   small diff script, or the owner eyeballs before/after themselves. The Claude-in-Chrome tool is fine for non-visual
   checks (DOM, console, network, computed styles) but its screenshots are returned to Claude, so not for art pages.
7. **Deployment targets** — GitHub Pages only, or also Vercel / custom domain? (drives Twitch `parent`, base-href and
   404 fallback handling.)
8. **Fonts** — keep Google Fonts (link tags) or self-host.
9. **Lambda vendored deps** — stop tracking going forward only, or rewrite history?
10. **Branching** — refactor branch name and whether to work from `working` or a fresh branch off `main`.

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
