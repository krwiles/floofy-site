# Handoff: floofy-site refactor — Phase 6, Stage 3 (split commission.html)

Written 2026-09-28. For a fresh agent continuing this work, possibly on a different machine. This
doc is self-contained — a previous agent's local memory (`~/.claude/projects/.../memory/`) is
machine-specific and may **not** be present here, so the facts that matter are inlined below
rather than just referenced. **This file is a snapshot, not live state — verify against the repo
before trusting any of it, and delete or update it once Stage 3 is done.**

## 1. Where things stand right now

Repo: `krwiles/floofy-site`. Default work branch is `working` (not `main`). This is a solo-owner
Angular 22 site mid a long, phased refactor tracked in `docs/refactor/`.

- **Phases 0–5 are done and merged** into `working`. Full history: `docs/refactor/05-roadmap.md`.
- **Phase 6 ("Restructure") is in progress.** Its own plan: `docs/refactor/17-phase-6-plan.md`.
  - Stage 1 (folder restructure: `pages/`, `layout/`, `shared/{components,directives,pipes,forms}`,
    `services/`) — **merged**, PR #42.
  - Stage 2 (asset rename into `artwork/graphics/icons` + `assets/data/gallery.json` driving the
    gallery page and carousels) — **merged**, PR #43.
  - **Stage 3 (split `commission.html`) is the current task.** Plan doc:
    `docs/refactor/18-phase-6-stage-3-plan.md`. That plan is itself open as
    **PR #44** (docs only, branch `refactor/phase-6-stage-3-plan`, this file lives on it too) —
    check whether it has merged into `working` yet; if not, read it directly off that branch.
    Either order (merge #44 first, or start Stage 3a's own branch off `working` regardless) is
    fine — they don't stack.
  - Stage 4 (Twitch/Twitter script loading, `StreamScheduleService`) — not started, needs its own
    grilling round first.

**First thing to do**: `git fetch origin`, then check `git log origin/working` and
`git branch -r --merged origin/working` to confirm the above is still accurate before doing
anything.

## 2. The actual next task: Stage 3, sub-stage 3a

Full design is in `docs/refactor/18-phase-6-stage-3-plan.md` — read it before starting, don't
re-derive it. Short version: Stage 3 turned out bigger than "split a template" once the source was
actually read, so it's 3 sub-stages, **each its own PR against `working`, never stacked**:

- **3a (start here)**: pure rename/unification, no visual change.
  - `CommercialTypeId` → `UsageTypeId`, `CommercialTypePricing` → `UsageTypePricing`,
    `pricing.json`'s `"commercialTypes"` → `"usageTypes"`, `getCommercialTypePricing` →
    `getUsageTypePricing`, and every parameter name that says "commercial".
  - Unify gallery's `category` (in `models/gallery-entry.ts`) and commission's `CommissionTypeId`
    into one `ArtworkCategory` type (`'illustration' | 'chibi' | 'emote'`). Commission's old value
    `'emotes'` (plural) becomes `'emote'` (singular) to match gallery's spelling.
  - The backend Lambda (`aws_lambda/floof-comm/lambda_function.py`) treats `commissionType` as free
    text (only length-checked, capitalized into an email subject) — already confirmed this rename
    is safe, cosmetic email-wording change only, not an API break. Don't re-verify this from
    scratch, but don't blindly trust it either if the Lambda code has since changed.
  - Verify: `tsc` (both app and spec tsconfig), full test suite, prod build, and the scripted
    visual diff (`npm run baseline:capture`, `npm run baseline:diff` — see
    `scripts/visual-baseline/`) should come back **0.00%** on all 8 routes × 3 widths, since
    nothing rendered should change.
- **3b**: reshape `en.json`/`ja.json`'s commission card/terms content from numbered keys
  (`includes_1`/`_2`/`_3`) into real arrays; grouped cards (Artwork Usage, ToS) become an array of
  `{ label, items: string[] }`. Add `I18nService.list(key)` (same pattern as its existing `nav()`
  method, since `t()` only returns strings). Also 0.00% diff expected — the component doesn't
  consume the new shape yet, this stage only proves the data migration is lossless.
- **3c**: the real work — build `PricingCard`, `TermsCard` (chrome only, projects body via
  `ng-content`), `LabelledList`, `PricingSection`, `TermsSection`, `RequestForm`; wire them with
  `Commission` (the page) staying the cross-section coordinator; migrate the 3 hand-rolled form
  fields (reference links, deadline, additional notes) onto `app-form-field` (gaining real error
  display); standardize ToS's text size up to match Artwork Usage's. **This sub-stage will show a
  real, non-zero visual diff on the commission route by design** — that's expected, reviewed by
  hand (screenshots/computed styles, see the art-privacy rule below), not a bug to chase.

Do 3a → 3b → 3c in order, each merged before the next starts. Don't skip straight to 3c.

## 3. Rules that apply project-wide (not written down elsewhere in the repo)

- **Never view the site's own artwork.** The owner is an illustrator; the site's images are all
  rights reserved (`LICENSE-media.md`, `noai` meta tags) and the owner has explicitly said they'd
  rather their art not be sent to an AI provider's servers at all. Concretely: never `Read` an
  image file, never screenshot a page that renders art, never use a browser tool's screenshot
  action on such a page. Use file metadata, source text, DOM/console/network inspection, and
  *numeric* pixel-diffs (the `scripts/visual-baseline/` tooling reports only percentages and file
  sizes, never image content) instead. This matters directly for Stage 3c's visual verification.
- **Zoneless Angular testing gotcha**: this app has no `zone.js` dependency. In a unit test that
  uses a wrapping host component with plain (non-signal) properties, mutating a host property
  *after* the first `fixture.detectChanges()` is silently never picked up by a child's input
  signal — nothing marks the host dirty. Set every per-scenario value on the host **before** the
  first `detectChanges()` call (e.g. `Object.assign(fixture.componentInstance, overrides)` right
  after `TestBed.createComponent()`), not after.
- **Never stack PRs on top of each other in this repo.** Earlier in this project, stacked PRs
  merged into their (already-merged) base branch instead of `working` at least three times,
  including once at whole-PR scale requiring a `git rebase --onto` recovery. Every Phase 6 stage
  branches directly off `working` and PRs directly against `working`, even when stages are done in
  sequence.
- **Git commit trailer**: `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>` on every commit
  this agent makes.
- **PR description footer**: `🤖 Generated with [Claude Code](https://claude.com/claude-code)` on
  every PR description. (Check the current session's own attribution instructions — they may have
  changed since this doc was written; don't take this as authoritative if they say otherwise.)
- **`/code-review` was skipped, and disclosed as skipped in the PR body, for Stage 1 and Stage 2**
  (pure mechanical moves with the checks above covering them). Use judgment on 3a/3b (likely fine
  to skip similarly, disclosed) vs. 3c (real new components — probably worth running).
- **Owner's name/email**: Kurtis Wiles, `kurtisrwiles@gmail.com`, for attribution/identification
  only.

## 4. Suggested skills for the next agent

- **`mattpocock-skills:implement`** — to actually build Stage 3a (and later 3b, 3c). Pass it the
  relevant section of `docs/refactor/18-phase-6-stage-3-plan.md` as context; it already covers
  TDD-at-seams, typechecking, running the full suite once, and using `/code-review`.
- **`mattpocock-skills:grilling`** + **`mattpocock-skills:domain-modeling`** (together, as
  `mattpocock-skills:grill-with-docs` does) — needed again before Stage 4 (Twitch/Twitter script
  loading), which has had no planning session yet. Not needed for 3a/3b/3c — those are already
  fully specified in the plan doc.
- **`superpowers:using-superpowers`** — if this session doesn't already have Superpowers-family
  skills loaded, check what's available before assuming any workflow.

## 5. Loose threads, not blocking Stage 3

- Slideshow-carousel's `navigate()` can leave an internal `instant` flag stuck `true`, silently
  stopping auto-advance — a real, reported, still-unfixed bug from early in the project. Not
  Stage-3-related; mentioned here only so it isn't rediscovered from scratch. See `05-roadmap.md`
  for the full root-cause writeup if it resurfaces.
- Gallery lightbox/grid a11y rebuild (focus trap, keyboard nav, a real `ScrollLockService`) was
  explicitly parked by the owner during Phase 6 planning — see "Open ideas" in `05-roadmap.md`.
  Don't pick it up without the owner asking.

## 6. Once this handoff is no longer needed

Delete this file (or fold anything still useful into `docs/refactor/05-roadmap.md`) once Stage 3
is complete, or once the next agent has picked it up and this has served its purpose — it isn't a
permanent phase-record doc like the numbered ones in this directory, just a continuity aid.
