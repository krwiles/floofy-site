# 14 — Phase 5 execution plan: contact (page 1 of 3)

Builds on [13-phase-5-plan.md](13-phase-5-plan.md)'s component/service design. Contact is simplest and goes
first: this PR builds every shared piece from scratch, then migrates contact onto them. Reviews' and
commission's PRs mostly just consume what this one builds — see
[15](15-phase-5-reviews-plan.md)/[16](16-phase-5-commission-plan.md).

## New files this PR creates

- `src/app/components/form-field/form-field.ts` (+ template) — `FormFieldGroup`, selector `app-form-field`.
- `src/app/directives/control.ts` — `Control`, selector `[appControl]`.
- `src/app/components/form-status/form-status.ts` (+ template) — `FormStatus`, selector `app-form-status`.
- `src/app/forms/form-submission.ts` — `createFormSubmission()` factory + the `FormSubmissionStatus` type.
- `src/app/services/api.service.ts` — `ApiService`, replacing `ContactService` for now (reviews'/commission's
  methods get added to this same file in their own PRs, per [13](13-phase-5-plan.md)'s "one merged service"
  decision — or, if landing all 4 methods now is cheaper than doing it 3 times, this PR may add all 4 typed
  methods at once even though only `submitContact` has a caller yet; either way `ContactService` is deleted).
- `src/environments/environment.ts` (or wherever this project's environment config lives) — the Lambda URL(s),
  moved out of the service body.

## What changes in `contact.ts` / `contact.html`

- `contact.html`'s hand-copied field blocks (name/email/message) become `<app-form-field>` wrapping an
  `appControl`-decorated `<input>`/`<textarea>`, each with `[formField]` unchanged.
- The status `<p>` + `getElementById('contact-status')` dance becomes `<app-form-status [status]="status()" />`,
  reading one `FormSubmissionStatus` signal instead of a plain string plus manual class toggling.
- `contactForm`'s `submission` block becomes a call to `createFormSubmission({...})`, passing contact's own
  `buildRequest` (unchanged shape, `CreateContactRequest`) and `onSuccess` (still resets the form — the one
  page-specific side effect contact has).
- `ContactService` usage becomes `ApiService.submitContact(...)`.
- `ngOnInit`'s `document.getElementById('contact-status')` line is deleted entirely — no DOM lookups left.

## Verification

- TDD for the new shared pieces (`form-field`, `control`, `form-status`, `form-submission`, `api-service`) —
  written first, per this project's established practice for genuinely new code.
- Typecheck, full unit suite, production build.
- Visual diff against contact's current rendered output — this is a structural extraction, not a redesign, so
  the page should render identically (same classes end up on the same elements, just assembled by shared pieces
  instead of hand-copied per field).
- Manual submit-flow check in a real browser: valid submit → pending → success/error text and color, invalid
  submit → error summary, matching today's behavior exactly.
- `/code-review` once, findings verified before fixing, per this project's standing process.
