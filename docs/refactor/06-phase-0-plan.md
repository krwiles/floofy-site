# 06 — Phase 0 execution plan (baseline)

Concrete, ready-to-execute version of `05-roadmap.md` → Phase 0, settled 2026-09-21 via `/grilling`
(`mattpocock-skills:grilling`). **This document is a plan. Nothing in it has been executed. No source, test, or
config file has been changed.** Execution starts only when the owner says go.

## Decisions locked in this round

| # | Decision | Answer |
| --- | --- | --- |
| 1 | Base branch | `working` (contains all of `main` + 96 more commits) |
| 2 | Branch name | `refactor/phase-0-baseline` |
| 3 | Commit granularity | One commit per concern (12 commits, see below) |
| 4 | Merge | Straight into `working` once `ng build` + `ng test` are green — no PR |
| 5 | Router fix pattern | `provideRouter(routes)` (real routes) in each spec's providers — per the official Angular testing guide ("do not mock the Router; provide real route configurations"). No `RouterTestingHarness` — these are smoke tests, not navigation tests |
| 6 | `App` "should render title" | Replace: assert `app-navbar` + `app-footer` render, not a nonexistent `<h1>` |
| 7 | Carousel / ParallaxSection specs | Minimal fix only (`setInput`); no new assertions — both get rewritten in Phase 3/4 |
| 8 | `I18nService` spec | The test picked a bad key (`nav.about` is an object, not a string) — fix the test, not the service. Swap to `footer.legal.backToTop` (verified: `"Back to top"` / `"上へ戻る"`) |
| 9 | `.gitattributes` scope | General rule only: `* text=auto eol=lf`. No per-extension binary list (paths are about to move; Git's binary detection already works) |
| 10 | Renormalize now | Yes — `git add --renormalize .` in the same commit |
| 11 | `CLAUDE.md` depth | Short: commands, naming convention, pointer to `docs/refactor/` |
| 12 | Visual baseline tooling | Scripted (Playwright), English only, 8 routes × 3 widths = 24 captures. Claude only ever sees file paths/sizes and diff percentages — never the images (see [[feedback-art-privacy]]) |
| 13 | Phase 0 review | Direct merge, no PR |

## Commit plan (in order)

1. `chore: add .gitattributes and renormalize line endings`
2. `fix(about): remove unused RouterLink import`
3. `test(app): provide router and replace stale title assertion`
4. `test(navbar): provide router context for should-create spec`
5. `test(footer): provide router context for should-create spec`
6. `test(home): provide router context for should-create spec`
7. `test(carousel): set required images input in spec`
8. `test(parallax-section): set required backgroundImage input in spec`
9. `test(i18n): fix translation key assertions to use a real flat key`
10. `docs: add CLAUDE.md`
11. `chore: add visual baseline capture/diff scripts`
12. `chore: capture Phase 0 visual baseline (english, 8 routes × 3 widths)`

Each commit leaves `ng build` compiling; `ng test` is expected red until commit 9 lands, then green through 12.

---

## Commit 1 — `.gitattributes` + renormalize

Create `.gitattributes`:

```
* text=auto eol=lf
```

Then `git add --renormalize .` to convert existing CRLF files (currently `contact.html`) in the same commit.

## Commit 2 — remove unused `RouterLink` import

`src/app/about/about.ts`: drop `RouterLink` from the `imports` array and its import statement (kills build warning
`NG8113`). No template change — `about.html` doesn't use `routerLink`.

## Commit 3 — `app.spec.ts`

```ts
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the navbar and footer', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-navbar')).toBeTruthy();
    expect(compiled.querySelector('app-footer')).toBeTruthy();
  });
});
```

## Commit 4 — `navbar.spec.ts`

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Navbar } from './navbar';
import { routes } from '../../app.routes';

describe('Navbar', () => {
  let component: Navbar;
  let fixture: ComponentFixture<Navbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [provideRouter(routes)],
    }).compileComponents();

    fixture = TestBed.createComponent(Navbar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

## Commit 5 — `footer.spec.ts`

Same pattern as commit 4 (`Footer` in place of `Navbar`, same relative import path `../../app.routes`).

## Commit 6 — `home.spec.ts`

Same pattern, import path `../app.routes` (one level shallower than navbar/footer).

## Commit 7 — `carousel.spec.ts`

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Carousel } from './carousel';

describe('Carousel', () => {
  let component: Carousel;
  let fixture: ComponentFixture<Carousel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Carousel],
    }).compileComponents();

    fixture = TestBed.createComponent(Carousel);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('images', [
      [{ src: 'assets/test-fixture.jpg', alt: 'Test image', width: 400, height: 600 }],
    ]);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

A synthetic `assets/test-fixture.jpg` path is used deliberately (not a real filename) so the test doesn't couple to
an asset that the naming/reorganisation phase will later rename.

## Commit 8 — `parallax-section.spec.ts`

Same pattern: `fixture.componentRef.setInput('backgroundImage', 'assets/test-fixture.jpg');` before `whenStable()`.

## Commit 9 — `i18n.service.spec.ts`

Replace all three failing assertions:

| Test | Before | After |
| --- | --- | --- |
| "should initialize the locale from localStorage" (locale `ja`) | `expect(service.t('nav.about')).toBe('概要')` | `expect(service.t('footer.legal.backToTop')).toBe('上へ戻る')` |
| "should fall back to english for unsupported saved locales" | `expect(service.t('nav.about')).toBe('ABOUT')` | `expect(service.t('footer.legal.backToTop')).toBe('Back to top')` |
| "should update the locale, persisted value, and translations" (locale `ja`) | `expect(service.t('nav.gallery')).toBe('ギャラリー')` | `expect(service.t('footer.legal.backToTop')).toBe('上へ戻る')` |

No other lines in the file change.

## Commit 10 — `CLAUDE.md`

```markdown
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
```

## Commit 11 — visual baseline scripts

Add dev dependencies: `playwright`, `pixelmatch`, `pngjs`. Run `npx playwright install chromium` once (downloads the
browser binary; not committed).

New files:
- `scripts/visual-baseline/routes.mjs` — shared config: the 8 route paths (`''`, `about`, `streaming`, `gallery`,
  `reviews`, `donate`, `contact`, `commission`) × 3 widths (375, 768, 1280).
- `scripts/visual-baseline/capture.mjs` — starts `ng serve` (via `child_process`) if nothing answers on
  `http://localhost:4200`, waits for it to be ready, launches headless Chromium via Playwright, screenshots each
  route/width to `__screenshots__/<label>/<route-slug>-<width>.png` (default label `baseline`), then exits (stopping
  any server it started). Prints only the list of file paths written and their byte sizes.
- `scripts/visual-baseline/diff.mjs` — compares two labelled sets (default `baseline` vs `current`) with
  `pixelmatch`, writes a highlighted diff PNG per route/width to `__screenshots__/diff/` **for the owner to open**,
  and prints a table of `route, width, percent-changed` to stdout — the only output Claude reads.

`package.json` scripts:
```json
"baseline:capture": "node scripts/visual-baseline/capture.mjs",
"baseline:diff": "node scripts/visual-baseline/diff.mjs"
```

`__screenshots__/` is already in `.gitignore` (pre-existing entry) — captures are never committed.

## Commit 12 — capture the baseline

Run `npm run baseline:capture` (label `baseline`, English only — the dev server's default locale). Verify the script
printed 24 file paths under `__screenshots__/baseline/`. Commit only the two script files' presence is already
covered by commit 11; this commit is a no-op for git (captures are gitignored) — recorded here as a checklist item,
not an actual commit, unless we decide to keep a small metadata file (`__screenshots__/baseline/manifest.json` with
route/width/byte-size/hash, gitignored alongside the PNGs) for future sessions to sanity-check freshness. **Open
question, not blocking**: keep a gitignored manifest or not? Defaulting to *not* committing anything for this item;
flag if you'd like a manifest tracked instead.

---

## Verification (definition of done)

```
npm run build            # production build, no new warnings
npm test                 # all suites green
npm run baseline:capture # 24 files written, only paths/sizes printed
```

Then fast-forward `working` to the branch tip (or merge) and delete `refactor/phase-0-baseline`.

## Explicitly out of scope for Phase 0

- Any change to `About`'s behavior beyond the unused import (no template/logic changes).
- Any change to `I18nService`, `Carousel`, or `ParallaxSection` source — only their specs change.
- The Angular 22 upgrade, Node version switch enforcement (`engines` field), or Tailwind bump — those are Phase 1.
- A Japanese visual baseline — captured fresh before Phase 7 per the earlier decision.
