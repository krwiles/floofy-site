# 18 — Phase 6 stage 3 plan: split `commission.html`

Settled via `grill-with-docs` (grilling + domain-modeling), 2026-09-28. New glossary terms (**Artwork category**,
**Usage type**) are in `/CONTEXT.md`, replacing the ad hoc "Category" mention and the code's "commercial type"
naming. Splits the roadmap's single Stage 3 item into 3 sub-stages, each its own PR against `working`, matching
Phase 6's own precedent of never stacking.

## Why this got bigger than "split a template"

Reading `commission.ts`/`.html` in full during grilling surfaced two real, pre-existing inconsistencies that the
owner chose to fix now rather than carry into the split: the same illustration/chibi/emote concept was modelled
twice, with mismatched spelling (gallery's `category: 'emote'` vs commission's `CommissionTypeId: 'emotes'`), and
the pricing/usage vocabulary was inconsistent (`CommercialTypeId` in code vs "usage type" everywhere a visitor
sees it). Both get fixed as part of this stage, not deferred.

## Facts found before designing

- The 3 pricing cards are structurally identical (title, price, carousel, 5 labelled bullet lists, a CTA) but
  differ in carousel aspect ratio and how many items each list has — see the table in the grilling transcript.
- The 7 terms cards come in 4 shapes: plain bullets (Revisions, Pricing, Payment), a numbered list (Workflow), a
  plain paragraph (Communication), and grouped sub-lists (Artwork Usage: 4 groups, 3 with a live percent add-on;
  Terms of Service: 8 groups, smaller text). Their 3-column placement is a manual balance (ToS alone in its own
  column, since it's long), not derived from card order.
- `I18nService.t()` only returns strings; `nav()` already reads a JSON section directly as structured data — the
  same pattern gives us `list()` for array-shaped content.
- The backend Lambda (`floof-comm/lambda_function.py`) treats `commissionType` as free text, only length-checked
  and capitalized into a notification-email subject — changing the value it receives from `'emotes'` to
  `'emote'` is a cosmetic email-wording change, not an API break.
- 3 form fields (reference links, deadline, additional notes) are still hand-written `<label>` markup rather than
  `app-form-field`, and 2 of them (reference links, additional notes) have `maxLength` validators with nowhere to
  show the resulting error.

## Decisions locked this round

- **The page becomes an outline**: hero + `PricingSection` + `TermsSection` + `RequestForm`, ~30 lines. No
  separate "usage picker" component — Phase 5's `RadioGroup` already is that.
- **`ArtworkCategory`** (`'illustration' | 'chibi' | 'emote'`) replaces both gallery's `category` and commission's
  `CommissionTypeId`, defined once in `models/`. Spelling settles on `emote` (singular).
- **"Commercial type" is renamed to "usage type" everywhere**: `CommercialTypeId` → `UsageTypeId`,
  `CommercialTypePricing` → `UsageTypePricing`, `pricing.json`'s `commercialTypes` → `usageTypes`,
  `getCommercialTypePricing` → `getUsageTypePricing`, parameter names throughout.
- **Card list content becomes real arrays** in `en.json`/`ja.json` (e.g. `includes: [...]` replacing
  `includes_1`/`includes_2`/`includes_3`), reshaped by script with no re-translation. Grouped cards
  (Artwork Usage, ToS) become an array of `{ id, label, items: string[] }` — `id` is the old key name
  (`promotion`, `ownership_licensing`, …), so 3c can attach Artwork Usage's percent add-ons by
  `UsageTypeId` rather than by array position. Two readers, one per shape: `I18nService.list(key): string[]`
  and `I18nService.groups(key): ListGroup[]`.
- **Which list-categories each pricing card has, and the terms' 3-column groupings, are typed code constants**
  (not translated content) in a feature-local `commission-content.ts`.
- **`TermsCard`** supplies chrome only (title, tone, optional scroll-anchor id) and projects its body via
  `<ng-content>`; **`LabelledList`** renders one bulleted/numbered/grouped list and is used inside that
  projection. No "kind" flag on `TermsCard` itself.
- **Cross-section wiring stays coordinated by the page**: `Commission` is the one place that legitimately knows
  about all three siblings. `PricingSection` emits a pick event with the chosen `ArtworkCategory`; `RequestForm`
  takes that as an input it applies to its own form model; the form's 3 "?" buttons emit outputs `Commission`
  forwards to a shared `scrollToElement` helper (moved out of commission-only code into
  `shared/utils/scroll-to-element.ts`, since nothing about it is commission-specific).
- **Standardize while splitting, not a pure move**: the 3 hand-rolled fields move onto `app-form-field` (gaining
  real error display); Terms of Service's body text grows from `11px` to Artwork Usage's `14px`/`text-sm`, so
  both grouped cards match. This means **stage 3c does not produce a 0.00% visual diff** — expected, real changes
  reviewed by hand, same as Stage 3b/3c's precedent for a real design change.

## Sub-stages

### 3a — Rename + unify (no visual change)

`ArtworkCategory` replaces `CommissionTypeId` and gallery's local `category` type; `CommercialTypeId` →
`UsageTypeId` and all its call sites; `pricing.json`'s `commercialTypes` → `usageTypes`. Verify: `tsc`, full
suite, prod build, **0.00% visual diff** (pure rename, nothing rendered changes).

### 3b — i18n list restructure (commission page intentionally broken until 3c)

A one-off script (run once, not committed) reshapes `en.json`/`ja.json`'s `commission.cards.*` and
`commission.terms.*` numbered keys into arrays. Both files share one key structure (checked), so one script
covers both:

| Where                                                 | Becomes                                                                                                                                     |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `cards.{chibi,emotes,illustration}`                   | `includes`, `excludes`, `details`, `notes`, `turnaround` → `string[]`; `title`, `cta` unchanged                                             |
| `terms.{pricing,revisions,workflow,payment}`          | `item_N` → `items: string[]`; `title` unchanged                                                                                             |
| `terms.artwork_usage`                                 | `groups: ListGroup[]` in the old order (`personal`, `promotion`, `distribution`, `products`, `unsure`); `unsure` has no items → `items: []` |
| `terms.tos`                                           | `groups: ListGroup[]` in the old order                                                                                                      |
| `terms.communication`, `kicker`/`title`/`description` | unchanged (not lists)                                                                                                                       |

Adds `ListGroup` (`{ id: string; label: string; items: string[] }`) in `models/`, plus `I18nService.list(key)` and
`I18nService.groups(key)`. Both follow `nav()`'s pattern: they read the current locale's JSON directly and
return `[]` for a missing key. Unit-tested against the real JSON.

**Nothing consumes the new shape yet, so the commission page's cards and terms render raw keys (e.g.
`commission.cards.chibi.includes_1`) until 3c.** That's accepted: the site is pre-launch, and no shims or
duplicated data are added to keep the old keys working. The `cards.emotes` key is left as-is here and is
3c's call.

Verify: the script's own lossless check (every old string appears exactly once in the new shape, in the same
order, in both locales), `tsc`, full suite, prod build. No visual diff for this stage; other routes are
untouched, so they're covered by 3c's diff.

### 3c — Component split + standardization (real, reviewed visual change)

Build `PricingCard`, `TermsCard`, `LabelledList`, `PricingSection`, `TermsSection`, `RequestForm`; wire them per
"Cross-section wiring" above; consume `I18nService.list()`/`groups()` and the new `commission-content.ts` constants; migrate
the 3 hand-rolled fields onto `app-form-field`; standardize ToS's text size. Verify: `tsc`, full suite, prod
build; visual diff **will show real changes** on the commission route only — captured, reviewed against the
standardization list above (not expected 0.00%), no code review needed elsewhere since other routes are
untouched.

Carried over from 3a's review (not in 3a's scope, pick up here): `CommissionTypePricing` / `commissionTypes` /
`getCommissionTypePricing` still say "commission type" for what is now an `ArtworkCategory` — rename to the
glossary term; and `PricingService`'s lookups still take `id: string` rather than `ArtworkCategory` / `UsageTypeId`.

## Definition of done for this stage

- `commission.html` is an outline: hero + 3 section components, no page template over ~150 lines anywhere in the
  new structure.
- No repeated 3+ line markup block for a pricing or terms card.
- `ArtworkCategory`/`UsageTypeId` used consistently; no remaining `CommissionTypeId`/`CommercialTypeId` reference.
- Reference-links/deadline/additional-notes fields show validation errors like every other field.
- `docs/refactor/05-roadmap.md` and memory updated to what actually shipped.
