# 09 — Phase 3 execution plan (primitives)

Concrete plan for `05-roadmap.md` → Phase 3, settled 2026-09-22 via `mattpocock-skills:grill-with-docs`
(`grilling` + `domain-modeling`). **This document is a plan. Nothing in it has been executed** beyond the
`CONTEXT.md` update already committed this session.

Phase 3 is split into three sub-phases, each its own branch and merge decision, because the 9 primitives it covers
have very different risk profiles. Stage 3a is fully specified below, ready to execute. Stages 3b and 3c have their
decisions settled but their exact implementation deferred to a focused session immediately before each is built —
writing full API detail for a card/button system that gets applied to every page felt premature this far ahead.

## Decisions locked in this round

| # | Decision | Answer |
| --- | --- | --- |
| 1 | Decomposition | Three stages: **3a** motion & structure (zero visual risk), **3b** card/button (real visual change everywhere), **3c** social-links/brand (data-driven consolidation) |
| 2 | Card system shape | `[appCard]` attribute directive, not a component — no required DOM structure, the element keeps its own tag/content. Checked against the Angular docs and the frontend-design skill first: neither gave a directly-quotable verdict on this specific architectural question (the docs search returned an unrelated page; frontend-design covers aesthetics, not component structure) — this rests on general Angular convention (directives add behavior/classes without a new view; components own a template), not a verified quote |
| 3 | `app-social-links` variance | One typed `SOCIALS` array; component takes `ids` (which networks, in order) and `variant: 'plain' \| 'chip'` (which visual treatment) — each real call site already differs and keeps differing |
| 4 | Testing | TDD (failing test first) across all of Phase 3, including template-shaped primitives — taken literally per the owner's answer, not the narrower logic-only scope this plan initially proposed |
| 5 | Stage 3b merge | Always a PR, regardless of what the visual diff shows — applying card/button everywhere is a deliberate design landing, not a mechanical reorganization a diff can validate alone |
| 6 | File locations for 3a-3c | The current flat structure (`src/app/components/`, `src/app/services/`, `src/app/pipes/`), matching existing siblings (`Carousel`, `ParallaxSection`). **Not** the target `core/`/`shared/`/`features/` layout from `03-target-architecture.md` — the roadmap already places Phase 6 (Restructure) *after* Phase 3 for exactly this reason; building ahead of it would just create a layout Phase 6 has to partially re-normalize |

## New domain term this round

Added to `CONTEXT.md`: **Social link**, with two presentations (**Plain** — footer's inline icon, no fill/border;
**Chip** — about's bordered filled button) and no single fixed set of networks shown on every page.

## Facts found this session

- Exact current counts (re-verified fresh, not from earlier session notes, which had drifted for `contact.html`):
  `.animate-on-scroll` — about 17, commission 47, contact 7, donate 3, home 27, reviews 9 (**110 total**, 0 on
  gallery/streaming). `.flourish` spans — **42 total**, of which **13** are the byte-identical "between sections"
  divider pattern (`f-full-wide absolute left-1/2 z-10 hidden h-16 -translate-x-1/2 -translate-y-1/2
  text-border-strong md:inline-block`, confirmed identical via grep across all 8 pages, zero variation) and **29**
  are genuine `app-flourish` candidates (hero flourishes, heading-adjacent `f-end`/`f-end-short`, etc.).
- Social links genuinely differ per page, not just in which networks but in *presentation*: footer and about both
  show the same 6 networks (x, bluesky, pixiv, twitch, vgen, ko-fi) but footer renders them as plain inline icons
  while about renders them as bordered "chip" buttons with larger icons. contact shows only 4 (x, bluesky, vgen,
  email) as chips — and contact is the only page that treats email as a social icon; footer renders it as a plain
  `mailto:` text link instead. donate shows only ko-fi.
- Found a 4th button-shaped element while checking: `about.html`'s fan-art hashtag link is a small pill
  (`rounded-full`, `px-4 py-1`, `text-sm tracking-widest`) but uses the exact same `bg-brand` /
  `hover:bg-brand-subtle` / focus-ring treatment as the primary CTA buttons — a size/shape variant of the same
  system, not a separate component. `commission.html` also has 3 tiny circular "?" info-trigger buttons
  (`h-5 w-5 rounded-full border`, lines 649/736/878) that are a different kind of control entirely (tooltip
  triggers, not CTAs) — out of scope for `appButton`, noted for whoever eventually builds a tooltip primitive.
- `Reviews` still does `inject(App, { optional: true })` purely to call `app?.observerInit()` after fetching — the
  exact hack `appReveal`/`RevealService` is meant to remove, confirmed still present and unchanged.
- `App.observerInit`/`ngOnInit`/`ngAfterViewInit`/`ngOnDestroy` are unchanged since the start of this refactor
  (Phase 1 only touched `App`'s `changeDetection` line, not this logic). The Phase 0 `IntersectionObserver` test
  stub in `app.spec.ts` exists solely to make this logic safe to test — it becomes dead weight the moment this
  logic is deleted in stage 3a.

## Stage 3a — Motion & structure (ready to execute)

Zero visual risk: every change here reproduces exactly what's on screen today, just from a shared, self-registering
mechanism instead of a global DOM scan glued to router navigation.

### `RevealService` (`src/app/services/reveal.service.ts`)

`providedIn: 'root'`. Holds one `IntersectionObserver` (same options as today: `root: null, rootMargin: '0px',
threshold: 0.2`), created lazily on first `register()` call (not eagerly in a constructor) so it doesn't run in
environments without `IntersectionObserver` unless something actually registers. `inject(DOCUMENT)` for
`matchMedia`/testability instead of the raw global.

```ts
register(element: Element): void   // starts observing; if prefers-reduced-motion, adds 'animate-in' immediately instead
unregister(element: Element): void // stops observing (no-op if already revealed/unobserved)
```

On intersect: add `'animate-in'` to the target, call `observer.unobserve(target)` (matches today's "reveal once"
behavior exactly — no `revealOnce` input needed since nothing currently needs the opposite, per YAGNI).

**TDD test plan** (write these first): register() calls observer.observe with the element; an intersecting entry
gets `animate-in` added and is unobserved; unregister() stops observing an element that hasn't intersected yet;
under `prefers-reduced-motion: reduce`, `animate-in` is added immediately on register without waiting for
intersection. Use a fake `IntersectionObserver` class and `vi.stubGlobal`/mocked `matchMedia`, same technique
already used in `app.spec.ts`.

### `appReveal` directive (`src/app/directives/reveal.ts`)

`selector: '[appReveal]'`. No inputs. `host: { class: 'animate-on-scroll' }` — the directive supplies the CSS class
itself now, callers no longer add it by hand. Constructor/`ngOnInit` calls `RevealService.register(this.elementRef.nativeElement)`;
`ngOnDestroy` calls `unregister`.

**TDD test plan**: creating the directive registers its host element with `RevealService` (spy); destroying it
unregisters. Two tests, `RevealService` provided as a test double.

**Migration** (110 usages across 6 files): replace `class="animate-on-scroll ...other classes..."` with
`appReveal` attribute + `class="...other classes..."` (drop just the literal `animate-on-scroll` token, keep
everything else). Delete `App.observerInit`/`ngOnInit`'s router-subscription-triggered re-scan/`ngAfterViewInit`/
`ngOnDestroy` entirely — `App` becomes just `initFlowbite()` in `ngOnInit` (still needed until Flowbite's JS is
removed in Phase 4) with no lifecycle interface beyond that. Delete `Reviews`' `inject(App, { optional: true })`
and its `app?.observerInit()` call — newly-rendered review cards register themselves via the directive automatically,
no parent-reaching needed. Delete the `IntersectionObserver` stub from `app.spec.ts` (no longer exercises that
code path) and add a test asserting `App` no longer has an `observerInit` method (guards against regression).

### `app-flourish` (`src/app/components/flourish/flourish.ts`)

`selector: 'app-flourish'`. Inputs: `variant = input.required<'end' | 'end-short' | 'full' | 'full-wide'>()`,
`flip = input(false)`. Inline template (small component, per the Angular guide): a single `<span>` with
`class="flourish"` plus `[class]="'f-' + variant()"` and `[class.flip]="flip()"` (the variant values already match
the existing CSS suffix exactly — `f-end`, `f-end-short`, `f-full`, `f-full-wide` — no mapping needed), `aria-hidden="true"`.

**TDD test plan**: renders with class `f-full` when `variant="full"`; renders with class `flip` when `flip` is true;
omits `flip` class when false (default).

**Migration** (29 usages): replace each `<span class="flourish f-{variant} ...positioning/color classes..."
aria-hidden="true"></span>` with `<app-flourish variant="{variant}" [flip]="true|omit" class="...positioning/color
classes..." />` — positioning and color utility classes stay on the host element via Angular's automatic
attribute/class forwarding onto the component's root element.

### `app-section-divider` (`src/app/components/section-divider/section-divider.ts`)

`selector: 'app-section-divider'`. No inputs at all — confirmed zero variation across all 13 current usages. Inline
template: `<span class="flourish f-full-wide absolute left-1/2 z-10 hidden h-16 -translate-x-1/2 -translate-y-1/2
text-border-strong md:inline-block" aria-hidden="true"></span>` (reuses `app-flourish` internally, or duplicates the
one line directly — either is fine given there's no variation to parametrize).

**TDD test plan**: renders the expected classes; that's the whole component, one test is enough.

**Migration** (13 usages): replace each occurrence with `<app-section-divider />`.

### `app-section-header` (`src/app/components/section-header/section-header.ts`)

`selector: 'app-section-header'`. Inputs: `eyebrow = input.required<string>()`, `title = input.required<string>()`,
`description = input<string>()`, `tone = input.required<'light' | 'middle' | 'dark'>()`,
`flourish = input(true)`. Already-translated strings in, matching the established pattern elsewhere in this
codebase (`Carousel`, `ParallaxSection` take plain values; the caller resolves `| translate` before binding).
Renders the eyebrow/title/description/flourish stack with each part carrying `appReveal` individually (matching
today's per-element reveal exactly, not a single wrapping reveal — they sit close enough together that the visual
difference would be negligible either way, but per-element keeps behavior identical rather than assumed-equivalent).

**TDD test plan**: renders eyebrow, title, and description when all three are provided; omits the description
paragraph when not provided; shows the flourish by default; hides it when `flourish="false"`; applies the right
tone's text-color classes for each of `light`/`middle`/`dark`.

**Migration**: ~20 occurrences of the eyebrow/`h2`/description/flourish block get replaced with one
`<app-section-header eyebrow="..." title="..." description="..." tone="...">` call each. Exact list enumerated at
execution time (this is the one 3a item with real per-instance content to carry over correctly, not just a class
swap — worth double-checking each replacement against its original rendered text/tone during execution rather than
assuming the pattern matched everywhere).

### `app-section` (`src/app/components/section/section.ts`)

`selector: 'app-section'`. Inputs: `tone = input.required<'light' | 'light-alt' | 'middle' | 'middle-alt' | 'dark' |
'dark-alt'>()`, `pattern = input<'stars' | 'circles'>()`, `parallaxStrength = input(0.6)`,
`width = input<'6xl' | '7xl'>('7xl')`, `ariaLabel = input<string>()`. Content via `<ng-content>`. Internally wraps
in `app-parallax-section` only when `pattern()` is set (mirrors today's split between plain `<section
class="bg-section-...">` and `<app-parallax-section>`-as-pattern-backdrop usages).

**TDD test plan**: renders the right `bg-section-*` class for each tone value; wraps content in
`app-parallax-section` when `pattern` is provided; renders a plain `<section>` with no parallax when it isn't.

**Migration**: deferred detail — enumerate exact call sites (`<section class="bg-section-...">` and the
pattern-only `<app-parallax-section>` wrappers) at execution time, same reasoning as `app-section-header`.

## Stage 3b — Surfaces & controls (decisions settled, detail deferred)

**Goes through a PR regardless of visual-diff result** (decision #5). Before writing its own concrete plan:
enumerate every current card-shaped element (`.card-on-section-*`, `.glass-panel`, `.card-shadow`, and the ~50
inline `card-shadow rounded-4xl border ...` strings) and every button-shaped element (the 3 already-identical home
CTAs, the 2 matching commission/reviews submit buttons, `streaming.css`'s `.stream-cta*`, donate's chip link, and
the about hashtag pill) with their exact current classes side by side, then decide `appButton`'s variant names
(`primary`/`secondary`/`pill` at minimum, per the facts found this session) before writing any code.

- `[appCard]` directive: `tone` (`light | light-alt | middle | middle-alt | dark | dark-alt`), `special` (boolean,
  the "featured" variant), `shadowOnly` (boolean, for `.card-shadow`-only usages with no fill), `glass` (boolean,
  for `.glass-panel` usages — mutually exclusive with `tone`/`special`, worth deciding whether that's a runtime
  assertion or just documented).
- `a[appButton]` / `button[appButton]`: `variant` (`primary | secondary | pill` — dropped `ghost`/`danger` from the
  original inventory proposal, nothing in the current codebase needs them; add back only when something does),
  `size` if the pill turns out to need one beyond what `variant="pill"` already implies.

## Stage 3c — Data-driven consolidation (decisions settled, detail deferred)

- `SOCIALS: Social[]` (`src/app/data/socials.ts` or similar): `{ id, label, url, iconClass }`, one entry per network
  including a new `email` entry (`mailto:Summerfluffball@gmail.com`) so contact's icon-treated email link and
  footer's plain-text one can both be reconsidered from the same data if desired (footer keeps its own plain-text
  treatment unless the owner wants it changed — not assumed here).
- `app-social-links`: `ids = input.required<SocialId[]>()`, `variant = input<'plain' | 'chip'>('plain')`.
- `app-brand`: no inputs — confirmed byte-identical markup between navbar and footer already.

## Explicitly out of scope for Phase 3

- Anything Flowbite-related (carousel, navbar disclosure) — Phase 4.
- Forms (`app-form-field`, `appControl`, `FormSubmission`, etc.) — Phase 5.
- The commission-page tiny info-trigger buttons found this session — no tooltip primitive exists yet; noted for
  whichever future phase builds one.
- Moving any of these new files into `core/`/`shared/`/`features/` — that's Phase 6, after Phase 3 by design.

## Process (stages 3a and 3c)

Branch per stage off `working` (`refactor/phase-3a-motion-structure`, etc.), small commits, TDD for every new unit.
Visual diff at the end decides direct-merge (`0.00%` everywhere) vs. PR, same as Phase 0/2. Stage 3b always gets a
PR per decision #5.

## Rollback

Each stage lives on its own branch until merged; a stage that goes sideways doesn't block the others. Small commits
within a stage revert individually if needed.
