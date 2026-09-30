# Review moderation and IP blocking — build plan

Implements [spec.md](spec.md). Each step is its own commit, tests first. One PR into `working`. The owner's cloud setup
([aws-setup.md](aws-setup.md)) happens after merge, before deploying.

## Ground rules

- **Tests:** `pytest`, run locally from `aws_lambda/`. The database cursor and `resend` are replaced with small fakes,
  so tests need no network, no Neon and no Resend. New dev dependency: `aws_lambda/requirements-dev.txt` (`pytest`).
- **SQL:** parameterised only (`cur.execute(query, params)`). A test in step 1 fails the build if any Lambda file
  builds SQL with an f-string.
- **HTML:** every user-supplied value goes through `html.escape` before entering an email or page.
- **Shared code:** the token and blocklist helpers live once in `aws_lambda/shared/`, and `aws_lambda/build.sh` copies
  them into each Lambda's zip. This avoids a Lambda Layer (one more AWS resource to manage) and hand-copied duplicates.

## Steps

### 1. Shared helpers and test harness

- `aws_lambda/shared/admin_links.py`: `sign(action, target_id, expires_at)`, `verify(token, now)` (returns
  `(action, target_id)` or `None`), and `link(admin_url, action, target_id)` (7-day expiry).
- `aws_lambda/shared/blocklist.py`: `is_blocked(cur, ip)` and `block(cur, ip, reason)` (the `ON CONFLICT DO NOTHING`
  insert).
- `aws_lambda/tests/`: `conftest.py` puts `shared/` and each Lambda folder on the import path and provides a
  `FakeCursor` and a `FakeResend`.
- **Tests:**
  - A signed token verifies.
  - A changed id, action or expiry fails.
  - An expired token fails.
  - A malformed token (missing parts, bad base64, unknown action) fails without raising.
  - A token signed with a different secret fails.
  - `block` issues the conflict-safe insert.
  - No Lambda source contains f-string SQL.

### 2. HTML escaping in the existing emails

- `floof-comm` and `floof-contact`: escape every user value in every email body and subject.
- **Tests:** a request whose fields contain `<a href="https://evil.example">` produces an email body containing
  `&lt;a href=` and no raw `<a href="https://evil.example">`.

### 3. `floof-contact`: check the blocklist

- Connect to Neon, the same way as `floof-api`, and return the vague `403` for a blocked IP before sending anything.
- `EMAIL_FROM` replaces the hard-coded sender.
- **Tests:** a blocked IP gets `403` and no email is sent; an unblocked IP still sends.

### 4. `floof-comm`: blocklist, rate limit, record, block link

- Order: validate → blocked (`403`) → more than 2 in the last 24 hours (`429`) → insert into
  `commission_requests … RETURNING id` → emails.
- The owner's email gains a **Block this requester** link (`block-commission-ip`, request id). `EMAIL_FROM` replaces
  the hard-coded sender.
- **Tests:**
  - A blocked IP gets `403`, with no insert and no email.
  - A 3rd request within 24 hours gets `429`; the 2nd still goes through.
  - A valid request is inserted with every field and its IP.
  - The owner email contains a link that `verify` decodes to `("block-commission-ip", <new id>)`.

### 5. `floof-api`: review notification email

- The insert gains `RETURNING id`. After it commits:
  - count this IP's earlier reviews;
  - send the owner an email: escaped author and comment, time, id, IP, the count, and **Delete** / **Block** links.
- Email failures are logged and the response is still `201`.
- New dependency: `resend`.
- **Tests:**
  - A new review sends one email whose two links verify to `delete-review` / `block-review-ip` with the new id.
  - The comment is escaped.
  - A `resend` failure still returns `201`.

### 6. `floof-admin`: confirm page and actions

- `aws_lambda/floof-admin/lambda_function.py`, with GET, POST and the spec's security headers on every response.
- The POST body is form-encoded, and Lambda function URLs may deliver it base64-encoded, so handle both.
- **Tests:**
  - A GET with a valid token renders the target's escaped details, and a form posting the same token.
  - A GET makes no writes.
  - A GET with an invalid or expired token gets `403` and does no database work.
  - Each POST action runs the right parameterised write and renders "Done"; repeating it renders "already done".
  - A block looks up the IP by id and records `admin email: review #<id>` / `commission #<id>` as the reason.
  - A missing target renders "not found".
  - Other methods get `405`.
  - Every response carries the security headers.

### 7. Build script

- `aws_lambda/build.sh <lambda>`: installs that Lambda's `requirements.txt` as **Linux** wheels
  (`pip install --platform manylinux2014_<arch> --only-binary=:all:`), copies in `shared/`, and zips the result to
  `aws_lambda/dist/<lambda>.zip`.
- The architecture argument must match each function's setting in AWS (`x86_64` or `arm64`).
- `dist/` is git-ignored.
- Manual check: build all four, unzip one, and confirm `psycopg`'s Linux binary and `admin_links.py` are inside.

## Done when

- `pytest` passes, with every step's tests present.
- `build.sh` produces all four zips.
- `docs/features/review-moderation/*` matches what shipped.
- After the owner deploys, the checklist in [aws-setup.md](aws-setup.md#9-test-it-end-to-end) passes against the real
  site.
