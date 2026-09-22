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
- **Card Shadow** — the shadow alone, with no fill or border. Used standalone where something needs elevation
  (e.g. an embedded iframe, a plain image) without becoming a full Card.

**Status (2026-09-22):** the Card and Glass Panel styles were finished by the owner as a system, but have **not yet
been applied** to the site. Most on-page cards today are still manually styled with ad-hoc Tailwind classes plus
the standalone Card Shadow. Reconciling the two is planned as its own piece of work (applying the finished Card
system across every page), not a side effect of any styling reorganization.

## Hero color

The background color behind a page's hero section, shown before/around its hero image while that image loads or in
the gaps its mask leaves. Each page's Hero color is **sampled directly from that page's own hero image** — it is
not an independently chosen design color, and the two are not expected to relate to each other across pages. If a
page's hero image changes, its Hero color should be re-sampled from the new image, not reused from the old one.

## Social link

A link to an external profile or platform (X, Bluesky, Pixiv, Twitch, Vgen, Ko-fi, or an emailer). Has two visual
presentations in use across the site: **Plain** (an inline icon with no border or fill, used in the footer) and
**Chip** (a bordered, filled button with a larger icon, used on the about page). Which networks appear, and in
which presentation, is chosen per page — there is no single fixed set shown everywhere.

## Lightbox backdrop

The dark scrim behind an enlarged image in the gallery lightbox. Distinct from a Hero color — it is a fixed neutral
chosen for contrast against art of any color, not sampled from anything.
