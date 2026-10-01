# Review moderation — setup guide (Neon, Resend, Cloudflare, AWS)

The steps only the owner can do, in order, after the code from [plan.md](plan.md) is merged. The design is in
[spec.md](spec.md). Budget about an hour. Nothing here changes the live site until step 7.

> **Never paste `ADMIN_LINK_SECRET` into code, git, chat, email or a ticket.** It lives only in the Lambda environment
> variables. Anyone who has it can forge admin links.

## 1. Create the `commission_requests` table

In the **Neon console**, open the project, then the **SQL Editor** on the same database `floof-api` uses, and run:

```sql
CREATE TABLE commission_requests (
  id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at        timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_address        inet        NOT NULL,
  name              varchar(50)  NOT NULL,
  email             varchar(100) NOT NULL,
  commission_type   varchar(50)  NOT NULL,
  usage_type        varchar(50)  NOT NULL,
  description       text NOT NULL CHECK (length(description) <= 2000),
  reference_links   text NOT NULL DEFAULT '' CHECK (length(reference_links) <= 2000),
  usage_explanation text NOT NULL CHECK (length(usage_explanation) <= 2000),
  estimated_price   numeric(10, 2) NOT NULL,
  deadline          varchar(50) NOT NULL DEFAULT '',
  additional_notes  text NOT NULL DEFAULT '' CHECK (length(additional_notes) <= 2000)
);

-- Makes the "requests from this IP in the last 24 hours" check fast.
CREATE INDEX idx_commission_requests_ip_created ON commission_requests (ip_address, created_at DESC);
```

Check it worked with `SELECT count(*) FROM commission_requests;`, which should return `0`.

`reviews` and `blocked_ips` need no changes.

## 2. Generate the link-signing secret

In a terminal, run:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(48))"
```

Copy the output (about 64 characters) somewhere temporary, such as a password manager entry. You'll paste the **same
value** into four Lambdas in steps 6–8, then you can delete the temporary copy.

## 3. Confirm the email domain is verified

Every email is sent as `FloofySite <no-reply@summerfloofy.com>` (a constant in the code, not a setting). In **Resend →
Domains**, check that `summerfloofy.com` shows **Verified**. If not, add the DNS records Resend lists in **Cloudflare
→ DNS → Records**, each set to **DNS only (grey cloud)**, not proxied, then click **Verify**.

## 4. Note each Lambda's runtime and architecture

In the **AWS console**, go to **Lambda → Functions**. For `floof-api`, check its **Runtime** (e.g. Python 3.12) and,
under **Configuration → General configuration**, its **Architecture** (`x86_64` or `arm64`). The other functions,
including the new `floof-admin`, should use the **same** runtime and architecture, because the zips are built for one
of them.

The runtime must be **Python 3.10 or newer** (psycopg 3.3 needs it), and on `arm64` it must be **3.12 or newer**
(psycopg's ARM build needs the newer Linux those runtimes use). If a function is older, change its runtime under
**Code → Runtime settings → Edit** before uploading.

## 5. Build the deployment zips

The script needs [uv](https://docs.astral.sh/uv/) (`brew install uv`). macOS's built-in `pip` can't download Linux
packages for a different Python version.

From the repo root, run the command once per function, with the architecture and Python version from step 4:

```bash
cd aws_lambda
./build.sh floof-api x86_64 3.12
./build.sh floof-comm x86_64 3.12
./build.sh floof-contact x86_64 3.12
./build.sh floof-admin x86_64 3.12
```

The zips land in `aws_lambda/dist/`.

## 6. Create `floof-admin`

1. **Lambda → Create function → Author from scratch.**
   - Name: `floof-admin`.
   - Runtime and architecture: the same as step 4.
   - Click **Create**.
2. **Code → Upload from → .zip file**, and choose `dist/floof-admin.zip`. Under **Runtime settings**, the handler must
   be `lambda_function.lambda_handler`.
3. **Configuration → General configuration → Edit**: set the timeout to **10 seconds**. Neon can take a moment to wake
   up on the first request after idle.
4. **Configuration → Environment variables → Edit.** Add:
   - `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`: copy the values from `floof-api`.
   - `ADMIN_LINK_SECRET`: the value from step 2.
5. **Configuration → Function URL → Create function URL.**
   - Auth type: **NONE**. The signed token is the authentication.
   - Leave CORS **off**; the page is opened directly, never called from the site's JavaScript.
   - Save, then copy the URL. That's **`ADMIN_URL`**.

Opening `ADMIN_URL` with no token should show "This link is invalid or has expired". That's correct.

## 7. Update `floof-api`

1. **Code → Upload from → .zip file**: `dist/floof-api.zip`.
2. **Environment variables**, add:
   - `RESEND_API_KEY` and `FLOOFY_EMAIL`: copy them from `floof-comm`. `FLOOFY_EMAIL` may list several admins,
     separated by commas (e.g. `you@example.com,other@example.com`); use the same list on `floof-comm` and
     `floof-contact`.
   - `ADMIN_LINK_SECRET`: from step 2.
   - `ADMIN_URL`: from step 6.
3. **General configuration**: set the timeout to **10 seconds**, since sending the email adds a little time.

## 8. Update `floof-comm` and `floof-contact`

**`floof-comm`:**

1. Upload `dist/floof-comm.zip`.
2. Add these environment variables:
   - `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`: copied from `floof-api`.
   - `ADMIN_LINK_SECRET`.
   - `ADMIN_URL`.
3. Set the timeout to **15 seconds**.

**`floof-contact`:**

1. Upload `dist/floof-contact.zip`.
2. Add these environment variables:
   - `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`.
   - `ADMIN_LINK_SECRET`.
   - `ADMIN_URL`.
3. Set the timeout to **10 seconds**.

## 9. Test it end to end

Use a phone on mobile data for the "visitor" steps, so blocking it doesn't block your own home IP.

- [ ] Post a review on the site. It appears, and you get an email with both buttons, showing the review text, IP and
      earlier-review count.
- [ ] Tap **Delete this review**. A confirmation page opens, and the review is still visible on the site.
- [ ] Press **Confirm**. The page says Done, and the review is gone from the site after a refresh.
- [ ] Tap the same Delete link again, then Confirm. The page says "already done".
- [ ] Change one character of a link's token and open it. You get "invalid or has expired".
- [ ] Send a commission request from the phone. Both emails arrive (including the customer copy, sent from
      `no-reply@summerfloofy.com`), and a row appears in `SELECT * FROM commission_requests ORDER BY id DESC LIMIT 1;`.
- [ ] Send two more requests from the phone within 24 hours. The third is refused ("try again later").
- [ ] From the commission email, **Block this requester**, then Confirm. From the phone, a new review, commission
      and contact message are all refused with the vague error.
- [ ] Clean up: unblock the phone's IP (see below) and delete the test rows.

## 10. Keep it free

Everything here fits in free allowances: Lambda's always-free 1M requests a month, CloudWatch's 5 GB of logs, and
Neon's and Resend's free plans (Resend allows 100 emails a day). Two settings make sure it stays that way:

1. **A $1 budget alert.** In **Billing and Cost Management → Budgets → Create budget**, choose **Use a template →
   Zero spend budget** (or a monthly cost budget of $1), and enter your email. AWS then emails you as soon as anything
   starts costing money. The first two budgets are free.
2. **Log retention.** By default CloudWatch keeps logs forever. For each of the four functions, open **CloudWatch →
   Log groups → `/aws/lambda/<function name>`** → **Actions → Edit retention setting**, and choose **2 weeks**
   (or 1 month if you want a longer history).

When AWS asks about encrypting environment variables, keep the default **AWS managed key**: a customer-managed KMS
key costs $1 a month.

## Reading the logs

Every Lambda writes one JSON line per request (method, path, IP and browser, never what the visitor typed), plus a line
for each outcome: `review_saved`, `commission_saved`, `refused` (with `reason`: `invalid`, `blocked` or
`rate_limited`), `owner_email_failed` / `email_failed`, and on `floof-admin`, `admin_invalid_link`,
`admin_confirm_shown` and `admin_action`. Admin tokens are never logged.

To search them, open **CloudWatch → Logs Insights**, pick one or more `/aws/lambda/floof-*` log groups, and run, for
example:

```
fields @timestamp, event, ip, reason, action, target_id
| filter ispresent(event) and event != "request"
| sort @timestamp desc
| limit 100
```

Change the filter to `event = "request"` to see every call, or `ip = "203.0.113.7"` to follow one visitor. Logs Insights
charges per GB scanned beyond a small free amount; with these tiny logs a query costs effectively nothing.

## Rotating the secret

If an email may have leaked, or just periodically:

1. Generate a new value (step 2).
2. Replace `ADMIN_LINK_SECRET` on **all four** Lambdas (`floof-api`, `floof-comm`, `floof-contact`, `floof-admin`).

Every link already sent stops working immediately.

## Undoing an action

Run these in the Neon SQL Editor:

```sql
-- Restore a deleted review.
UPDATE reviews SET deleted = FALSE WHERE id = 123;

-- Unblock an IP.
DELETE FROM blocked_ips WHERE ip_address = '203.0.113.7';

-- See what's blocked and why (the reason names the review/request it came from).
SELECT ip_address, reason, blocked_at FROM blocked_ips ORDER BY blocked_at DESC;
```

## Troubleshooting

- **Something fails:** open the function → **Monitor → View CloudWatch logs**, then the latest log stream, or search
  with [Logs Insights](#reading-the-logs). Email failures are logged there (`owner_email_failed` / `email_failed`), and
  the review or commission request is still saved.
- **`No module named 'psycopg'` / `'resend'`:** the zip was built for the wrong architecture or Python version, or
  without its dependencies. Rebuild with `build.sh` and the values from step 4.
- **Timeouts on the first request after a while:** Neon was waking up. Raise the timeout a little.
- **Customer emails missing:** check `summerfloofy.com` shows **Verified** in Resend (step 3).
