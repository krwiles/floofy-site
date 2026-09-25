# 16 — Phase 5 execution plan: commission (page 3 of 3)

Builds on [13-phase-5-plan.md](13-phase-5-plan.md) and lands after
[14](14-phase-5-contact-plan.md)/[15](15-phase-5-reviews-plan.md). Commission is the largest and last page: it
adds the two Choice components (nothing else needed them) and the `PricingService` move, then migrates.

## New files this PR creates

- `src/app/components/radio-group/radio-group.ts` (+ template) — `RadioGroup`, selector `app-radio-group`.
- **`CheckboxField` already exists** — reviews' PR built it (its own agreement checkbox needed it first,
  correcting an oversight in `15-phase-5-reviews-plan.md`'s original "no new shared components" claim). This PR
  just consumes it for the ToS checkbox, no new file. **One thing to raise with the owner before wiring it up**:
  `CheckboxField` hardcodes `gap-2` on its outer row (carried over from reviews' own markup, unchanged),
  but commission's current ToS row uses `gap-1` — a small, pre-existing one-page difference between the two
  forms that predates this refactor. Using `CheckboxField` as-is means commission's checkbox row spacing changes
  from `gap-1` to `gap-2`; confirm that's fine (matching reviews'/being the standard going forward) rather than
  assuming it, same as every other one-page-difference decision this refactor has surfaced rather than resolved
  silently.
- `ApiService` gains `submitCommission` if not already added in an earlier PR.

## What changes in `commission.ts` / `commission.html`

- The name/email/description/reference-links/usage-explanation/deadline/additional-notes fields become
  `<app-form-field>` + `appControl`, same pattern as contact/reviews.
- The `commissionType` and `usageType` pill-radio groups (3 and 5 hand-copied pill blocks respectively) each
  become one `<app-radio-group [field]="commissionForm.commissionType" [options]="...">` /
  `<app-radio-group [field]="commissionForm.usageType" [options]="...">`, with the option lists as plain
  component-level constants (they're fixed, not data-driven from anywhere today).
- The `tosAccepted` checkbox becomes `<app-checkbox-field [field]="commissionForm.tosAccepted">`, projecting its
  existing inline label text (unchanged wording).
- The status `<p>` + `getElementById('commission-form-status')` dance becomes
  `<app-form-status [status]="status()" />`.
- `commissionForm`'s `submission` block becomes `createFormSubmission({...})`; commission has no post-success
  side effect today (no reset, no refresh) and keeps none.
- `totalPriceUsd(commission, commercial)` is deleted from `Commission`; call sites use
  `this.pricingService.getTotalPriceUsd(...)` directly instead.
- `CommissionService` usage becomes `ApiService.submitCommission(...)`.
- `ngOnInit`'s `document.getElementById('commission-form-status')` line is deleted.
- `scrollToElement`/focus-highlight (`scrollToCommissionTypes`/`scrollToArtworkUsage`/`scrollToTerms`/
  `scrollToForm`) is explicitly **not** touched — out of scope per [13](13-phase-5-plan.md), not forms-specific.

## Verification

- Full unit suite, typecheck, production build.
- Visual diff against commission's current rendered output — including the pill-radio groups' `peer-checked`
  visual state at each of the fixed option values, and the ToS checkbox row.
- Manual check in a real browser: picking a commission type / usage type still updates the price display
  correctly (via `PricingService.getTotalPriceUsd`); `scrollToForm(type)` still pre-selects the right radio pill
  when jumping to the form from a pricing card.
- `/code-review` once, findings verified before fixing.

## After this PR lands

Flowbite CSS removal (theme/plugin import + `@source` line in `src/styles.css`, `flowbite` package uninstall) is
its own separate PR, per [13](13-phase-5-plan.md)'s sequencing — nothing left depends on it once all 3 forms are
migrated.
