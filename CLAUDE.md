# CLAUDE.md

Guidance for Claude Code (and other agents) working in this repository.

## Commands

Requires Node `^22.22.3 || ^24.15.0 || >=26.0.0` (the Angular CLI's own floor) — run `nvm use` to pick up `.nvmrc`.

- `npm start` — dev server (`ng serve --hmr=false --live-reload=true`)
- `npm run build` — production build
- `npm test` — unit tests (Vitest via `@angular/build:unit-test`)
- `npm run format` / `npm run format:check` — Prettier (with the Tailwind class-sorting plugin)
- Lambdas (`aws_lambda/`):
  - `.venv/bin/pytest`: the Lambda tests, with fakes and no network (see the README for the one-time venv setup).
  - `./build.sh <lambda> x86_64 3.14`: build an upload zip; the AWS runtime is Python 3.14 on x86_64.
  - Dependencies: edit `<lambda>/requirements.in`, then recompile the hashed `requirements.txt` (command in the README).

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
- **Work in batches:** a goal's tasks go to parallel subagents, merged into one `batch/<goal>` branch off `main`
  that PRs into `main`. Run it with the `batch` skill (`.claude/skills/batch/SKILL.md`).

## Comments and review

Comment every logical step in one line; the full rules, and what the two-axis review checks, are in
`CODING_STANDARDS.md`. The comment-length check warns after every edit and fails CI.

## This repo is mid-refactor

See `docs/refactor/` for the full audit, target architecture, upgrade plan and phased roadmap.
Before planning a new batch, check the status block at the top of `docs/refactor/05-roadmap.md`. A subagent working
one task reads only its task section of the batch plan.
