# API status codes — plan

The Lambdas reply with a short status code instead of English text; the frontend turns each code into a translated,
per-form message. Settled with the owner on 2026-10-01. Nothing here is built yet.

## Why

Today every form message is English prose, from two places:

- **The Lambdas** write success and error messages ("You have exceeded the limit of 1 comment per hour…").
- **The pages** hard-code "Submitting review…" and "Please correct the errors…".

None of it can be translated. The wording also lives on the server, far from the page that shows it.

## Response contract (all three form Lambdas)

Every response body is JSON with a `code`. The codes are the same for every Lambda:

| `code`         | HTTP      | When                                                       | Extra fields           |
| -------------- | --------- | ---------------------------------------------------------- | ---------------------- |
| `ok`           | 200 / 201 | Saved and/or sent                                          | —                      |
| `invalid`      | 400       | Failed server-side validation (too long, bad price, …)     | —                      |
| `rate_limited` | 429       | Over this Lambda's limit                                   | `limit`, `window_hours` |
| `error`        | 403 / 500 | Blocked IP, email failure, or anything unexpected; also 405 | —                      |

- **`rate_limited`** carries the rule itself, from the Lambda's own constants, so the limit is defined once (on the
  server):
  - reviews: `{"code": "rate_limited", "limit": 1, "window_hours": 1}`;
  - commissions: `{"code": "rate_limited", "limit": 2, "window_hours": 24}`.
- **A blocked IP gets `error`**, the same as a real failure, so a blocked visitor learns nothing; that's the same idea as
  today's vague 403.
- **`invalid` has no per-field detail.** The forms already enforce the same limits before sending, so only someone
  bypassing the form ever sees it.
- **Unchanged:** `GET` on `floof-api` (the review list) and every `floof-admin` page, since those are data and web
  pages, not form replies.

## Frontend

- **`ApiService.normalizeError`** returns `{ code, limit?, window_hours? }` from the body. A network failure, or a
  body with no code, becomes `{ code: 'error' }`.
- **Models:** `ApiError` and the three `Create…Response` types become the code shape instead of `{ message }`.
- **`createFormSubmission`** takes an i18n key prefix (e.g. `forms.review`) instead of `pendingMessage` /
  `invalidMessage`. It sets the status text from `<prefix>.pending`, `<prefix>.invalid` and `<prefix>.<code>`.
- **`I18nService.t()`** gains simple `{name}` placeholders, e.g. `t(key, { limit: 2, window_hours: 24 })`, so the
  rate-limit text can use the numbers from the response.
- **New i18n keys, in both `en.json` and `ja.json`:**
  - `forms.contact`, `forms.review` and `forms.commission`, each with `pending`, `invalid`, `ok`, `rate_limited` and
    `error`;
  - `contact` has no rate limit, but gets the key anyway so the shape is uniform.
  - The wording varies per form ("Thanks for your review!"), even though the codes don't.

## Backend

- **Each Lambda's `response()` helper** takes a code, plus optional extra fields, instead of a message.
- **`floof-api`:** the 400s become `invalid`; blocked becomes `error` (still a 403); rate limit becomes `rate_limited`
  with `limit: 1`, `window_hours: 1`; created becomes `ok`.
- **`floof-comm`:** the same set, with `limit: MAX_REQUESTS_PER_DAY`, `window_hours: 24`.
- **`floof-contact`:** `invalid`, `error` and `ok`.
- **Logging is unchanged.** CloudWatch still records the real reason (`refused` / `blocked` / `email_failed`).

## Tests (written first)

- **Lambdas:** for each Lambda, the exact body for every outcome. The vague-403 tests change from a message to `error`.
- **`I18nService`:** placeholders are filled in, and a missing value leaves the placeholder visible.
- **`ApiService`:** the body code is passed through, and a network failure or a body with no code becomes `error`.
- **`createFormSubmission`:** each code shows `<prefix>.<code>` translated, and rate limits fill in the numbers.
- **i18n:** every `forms.*` key exists in both locales.

## Delivery

- **One PR after #53 merges** (no stacking), holding both the Lambda and the frontend changes.
- **The two halves must ship together.** New Lambdas with the old site would show no messages, and the old Lambdas
  with the new site would show `error`. Deploy the four zips, then the site, back to back. Per the owner's no-shims
  rule, the gap between them may show wrong messages for a few minutes.
- **The Lambdas get rebuilt** with `build.sh` for each function's runtime (currently Python 3.14).

## Out of scope

- A countdown ("try again in 3 hours"), which would need an extra query for the oldest counted request.
- Translating the hard-coded English hero text on the reviews and streaming pages (Phase 7).
