# Floofy Site — Refactor Planning

Planning documents for restructuring the site for readability, consistency and ease of development.
**Status: planning only. No application code has been changed.** Written 2026-09-21 on branch `working`.
Card styles (`src/styles/components/cards.css`) are finished and committed. **Phase 0 and Phase 1 (Angular 22
upgrade) are both done**, merged into `working` (Phase 1 via
[PR #20](https://github.com/krwiles/floofy-site/pull/20)). Next up is Phase 2 (design foundations / style layering).

## Goals (from the owner)

1. The site is feature complete. Priority is **refactoring**, not new features.
2. Turn the many repeated UI patterns into shared components for consistency and easier development.
3. Restructure the project so it is easy to navigate and read.
4. Upgrade to **Angular 22** and the newest Tailwind. Consider **removing Flowbite** and writing our own small pieces.
5. Polish the front-end UI (the owner is currently designing the shared **card styles** in `src/styles/components/cards.css`).

## Documents

| File | Contents |
| --- | --- |
| [01-findings.md](01-findings.md) | Audit of the current codebase: architecture, duplication counts, bugs, smells |
| [02-component-inventory.md](02-component-inventory.md) | Proposed shared components / directives / services, with intended APIs |
| [03-target-architecture.md](03-target-architecture.md) | Target folder layout, styling layers, data, i18n, forms, testing conventions |
| [04-upgrade-plan.md](04-upgrade-plan.md) | Angular 22 / TypeScript / Node / Tailwind upgrade and the Flowbite removal analysis |
| [05-roadmap.md](05-roadmap.md) | Phased, checkable work plan, risks, and open decisions |
| [06-phase-0-plan.md](06-phase-0-plan.md) | Concrete, commit-by-commit execution plan for Phase 0 (baseline) — done, merged |
| [07-phase-1-plan.md](07-phase-1-plan.md) | Execution plan for Phase 1 (Angular 22 upgrade) — done, merged via [PR #20](https://github.com/krwiles/floofy-site/pull/20) |

## Ground rules while this is in progress

- **Do not modify code until the owner says so.** The owner is finishing the card styles first so the design
  direction can be seen before components are built around it.
- Work on a new branch cut from `main` (or from `working` once the WIP is committed), never directly on `main`.
- Every phase must leave `ng build` green. Behaviour and appearance must not change unless the phase says so.
- Follow the Angular best-practices guide (`get_best_practices` in the angular-cli MCP): standalone (do not write
  `standalone: true`), signals, `input()`/`output()`, `OnPush`, `host: {}` instead of `@HostBinding`/`@HostListener`,
  native control flow, `class`/`style` bindings instead of `ngClass`/`ngStyle`, `NgOptimizedImage` for static images,
  reactive/signal forms, `inject()`. Must pass AXE and WCAG AA.
- Match existing repo conventions: files named `home.ts` / `home.html` (no `.component` suffix), `app-` selector
  prefix, Prettier (`printWidth` 120, single quotes, Tailwind class sorting plugin).
