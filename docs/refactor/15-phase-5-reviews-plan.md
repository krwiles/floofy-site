# 15 — Phase 5 execution plan: reviews (page 2 of 3)

Builds on [13-phase-5-plan.md](13-phase-5-plan.md) and lands after
[14-phase-5-contact-plan.md](14-phase-5-contact-plan.md), which builds most of the shared pieces this PR needs.

**Correction, found during implementation:** this doc originally said "no new shared components" here, but also
referenced `<app-checkbox-field>` below without noticing that component didn't exist yet — contact has no
checkbox, so nothing had built it. Reviews is actually the first page with a checkbox to migrate, ahead of
commission in the sequencing, so **this PR builds `CheckboxField`**, per `16-phase-5-commission-plan.md`'s own
"whichever page needs it first creates it" note.

## New files this PR creates

- `src/app/components/checkbox-field/checkbox-field.ts` (+ template) — `CheckboxField`, selector
  `app-checkbox-field`. See `13-phase-5-plan.md`'s design; commission's PR will just consume it.

`ApiService` gains `getReviews`/`submitReview` if contact's PR didn't already add all 4 methods (see
[14](14-phase-5-contact-plan.md)'s note on that either/or).

## What changes in `reviews.ts` / `reviews.html`

- The author/comment field blocks become `<app-form-field>` + `appControl`, same as contact.
- The agreement checkbox becomes `<app-checkbox-field [field]="reviewForm.agreement">`, projecting its existing
  inline label text (unchanged wording).
- The status `<p>` + `getElementById('review-status')` dance becomes `<app-form-status [status]="status()" />`.
- `reviewForm`'s `submission` block becomes `createFormSubmission({...})`, with `onSuccess` still calling
  `this.requestReviews()` to refresh the list — the one page-specific side effect reviews has. This stays exactly
  as it is today (`httpResource` for this read was explicitly deferred, see
  [13](13-phase-5-plan.md#explicitly-out-of-scope-for-this-phase) and `05-roadmap.md`'s "Open ideas" list).
- `ReviewsService` usage becomes `ApiService.getReviews()`/`ApiService.submitReview(...)`.
- `ngOnInit`'s `document.getElementById('review-status')` line is deleted.

## Verification

- Full unit suite, typecheck, production build.
- Visual diff against reviews' current rendered output.
- Manual check in a real browser: posting a review still refreshes the list and shows the new review; invalid
  submit still shows the agreement-required error in the same place.
- `/code-review` once, findings verified before fixing.
