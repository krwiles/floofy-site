# CLAUDE.md

Guidance for Claude Code (and other agents) working in this repository.

## Commands

- `npm start` — dev server (`ng serve --hmr=false --live-reload=true`)
- `npm run build` — production build
- `npm test` — unit tests (Vitest via `@angular/build:unit-test`)
- `npm run format` / `npm run format:check` — Prettier (with the Tailwind class-sorting plugin)

## Conventions

- Files are named after the class, not the Angular type: `home.ts` / `home.html` / `home.css` (no `.component` suffix).
- Standalone components (no `standalone: true` — it's the v20+ default), `OnPush`, `input()`/`output()`, signals for
  state, `inject()` over constructor injection, native control flow (`@if`/`@for`), `class`/`style` bindings instead
  of `ngClass`/`ngStyle`, `host: {}` instead of `@HostBinding`/`@HostListener`.
- Selector prefix: `app-`.
- User-facing strings come from `src/assets/i18n/{en,ja}.json` via `I18nService` / `TranslatePipe` — don't hardcode
  English text in templates.

## This repo is mid-refactor

See `docs/refactor/` for the full audit, target architecture, upgrade plan and phased roadmap.
Check `docs/refactor/05-roadmap.md` for the current phase before starting new work.
