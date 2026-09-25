# 12 — Phase 4 plan: Hero and Flowbite JS removal

Settled via `grill-with-docs` (grilling + domain-modeling), 2026-09-23. Component specs live in
[`specs/`](specs/) — this document is the sequencing/execution plan built on top of them; see each spec for what
each piece actually does.

## What's in this phase

Two tracks, different rules:

**Track A — genuinely Flowbite-driven, from-scratch, no parity goal, always a PR.** Each has a written spec:

1. [Image asset model](specs/image-asset-model.md) — prerequisite data-shape consolidation, not Flowbite-related
   itself, but blocks both carousels below.
2. [Rolling carousel](specs/app-rolling-carousel.md) — home page's continuous image strip.
3. [Slideshow carousel](specs/app-slideshow-carousel.md) — commission page's 3 pricing-card carousels.
4. [Language toggle](specs/app-language-toggle.md) — extraction only; not actually Flowbite-driven, but grouped
   here because it shares a file with the piece that is.
5. [Mobile navigation menu](specs/navbar-disclosure.md) — the real Flowbite-JS removal (`initFlowbite()`,
   `data-collapse-toggle`).

**Track B — parity-preserving mechanical work, no formal spec (lighter ceremony, agreed earlier in planning):**

6. **`app-hero`** — consolidate the 8 near-identical page hero blocks into one component. Keeps today's visual
   output exactly. Text stays i18n-agnostic (translated strings in, not an i18n key prefix). Needs a `heroTitle`
   content slot (home's two-line name) and a `heroActions` slot (streaming's CTA row — the owner hasn't decided
   whether that row expands to other pages or disappears, so the slot must not assume either future).
7. **`app-parallax` clean-up** — replace each `<app-parallax-section>` instance's own independent scroll listener
   with one shared scroll service, all instances subscribing to it instead. Keeps today's visual output exactly.
   Noted for later, not part of this pass: if the shared-listener change doesn't fully resolve the slight lag the
   owner's noticed in the parallax motion, revisit the underlying technique itself, not just how many listeners
   there are.

## Sequencing and dependencies

Order matters here for two reasons: real data dependencies (the image model), and avoiding repeated churn on the
same page files across multiple branches.

1. **Image asset model** first — both carousels need the final shape before they're built.
2. **Rolling carousel** — touches `home.html` and the shared image data only.
3. **Slideshow carousel** — touches `commission.html` and the shared image data only.
4. **Language toggle** — touches `navbar.html`/`navbar.ts` only.
5. **Mobile navigation menu** — also touches `navbar.html`/`navbar.ts`/`navbar.css`; done right after the language
   toggle (not in parallel with it) since they share the same files.
6. **`app-hero`** — touches all 8 page templates, including `home.html` and `commission.html`. Doing this after
   steps 2–5 means it lands on top of the already-updated versions of those two files, rather than fighting
   concurrent edits to the same lines.
7. **`app-parallax` clean-up** — self-contained to the parallax component and its new scroll service; doesn't
   block or get blocked by anything else. Done last mainly because every page's hero markup will have just been
   touched by step 6, so it's cleaner to let that settle first.

Each step is its own branch off `working`, its own PR (or, for steps 6–7, a direct merge if the visual diff comes
back clean — same diff-decides-merge rule the rest of this refactor has used, since those two are the
parity-preserving track). Steps 2–5 are real, intentional visual/behavioral changes by design, so diff-decides-
merge does not apply to them — they're always a PR, per the owner's standing direction for the Flowbite pieces.

## `app-hero` migration order

Per the existing roadmap note: donate → gallery → reviews → contact → streaming → about → commission → home.
Simpler, more uniform pages first to prove out the base shape (and the `heroTitle`/`heroActions` slots) before
hitting the two real exceptions — streaming's fully custom hero and home's two-line name — later in the run.

## Verification, per step

Same process this refactor has used throughout: TDD where the piece is new (steps 1–5), tests-first; typecheck
and unit tests run regularly, full suite once at the end of each step; `/code-review` once per step, findings
verified before fixing; visual-diff capture/compare against the pre-step baseline; real-browser check for
anything jsdom can't exercise (touch gestures, real transition timing, real scroll behavior) — this project's
motion work has repeatedly shipped bugs that only a real browser catches.

## Definition of done for this phase

- `ng build`/`ng test` green throughout; no `flowbite` import remains anywhere in the app's TypeScript once steps
  2–5 are all merged (its CSS theme/plugin stays until Phase 5, per `05-roadmap.md`).
- All 8 pages use `app-hero`; the 8 hand-copied hero blocks are gone.
- `home.html`'s and `commission.html`'s carousels are the new rolling/slideshow components; `carousel.ts` (the
  old Flowbite-wrapped one) is deleted.
- Navbar's mobile menu works without Flowbite; the language toggle is its own component.
- `docs/refactor/05-roadmap.md` and memory updated to reflect what actually shipped, same as every prior phase.
