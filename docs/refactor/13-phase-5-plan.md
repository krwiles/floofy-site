# 13 — Phase 5 plan: Forms and backend access

Settled via `grill-with-docs` (grilling + domain-modeling), 2026-09-25. New glossary terms (Form Field, Control,
Choice, Form Status, Form Submission) are in `/CONTEXT.md`. This document is the component/service design plus
the sequencing plan built on top of it — see [14](14-phase-5-contact-plan.md)/[15](15-phase-5-reviews-plan.md)/
[16](16-phase-5-commission-plan.md) for each page's own migration plan.

## What's in this phase

Unlike Phase 4's Track A (from-scratch redesigns of Flowbite-driven pieces), this phase is closer in spirit to
Stage 3b (Card/Button): extracting **already-designed, already-shipped** UI into shared, reusable pieces. Nothing
here changes how a form looks or behaves — it removes duplication and two real smells (a `getElementById`/
`classList` status split; three near-identical fallback error-handling chains). No separate `specs/` files this
time (that convention was for Phase 4's genuinely new designs); this one document plus the three page docs cover
it, matching Stage 3b's own precedent.

## Facts found before designing (read all 3 forms' code first, per the grilling skill's own rule)

- No native `<select>` exists anywhere in the codebase (`grep`-confirmed). Every "choice" field today is either a
  pill-styled radio button (`peer-checked` visual treatment) or a plain checkbox.
- All 3 backend POST responses already share the identical shape `{ message: string }`.
- The 3 forms use plain hand-written Tailwind classes; **zero** Flowbite-specific classes or JS attributes exist
  anywhere in `src/app` (confirmed via `grep` for `rounded-base`, `data-collapse-toggle`, `data-dropdown`, etc.,
  and for any `flowbite` import outside `src/styles.css`/`package.json`). Removing the Flowbite theme/plugin CSS
  is very likely low-risk — still verified via visual diff before removal, not assumed.
- Signal Forms' `FieldState` (`@angular/forms/signals`) already exposes `required: Signal<boolean>`, so a field's
  required-asterisk visibility can be derived, not passed in as a second, independently-set input.
- Signal Forms' `FormField` directive (the existing `[formField]` binding) publicly exposes `state: Signal<FieldState<T>>` on itself. A sibling directive on the same host element can `inject(FormField, { self: true })` and
  read `.state()` directly — no custom coordination token or shared service needed for `appControl` to know a
  control's own validity.
- Phase 7's checklist already covers translating hardcoded English (precedent: `reviews.html`'s hardcoded
  section header); Phase 8 (backend hygiene) is cleanly the Lambda/Python side only — no overlap with this
  phase's `ApiService` work.

## Decisions locked this round

- **`app-form-field` / `appControl` split** mirrors Angular Material's `mat-form-field`/`matInput`: the wrapper
  owns label + required-marker + error list and projects the control; the control directive supplies shared
  input styling and reads its own validity independently, not via a shared coordination service.
- **Choice is two components, not one with a mode switch** — same shape as Carousel. A pill-radio-group and a
  checkbox field are visually and structurally different; `<select>` support is explicitly not built (YAGNI —
  nothing needs it today).
- **`FormSubmission` is a factory function**, not a component, returning Signal Forms' own `{ action, onInvalid }`
  shape.
- **`app-form-status` is one discriminated-signal source of truth** — no `getElementById`/`classList` anywhere.
- **One merged `ApiService`**, typed per-endpoint methods, not three services with a shared base class.
- **`ApiService` normalizes error handling itself** — the `err.error?.message ?? err.message` fallback chain
  collapses from 3 call sites to 1.
- **The 3 Lambda URLs move to environment config**, out of the service class body.
- **`totalPriceUsd` moves to `PricingService`** as a pure mechanical relocation, no behavior change.
- **Forms get `tone` support** (`light`/`middle`/`dark`), matching Card/Button's established pattern — carried
  forward from the open item recorded during Stage 3b planning, not a new decision. All 3 forms use `tone="middle"`
  today with no exception, so this input defaults to `'middle'`; nothing today exercises another value, but the
  input exists because the site's other primitives already treat tone as a first-class per-instance property, not
  because a second value is needed yet.

## Explicitly out of scope for this phase

- `scrollToElement`/focus-highlight (commission's anchor-nav helper) — not forms-specific, left alone.
- `<select>` support in the Choice components — nothing uses it today.
- Translating hardcoded validation/status messages — deferred to Phase 7 (tracked there explicitly).
- Adopting `httpResource` for reviews' GET — deferred, tracked in `05-roadmap.md`'s "Open ideas" list.
- Moving `GalleryImageService`'s hardcoded image arrays into a JSON file (raised by the owner as an unrelated
  idea during this planning session) — tracked in `05-roadmap.md`'s "Open ideas" list, not this phase's work.

## Component and service design

### `app-form-field` (component)

Class name **`FormFieldGroup`**, not `FormField` — Angular's own Signal Forms already exports a class named
`FormField` (the `[formField]` directive), and every page importing both would collide on that identifier.
Selector stays `app-form-field`.

- `label = input.required<string>()` — already-translated by the caller, i18n-agnostic (same convention as
  `Hero`).
- `field = input.required<Field<unknown>>()` — the Signal Forms field callable itself (e.g. `contactForm.name`),
  not three separately-passed booleans/arrays. Internally: `state = computed(() => this.field()())`.
- Required-asterisk visibility: `state().required()` — derived, not a second input.
- Error list visibility: `state().invalid() && state().touched()`, iterating `state().errors()`.
- Projects the actual control via `<ng-content />` inside its own `<label>` — works unchanged whether the
  projected control is a text input, a textarea, or a date input.
- `tone = input<Tone>('middle')` — see "Decisions locked" above.

### `appControl` (directive)

Class name **`Control`**. Selector `[appControl]`.

- **No explicit inputs.** `private readonly formField = inject(FormField, { self: true });` reads the sibling
  `[formField]` directive already required on the same host element — every control in this codebase already
  has one — and derives `invalid = computed(() => this.formField.state().invalid() && this.formField.state().touched())`
  from its public `state` signal. This is a tighter resolution of round 2's "read the field independently, no
  coordination service" decision: no second binding needed on the control element at all, since the sibling
  directive is already there.
- Host bindings supply the shared class string (today duplicated ~12 times across the 3 forms) plus a
  conditional error-border class driven by `invalid()`.
- Applies to `<input>`, `<textarea>`, and any future text-like control; not applied to the Choice components
  below, which have their own distinct styling needs.

### `app-radio-group` (component) — Choice, pill-radio-group presentation

Class name **`RadioGroup`**.

- `label = input.required<string>()`
- `field = input.required<Field<string>>()`
- `options = input.required<readonly { value: string; label: string }[]>()`
- Renders the label/error wrapper itself (its own placement, per `CONTEXT.md`'s Choice entry — below the whole
  group, not per-option) and `@for`s over `options()` to render each pill once, replacing today's 3–5 hand-copied
  pill blocks per usage (commission's `commissionType` and `usageType` pickers).

### `app-checkbox-field` (component) — Choice, checkbox presentation

Class name **`CheckboxField`**.

- `field = input.required<Field<boolean>>()`
- Projects the inline label text via `<ng-content />` (commission's ToS text and reviews' agreement text differ
  enough — one is plain text, the wording is page-specific — that content projection fits better than a single
  `label` string input).
- Renders the checkbox + projected text inline, plus its own error placement below the row (matching today's
  actual markup shape for both existing checkboxes).

### `FormSubmission` helper

A plain factory function (not a component) — proposed location `src/app/forms/form-submission.ts`.

```ts
function createFormSubmission<TModel, TRequest, TResponse extends { message: string }>(config: {
  pendingMessage: string;
  invalidMessage: string;
  buildRequest: (model: TModel) => TRequest;
  submit: (request: TRequest) => Observable<TResponse>;
  onSuccess?: (response: TResponse) => void;
  status: WritableSignal<FormSubmissionStatus>;
}): { action: () => Promise<void>; onInvalid: () => void };
```

Where `FormSubmissionStatus = { kind: 'idle' | 'pending' | 'success' | 'error'; message: string }` is the same
shape `app-form-status` takes. Replaces each form's ~30-line `submission: { action, onInvalid }` block with a
call to this factory plus that form's own `buildRequest`/`submit`/`onSuccess`.

### `ApiService`

Merges `ContactService`, `ReviewsService`, `CommissionService` into one. Methods: `submitContact`, `getReviews`,
`submitReview`, `submitCommission` — same typed request/response shapes as today's 3 services, just one file.
URLs move to `environment.ts` (or equivalent). A private `catchError` normalizes every failure to a plain
`{ message: string }` shape (or a small typed `ApiError`) before it reaches a caller, so `FormSubmission`'s
`onError` path can trust `.message` uniformly — the fallback chain each form does today collapses to this one
place.

### `PricingService`

Adds `getTotalPriceUsd(commissionTypeId, commercialTypeId)`, the same two-line calculation
(`getPercentAddon`/`getBasePriceUsd` composed) currently living on `Commission` as `totalPriceUsd`. Mechanical
move only.

## Sequencing and PR breakdown

Contact is simplest and needs almost everything on day one; reviews adds nothing new; commission adds the two
Choice components plus the `PricingService` move. One PR per page, in the order the roadmap already states:

1. **Contact** — builds all 5 shared pieces (`FormFieldGroup`, `Control`, `FormStatus`, `createFormSubmission`,
   `ApiService`) from scratch, then migrates contact onto them. See
   [14-phase-5-contact-plan.md](14-phase-5-contact-plan.md).
2. **Reviews** — consumes what already exists; no new shared pieces. Keeps its own post-submit list-refresh
   behavior (`requestReviews()`), which doesn't change. See
   [15-phase-5-reviews-plan.md](15-phase-5-reviews-plan.md).
3. **Commission** — adds `RadioGroup` and `CheckboxField`, plus the `PricingService` move, then migrates
   commission. See [16-phase-5-commission-plan.md](16-phase-5-commission-plan.md).
4. **Flowbite CSS removal** — done, [PR #39](https://github.com/krwiles/floofy-site/pull/39). A fresh grep
   across `src/app` (including all 3 migrated forms) confirmed zero remaining Flowbite classes/JS hooks before
   removing the theme/plugin import and `@source` line from `src/styles.css` and uninstalling the `flowbite`
   package. Visual diff came back 0.00% across all 8 routes × 3 widths.

## Definition of done for this phase

- All 3 forms use `FormFieldGroup`/`Control`/`FormStatus`/`createFormSubmission`; the hand-copied field/status/
  submission blocks are gone.
- Commission's choice fields use `RadioGroup`/`CheckboxField`; reviews' checkbox uses `CheckboxField`.
- One `ApiService` replaces the 3 separate backend services; Lambda URLs live in environment config, not inline.
- `totalPriceUsd` lives on `PricingService`.
- `flowbite` theme/plugin CSS removed, package uninstalled, verified via visual diff.
- `ng build`/`ng test` green throughout; `/code-review` once per PR, findings verified before fixing.
- `docs/refactor/05-roadmap.md` and memory updated to reflect what actually shipped, same as every prior phase.

## Still owed to the owner

An HTML artifact explaining the Material `mat-form-field`/`matInput` pattern this phase's `app-form-field`/
`appControl` split mirrors — requested during grilling, to be produced once this design was finalized. This
document being finalized is that point.
