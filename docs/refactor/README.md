# Floofy Site — Refactor Planning

Planning documents for restructuring the site for readability, consistency and ease of development.
**Status: planning only. No application code has been changed.** Written 2026-09-21 on branch `working`.
Card styles (`src/styles/components/cards.css`) are finished and committed. **Phases 0, 1 (Angular 22 upgrade) and
2 (design foundations) are all done**, merged into `working` (Phase 1 via
[PR #20](https://github.com/krwiles/floofy-site/pull/20); Phase 2 direct-merged, clean visual diff and code review).
Phase 3 (primitives) has a concrete plan for its first sub-phase (3a) — awaiting the owner's go-ahead to execute.
The backend CORS fix and buying a real domain are explicitly deferred by the owner — frontend only for now.

**A real, live bug was found during Phase 2, unrelated to it**: the reviews and contact Lambdas' CORS allow-list is
hardcoded to `http://localhost:4200` only — the actual production site can't fetch reviews or submit the contact
form. See `05-roadmap.md`'s Phase 2 section for detail. Not fixed (backend, out of scope for this frontend
refactor) — flagged for the owner to prioritize.

A project domain glossary lives at `/CONTEXT.md` (repo root, not under `docs/refactor/`) — vocabulary for the
design system (Tone, Card, Glass Panel, Hero color, …), kept up to date as terms get sharpened during planning.

## Goals (from the owner)

1. The site is feature complete. Priority is **refactoring**, not new features.
2. Turn the many repeated UI patterns into shared components for consistency and easier development.
3. Restructure the project so it is easy to navigate and read.
4. Upgrade to **Angular 22** and the newest Tailwind. Consider **removing Flowbite** and writing our own small pieces.
5. Polish the front-end UI (the owner is currently designing the shared **card styles** in `src/styles/components/cards.css`).

## Documents

| File                                                           | Contents                                                                                                                    |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| [01-findings.md](01-findings.md)                               | Audit of the current codebase: architecture, duplication counts, bugs, smells                                               |
| [02-component-inventory.md](02-component-inventory.md)         | Proposed shared components / directives / services, with intended APIs                                                      |
| [03-target-architecture.md](03-target-architecture.md)         | Target folder layout, styling layers, data, i18n, forms, testing conventions                                                |
| [04-upgrade-plan.md](04-upgrade-plan.md)                       | Angular 22 / TypeScript / Node / Tailwind upgrade and the Flowbite removal analysis                                         |
| [05-roadmap.md](05-roadmap.md)                                 | Phased, checkable work plan, risks, and open decisions                                                                      |
| [06-phase-0-plan.md](06-phase-0-plan.md)                       | Concrete, commit-by-commit execution plan for Phase 0 (baseline) — done, merged                                             |
| [07-phase-1-plan.md](07-phase-1-plan.md)                       | Execution plan for Phase 1 (Angular 22 upgrade) — done, merged via [PR #20](https://github.com/krwiles/floofy-site/pull/20) |
| [08-phase-2-plan.md](08-phase-2-plan.md)                       | Execution plan for Phase 2 (design foundations / style layering) — done, merged                                             |
| [09-phase-3-plan.md](09-phase-3-plan.md)                       | Concrete plan for Phase 3 stage 3a (primitives: motion & structure), ready to run; 3b/3c settled but detailed later         |
| [10-phase-3b-plan.md](10-phase-3b-plan.md)                     | Execution plan for Phase 3 stage 3b (surfaces & controls: Card, Button) — done, merged                                      |
| [11-phase-3c-plan.md](11-phase-3c-plan.md)                     | Execution plan for Phase 3 stage 3c (Social link, Brand) — done, merged                                                     |
| [12-phase-4-plan.md](12-phase-4-plan.md)                       | Execution plan for Phase 4 (Hero and Flowbite JS removal) — done, merged                                                    |
| [13-phase-5-plan.md](13-phase-5-plan.md)                       | Component/service design and sequencing for Phase 5 (forms and backend access)                                              |
| [14-phase-5-contact-plan.md](14-phase-5-contact-plan.md)       | Phase 5 execution plan, page 1: contact (builds every shared piece)                                                         |
| [15-phase-5-reviews-plan.md](15-phase-5-reviews-plan.md)       | Phase 5 execution plan, page 2: reviews                                                                                     |
| [16-phase-5-commission-plan.md](16-phase-5-commission-plan.md) | Phase 5 execution plan, page 3: commission (adds the Choice components)                                                     |

## Ground rules while this is in progress

- **Do not modify code until the owner says so.** The owner is finishing the card styles first so the design
  direction can be seen before components are built around it.
- Work on a new branch cut from `main` (or from `working` once the WIP is committed), never directly on `main`.
- Every phase must leave `ng build` green. Behaviour and appearance must not change unless the phase says so.
- Follow the Angular best-practices guide (`get_best_practices` in the angular-cli MCP — re-check it per phase, it
  changed with the v22 upgrade): standalone (do not write `standalone: true`), signals, `input()`/`output()`,
  `host: {}` instead of `@HostBinding`/`@HostListener`, native control flow, `class`/`style` bindings instead of
  `ngClass`/`ngStyle`, `NgOptimizedImage` for static images, reactive/Signal Forms, `inject()`. On Angular 22+, do
  **not** set `changeDetection: ChangeDetectionStrategy.OnPush` explicitly — it's the default now (existing
  explicit `OnPush` elsewhere in the codebase is harmless leftover, not a bug, cleanup deferred to whichever phase
  next touches each component). Must pass AXE and WCAG AA.
- Match existing repo conventions: files named `home.ts` / `home.html` (no `.component` suffix), `app-` selector
  prefix, Prettier (`printWidth` 120, single quotes, Tailwind class sorting plugin).
