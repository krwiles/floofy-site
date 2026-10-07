# Review moderation and IP blocking — spec

Settled in a grilling round on 2026-09-30. The build steps are in [plan.md](plan.md), and the owner's AWS / Neon /
Resend setup is in [aws-setup.md](aws-setup.md).

## What it does

The owner gets an email for **every new review**, with two buttons: **Delete this review** and **Block this
reviewer**. **Commission request** emails get a **Block this requester** button. Each button opens a small
confirmation page served by a new `floof-admin` Lambda. The action only happens when **Confirm** is pressed.

A blocked IP can no longer post a review, send a commission request or send a contact message. It gets the same
deliberately vague error everywhere.

Commission requests are also **recorded in the database** (a permanent record if an email is lost) and
**rate-limited**.

## Goals and non-goals

**Goals:** one-click moderation from the inbox; links that are useless to anyone who didn't receive them; no action
without an explicit confirm; no lost reviews or requests when email fails; no HTML injection through user input.

**Not in version 1:**

- **Undo buttons.** Actions are reversible by hand; see [aws-setup.md](aws-setup.md#undoing-an-action).
- **Blocking the whole site.** Done in the Cloudflare dashboard instead ("Under Attack" mode, WAF rules or a
  maintenance page), behind the owner's Cloudflare login and 2FA.
- **A contact-form rate limit.** The contact form only _checks_ `blocked_ips`.
- **Cloudflare Access.** An optional later hardening step: see [Future ideas](#future-ideas).
- **Sign in with Google.** A recorded future idea.

## Security model: signed action links

### The token

Each button links to `{ADMIN_URL}?token=<token>`, where:

```
payload   = "<action>.<target_id>.<expires_unix>"      e.g. "delete-review.123.1759881600"
signature = HMAC-SHA256(ADMIN_LINK_SECRET, payload)
token     = base64url(payload) + "." + base64url(signature)
```

- **Actions:** `delete-review`, `block-review-ip` and `block-commission-ip`. Each targets a review id or a
  commission request id, **never a raw IP**. The server looks the IP up itself.
- **Expiry:** 7 days after the email is sent.
- **Secret:** `ADMIN_LINK_SECRET`, a long random value. It's stored only in the environment of the Lambdas that
  create links (`floof-api`, `floof-comm`) and the one that checks them (`floof-admin`). It never appears in code,
  git, emails, URLs or logs.
- **Verification:**
  1. Re-compute the signature from the payload.
  2. Compare it with `hmac.compare_digest`, a constant-time comparison, so timing can't leak how much of a guess
     was right.
  3. Reject anything that fails to match, is malformed, has an unknown action, or has passed its expiry.
- **Not single-use:** delete and block are idempotent, so repeating one does nothing. Expiry alone limits old links.

### What each attacker can do

| Attacker has…                                  | Outcome                                                                                                                                            |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| The `floof-admin` URL (e.g. from logs or code) | Nothing. Every request without a valid token is refused.                                                                                           |
| This repo's source code                        | Nothing. The code shows how signing works, but not the key.                                                                                        |
| One email, or one link from it                 | Only that link's action on that one review/request, until it expires, and only by pressing Confirm. Editing the id or expiry breaks the signature. |
| The owner's AWS account                        | Could read the key and forge links, but could equally edit the database directly. The token isn't the weak point.                                  |

### Other protections

- **GET never acts.** Email security scanners (Outlook Safe Links, Gmail, antivirus) open links automatically. So
  GET only shows a confirmation page, and the action runs on a POST from its Confirm button.
- **HTML escaping.** Every user-supplied value is passed through `html.escape` before going into any email
  (review, commission, contact) or the confirmation page. Without it, someone could put a fake "Delete" button,
  pointing to their own site, inside a genuine email from this backend.
- **Response headers on admin pages:**
  - `Cache-Control: no-store` and `Referrer-Policy: no-referrer`, so tokens aren't cached or passed on to other sites.
  - `X-Robots-Tag: noindex`.
  - `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'`.
- **Parameterised SQL only.** Values always go through `cur.execute(query, params)`, never f-strings or `+`.
- **Logging.** Every Lambda logs each request (method, path, IP, user agent) and each outcome as one JSON line in
  CloudWatch, via `aws_lambda/shared/request_log.py`. Logs carry ids, never request bodies, tokens or the secret. See
  [aws-setup.md](aws-setup.md#reading-the-logs).
- **Separate Lambda.** `floof-admin`'s URL never appears in the site's JavaScript, and a bug in admin code can't
  affect the public endpoints.

## Behaviour by endpoint

### `floof-api` (reviews), changed

POST, after the existing checks (blocked IP, 1-per-hour rate limit):

1. Insert the review with `RETURNING id`.
2. Count this IP's earlier reviews.
3. Send the owner a review email: author, comment, time, review number, IP, the earlier-review count, and **Delete
   this review** / **Block this reviewer** links.
4. If the email fails, log it to CloudWatch and **still return 200** (`ok`). The review is saved either way.

GET is unchanged.

### `floof-comm` (commissions), changed

POST, in order:

1. Validate the request (unchanged).
2. **Blocked IP:** return `403 {"message": "Internal Server Error"}`, the same vague reply as reviews.
3. **Rate limit: more than 2 requests from this IP in the last 24 hours** returns `429` with a plain "try again
   later" message.
4. **Record** the request in `commission_requests`, `RETURNING id`.
5. Send the existing two emails. The owner's email gains a **Block this requester** link, and every user value is
   HTML-escaped.
6. Email failures behave as today: an error response. The request is already saved, so nothing is lost. A
   resubmission counts toward the rate limit.

### `floof-contact`, changed

POST: a **blocked IP** gets the same vague `403`. The email escapes every user value and has a **Block this sender**
link (`block-contact-ip`). Contact messages aren't stored, so that one link carries the sender's IP itself (as an
integer) instead of an id; the signature makes it just as tamper-proof. There's no rate limit and no new table.

### `floof-admin`, new

A Lambda function URL (auth `NONE`; the token is the authentication).

- **`GET ?token=…`:** verify the token, then load the target:
  - `delete-review`: the review's author, comment, time and whether it's already deleted.
  - `block-*`: the review's or request's author/name and a snippet, plus whether its IP is already blocked.

  Render a confirmation page describing exactly what will happen, with a **Confirm** form that POSTs the token
  back. An invalid or expired token gets a `403` page: "This link is invalid or has expired."

- **`POST` (form body `token=…`):** verify the token again, then act:
  - `delete-review`: `UPDATE reviews SET deleted = TRUE WHERE id = %s`.
  - `block-review-ip` / `block-commission-ip`: look up the IP by id, then
    `INSERT INTO blocked_ips (ip_address, reason) VALUES (%s, %s) ON CONFLICT (ip_address) DO NOTHING`. The
    reason records the source automatically, e.g. `admin email: review #123`.

  Render a "Done" page, or "already done" if nothing changed. A missing target (bad id) gets a plain "not found"
  page.

- **Any other method:** `405`.

## Data model

- **`reviews`:** unchanged. Delete sets the existing `deleted` flag.
- **`blocked_ips`:** unchanged. It already has `ip_address` (primary key), `reason` and `blocked_at`.
- **`commission_requests`:** new. The exact SQL is in [aws-setup.md](aws-setup.md#1-create-the-commission_requests-table).
  It stores the full request, plus IP and time, with an `(ip_address, created_at)` index for the rate-limit query.
  Customers' names and emails now also live in the database, as well as in email.

## Configuration

| Variable                     | `floof-api` | `floof-comm` | `floof-contact` | `floof-admin` |
| ---------------------------- | :---------: | :----------: | :-------------: | :-----------: |
| `DB_HOST/NAME/USER/PASSWORD` |   ✓ (has)   |     new      |       new       |      new      |
| `RESEND_API_KEY`             |     new     |   ✓ (has)    |     ✓ (has)     |               |
| `FLOOFY_EMAIL`               |     new     |   ✓ (has)    |     ✓ (has)     |               |
| `ADMIN_LINK_SECRET`          |     new     |     new      |       new       |      new      |
| `ADMIN_URL`                  |     new     |     new      |       new       |               |

Every email is sent as `FloofySite <no-reply@summerfloofy.com>`, from the site's own domain, verified in Resend. It's
not a secret and won't vary by environment, so it's a constant (`EMAIL_FROM` in `aws_lambda/shared/`), not a setting.

## Future ideas

- **Sign in with Google.** Deferred: it needs a session or token design that fits a serverless backend.
- **Cloudflare Access** in front of `floof-admin`, reached through the site's domain, for a login on top of the
  signed tokens.
- **Undo** buttons on the "Done" page.
- **A contact-form rate limit**, using the same pattern as commissions.
