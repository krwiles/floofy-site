# 04 — Upgrade plan: Angular 22, Tailwind, Flowbite

Facts below were checked against the npm registry on 2026-09-21. **Nothing has been installed or changed.**
Migration-guide details for Angular 22 have **not** been read yet — that is the first step of the upgrade phase
(use the angular-cli MCP `search_documentation` and the official update guide / `ng update` output).

## Current versions → targets

| Package | Now (installed) | npm `latest` | Target | Notes |
| --- | --- | --- | --- | --- |
| `@angular/*` (core, common, compiler, forms, platform-browser, router) | 21.2.7 | **22.1.7** | 22.1.x | `ng update @angular/core@22 @angular/cli@22` |
| `@angular/cli`, `@angular/build` | 21.2.x | 22.1.8 (`next`: 22.2.0-rc.0) | 22.1.x | do not use the `next` tag |
| `@angular/compiler-cli` | 21.2.x | 22.1.x | 22.1.x | peer: `typescript >=6.0 <6.1` |
| **TypeScript** | 5.9.3 | 7.0.2 | **6.0.x** | ⚠ see below — do **not** take `latest` |
| `tailwindcss`, `@tailwindcss/postcss` | 4.2.2 | 4.3.3 | 4.3.x | minor bump inside v4; low risk |
| `flowbite` | 4.0.1 | 4.0.2 | **remove** (fallback: 4.0.2) | see analysis below |
| `vitest` | 4.x | 5.0.1 | **4.x** | ⚠ `@angular/build` peer is `^4.0.8`; stay on v4 |
| `jsdom` | 28 | — | keep | |
| `prettier` (+ tailwind plugin) | 3.9.4 / 0.8.0 | — | keep; bump if the plugin needs it for Tailwind 4.3 | |
| `rxjs` | ~7.8.0 | — | keep | Angular peer `^6.5.3 \|\| ^7.4.0` |
| `zone.js` | not installed | — | leave uninstalled | project is already zoneless; peer is optional |

## Hard constraints discovered

1. **Node**: Angular 22 requires `^22.22.3 || ^24.15.0 || >=26.0.0`. The local machine has **Node 24.14.1**, which is
   *below* the minimum — the owner must upgrade Node (to ≥ 24.15) before `ng update`/`ng build` will run cleanly.
   CI: `actions/setup-node` with `node-version: 22` resolves to the latest 22.x (fine), but pin explicitly
   (`24` recommended) and add an `engines` field to `package.json`.
2. **TypeScript 6.0.x only**: `@angular/compiler-cli@22.1.7` and `@angular/build@22.1.8` declare
   `typescript: >=6.0 <6.1`. npm's `latest` is 7.0.2 — installing it will fail the peer check or break the compiler.
   Pin `typescript` to `~6.0.x` in `package.json`. TS 6.0 also brings its own deprecations (check `tsconfig*.json` options
   and `lib`/`module` settings against the TS 6 release notes as part of the upgrade).
3. **Vitest 4.x**: `@angular/build@22` peer is `^4.0.8`; do not move to Vitest 5 yet.
4. Vendored Python is unaffected by the front-end upgrade.

## Recommended sequence

Do the framework upgrade **as its own branch and PR, before** the component refactor, so the refactor is written
against the final APIs and any regression is attributable.

1. Baseline: commit the WIP (`cards.css`, contact page) on `working`; fix the 7 red spec files; record baseline
   screenshots and bundle sizes (`ng build` stats).
2. Upgrade Node locally; add `engines` and pin CI Node.
3. Read Angular 22 update guide; run `ng update @angular/core@22 @angular/cli@22` (accept only the migrations it lists);
   pin TypeScript `~6.0`; keep Vitest 4.
4. Fix compile errors / new lint warnings (e.g. the unused `RouterLink` import; any signal-forms API renames — the
   forms package is experimental-adjacent, verify `form`, `FormField`, `FormRoot`, `submission.action`, `onInvalid`
   still exist and behave the same in 22).
5. Tailwind 4.2.2 → 4.3.3 (`npm i tailwindcss@4.3 @tailwindcss/postcss@4.3`); rebuild; compare generated CSS size and
   visual baseline. Re-check the Prettier plugin still sorts.
6. Verify `ng build`, `ng test`, `ng serve`, production build, GitHub Pages deploy (`build:gh-pages`) and the base-href.
7. Only after that, begin refactor phases.

## Flowbite: keep or remove?

### What Flowbite actually does in this project

| Use | Where | Weight |
| --- | --- | --- |
| `initFlowbite()` (global JS init) | `app.ts` | needed only for `data-collapse-toggle` on the navbar |
| `initCarousels()` + `data-carousel*` attributes | `components/carousel` | the carousel (used on home + 3× on commission) |
| `@import 'flowbite/src/themes/default'` | `styles.css` | supplies CSS variables/utilities (notably `--radius-base` → `rounded-base`) |
| `@plugin 'flowbite/plugin'` | `styles.css` | adds Flowbite's base styles for forms, tooltips, charts, datatables, wysiwyg (all on by default) |
| `@source '../node_modules/flowbite'` | `styles.css` | makes Tailwind scan Flowbite's JS/markup for classes |
| Flowbite UI classes in templates | grep found none beyond `rounded-base` (44 uses) | `bg-brand`, `text-brand`, `border-border` etc. resolve to **your own** `@theme` tokens (defined in `styles.css`) |

Not used anywhere: modals, dropdowns, tooltips, accordions, datepicker, drawers, tabs, popovers.

### Recommendation: **remove Flowbite**

- The two JS behaviours are small and are better as signal-driven Angular code:
  - Carousel → own `app-carousel` (autoplay, indicators, prev/next, ARIA, reduced-motion, multiple instances).
  - Navbar collapse → a `signal<boolean>` disclosure with correct `aria-expanded`.
- Removing `initFlowbite()`/`initCarousels()` also removes the fragile "init after routing" DOM scanning, the static
  `id="default-carousel"` problem, and Flowbite's runtime dependency chain (`@popperjs/core`, `flowbite-datepicker`,
  `mini-svg-data-uri`).
- Owning the tokens removes the coupling between our design system and a third-party theme file, so future
  Tailwind bumps only involve Tailwind.

### Risks / things to verify before deleting

1. **`rounded-base`** (44 uses): Flowbite's default theme sets `--radius-base: 12px`
   (`node_modules/flowbite/src/themes/default.css:26`). Define `--radius-base: 12px` in our `@theme` (or replace with a
   named radius scale, e.g. `rounded-control`) so nothing changes visually.
2. **Flowbite base form styles**: verified — `flowbite/plugin` (`plugin.js`) enables `forms`, `tooltips`, `charts`,
   `datatables` and `wysiwyg` base styles **by default**. The `forms` styles reset/restyle inputs, selects, checkboxes and
   radios, so the three forms and the commission radio/checkbox pickers may rely on them (tooltips/charts/datatables/
   wysiwyg are unused). Diff the built CSS (`ng build` before/after; look for `[type='checkbox']`, `select`,
   `appearance`) and screenshot the forms. A quick interim step is `@plugin 'flowbite/plugin' { … }` with the unused
   groups turned off, to shrink CSS before full removal.
3. **Other Flowbite theme variables**: the default theme also defines many variables our `@theme` does not override
   (e.g. `--color-body`, `--color-heading`, `--color-brand-soft`, `--color-brand-medium`, `--color-brand-light`,
   `--color-brand-softer`). Our `@theme` (imported later) overrides `--color-brand`, `--color-brand-subtle` and
   `--color-brand-strong`, but any utility using the others would silently disappear. Templates appear to use only
   `bg-brand`, `bg-brand-subtle`, `text-brand`; re-grep, and check `cards.css` (`color-mix(… var(--color-…))`), the
   built CSS, and screenshots after removal.
4. **Carousel behaviour parity**: 5 s interval, slide-transition (`duration-1000 ease-in-out`), indicators only when
   `controls` is true, per-group images (arrays of arrays). Write the component to the same contract, then compare.
5. **Logical utilities** (`inset-s-0`, `inset-e-0`, `rtl:*`): Tailwind 4 native — fine without Flowbite.
6. Font-smoothing / typography defaults that come from Flowbite's base layer: eyeball text rendering after removal.

### Fallback

If parity testing shows the form styles are a large hidden dependency, keep only the theme/plugin CSS temporarily,
remove the JS (`initFlowbite`, `initCarousels`) first, and replace the CSS reliance in the forms phase. Removal
can therefore be staged: **JS first (Phase 4), CSS last (end of Phase 5)**.

## Angular 22 features worth adopting during the refactor (verify each in the 22 docs first)

Do not assume; confirm with `search_documentation`/`find_examples` before using:
- signal-forms API in 22 (stable vs experimental; `formField` vs `field` naming);
- `httpResource` for the reviews list;
- built-in animation APIs already used in the gallery (`animate.enter` / `animate.leave`);
- `@defer` improvements; `NgOptimizedImage` updates;
- zoneless + `OnPush` defaults, `provideBrowserGlobalErrorListeners` (already used);
- template features that simplify the `TranslatePipe` (e.g. signal-based approaches).

## Rollback

Each step is a separate commit on the upgrade branch. If the upgrade blocks, `git revert`/`git reset` the branch;
`main` is untouched. Lockfile changes are committed with the step that causes them.
