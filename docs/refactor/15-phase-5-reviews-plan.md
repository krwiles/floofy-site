# 15 — Phase 5 execution plan: reviews (page 2 of 3)

Builds on [13-phase-5-plan.md](13-phase-5-plan.md) and lands after
[14-phase-5-contact-plan.md](14-phase-5-contact-plan.md), which builds every shared piece this PR needs. No new
shared components — this PR is purely reviews' own migration onto what already exists.

## New files this PR creates

None. `ApiService` gains `getReviews`/`submitReview` if contact's PR didn't already add all 4 methods (see
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
