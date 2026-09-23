# Floofy Site — Domain Glossary

Vocabulary for this project's design system and content model. This file is a glossary only — no implementation
detail, no file paths as instructions, no code. See `docs/refactor/` for how these concepts are actually built.

## Tone

A section's place on the light → dark background scale. There are three: **Light**, **Middle**, **Dark** — each
with an **Alt** variant (an alternate shade of the same tone, used to zebra-stripe consecutive sections of the same
tone). Every tone has its own heading, body, and subtle-body text colors, so text always has a correct pairing for
the tone it sits on. Tone is a property of a *section*, not of the page as a whole — a single page moves through
several tones top to bottom.

## Card

An opaque content container with a tinted gradient fill and a soft shadow, used for pricing tiles, terms tiles, the
about-page social block, and similar grouped content. A Card is always drawn *for* a specific Tone (its fill colors
derive from that tone's palette) and has a plain and a "special" (featured) variant per tone.

**Not the same as:**
- **Glass Panel** — a *translucent*, blurred surface (backdrop-filter) used specifically for the panel that sits
  over a hero's background image. Glass Panels are not tied to a Tone the way Cards are; they read correctly over a
  photographic background rather than a flat section fill.
- **Card Shadow** — the shadow alone, with no fill or border, used standalone where something needs elevation
  (e.g. an embedded iframe, a plain image) without becoming a full Card. Still tone-aware like a full Card — each
  Tone has its own shadow depth/color (matching the shadow already baked into that Tone's Card), so an elevated
  image or plain container reads correctly whichever tone's section it sits in.

**Status (2026-09-22):** the Card and Glass Panel styles were finished by the owner as a system; applying them
site-wide (reconciling the ad-hoc manually-styled cards with the finished system, including standardizing the
Card Shadow radius that varied per usage) is Phase 3b's work — see `docs/refactor/10-phase-3b-plan.md`.

## Button

A clickable call-to-action. Has two independent properties, same pattern as a Card: **Variant** (its shape/
hierarchy — Primary, Secondary, Pill) and **Tone** (which section background it sits on — Light, Middle, Dark, the
same three as a section's Tone). Unlike a Card, whose fill matches its Tone's own color family so it reads as a
native surface, a Button's fill *contrasts* against its Tone so it always stands out rather than blending in — a
Light or Middle Button renders darker than its background, a Dark Button renders lighter — mirroring the contrast
direction of that Tone's heading/body text colors rather than its Card's.

## Hero color

The background color behind a page's hero section, shown before/around its hero image while that image loads or in
the gaps its mask leaves. Each page's Hero color is **sampled directly from that page's own hero image** — it is
not an independently chosen design color, and the two are not expected to relate to each other across pages. If a
page's hero image changes, its Hero color should be re-sampled from the new image, not reused from the old one.

## Social link

A link to an external profile or platform. Seven networks: X, Bluesky, Pixiv, Twitch, Vgen, Ko-fi, and Email
(a `mailto:` link, still counted as a Social link even though it isn't a "profile" the way the others are — it
gets the same icon-link treatment). Has two visual presentations in use across the site: **Plain** (an inline
icon with no border or fill, used in the footer) and **Chip** (a bordered, filled button with a larger icon,
used on the about/contact/donate pages). Which networks appear, and in which presentation, is chosen per page —
there is no single fixed set shown everywhere. Every Social link's accessible name follows "SummerFloofy on
{Network}" (e.g. "SummerFloofy on Email") — a fixed convention, not computed from the network name at render
time, so a network whose accessible name should read differently would need that decided explicitly, not left
to a template default.

## Brand

The logo image + "Floofy" wordmark linking home, shown in both the navbar and the footer. Has a shared core (the
image, the wordmark text, and the link itself) but is **not a single fixed presentation** — each place it
appears wraps that core in its own surrounding structure for its own reasons: the footer wraps it in a heading
(it's the accessible name for that footer landmark), the navbar gives it a one-time entrance animation on page
load (irrelevant to the footer, which isn't part of that load sequence). Treat those wrappers as belonging to
where Brand appears, not as part of Brand itself.

## Lightbox backdrop

The dark scrim behind an enlarged image in the gallery lightbox. Distinct from a Hero color — it is a fixed neutral
chosen for contrast against art of any color, not sampled from anything.

## Image asset

A picture's metadata — source, alt text, width, height. One shared shape used everywhere a picture is rendered:
the gallery grid, the lightbox, and both kinds of Carousel below. Previously two overlapping ideas (a "carousel
image" and a separate "gallery image" with an unused thumbnail/full-size split) — consolidated into one, since the
thumbnail split was never actually implemented differently in practice, only declared and then left unused.

## Carousel

Not one thing — two distinct presentations, each its own component, not two modes of a shared one:

- **Rolling carousel**: a continuously auto-scrolling horizontal strip of images, each sized to a shared height
  with its own natural aspect ratio preserved, looping seamlessly. No manual controls, no indicators — a purely
  flowing preview (home page's gallery preview).
- **Slideshow carousel**: shows exactly one cropped image at a time, auto-advancing on a delay with a directional
  slide transition, wrapping endlessly. Navigated manually via hover/focus-revealed arrows or touch swipe. No
  indicators either (commission's pricing-card image carousels).

Both replace the site's previous single Carousel, which was a thin wrapper around Flowbite's own carousel JS and
matched neither presentation cleanly (fixed grouped slides, a hardcoded shared id that broke with more than one
instance on a page).
