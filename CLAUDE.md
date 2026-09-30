# CLAUDE.md

Guidance for Claude Code (and other agents) working in this repository.

## Commands

Requires Node `^22.22.3 || ^24.15.0 || >=26.0.0` (the Angular CLI's own floor) — run `nvm use` to pick up `.nvmrc`.

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

## Working rules

- **Never view the site's artwork.** The owner is an illustrator, the images are all rights reserved
  (`LICENSE-media.md`, `noai` meta tags), and they'd rather their art not be sent to an AI provider at all. Never
  read an image file, and never screenshot a page that renders art. Verify visual changes with file metadata, DOM
  and computed styles, and the numeric diffs from `npm run baseline:capture` / `baseline:diff`, which report only
  percentages. Leave screenshots on disk for the owner to look at.
- **Zoneless tests:** there's no `zone.js`, so in a spec with a wrapping host component, changing a plain host
  property _after_ the first `fixture.detectChanges()` is silently never seen by the child's inputs. Set every
  per-test value before the first `detectChanges()` (e.g. `Object.assign(fixture.componentInstance, overrides)`).
- **Never stack PRs:** every branch comes straight off `working` and PRs straight back into it.

## Comments

- Every distinct logical step in a function gets a short comment above it — not just the steps that seem
  non-trivial. Skimming just the comments should show the whole shape of the function, top to bottom, without
  reading the code itself.
- A comment states what the block accomplishes and, where it's not obvious, why — not the mechanics already
  visible in the line(s) below it.
- Keep it to one line. A second line is fine only when a real nuance would otherwise be lost — if a comment is
  stretching to three-plus lines, cut it down rather than explaining more. Skimmable in a second, not a paragraph
  to read. (Docstrings/JSDoc can run longer.)
- A decision documented elsewhere (`docs/refactor/*`, an ADR) gets a pointer next to the code, not a second copy
  of the reasoning — name the decision and cite the doc, don't restate it.
- A call whose name or return value isn't obvious from how it's used gets a brief note on what it actually does
  and returns.
- Comment at the block level, not line-by-line: one comment per logical step, not a separate comment for every
  line inside a multi-line block.
- Applies to test files exactly the same as source files.

**Enforced by a Claude Code `PostToolUse` hook** (`scripts/check_comment_length.py`, run via `.claude/settings.json`
on every `Write`/`Edit`) that warns — advisory, doesn't block the edit — when a `//` comment block in a `.ts`/`.tsx`
file runs over 2 lines. Ported from `ticker-news-analysis`'s own copy of this rule. This only affects new comments
going forward: this codebase already has several long, historical rationale comments (e.g. `hero.ts`) predating
the rule — they aren't retroactive violations to fix opportunistically, just don't add
more like them.

## This repo is mid-refactor

See `docs/refactor/` for the full audit, target architecture, upgrade plan and phased roadmap.
Check `docs/refactor/05-roadmap.md` for the current phase before starting new work.
