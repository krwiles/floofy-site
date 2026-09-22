# 07 — Phase 1 execution plan (Angular 22 upgrade)

Concrete plan for `05-roadmap.md` → Phase 1, settled 2026-09-22 via `superpowers:brainstorming`.
**This document is a plan. Nothing in it has been executed. No source, test, or config file has been changed.**
Execution starts only when the owner says go.

## Decisions locked in this round

| # | Decision | Answer |
| --- | --- | --- |
| 1 | Scope | Framework/tooling version bump only. No Flowbite removal (staged Phase 4/5), no component work, no adopting new Angular 22 features (Phase 3+) |
| 2 | Branch | `refactor/phase-1-angular-22` off `working` |
| 3 | Review | **PR against `working`, owner reviews and merges** — not a direct merge like Phase 0. This is the first phase that changes real runtime behavior, not just test infrastructure |
| 4 | `ng update` commits | Let it create its own commit(s) for the automated schematics (its normal, supported workflow); I add follow-up commits for anything it doesn't fully resolve |
| 5 | Push | Push the Phase 1 branch when opening the PR. `working`'s 12 unpushed Phase 0 commits are left alone unless separately requested |
| 6 | TypeScript | Pin to `~6.0.3` explicitly, not whatever `npm i typescript@latest` would give (that resolves to `7.0.2`, which `@angular/compiler-cli@22.1.7`'s peer range `>=6.0 <6.1` rejects) |
| 7 | Tailwind | Pin to `4.3.x` explicitly in `package.json` (currently floating on `^4.1.12` but already resolved to `4.3.2` on disk from Phase 0's `npm install` — make that intentional, not incidental) |
| 8 | Vitest | Stay on `4.x` (`@angular/build@22`'s peer is `^4.0.8`; do not take v5) |
| 9 | Form verification | **Corrected from the verbal design**: exercise validation only (empty-submit error paths, which are client-side per the code — confirmed no network call happens before Signal Forms validation passes). Do **not** complete a real submission — that fires a live POST to production Lambda URLs, and for commission/contact triggers a real email send via Resend; for reviews, inserts a real row into the live database |
| 10 | Visual verification | Reuse the Phase 0 scripts: capture a `post-upgrade` label, diff against the existing `baseline` label. Claude only ever sees the printed percent-changed table, never the images |

## Facts verified this session (2026-09-22)

- Currently installed: `@angular/core` 21.2.17, `@angular/cli` 21.2.18, `@angular/build` 21.2.18, `typescript` 5.9.3,
  `vitest` 4.1.10, `tailwindcss`/`@tailwindcss/postcss` 4.3.2 (already ahead of the declared `^4.1.12` range —
  resolved there by Phase 0's `npm install`), `flowbite` 4.0.2, Node 24.21.0.
- `@angular/core@22.1.7` engines: `^22.22.3 || ^24.15.0 || >=26.0.0` — Node 24.21.0 satisfies this.
- `@angular/compiler-cli@22.1.7` peer: `typescript: >=6.0 <6.1`. npm's `typescript` `latest` dist-tag is `7.0.2`
  (do **not** install "latest") — but `typescript@6.0.2` and `6.0.3` are real, published, stable releases; `~6.0.3`
  resolves correctly.
- `@angular/build@22.1.8` peer: `vitest: ^4.0.8` — confirms staying on Vitest 4.
- Angular 22.0.0 changelog (fetched from `angular/angular`'s `CHANGELOG.md`, summarized by an automated tool —
  treated as a lead to verify against real compiler/test output, not a guarantee) cross-checked against this repo:

  | Change | Relevant here? |
  | --- | --- |
  | `OnPush` becomes the default when `changeDetection` is unset | **Yes** — `Gallery` is the only component in this codebase that doesn't set it explicitly. Its state is already signal-based, so this should be a no-op, but it gets an explicit smoke test (step 8 below) rather than an assumption |
  | Signal Forms: `min`/`max` no longer accept string values | Checked all three forms (contact, reviews, commission) — none use `min`/`max` with a string value (only `required`, `maxLength`, `email`). Re-grep after `ng update` in case its schematics touched anything |
  | `provideRoutes()` removed | Not used — `app.config.ts` already uses `provideRouter(routes, withPreloading(...), withInMemoryScrolling(...))` |
  | Hammer.js integration removed | Not used |
  | XHR upload progress removed/deprecated | `provideHttpClient()` is called with no progress-reporting options — low risk, but the 3 form submissions (validation-only per decision #9) and `ReviewsService.getReviews()` (a real `GET`, side-effect-free) are exercised as part of verification anyway |
  | Compiler: duplicate input/output bindings now throw; `in` in template expressions now throws; elements with multiple matching selectors now throw | No known matches in this codebase by inspection, but these are compile-time checks — `ng build` after `ng update` will surface any of them directly |
  | `ComponentFactoryResolver`/`ComponentFactory`/`createNgModuleRef` removed | Not used (this app is standalone-only, already) |

## Execution steps

1. **Branch.** `git checkout -b refactor/phase-1-angular-22` off `working` (confirm `working` is clean first).
2. **`ng update`.** Run `ng update @angular/core@22 @angular/cli@22` from the repo root. Let it install
   compatible peer versions (`@angular/common`, `@angular/compiler`, `@angular/compiler-cli`, `@angular/forms`,
   `@angular/platform-browser`, `@angular/router`, `@angular/build` should all move together) and create its own
   commit(s) for any schematic migrations it runs.
3. **Pin TypeScript.** Set `"typescript": "~6.0.3"` in `package.json` explicitly (don't leave it to whatever
   `ng update` happened to resolve) and `npm install`. Commit if it differs from what step 2 left.
4. **Pin Tailwind.** Set `"tailwindcss": "^4.3.2"` and `"@tailwindcss/postcss": "^4.3.2"` explicitly, `npm install`,
   commit — making the version that's already on disk an intentional, declared choice.
5. **Fix build errors.** `ng build`, iterate on whatever the compiler surfaces. Before fixing anything, re-run
   `list_projects` and `get_best_practices` (angular-cli MCP) with the workspace path so guidance reflects Angular
   22, not 21. Small, focused commits per fix rather than one large one.
6. **Fix test regressions.** `ng test`, same iterate-and-commit approach. Re-check for the `IntersectionObserver`
   stub and router-provider patterns from Phase 0 still working under the new version.
7. **Re-grep Signal Forms validators.** Confirm no `min`/`max` calls with string arguments exist anywhere in
   `src/app/**/*.ts` (checked clean pre-upgrade; re-check post-`ng update` in case a schematic touched validator
   calls).
8. **`Gallery` smoke test (non-visual).** Via Chrome DevTools automation: open `/gallery`, confirm the grid renders
   (DOM query, not a screenshot), click an image, confirm the lightbox overlay is present with no console errors,
   close it (click + Escape key), confirm it's removed. No form submission, no network side effects.
9. **Form validation smoke test (non-visual, no real submission).** For each of contact/reviews/commission: fill
   required fields partially or leave empty, trigger the empty-submit error path (confirmed client-side only —
   `onInvalid` runs before `submission.action`, no HTTP call), verify error messages render via DOM read. Do **not**
   fill a form completely and click through to a real submission.
10. **Visual regression check.** `npm run baseline:capture -- --label post-upgrade`, then
    `npm run baseline:diff -- --against baseline --current post-upgrade`. Report only the printed percent-changed
    table — investigate any route/width showing non-trivial change before proceeding.
11. **Full verification.** `ng build` (production) and `ng test` both green, no new warnings beyond the pre-existing
    CSS selector warning.
12. **Push and open PR.** Push `refactor/phase-1-angular-22`, open a PR against `working` whose description includes:
    the version table (before/after), the breaking-changes-relevance table above, and the verification output from
    steps 5–11. **I do not merge this PR** — the owner reviews and merges (or requests changes).

## Explicitly out of scope for Phase 1

- Flowbite removal (JS in Phase 4, CSS in Phase 5, per `04-upgrade-plan.md`).
- Adopting any new Angular 22 API (`httpResource`, etc.) — that's for when components are rebuilt in Phase 3+.
- Any component/template rewrite beyond what's strictly required to compile against Angular 22.
- Completing a real submission of any of the three forms (see decision #9).
- Pushing `working`'s existing Phase 0 commits to `origin` (separate decision, not part of this phase).

## Rollback

Everything lives on `refactor/phase-1-angular-22` until the PR is merged; `working`/`main` are untouched. If
`ng update` goes sideways mid-run, `git reset --hard` to the branch's first commit is always available since nothing
before it is touched. If the PR reveals a problem after review, it's closed without merging and the branch deleted —
no cleanup needed on `working`.
