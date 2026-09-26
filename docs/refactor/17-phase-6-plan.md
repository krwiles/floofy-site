# 17 — Phase 6 plan: Restructure

Settled via `grill-with-docs` (grilling + domain-modeling), 2026-09-26. New glossary terms (Artwork/Graphic/Icon,
Gallery collection) are in `/CONTEXT.md`. This document is the overall plan and sequencing; each stage below gets
its own detailed spec, settled just before it executes (same precedent as Phase 3's 3a/3b/3c and Phase 4/5).

## What's in this phase

Phase 6 was a six-item rough checklist. Grilling split it into **four stages, done one at a time, each its own
branch and PR** (never stacked — the branch-mixup lesson from Phase 5: every PR targets `working` directly), and
parked one item as a future idea.

| Stage | Work                                        | Spec status                                           |
| ----- | ------------------------------------------- | ----------------------------------------------------- |
| 1     | Folder restructure                          | Settled below                                         |
| 2     | Asset naming/organisation + `gallery.json`  | Settled below (manifest generated, awaiting owner)    |
| 3     | Split `commission.html` into sub-components | Needs its own grilling round before it starts         |
| 4     | Script loading + `StreamScheduleService`    | Needs its own grilling round before it starts         |
| —     | Gallery lightbox/grid a11y rebuild          | **Parked** — moved to "Open ideas" in `05-roadmap.md` |

Order matters: Stage 1 first, since it changes every file's path and every later stage's diff would otherwise land
on old paths.

## Decisions locked this round

- **Stage split and order** as above; the lightbox/grid rebuild (focus trap, keyboard, `ScrollLockService`,
  invisible defer placeholder) is skipped for now, kept as an idea.
- **Folder layout diverges from `03-target-architecture.md`** on purpose: services stay in one `services/` folder
  (owner preference), there is no `core/`, models stay top-level, and route folders are `pages/` (each is one
  routed page, and that's what the owner calls them) rather than `features/`.
- **`gallery.json` is a real `.json` file**, like `pricing.json`, and is the source for the gallery page and the
  home/commission carousels — nothing else.
- **Each entry lists where it appears** (`showIn`), independent of its category. Expandable to other pages later.
- **Everything else stays static**: hero images, avatar/logo, badges, patterns stay as plain paths in templates.
- **Asset folders are `artwork/`, `graphics/`, `icons/`**, flat inside each; the kind of artwork lives in the
  entry's `category`, not a subfolder.
- **The 3 unreferenced files are kept** (`A6757DF0.jpeg`, `G25GkrnbsAAv-8K.jfif`, `icon.png`); `icon.png` is a
  high-res logo and goes in `graphics/`.
- **Two stale notes are dead**: gallery.html's "dropdown / direct-URL" TODO (Phase 7's routing item already tracks
  it) and Phase 0's "ask before touching the unfinished section" note (that section is in `home.html`, is fully
  built, and needs nothing).

## Stage 1 — Folder restructure (parity-preserving, mechanical)

Target layout under `src/app/`:

```
pages/       home about streaming gallery reviews donate contact commission   (each: .ts .html .css .spec.ts)
layout/      navbar footer
shared/
  components/   hero, section, section-header, section-divider, flourish, parallax-section, rolling-carousel,
                slideshow-carousel, language-toggle, social-links, brand, jump-button
  directives/   button, card, control, reveal
  pipes/        translate.pipe
  forms/        form-field-group, radio-group, checkbox-field, form-status, required-marker, field-error-list,
                form-submission.ts
services/    api, gallery-image, i18n, parallax-scroll, pricing, reveal
models/      (unchanged)
config/      (unchanged)
utils/       (unchanged)
```

Rules: one commit per folder move (`git mv`, so history follows); imports fixed by the compiler, not by hand-
hunting; routes update to `import('./pages/home/home')`; no class renames, no behavior changes. Also in this
stage: delete the two stale TODO comments in `gallery.html`, fix the stale Phase 0 note in the roadmap.

Verification: `tsc`, full test suite, prod build, and the scripted visual diff must come back **0.00% on all 8
routes × 3 widths** — since it changes no output, a clean diff is the whole proof. Per the established process,
a clean diff means Track B (diff-decides-merge), but this environment can't push directly to `working`, so it
opens as a normal PR.

## Stage 2 — Asset naming/organisation + `gallery.json`

Done together so each image gets described exactly once.

1. **Manifest** (done): `docs/refactor/asset-manifest.csv`, generated from file headers and source text only —
   no image was opened (art-privacy rule). One row per file in `src/assets/` (47), with `referencedIn` showing every
   source file that mentions it.
2. **Owner fills in** `newName`, `folder` (artwork | graphics | icons) and `alt`. `alt` is only required for files
   that will be in `gallery.json`. `suggestedFolder` is a guess by filename to override. Renames use lowercase
   kebab-case; `.jfif` becomes `.jpg` unless the owner gives another extension.
3. **Script** `git mv`s every file into its folder and rewrites every reference: templates, TS, CSS `url()`s,
   `index.html`'s preload link, `src/robots.txt` (`Disallow` path must keep matching), `README.md`/
   `LICENSE-media.md`. `ng build` then catches any miss.
4. **`gallery.json`**: `{ src, alt, width, height, category: 'illustration' | 'chibi' | 'emote', showIn: string[] }`
   per entry, with `showIn` values `gallery`, `home`, `commission` (expandable). `GalleryImageService` becomes a
   thin reader that filters by `showIn`/`category` — the hardcoded arrays (and home.ts's third duplicate list)
   go away. Width/height are typed by hand, seeded from the manifest; no build-time script for now.
5. Verification: build, tests, visual diff. Expected 0.00% (same images, new paths). Anything else is a real
   finding.

Known consequences: deployed asset URLs change, so anything hotlinking the old ones breaks (accepted; `robots.txt`
already disallows crawling them).

## Stage 3 — Commission split (spec later)

`commission.html` is 661 lines. Roadmap intent: pricing card ×3, terms card ×7, form, usage picker. Grill before
starting: what actually varies between the 3 pricing cards / 7 terms cards, what the shared inputs are, what
stays in the page.

## Stage 4 — Script loading + streaming (spec later)

Twitch embed currently loads its script and builds the embed with `getElementById` inside `streaming.ts`, and the
"next stream" schedule maths has no tests. Twitter's `widgets.js` is loaded globally from `index.html` for a single
use on the about page. Intent: a `ScriptLoader` service, `StreamScheduleService` with tests, Twitter loaded lazily.
Grill before starting.

## Definition of done for this phase

- `pages/`, `layout/`, `shared/`, `services/` layout in place; no leftover flat page folders.
- All assets named and foldered per the manifest; no upload-ID filenames.
- Gallery page and both carousels fed from `gallery.json`; no hardcoded image arrays.
- Commission split, script loading/schedule extracted (stages 3–4), each verified.
- `docs/refactor/05-roadmap.md` and memory updated to what actually shipped.
