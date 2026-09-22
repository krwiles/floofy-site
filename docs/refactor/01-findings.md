# 01 — Findings (audit of the current codebase)

Audit date: 2026-09-21. Baseline: `ng build` passes (2 warnings); `ng test` has **10 failing tests in 7 of 20 spec files**.

## Stack

- Angular **21.2.7**, standalone components, lazy routes with `PreloadAllModules`, zoneless (no `zone.js` dependency).
- Signal Forms (`@angular/forms/signals`: `form`, `FormField`, `FormRoot`) on the 3 forms.
- Tailwind **4.2.2** (CSS-first config in `src/styles.css`); Flowbite **4.0.1** (theme import + plugin + JS).
- TypeScript 5.9.3, Vitest 4 (via `@angular/build:unit-test`), Prettier with the Tailwind plugin.
- Deploys to GitHub Pages (`.github/workflows/deploy-pages.yml`, Node 22). Three AWS Lambda backends in `aws_lambda/`.

## Size

About 5,000 lines outside assets. The heavy files: `commission.html` (909), `home.html` (315), `about.html` (282),
`contact.html` (425, includes uncommitted WIP), `reviews.html` (215), `gallery-image.service.ts` (224),
`commission.ts` (198).

## Duplicated patterns (candidates for components)

| Pattern | Occurrences | Where |
| --- | --- | --- |
| Hero: parallax bg + side image + glass panel + kicker/title/copy/tagline | 8 (one per page) | every page; ~50 lines each, only text/images/colours/alignment differ |
| Section header: eyebrow (`tracking-[0.35em]`) + h2 + description + flourish | ~20 | about, commission, contact, donate, home, reviews, streaming |
| Flourish `<span class="flourish f-…">` | ~50 | every page; the "between sections" divider repeats the same long class string |
| `animate-on-scroll` class | ~125 | commission 47, home 27, contact 21, about 17, reviews 9, donate 3 |
| Form field (label, required `*`, inline error list, input class string) | ~14 fields | commission 7, contact 3, reviews 2 (+ selects/radios/checkboxes); the input class string is copied 12 times |
| Form status message (`getElementById` + `classList`) | 3 | commission, contact, reviews |
| Form submit / invalid / error handling incl. `console.log` | 3 | commission.ts, contact.ts, reviews.ts |
| Social links (9-line `<a>` per network) | footer, about, contact, donate | hardcoded URLs in each place |
| Card surface (CSS classes + inline `card-shadow rounded-4xl border border-white/70 bg-section-middle-alt …`) | ~50 mentions | all pages; two competing systems |
| CTA button styling | 3 implementations | tailwind utility string (home/gallery), `.stream-cta` (streaming.css), inline in donate |
| Brand block (avatar + "Floofy") | navbar, footer | identical markup |
| Backend service (`http.post` to a hardcoded Lambda URL) | 3 | reviews, commission, contact services |
| Parallax nesting (outer pattern bg + inner image parallax + mask fade) | 8 | the same 15-line block per hero, and again for sections |

## Bugs, smells and rule violations

### App shell
- `app.ts`: subscription stored as `any`, manual `ngOnInit`/`ngAfterViewInit`/`ngOnDestroy`, `setTimeout` to re-scan for
  `.animate-on-scroll` after each navigation; a new `IntersectionObserver` is created on every call; observers are never
  disconnected. `title` signal unused.
- `reviews.ts` does `inject(App, { optional: true })` only to call `app.observerInit()` after loading data
  (component reaching into the root component).

### DOM access from components
- Status text colour: `document.getElementById('…-status')` then `classList.add('text-success' | 'text-error')`
  (commission, contact, reviews). Breaks if the element is not yet rendered, is invisible to signals, and is not
  announced to assistive tech (no `aria-live`).
- Gallery lightbox writes `position/top/width/paddingRight` on `document.body` and a CSS variable on `<html>`.
- Streaming builds a `<script>` tag for the Twitch embed, uses `window as any`, and reloads the embed on every resize.
- About calls `twttr.widgets.load()` via a `declare const`; `index.html` loads the Twitter widget script on every
  page and it is `noindex` site-wide.

### Rule / best-practice violations (Angular guide)
- `Gallery` has **no `OnPush`** and uses **`@HostListener`** (`document:keydown.escape`).
- `console.log` calls left in submit handlers.
- `About` imports `RouterLink` but does not use it (build warning NG8113).
- Impure `TranslatePipe` (`pure: false`) runs on every change-detection pass.
- Several `any` types (`routerEventsSub`, `window as any`).
- Templates contain a UTF-8 BOM (`donate.html`) and mixed line endings warnings from Git (`contact.html`).

### Accessibility
- Lightbox: no `role="dialog"`/`aria-modal`, no focus trap or focus return, no arrow-key navigation, close button
  is `lg:text-transparent` (visually hidden on desktop, still focusable, no accessible name).
- Form status has no `aria-live`; errors are not linked with `aria-describedby`; `<label>` wraps a `<p>` containing
  a `<div>` (invalid nesting).
- Carousel indicator/controls come from Flowbite markup; no reduced-motion handling in the carousel.
- Gallery images are click targets (`(click)` on `<img>`), not buttons.
- Alt texts are placeholders (`"Image 1"`, filename slugs).

### Data and i18n
- Image metadata is hardcoded in TypeScript: `gallery-image.service.ts` (224 lines, 13 entries) and `home.ts`
  (12 entries, repeating the same width/height data).
- `chibiImages` / `emoteImages` / `illustrationImages` lists exist in the same service.
- i18n is incomplete: `streaming.html`, the Ko-fi block of `donate.html`, and the labels/placeholders in
  `contact.html` are hardcoded English. `pricing.json` and the nav come from JSON but everything else is keyed strings.
- `I18nService` reads `localStorage` in a field initialiser and an `effect()` (not SSR/private-mode safe).
- Translations are imported statically (both languages ship in the initial bundle).

### Styles
- Tokens (`@theme`), base rules and imports all live in `src/styles.css` (99 lines).
- Five partials: `masks.css`, `flourishes.css`, `motion.css`, `icons.css`, `components/cards.css` (WIP, replaces the
  deleted `glass.css`).
- `streaming.css` (92 lines) is a per-page stylesheet using raw hex/rgba instead of tokens, and duplicates card/CTA styles.
- Raw hex hero backgrounds: `bg-[#DBE0FD]`, `bg-[#D3DCC7]`, `bg-[#787495]`, `bg-[#5A696E]` — not tokens.
- Build warns about "2 rules skipped due to selector errors: Empty sub-selector".
- `tailwind.config.js` (`darkMode: false`) is a v3 relic; with Tailwind v4 CSS-first it is unused.
- `styles.css` applies `font-family` twice (headings and `*:not(h1)…`) and imports Inter and Noto Sans JP from
  Google Fonts through a render-blocking `@import url(...)`.
- Magic values: `z-100`, `z-20000`, `scrollOffset = 108`, `rounded-4xl` and `rounded-base` used inconsistently.
- `rounded-base` (44 uses) comes from the Flowbite theme. It is the one Flowbite-provided token that the templates
  actually depend on (see `04-upgrade-plan.md`).

### Feature-level notes
- `about.html` has a `<!-- Fan images here -->` stub at the bottom.
- `contact.html` (uncommitted) contains a "Reviews, donate, contact" section (~180 new lines) that looks copy-pasted
  from another page.
- `gallery.html` carries two TODOs: the `@defer` placeholder flashes; and direct navigation to `/gallery` reportedly
  fails to load (likely GitHub Pages / SPA fallback — see deploy notes below).
- Commission page: `scrollToElement` (with focus-highlight timeouts) belongs in a shared scroll/focus helper.
- Commission price maths (`totalPriceUsd`) lives in the component; belongs with `PricingService`.
- `Streaming` time logic (getters recomputed each CD pass, DST detection by string-matching `GMT-4`) should be a small
  service or pure functions with tests.

### Tooling / repo hygiene
- **Tests are red**: 10 failing tests / 7 spec files. They are unmodified CLI stubs: `ParallaxSection` requires
  `backgroundImage` but the test does not set it; others lack HTTP providers or routes.
- Vendored Python dependencies are committed under `aws_lambda/*` (22 MB in `floof-api`, including
  `__pycache__` and a Windows `.pyd`). They should be built from `requirements.txt`, not tracked.
- Lambda function URLs are hardcoded in three services.
- `dist/` and `.angular/` exist on disk (ignored, fine) — mentioned only so nobody commits them.
- Deploy: GitHub Pages workflow builds with `--base-href /<repo>/`, but the Twitch `parent` list references
  `floofy-site.vercel.app` and `www.floofy.site` — deployment target(s) should be documented. SPA deep-link fallback
  on GitHub Pages needs a `404.html` copy of `index.html`; verify (likely the cause of the `/gallery` TODO).
- Node 22 in CI is unpinned by minor version; Angular 22 requires `^22.22.3 || ^24.15.0`.
- There is no `CLAUDE.md` / `AGENTS.md`; this `docs/refactor/` folder is the first project-level documentation
  beyond `README.md`.

## What is already good (keep)

- Lazy-loaded routes, standalone components, `OnPush` on most components.
- A coherent token palette (`--color-section-*`, `--color-on-*`, brand, border, state) — the design system exists,
  it just isn't consistently used.
- Signal Forms already adopted; `input()` signals used in `Carousel` and `ParallaxSection`.
- `prefers-reduced-motion` handled in `motion.css` and the parallax component.
- CSS-mask flourishes/icons that inherit `currentColor` are a neat, cheap technique; keep, wrap in a component.
- `pricing.json` as data, typed via `pricing.model.ts`.
