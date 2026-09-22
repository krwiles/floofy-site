# 03 — Target architecture (proposal)

## Principles

1. **Pages compose, components decide.** A page template should read like an outline (`<app-hero>`, `<app-section>`,
   `<app-section-header>`, …) with copy and data, not styling.
2. **One place per concern.** Tokens in one file, one card system, one button, one form-field, one social list.
3. **Data out of code.** Image lists, socials and copy live in JSON/typed constants, not inside components.
4. **Everything is signal-driven.** No `getElementById`/`classList`/`document.body.style` from components; state
   drives templates. Browser-only APIs are wrapped in small injectable services.
5. **Small files.** Target: templates < ~150 lines, components < ~150 lines of TS. `commission.html` (909 lines) is
   the main offender.

## Folder layout

Keep the repo's existing naming (`name.ts` / `name.html` / `name.css`, no `.component`).

```
src/
  main.ts
  index.html
  styles.css                    # imports only; no rules
  styles/
    tokens.css                  # @theme (colours, radii, shadows, z-index scale, type scale)
    base.css                    # element defaults, fonts, reduced-motion base
    utilities/                  # @utility rules: masks, flourishes, icons, motion keyframes
    components/                 # shared component-layer CSS: cards.css, controls.css (only what Tailwind can't express)
  app/
    app.ts  app.html  app.config.ts  app.routes.ts
    core/                       # app-wide singletons, no UI
      api/                      # api.service.ts, api.config.ts (Lambda URLs), models
      i18n/                     # i18n.service.ts, translate.pipe.ts, locale.ts
      browser/                  # scroll.service.ts, scroll-lock.service.ts, script-loader.service.ts, reveal.service.ts
    layout/                     # navbar/, footer/, brand/
    shared/
      ui/                       # hero, section, section-header, flourish, section-divider, card, button, icon,
                                # carousel, parallax, lightbox, gallery-grid, social-links, twitch-embed
      forms/                    # form-field, control, choice, form-status, submission.ts
      data/                     # socials.ts, gallery.json (or .ts), carousel groups, hero presets
      directives/               # reveal.ts
    features/                   # one folder per route, lazy loaded
      home/  about/  streaming/  gallery/  reviews/  donate/  contact/  commission/
        (+ feature-only sub-components, e.g. commission/pricing-card, commission/terms-card, commission/form)
  assets/
    images/…  icons/…  patterns/…  i18n/…  data/…      # split the flat 47-file assets folder
```

Notes:
- `features/*` replaces the flat page folders; routes update to `import('./features/home/home')`.
- `models/` disappears: models sit beside the feature or service that owns them (`core/api/…`, `features/reviews/…`).
- Renaming/reorganising `assets` is its own dedicated step; see "Asset naming and organisation" below and the roadmap.

## Asset naming and organisation (owner-requested change, noted 2026-09-21)

**Problem:** the 47 files in `src/assets/` are flat and mostly unnamed: art files keep their original social-media IDs
(`G_CQjK1XkAALluE.jpeg`, `HFT6u19bsAAQG-z.jpeg`, `6BA33836.jpeg`, `0062bdc3-…-Floofy-t09.webp`), 7 are `.jfif`, one has spaces
(`VGen Badge - outline.png`), and the gallery `alt` text is currently just the filename slug. Nothing tells you what a
file is, and type is not reflected in the folder structure.

**Goal:** every image/media file has a descriptive, consistent name and lives in a folder that reflects its type.

Proposed folders (organise by *what the file is*, not by which page uses it — several images are used on multiple pages):

```
assets/
  images/
    art/
      illustrations/   # gallery/hero/OC artwork
      chibi/           # commission examples
      emotes/          # commission examples
    brand/             # avatar/profile image, logo, favicon source
  icons/
    social/            # x, bluesky, pixiv, twitch, ko-fi, vgen, email
  patterns/            # 4-point-stars, intersecting-circles
  ornaments/           # flourish*.svg
  data/  i18n/         # unchanged
```

Proposed naming convention: lowercase kebab-case, no spaces, no upload IDs, `.jfif` → `.jpg` (a rename, same JPEG data),
`<subject>-<kind>-<nn>.<ext>` (e.g. `floofy-illustration-01.jpg`, `chibi-example-02.webp`, `avatar-floofy.jpg`).
Subjects/titles must come from the owner, who knows what each piece depicts.

How to do it without anyone having to open the images:
1. Generate a **manifest** (CSV/JSON) of each file: current name, format, pixel size, byte size, and every place it is
   referenced (from source text and image headers only).
2. The owner fills in `newName`, `folder`, `alt` (real alt text) and optionally `source` (original post, for credit).
3. A script performs `git mv` (keeps history) and rewrites every reference; `ng build` then finds any miss.

Everything that must be updated with the rename (found by grep on 2026-09-21): `home.ts` (12 entries),
`gallery-image.service.ts` (13 entries plus chibi/emote/illustration lists), 8 page templates, `navbar.html`, `footer.html`,
`index.html` (preload link), `src/robots.txt` (`Disallow: /floofy-site/assets/` — keep it matching), `flourishes.css` and
`icons.css` (`url(...)`), `pricing.service.ts`/`i18n.service.ts` (JSON imports), `README.md` / `LICENSE-media.md` (mention
`/assets/`). Best done together with the `gallery.json` extraction so each image is described exactly once.

Findings while listing: 3 files are not referenced anywhere by literal path (`A6757DF0.jpeg`, `G25GkrnbsAAv-8K.jfif`,
`icon.png`) — the owner decides whether to delete or keep. Renaming changes the deployed URLs, so any external site
hotlinking these images would break (robots.txt already disallows crawling them).

## Styling layers

Current: tokens and rules are mixed in `styles.css`. Target layering, all imported by `styles.css` in order:

1. `tailwindcss` (+ any plugin)
2. `tokens.css` — the single `@theme` block. Add: `--radius-base` (replaces Flowbite's), a shadow scale
   (`--shadow-card`, `--shadow-card-lg`), a z-index scale (`nav`, `overlay`, `modal`), a spacing scale for section
   padding, hero background tokens (replace 4 raw hex classes), state colours (already present).
3. `base.css` — fonts, headings, `html`/`body`, mobile type scale.
4. `utilities/*.css` — `@utility` rules and mask techniques (masks, flourishes, icons, motion).
5. `components/*.css` — **only** styles Tailwind utilities cannot express cleanly (the layered card gradients with
   `::before`, glass panel). Everything else is Tailwind classes inside the shared component that owns them.

Rules:
- No raw hex/rgba in templates or component CSS; use tokens (or `color-mix()` on tokens like `cards.css` already does).
- No per-page stylesheets except for genuinely page-unique layout. `streaming.css` is removed once `app-card`,
  `appButton` and the schedule card exist.
- Component styles (`styleUrl`) stay small — the production budget is 4 kB warning / 8 kB error per component.
- Fonts: replace the `@import url(https://fonts.googleapis.com/…)` in CSS with `<link rel="preconnect">` +
  `<link rel="stylesheet">` in `index.html` (or self-host with `@fontsource`) to avoid a render-blocking CSS
  `@import`. Decide together with the `noai`/privacy stance.

## Data

- `gallery.json`: `{ id, src, thumb?, alt, width, height, category: 'illustration'|'chibi'|'emote', featured? }`.
  Home carousel groups, commission carousels and the gallery page all derive from it (filter/`computed`), so each image
  is described once, with real alt text.
- `socials.ts`: typed `Social[]` (see inventory).
- `pricing.json` stays; add `total()` to `PricingService`.
- Consider generating `width`/`height` at build time (script) to prevent drift; not required initially.
- Convert large PNG/JPEG/JFIF assets to WebP/AVIF and use `NgOptimizedImage` with `sizes`/`srcset` where possible
  (assets are 6.5 MB, some `.jfif`). Separate task from the refactor; tracked in the roadmap backlog.

## i18n

Current: a custom service + impure pipe with both locale JSONs in the initial bundle.

Recommendation (not yet decided — see open decisions): keep the custom approach (it is small and works with signals)
but:
- lazy-load the locale JSON (`import()`), only English initially;
- make `t()` signal-friendly so templates can call `i18n.t('key')` (or a pure computed lookup) rather than an impure pipe;
- wrap `localStorage` in try/catch and read via `DOCUMENT`/`inject`;
- add a dev-time check that `en.json` and `ja.json` have identical key sets (unit test);
- move the hardcoded English strings (streaming, donate Ko-fi block, contact labels) into the JSON;
- type keys (`keyof` of a generated type, or a `T` const) so a typo is a compile error.

Alternatives: `@angular/localize` (build-time, one bundle per locale — poor fit for a runtime toggle on static
hosting), or `ngx-translate`/Transloco (extra dependency for little gain).

## Routing and deployment

- Keep lazy routes; drop `PreloadAllModules` if bundle sizes stay small, or keep — measure first.
- Add page `title` per route (`title:` in route config) and per-page meta.
- Verify direct-URL loads (`/gallery` TODO): GitHub Pages needs `404.html` = `index.html` copy in the deploy
  step; check whether production also runs on Vercel (Twitch `parent` list mentions it), where a rewrite is needed.
- Move the three Lambda URLs into an `environment`-style config file.

## Forms

- Continue with Signal Forms. Put field schema (validators) beside the form component, extract the shared
  "required/maxLength with message" helpers if they repeat.
- Submission flow: `FormSubmission` helper (see inventory) shared across the three forms; server response messages
  displayed via `app-form-status`.
- Field components use `aria-describedby` for errors and `aria-invalid`.

## Testing

- Fix the 7 red spec files first (baseline).
- Shared components get real tests: inputs → DOM/classes/ARIA. Directives (`appReveal`) with a fake
  `IntersectionObserver`. Services (`StreamSchedule`, `Pricing`, `I18n`) get pure unit tests.
- One test asserts `en.json`/`ja.json` key parity and that every `'x.y' | translate` key used in templates exists.
- Add an AXE pass (e.g. `axe-core` in a Vitest/DOM test per page or a Playwright run) — the Angular guide requires it.
- Visual regression: a script that captures each route at 3 widths (375 / 768 / 1280) before each phase and after, and a
  side-by-side check. Tooling choice is an open decision (Playwright vs manual browser check).

## Repo hygiene

- Move `aws_lambda/*` vendored packages out of git: `requirements.txt` + a `build.sh`/`build.ps1` that installs
  Linux wheels (`pip install --platform manylinux2014_x86_64 --only-binary=:all: -t package/ …`) and zips. Add `.gitignore`
  entries for `aws_lambda/**/{psycopg*,requests*,certifi*,urllib3*,idna*,charset_normalizer*,resend*,bin,__pycache__}`.
  History rewrite is **not** proposed; only stop tracking going forward (needs the owner's decision).
- Delete `tailwind.config.js` once confirmed unused.
- Add `CLAUDE.md` (short: commands, conventions, where docs live) so future sessions start informed.
- Normalise line endings via `.gitattributes` (`* text=auto eol=lf`) — removes the CRLF warnings.
