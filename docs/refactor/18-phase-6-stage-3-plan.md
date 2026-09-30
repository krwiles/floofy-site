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
- **The pricing cards' order, list order and carousel shapes, and the terms' 3-column groupings, are typed code
  constants** (not translated content) in a feature-local `commission-content.ts`. All three cards have the same
  five lists, so the list order is one shared constant (`['includes', 'excludes', 'details', 'notes',
'turnaround']`, each also naming its `commission.labels.<id>` heading), not per-card config (revised in the 3b
  grilling, 2026-09-29).
- **`TermsCard`** supplies chrome only (title, tone, optional scroll-anchor id) and projects its body via
  `<ng-content>`; **`LabelledList`** renders one bulleted/numbered/grouped list and is used inside that
  projection. No "kind" flag on `TermsCard` itself.
- **Cross-section wiring stays coordinated by the page**: `Commission` is the one place that legitimately knows
  about all three siblings. `PricingSection` emits a pick event with the chosen `ArtworkCategory`; the page applies it
  through `RequestForm.selectCategory()` (changed from an input during 3c: an input can't re-fire for the same
  value, so re-picking the same card after changing the radio by hand would have been ignored); the form's 3 "?" buttons emit outputs `Commission`
  forwards to a shared `scrollToElement` helper (moved out of commission-only code into
  `utils/scroll-to-element.ts`, next to `join-classes.ts`, since nothing about it is commission-specific).
- **Standardize while splitting, not a pure move**: the 3 hand-rolled fields move onto `app-form-field` (gaining
  real error display), and the italic "(optional…)" notes on deadline/additional notes fold into their label
  text; Terms of Service's body text grows from `11px` to Artwork Usage's `14px`/`text-sm`, so both grouped cards
  match. This means **stage 3c does not produce a 0.00% visual diff** — expected, real changes
  reviewed by hand, same as Stage 3b/3c's precedent for a real design change.

## Sub-stages

### 3a — Rename + unify (no visual change)

`ArtworkCategory` replaces `CommissionTypeId` and gallery's local `category` type; `CommercialTypeId` →
`UsageTypeId` and all its call sites; `pricing.json`'s `commercialTypes` → `usageTypes`. Verify: `tsc`, full
suite, prod build, **0.00% visual diff** (pure rename, nothing rendered changes).

### 3b — i18n list restructure (commission page intentionally broken until 3c)

A one-off script (run once, not committed) reshapes `en.json`/`ja.json`'s `commission.cards.*` and
`commission.terms.*` numbered keys into arrays. Both files share one key structure (checked), so one script
covers both. Details below were settled in a grilling round on 2026-09-29.

| Where                                                 | Becomes                                                                                         |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `cards.{chibi,emotes,illustration}`                   | `includes`, `excludes`, `details`, `notes`, `turnaround` → `string[]`; `title`, `cta` unchanged |
| `cards.emotes`                                        | renamed to `cards.emote`, so all three card keys are exactly the `ArtworkCategory` values       |
| `terms.{pricing,revisions,workflow,payment}`          | `item_N` → `items: string[]`; `title` unchanged                                                 |
| `terms.artwork_usage`                                 | `groups: ListGroup[]` in the old order: `personal`, `promotion`, `distribution`, `products`     |
| `terms.artwork_usage.unsure`                          | **deleted** from both locales — a sentence the page never rendered (see below)                  |
| `terms.tos`                                           | `groups: ListGroup[]` in the old order                                                          |
| `terms.communication`, `kicker`/`title`/`description` | unchanged (not lists)                                                                           |

- **`ListGroup`** (`{ id: string; label: string; items: string[] }`) goes in `models/`. Every group has an
  `id`, ToS included, so there's one group shape and a stable `@for` track key.
- **`I18nService.list(key): string[]` and `groups(key): ListGroup[]`** follow `nav()`'s pattern: they read the
  current locale's JSON directly. A missing key returns `[]` and logs a `console.warn` naming the key, so a
  typo shows up in the console instead of as a silently empty card. Unit-tested against the real JSON.
- **A test pins Artwork Usage's group ids to `PricingService`'s `usageTypes`** in both locales. 3c attaches
  the percent add-ons by that `id`, so a renamed or added group must fail a test, not silently drop a percent.
- **The deleted `unsure` sentence is not the form's Unsure option.** That option uses its own key,
  `commission.form.usage_type.unsure`, which 3b doesn't touch, and its value stays typed inline as
  `UsageTypeId | 'unsure'`. No named type: it's used in one place, and still will be after 3c.
- **Out of scope:** `home.hero.name_1`/`name_2`, the only other numbered keys. They're the two separately
  styled lines of the landing page's name, not a list.

**Nothing consumes the new shape yet, so the commission page's cards and terms render raw keys (e.g.
`commission.cards.chibi.includes_1`) until 3c.** That's accepted: the site is pre-launch, and no shims or
duplicated data are added to keep the old keys working.

Verify: the script's own lossless check — every old string appears exactly once in the new shape, in the same
order, in both locales, with exactly two deliberate differences (the deleted `unsure` sentence and the
`emotes` → `emote` key rename) — then `tsc`, full suite, prod build. No visual diff for this stage; other
routes are untouched, so they're covered by 3c's diff.

### 3c — Component split + standardization (real, reviewed visual change)

Build `PricingCard`, `TermsCard`, `LabelledList`, `PricingSection`, `TermsSection`, `RequestForm`; wire them per
"Cross-section wiring" above; consume `I18nService.list()`/`groups()` and the new `commission-content.ts`
constants; migrate the 3 hand-rolled fields onto `app-form-field`; standardize ToS's text size. Details below
were settled in a grilling round on 2026-09-29.

**Where things live**

- `LabelledList` → `shared/components/labelled-list/`: a bulleted/numbered/grouped list isn't commission-specific.
- `PricingCard`, `PricingSection`, `TermsCard`, `TermsSection`, `RequestForm` → their own folders under
  `pages/commission/`: they only exist on this page.
- `commission-content.ts` (feature-local) holds: card order (`chibi`, `emote`, `illustration`); the shared list
  order; each card's carousel shape, keyed by `ArtworkCategory` (`chibi`/`emote` square, `illustration` 3:4),
  passed to `PricingCard` by `PricingSection`; and the terms' columns, read off the current layout —
  Revisions/Workflow/Communication, Pricing/Artwork Usage/Payment, ToS alone.
- `scrollToElement` → `utils/scroll-to-element.ts`. Anchor ids stay `commission-types`, `artwork-usage`,
  `commission-terms`, `commission-form`.

**Behaviour**

- **Percent add-ons are formatted once.** `PricingService.formatPercentAddon(id: UsageTypeId)` replaces
  `Commission`'s private copy, with the same `'1.0-0'` rounding. `TermsSection` uses it to append "(+50%)"-style
  suffixes to Artwork Usage's group labels (matched by group `id`) before passing the groups to `LabelledList`,
  which knows nothing about pricing. `RequestForm` uses it for the usage-type radio labels.
- **Form notes fold into labels in the JSON.** `en.json`/`ja.json`'s `commission.form.deadline.label` and
  `additional_notes.label` absorb their `note` text — "Deadline (optional and not guaranteed)",
  "希望納期（任意・確約ではありません）", each locale keeping its own spacing — and both `note` keys are deleted.
  `app-form-field` itself doesn't change. `price_estimate.note` is untouched (that field isn't migrated).
- **3a's carried-over renames** (flagged in 3a's review): `CommissionTypePricing` → `ArtworkCategoryPricing`,
  `commissionTypes` → `artworkCategories` (model and `pricing.json`), `getCommissionTypePricing` →
  `getArtworkCategoryPricing`. `PricingService` lookups take `ArtworkCategory`/`UsageTypeId` instead of
  `string`, except `getTotalPriceUsd`'s usage argument, which must still accept the form's `'unsure'`. The
  request field `commissionType` stays — it's the Lambda's API contract.

**Verify**

- One spec per new component, written test-first at its inputs/outputs (e.g. `PricingCard` renders its five lists
  in order and emits a pick; `LabelledList` renders bulleted, numbered and grouped content; `RequestForm` applies
  a picked category and shows errors on the 3 migrated fields). Zoneless: set every host value before the first
  `detectChanges()`.
- `tsc` (app + spec), full suite, prod build.
- Visual diff: every route except commission must stay **0.00%**. Commission changes by design, so it's checked
  two ways. Claude verifies each intended change through the DOM and computed styles in a headless browser —
  ToS body text is 14px, the 3 migrated fields show errors, the merged labels render, every card and terms block
  has content, no raw i18n keys remain — without viewing any image (art rule). The owner then looks at the
  commission screenshots and diff images left in `__screenshots__/`. Stop the dev server the capture script
  starts once done.
- Delivered as a PR into `working`, where the owner's visual sign-off happens before merge.

## Definition of done for this stage

- `commission.html` is an outline: hero + 3 section components, no page template over ~150 lines anywhere in the
  new structure.
- No repeated 3+ line markup block for a pricing or terms card.
- `ArtworkCategory`/`UsageTypeId` used consistently; no remaining `CommissionTypeId`/`CommercialTypeId` reference.
- Reference-links/deadline/additional-notes fields show validation errors like every other field.
- `docs/refactor/05-roadmap.md` and memory updated to what actually shipped.
- `docs/refactor/HANDOFF.md` deleted in 3c's final commit, after checking everything useful in it is recorded
  elsewhere; anything that isn't moves into `05-roadmap.md` first.
