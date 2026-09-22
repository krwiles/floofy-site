# 02 — Component inventory (proposed)

Intended APIs are **proposals** to react to, not commitments. Anything visual (cards, buttons, spacing) waits for the
owner's finished card styles. Selectors use the `app-` prefix; all components are `OnPush`, standalone, signal-based
`input()`/`output()`, and use `host: {}` for host bindings.

Legend: **P0** = blocks other work, **P1** = high value, **P2** = nice to have.

## Layout & structure

### `app-hero` — P0
Replaces the 8 copy-pasted hero blocks (~50 lines each → ~8).

| Input | Type | Notes |
| --- | --- | --- |
| `tone` | `'light' \| 'dark'` | text colour set (`on-light-*` vs `on-dark-*`) |
| `background` | colour token name | replaces raw `bg-[#…]`; add tokens `--color-hero-{home,gallery,…}` |
| `pattern` | `'stars' \| 'circles'` | the tiled SVG behind the image |
| `image`, `imagePosition`, `imageAlign` (`start`/`end`), `imageMaxWidth`, `imageHeight` | | side image + parallax settings |
| `panelAlign` | `'start' \| 'end'` | which side the glass panel sits |
| `kicker`, `title`, `description`, `tagline` | `string` | already-translated strings (component stays i18n-agnostic) |
| slot `[heroTitle]` | content | for home (two-line name) |
| slot `[heroActions]` | content | for streaming CTAs |

Includes: outer parallax pattern, inner masked image parallax, reveal animations, top flourish.
Consumers: home, about, streaming, gallery, reviews, donate, contact, commission.

### `app-section` — P0
`<section>` wrapper: `tone` (`light | light-alt | middle | middle-alt | dark | dark-alt`), optional `pattern` +
`parallaxStrength`, `width` (`6xl | 7xl`), vertical padding scale, `ariaLabel`/`labelledBy`.
Replaces the repeated `<section class="bg-section-…"><div class="mx-auto max-w-7xl px-4 py-24 …">` and the
`app-parallax-section` usages that only exist to draw the star/circle pattern.

### `app-section-header` — P0
`eyebrow`, `title`, `description`, `tone` (light/middle/dark → colour tokens), `align`, `flourish` (boolean/variant),
`level` (`h2`/`h3`). Renders the eyebrow/h2/paragraph/flourish stack used ~20 times. Reveal is built in.

### `app-flourish` and `app-section-divider` — P0
- `app-flourish`: `variant` (`end | end-short | full | full-wide`), `flip`, colour from `currentColor`. Wraps the
  existing CSS mask technique.
- `app-section-divider`: the "between sections" ornament (`f-full-wide`, centred on the seam, hidden on mobile).
  Replaces ~16 hand-copied absolute-positioned spans. Fixes the fragile "absolute without a relative parent" usage.

### `app-brand` — P2
Avatar + "Floofy" link used identically by navbar and footer.

### Navbar pieces — P1 (part of Flowbite removal)
- `app-navbar` keeps layout; extract `app-language-toggle` (the two inline flag SVGs → files in `assets/icons/`)
  and a signal-driven mobile menu (`aria-expanded`, `aria-controls`, Escape closes, closes on navigation). Replaces
  `data-collapse-toggle` and the `(click)="navDropdown.click()"` trick.

## Surfaces & controls

### `app-card` (or `[appCard]` directive) — P0, **blocked on the owner's card styles**
Variants mirroring `cards.css`: `light`, `light-special`, `middle`, `glass`, plus `padding` and `radius` scale.
Consolidates `.card-on-section-*`, `.glass-panel`, `.card-shadow` and the inline
`card-shadow rounded-4xl border border-white/70 bg-section-middle-alt` strings. Decide component vs directive vs
pure CSS classes after seeing the final styles (a directive/class is likely enough; a component only if it adds
structure such as header/footer slots).

### `a[appButton]` / `button[appButton]` — P1
`variant` (`primary | secondary | ghost | danger`), `size`, optional icon. One implementation replacing the Tailwind
string (home/gallery), `.stream-cta` (streaming.css) and the inline donate link. Focus ring uses one token.

### `app-social-links` + `SOCIALS` data — P1
A typed array `{ id, label, url, iconClass }` in `shared/data/socials.ts`; the component loops and renders accessible
links (`aria-label`, `rel="noopener noreferrer"`). Used by footer, about, contact, donate. One place to change a URL.

### `app-icon` — P2
Wraps the CSS-mask `social-icon` pattern (`name`, `size`); keeps `currentColor` behaviour, adds `aria-hidden`.

## Motion

### `[appReveal]` directive + `RevealService` — P0
Replaces `.animate-on-scroll` + `App.observerInit()` + the `Reviews → App` hack. One shared `IntersectionObserver`
in a root service; directive registers its host on init and unregisters on destroy, so late-rendered content
(reviews from the API, `@defer` blocks) is handled automatically. Options: `revealDelay`, `revealOnce`. Honours
`prefers-reduced-motion`. Keeps `motion.css` keyframes.

### `app-parallax` (existing `app-parallax-section`) — P1
Keep the idea, simplify: use `viewChild()`/`effect` or a directive instead of `@ViewChild` + `querySelector`; pass a
single shared scroll listener (via a `ScrollService` signal or one rAF-throttled listener); disable under reduced
motion; only update when in the viewport. `backgroundImage` stays required (fix its test).

## Forms

Goal: the three forms (`contact`, `reviews`, `commission`) share all plumbing; the pages keep only their field
definitions and copy.

### `app-form-field` — P0
`label`, `required`, `hint`, `field` (the signal-form field state for errors). Renders label + required star + error
list with `aria-describedby`, `aria-invalid`. Content-projects the control. Fixes the invalid `<label><p><div>` nesting.

### Control styling — P0
`[appControl]` directive (or `.form-control` class in a component layer) that owns the 12× duplicated
`mt-2 w-full rounded-base border border-border bg-section-light p-3 …` string, for `input`, `textarea`, `select`.
Radio/checkbox tiles get `app-choice` (used by commission type/usage pickers).

### `app-form-status` — P0
`state: 'idle' | 'pending' | 'success' | 'error'`, `message`. `role="status"` / `aria-live="polite"`, colour from the
state (no DOM class toggling). Replaces the three `#…-status` `<p>` elements and `statusElement` fields.

### `FormSubmission` helper — P0
Small class/factory: `const submit = createSubmission((value) => api.post(...))` exposing
`state`, `message`, `run()`. Signal-Forms `submission.action` calls it; no `subscribe`, no `console.log`, no
`getElementById`. Invalid handler sets the shared "please correct the errors" message.

### Backend access — P1
One `ApiService` / `API_BASE_URLS` injection token holding the three Lambda URLs (from an environment constant);
`ReviewsService`, `ContactService`, `CommissionService` shrink to typed methods. Consider `httpResource()` for the
reviews GET (loading/error state for free).

## Media

### `app-carousel` (own implementation) — P0 for Flowbite removal
Signals: `index`, `paused`. Inputs: `slides`, `interval`, `controls`, `ariaLabel`. Autoplay with pause on hover/focus and
under reduced motion; `role="region"` + `aria-roledescription="carousel"`, slide groups labelled
"n of N"; previous/next/indicator buttons; optional touch swipe. Replaces `initCarousels()`, all `data-carousel-*`
attributes and `carousel.css` override. Fixes the fixed `id="default-carousel"` (breaks with two carousels per page — the
commission page renders three).

### `app-lightbox` (+ `LightboxService`) — P1
Dialog with `role="dialog" aria-modal`, focus trap, Escape/←/→, focus return, real close button, `ScrollLockService`
(replaces the body-style writes). Gallery becomes a grid of `<button>`-wrapped images that open it.

### `app-gallery-grid` — P1
Masonry columns + `@defer (on viewport)` with an invisible, aspect-ratio-sized placeholder (fixes the flash TODO).

### `app-twitch-embed` — P1
Loads the embed script once (a tiny `ScriptLoader` service), debounced resize, `parent` from config.

### `app-tweet-embed` — P2
Wrap `twttr.widgets.load()`; load `widgets.js` lazily only on the pages that use it (drop the global `<script>`).

## Page-specific extractions (commission — the 909-line file)

| Piece | Notes |
| --- | --- |
| `app-pricing-card` | one card × 3 (chibi / emotes / illustration): title, price, carousel, CTA |
| `app-terms-card` | 7 term cards (Revisions, Workflow, Communication, Pricing, Artwork Usage, Payment, Terms of Service) — check how alike their markup is before deciding on one component vs a data-driven `@for` |
| `app-commission-form` | the form and price estimate, out of the page |
| `app-usage-picker` | the usage-type radio group |
| `app-stream-schedule-card` | streaming page schedule card (replaces `.stream-schedule-card` CSS) |

## Services and utilities

- `ScrollService` — smooth scroll + focus highlight (moves `scrollToElement` out of `Commission`), `ScrollLockService`.
- `StreamScheduleService` (or pure functions) — next stream instant, DST-safe, with unit tests.
- `I18nService` — safe storage access (try/catch, SSR-safe), lazy-load per-locale JSON (see architecture doc).
- `PricingService` — add `totalPriceUsd(commissionType, usageType)` here.
- `GalleryService` reads `assets/data/gallery.json` (typed) instead of 200 lines of TypeScript.

## Migration priority (summary)

1. **Foundations**: `appReveal`, `app-flourish`, `app-section-divider`, `app-section-header`, `app-section`.
2. **After the owner's card styles land**: `app-card`, `appButton`, `app-hero`.
3. **Forms**: `app-form-field`, `appControl`, `app-form-status`, `FormSubmission`, `ApiService`.
4. **Flowbite replacement**: `app-carousel`, navbar disclosure.
5. **Media & pages**: lightbox, gallery grid, Twitch embed, commission extractions, socials.
