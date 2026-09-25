# 11 — Phase 3 execution plan (Stage 3c: data-driven consolidation)

Concrete plan for `05-roadmap.md` → Phase 3 → Stage 3c, settled 2026-09-23 via `mattpocock-skills:grilling` +
`domain-modeling`. **This document is a plan. Nothing in it has been executed yet.**

Unlike Stage 3b, this is not a visual redesign — it's consolidating already-identical-looking repeated markup
into two small components. Diff-decides-merge (direct merge if `0.00%`, PR otherwise), same as Phase 0/2 and
Stage 3a, not Stage 3b's always-a-PR rule.

## Decisions locked in this round

| # | Decision | Answer |
| --- | --- | --- |
| 1 | `app-brand` isn't byte-identical after all | The plan's original "confirmed byte-identical" claim was wrong — footer wraps the text in `<h2 id="footer-brand">` (real `aria-labelledby` structure), navbar uses a plain `<span>` plus a real, functional `nav-brand-intro` entrance-animation class. `app-brand` owns only the shared part (`<a routerLink="/">` + `<img>` + `<span>Floofy</span>`); each caller supplies its own wrapper for what it specifically needs |
| 2 | Donate's Ko-fi chip sizing | Standardize onto the exact same chip sizing as about/contact (was drift, not a deliberate third size). The embed iframe's own dimensions, the embed's wrapper, and the `max-w-lg` panel wrapping the chip (Stage 3b's `[appCard]`) are unrelated and stay exactly as they are — only the inner chip `<a>` itself is in scope |
| 3 | `app-social-links` owns items only | Renders the repeated `@for` of individual link elements; each page keeps its own wrapping container (`grid`/`flex`, with whatever column/gap layout that page needs) around `<app-social-links [ids]="[...]" variant="..." />` — real, differing layout per page, same category of variance `app-section` already chose to leave as caller content |
| 4 | Icon sizing owned by the component | Each variant (`plain`/`chip`) bakes in one fixed size internally; callers stop passing any size-related classes. Removes exactly the kind of drift Q2 found in the first place |
| 5 | `target`/`rel` inferred from the URL | `url.startsWith('mailto:')` decides at render time instead of a stored `external` flag — a structural fact about the URL, not a content decision, so there's nothing to keep in sync |
| 6 | `ariaLabel` fully explicit per entry, wording standardized | Every entry gets its own literal `ariaLabel` string in `SOCIALS` (not computed from a template) — flexible enough to have preserved email's irregular "Email SummerFloofy" phrasing, but standardizing it to "SummerFloofy on Email" to match every other entry, since the irregularity was drift, not intent |

`SOCIALS` lives in `src/app/models/social.ts` — no existing `data/` folder in this codebase to match the
original plan sketch's tentative location, and `models/` already holds non-class data shapes (`Tone`).

## Facts found this session

- **`social-icon--{id}`** (`src/styles/utilities/icons.css`) defines exactly 7 networks: `x`, `bsky`, `pixiv`,
  `twitch`, `vgen`, `kofi`, `email` — matches `CONTEXT.md`'s "Social link" entry exactly.
- **Every real per-page variance, confirmed fresh (not from the earlier planning session, which under-counted
  it):**
  - `about.html`: 6 icons (`x bsky pixiv twitch vgen kofi`), chip variant, in a `grid-cols-2 sm:grid-cols-2
    md:grid-cols-4 lg:grid-cols-6` wrapper.
  - `contact.html`: 4 icons (`x bsky vgen email`), chip variant, in a `grid-cols-2 md:grid-cols-4` wrapper.
  - `footer.html`: 6 icons (`x bsky pixiv twitch vgen kofi`, no `email`), plain variant, in a `flex flex-wrap
    gap-3` wrapper (its own separate `mailto:` text link for email stays untouched — not part of this
    component, unchanged from the original plan's own note).
  - `donate.html`: 1 icon (`kofi`), chip variant (sizing standardized per decision #2), inside the `[appCard
    tone="middle"]` panel Stage 3b already built — only the inner `<a>` is touched.
  - `streaming.html`/navbar/gallery: no social-icon usage at all.
- **Exact hrefs/aria-labels per network** (used to build `SOCIALS` below): `x` → `https://x.com/SummerFloofy`;
  `bsky` → `https://bsky.app/profile/summerfloofy.bsky.social`; `pixiv` →
  `https://www.pixiv.net/en/users/115468010`; `twitch` → `https://www.twitch.tv/summerfloofy`; `vgen` →
  `https://vgen.co/SummerFloofy`; `kofi` → `https://ko-fi.com/summerfloofy`; `email` →
  `mailto:Summerfluffball@gmail.com`. All existing `aria-label`s already follow "SummerFloofy on {Network}"
  except email's "Email SummerFloofy" (standardized per decision #6).
- **`app-brand` real differences** (see decision #1): navbar's wrapping `<a>` has an extra `nav-brand-intro`
  class — confirmed in `navbar.css` as a real, functional one-time staggered entrance animation
  (`animation: navbarReveal...`, `prefers-reduced-motion` respected), not dead/vestigial like the scroll-anchor
  classes found in Stage 3a. Footer's `<h2 id="footer-brand">` is real too — that `id` is the
  `aria-labelledby` target for footer's own `<section aria-labelledby="footer-brand">` landmark. Both callers'
  base layout classes (`flex items-center space-x-3 rtl:space-x-reverse` on the `<a>`, `text-2xl font-semibold
  text-on-light-heading` on the text) are identical and become the component's own internal styling. Navbar's
  span additionally has `self-center whitespace-nowrap`, which footer's `<h2>` lacks — `self-center` is
  redundant given the parent nav already sets `items-center`, and `whitespace-nowrap` is low-risk to drop for a
  short, unlikely-to-wrap "Floofy" string; noted here rather than raised as a full decision, since it's a minor
  forwarding nuance with an easy one-line fix if the owner ever notices otherwise.

## `app-brand` (`src/app/components/brand/brand.ts`)

`selector: 'app-brand'`. No inputs.

```html
<a routerLink="/" class="flex items-center space-x-3 rtl:space-x-reverse">
  <img class="block h-14 w-14 rounded-4xl border-2 border-bg-muted" ngSrc="assets/G_Xl1MobAAAVbNn.jpeg" alt="Floofy" width="621" height="621" />
  <span class="text-2xl font-semibold text-on-light-heading">Floofy</span>
</a>
```

`:host { display: block; }` (or `contents`, worth trying `display: contents` first since this host has no
styling of its own to apply and `contents` would let the inner `<a>` participate directly in the parent flex
row without an extra box — confirm during implementation whether `contents` breaks `NgOptimizedImage` or
`routerLink`, falling back to `block` if so).

**TDD test plan**: renders a link to `/`; renders the Floofy image with the right `src`/`alt`; renders "Floofy"
text; a class forwarded from the caller (e.g. `nav-brand-intro`) ends up on the host element.

**Migration**:
- `navbar.html`: replace the `<a routerLink="/" class="nav-brand-intro flex items-center space-x-3
  rtl:space-x-reverse"><img .../><span ...>Floofy</span></a>` block with `<app-brand class="nav-brand-intro" />`.
- `footer.html`: replace the `<a routerLink="/" class="flex items-center space-x-3 rtl:space-x-reverse"><img
  .../><h2 id="footer-brand" ...>Floofy</h2></a>` block with `<h2 id="footer-brand"><app-brand /></h2>` — keeps
  the heading/`aria-labelledby` structure at the call site, where it's footer's own concern.

## `SOCIALS` (`src/app/models/social.ts`)

```ts
export type SocialId = 'x' | 'bsky' | 'pixiv' | 'twitch' | 'vgen' | 'kofi' | 'email';

export interface Social {
  id: SocialId;
  label: string;
  url: string;
  iconClass: string;
  ariaLabel: string;
}

export const SOCIALS: Social[] = [
  { id: 'x', label: 'X', url: 'https://x.com/SummerFloofy', iconClass: 'social-icon--x', ariaLabel: 'SummerFloofy on X' },
  { id: 'bsky', label: 'Bluesky', url: 'https://bsky.app/profile/summerfloofy.bsky.social', iconClass: 'social-icon--bsky', ariaLabel: 'SummerFloofy on Bluesky' },
  { id: 'pixiv', label: 'Pixiv', url: 'https://www.pixiv.net/en/users/115468010', iconClass: 'social-icon--pixiv', ariaLabel: 'SummerFloofy on Pixiv' },
  { id: 'twitch', label: 'Twitch', url: 'https://www.twitch.tv/summerfloofy', iconClass: 'social-icon--twitch', ariaLabel: 'SummerFloofy on Twitch' },
  { id: 'vgen', label: 'Vgen', url: 'https://vgen.co/SummerFloofy', iconClass: 'social-icon--vgen', ariaLabel: 'SummerFloofy on Vgen' },
  { id: 'kofi', label: 'Ko-fi', url: 'https://ko-fi.com/summerfloofy', iconClass: 'social-icon--kofi', ariaLabel: 'SummerFloofy on Ko-fi' },
  { id: 'email', label: 'Email', url: 'mailto:Summerfluffball@gmail.com', iconClass: 'social-icon--email', ariaLabel: 'SummerFloofy on Email' },
];
```

## `app-social-links` (`src/app/components/social-links/social-links.ts`)

`selector: 'app-social-links'`. Inputs:

```ts
ids = input.required<SocialId[]>();
variant = input<'plain' | 'chip'>('plain');
```

Template: `@for (id of ids(); track id)` over `SOCIALS.find(s => s.id === id)`, rendering one `<a>` per entry —
`[href]`, `[attr.aria-label]="social.ariaLabel"`, `target="_blank" rel="noopener noreferrer"` only when
`!social.url.startsWith('mailto:')` (decision #5), a `<span class="social-icon" [class]="social.iconClass"
aria-hidden="true">` inside, and the variant's class computed via a `TONE_CLASSES`-style lookup (matching
`SectionHeader`'s existing pattern — plain Tailwind utility composition, no new stylesheet needed since nothing
here needs a gradient/pseudo-element technique):

- `plain`: `inline-flex items-center justify-center text-on-light-heading text-xl transition-colors
  hover:text-on-light-heading focus-visible:outline-2 focus-visible:outline-offset-2
  focus-visible:outline-brand-strong` (the `text-xl` is newly baked in here — footer's wrapper had it before,
  dropped from the wrapper as redundant once the component owns sizing per decision #4).
- `chip`: `inline-flex items-center justify-center rounded-2xl border border-border bg-white/65 p-4 text-5xl
  transition-colors hover:bg-brand-subtle focus-visible:outline-2 focus-visible:outline-offset-2
  focus-visible:outline-brand-strong sm:p-5 sm:text-6xl md:text-5xl` (about/contact's existing chip size,
  standardized onto donate too per decision #2).

**TDD test plan**: renders one link per id, in the given order; each link's `href`/`aria-label`/icon class
matches the corresponding `SOCIALS` entry; omits `target`/`rel` for the `mailto:` entry, includes them for
`http(s)` entries; applies the plain classes by default; applies the chip classes when `variant="chip"`.

**Migration** (wrapping containers stay exactly as they are — only the repeated `<a>` children get replaced):
- `about.html`: 6 chip `<a>`s → `<app-social-links [ids]="['x','bsky','pixiv','twitch','vgen','kofi']"
  variant="chip" />`, inside the same `grid` wrapper.
- `contact.html`: 4 chip `<a>`s → `<app-social-links [ids]="['x','bsky','vgen','email']" variant="chip" />`,
  inside the same `grid` wrapper.
- `footer.html`: 6 plain `<a>`s → `<app-social-links [ids]="['x','bsky','pixiv','twitch','vgen','kofi']"
  variant="plain" />`, inside the same wrapper with its now-redundant `text-xl` dropped (`flex flex-wrap
  items-center gap-3`). The separate `mailto:` text link stays untouched.
- `donate.html`: 1 chip `<a>` → `<app-social-links [ids]="['kofi']" variant="chip" />`, inside the existing
  `[appCard tone="middle"]` panel — panel and iframe embed untouched.

## Explicitly out of scope for Stage 3c

- Anything about the iframe embed itself, or the `max-w-lg` panel wrapping donate's chip (Stage 3b's
  `[appCard]`, already correct) — only the chip `<a>` inside it is touched.
- Commission's radio-styled option labels, navbar buttons, streaming — unrelated, already excluded in Stage 3b
  and still not this stage's job.
- Adding an `email` icon to footer's plain row — footer's separate `mailto:` text link stays exactly as-is
  unless the owner asks otherwise.

## Process

Branch `refactor/phase-3c-data-consolidation` off `working`. TDD for both new pieces. Diff-decides-merge — direct
merge if the visual diff comes back `0.00%` everywhere (this stage's markup should render pixel-identically to
today's, since it's consolidating already-matching styling rather than changing it), a PR otherwise.

## Rollback

Lives on its own branch until merged, independent of 3a/3b. Small commits (`app-brand` first, `SOCIALS` +
`app-social-links` second, migration third) revert individually if needed.
