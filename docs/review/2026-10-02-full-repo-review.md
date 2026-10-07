# Full-repo code review — 2026-10-02

A review of `working` at `f4aaa7b` (everything through PR #58). Nine reviewers ran in parallel:

- one **standards** reviewer and one **spec** reviewer for each of four areas: the shared frontend, the pages and
  services, the Lambdas, and the styles and templates;
- one **security** reviewer for the whole repo.

The **standards** reviewers checked the code against `CLAUDE.md`'s conventions and comment rules, plus a list of
common code smells. The **spec** reviewers checked it against the design docs: `CONTEXT.md`,
`docs/refactor/03-target-architecture.md`, `docs/refactor/specs/*`, the phase plans and `docs/features/*`. Issues the
roadmap already records weren't reported again, unless they had got worse.

This file is the source for planning the fixes. Every finding has an ID (e.g. `B3`), so fix plans can refer to it;
the [fix outline](#fix-outline) at the end groups them into PRs. Nothing in here has been fixed yet.

**Checked before writing this up:**

- One reviewer said `CLAUDE.md` still describes the comment hook as checking only `.ts` files. That's wrong: #54
  updated it to cover all four file types. The finding is left out.
- The duplicated comments in `about.ts`, `gallery.ts` and `reviews.ts` (`D1`) were left by Claude's comment pass in
  #54. Its check for comments stacked on top of old ones missed some.

**Severity:** **Bug** means visitors get wrong behaviour. **A11y** means an accessibility failure. **Std** means a
documented standard is broken. **Smell** is a judgement call. **Doc** means the docs and the code disagree.

---

## Real bugs (`B`)

- **B1 — Off-by-one length limits (Bug).**
  - **The bug:** the review and contact forms allow exactly 50 and 2000 characters (`maxLength(…, 50/2000)`), and so
    does the database (`varchar(50)`, `length ≤ 2000`). But `floof-api` and `floof-contact` reject `len >= 50` and
    `len >= 2000`. A visitor can type a valid entry and get a vague "please correct the errors" with no field to fix.
  - **Also affected:** the contact email field allows 50 characters, and the Lambda rejects exactly 50.
  - **Not affected:** `floof-comm` uses `>` and is correct.
  - **Missing test:** no test checks the exact limit.
- **B2 — Japanese pages show raw i18n keys (Bug).**
  - **Missing from `ja.json`:** `home.hero.name_1/2` (the home hero title), `home.discover.{kicker,title,description}`,
    `contact.form.{kicker,title,description,submit}` and `contact.socials.*`. `t()` echoes a missing key back, so
    Japanese visitors see text like `home.discover.title`.
  - **Stale keys** (only in `ja.json`): `home.learn.*`, `about.news.*`, `commission.hero.{background_aria,section_aria}`.
  - **Unused in both files:** `home.contact_page.*`, `language.english/japanese`, `streaming.hero.*`.
  - **Missing test:** `03-target-architecture.md` asks for a unit test that both locales have identical key sets.
    None exists; only the `forms.*` keys are checked.
- **B3 — Forms can be submitted twice (Bug).** `createFormSubmission`'s `action` resolves immediately ("fire and
  forget"), so Signal Forms' `submitting()` is never true, and no submit button is disabled while pending.
  - **Commission:** a double-click sends two requests and four emails.
  - **Reviews:** two simultaneous POSTs can both pass the rate-limit count before either inserts.
- **B4 — Streaming shows the wrong week on Saturdays (Bug). Fixed by the streaming page refresh.** In `streaming.ts` `getNextStreamInstant()`,
  `(6 - day + 7) % 7 || 7` adds a full week whenever the UTC day is Saturday. So from Friday evening (Eastern) until
  the stream starts, the page shows next week's date. The schedule maths has no tests (Stage 4 notes this; the bug
  itself wasn't known).
- **B5 — Whitespace-only reviews get published (Bug).** The frontend's `required` accepts `"   "`. `floof-api`
  trims the text but never rejects an empty result, and the backend generally accepts empty required fields (author,
  comment, name, email, description).
- **B6 — The streaming "#schedule" link goes to the home page (Bug). Removed by the streaming page refresh.** `streaming.html` uses `href="#schedule"`. With
  `<base href="/">` that resolves to `/#schedule`, so it needs `routerLink` plus `fragment`.
- **B7 — Lambda timeouts are shorter than their network timeouts (Bug).**
  - **The mismatch:** Resend's client defaults to a 30-second timeout, and `shared/db.py` sets no `connect_timeout`.
    The Lambdas are cut off at 10–15 seconds.
  - **What happens:** if Resend or a waking Neon is slow, AWS kills the Lambda with no coded reply and no log.
  - **Worst case, in `floof-api`:** the review is already saved, the visitor sees an error, retries, and gets
    `rate_limited`.
- **B8 — `floof-api` can leave database connections open (Bug).** It closes the connection by hand on each path
  (`conn.close()` ×3) instead of using `with connect_to_db() as conn` like the other Lambdas. An exception in the middle
  leaks the connection.
- **B9 — `floof-admin` has no crash safety net (Bug).** It doesn't have `@replies_on_unexpected_errors` or an HTML
  equivalent, so a database outage or cold-start failure returns AWS's raw 502, without the spec's security headers.
- **B10 — Partial email failure in commissions (Bug).**
  - **The failure:** if the owner email is sent but the customer email fails (the backend never checks the email
    address format), the visitor gets a 500 and resubmits. That records the request again and emails the owner again.
  - **No test** covers a customer-only failure.
  - **Logging gap:** the `email_failed` log has no `request_id`, so it can't be matched to the saved row.
- **B11 — Price rounding overflow (Bug, minor).** A price like `99999999.996` passes `< MAX_PRICE`, then rounds to
  `100000000.00` in `numeric(10,2)` and overflows. It returns a 500 `error` instead of `invalid`.
- **B12 — The reviews list never leaves "Reviews loading..." (Bug, minor).** There's no failure or empty state, so it
  stays forever if the GET fails or there are no reviews.
- **B13 — Slideshow pause state (Bug).**
  - **Pausing:** hover, focus and touch share one `paused` flag. `mouseleave` restarts auto-advance while keyboard
    focus is still inside, which breaks the spec's "Hovering or focusing the component pauses". On touch, tapping an
    arrow (emulated `mouseenter` + `focusin`) leaves it paused until the visitor taps elsewhere.
  - **Recorded bug, unchanged:** the stuck-`instant` bug in `05-roadmap.md` is still present.
- **B14 — Small frontend bugs.**
  - Dates and prices in Japanese mode use the app's `LOCALE_ID`, not the toggle's locale, so they're formatted in
    English.
  - Two gallery entries have the alt text "emote".
  - `about.html:40` has a non-existent class, `wrap-break-word-`.
  - `navbar.html` uses `glass-bgx`, which isn't defined anywhere.
  - Navbar's `matchMedia` `change` listener is never removed.

## Security (`S`)

**Sound, no change needed:**

- **Admin links:** HMAC-SHA256 with a secret of at least 32 characters, `compare_digest`, the signature checked before
  the payload is parsed, base64 with only one valid spelling, and expiry. Replays are harmless because the actions are
  idempotent. GET never acts, and a forged POST can't succeed without a valid token.
- **`floof-admin` headers:** `no-store`, `no-referrer`, `noindex`, `frame-ancestors 'none'`, and no redirects.
- **SQL:** all parameterised, and `test_sql_safety` enforces it.
- **Email escaping:** user values are escaped everywhere, including link `href`s and the plain-text derivation.
  Subjects can't inject headers through Resend's JSON API.
- **Visitor IPs:** `sourceIp` can't be spoofed, because the browser calls the Lambda URLs directly.
- **Frontend:** no XSS paths (no `[innerHTML]` or `bypassSecurityTrust`).
- **The comment hook:** it quotes its path argument, so there's no shell injection.
- **Secrets:** none in code or git history.

**Findings:**

- **S1 — The commission form can be used to send email (Med). Fixed by PR 2.**
  - **The hole:** the customer confirmation goes to the `email` field as typed, with no format check. It carries up to
    about 8k characters of the sender's own text, and URLs in it become clickable.
  - **The abuse:** anyone can send phishing or spam to any address from `no-reply@summerfloofy.com`, signed with your
    domain's DKIM. That damages the domain's reputation and uses up Resend quota. The 2-per-day per-IP limit can be
    sidestepped by switching IPs (S3).
  - **Fix ideas:**
    - Accept only a single, strictly formatted email address (no `<>,;`).
    - Leave the visitor's own text out of the customer copy.
    - Add a global cap.
- **S2 — The contact form has no rate limit (Med). Fixed by PR 2 (reserved concurrency decided against).**
  - **The abuse:** a loop of POSTs sends one email per admin address each time. That can flood the inbox and use up
    the Resend quota, which also stops review and commission notifications.
  - **Status:** deferred in the moderation spec, but it's the cheapest way to abuse the site.
  - **Fix ideas:**
    - A per-IP limit plus a global cap.
    - AWS reserved concurrency on the three public Lambdas.
- **S3 — Per-IP limits and blocks are easy to get around (Med). Fixed by PR 2 (IPv6 /64 and global caps; Turnstile deferred).**
  - **The bypass:** every check uses the exact address, and one IPv6 host can rotate through 2^64 of them.
  - **Made worse by:** reviews publish immediately and email the owner each time.
  - **Fix ideas:**
    - Match limits and blocks on the IPv6 /64 network.
    - Add a global cap per time window.
    - Consider Cloudflare Turnstile on the forms.
  - **Edge case:** `floof-admin` reads any IPv6 address in `::/96` as IPv4.
- **S4 — No Content-Security-Policy on the site (Low).**
  - **The gap:** third-party scripts (Twitter `widgets.js` on every page, the Twitch embed at runtime) load without
    integrity checks. The impact is small, since the site has no cookies or logins.
  - **Fix:**
    - Add a CSP through a Cloudflare `_headers` file.
    - Only load Twitter's script where it's needed (it currently loads site-wide with no embeds — see `T5`).
- **S5 — Python dependencies aren't pinned (Low). Fixed by PR 2.**
  - **The risk:** `floof-comm`'s and `floof-contact`'s `requirements.txt` list `resend`, `requests` and `certifi` with
    no versions, so each build pulls whatever is newest into a Lambda that holds the API key and database
    credentials.
  - **Fix:** pin exact versions, ideally with `uv pip compile --generate-hashes`.
  - **Also:** `requests` and `certifi` aren't imported anywhere (`resend` pulls them in itself), so they can be dropped
    from the lists.
- **S6 — Personal data in logs (Low). Hardening done by PR 2 (`nosniff`, a click-tracking check).**
  - **What's logged:** every request's IP and user agent, and the full error text (`repr(error)`) from Resend and
    psycopg failures, which might include email addresses.
  - **Fix:** set a CloudWatch retention period (already in `aws-setup.md` step 10).
  - **Hardening:** add `X-Content-Type-Options: nosniff` to `floof-admin`.
  - **To check:** confirm Resend click tracking is off, since it would route admin-link tokens through Resend.

## Accessibility (`A`)

- **A1 — Form errors aren't linked to their fields (A11y, contradicts the target architecture). Fixed by PR 3.**
  - **The promise:** `03-target-architecture.md` says "Field components use `aria-describedby` for errors and
    `aria-invalid`".
  - **What's missing:** nothing sets either, and Signal Forms doesn't add `aria-invalid` itself.
  - **Wrong placement:** `FormFieldGroup` puts `<app-field-error-list>` inside the `<label>`'s `<p>`, so error text
    becomes part of the field's accessible name, and the `<p>`/`<div>` inside `<label>` is invalid HTML.
- **A2 — Radio groups (A11y). Fixed by PR 3.**
  - **Missing group:** `RadioGroup` has no `<fieldset>`/`<legend>` or `role="radiogroup"`, so the group label isn't tied
    to the radios.
  - **Invisible focus:** the inputs are `sr-only peer` and only `peer-checked:` is styled, so keyboard focus can't be
    seen.
- **A3 — Form results aren't announced (A11y). Fixed by PR 3.** `FormStatus` renders a plain `<p>` with no `role="status"` or
  `aria-live`. `02-component-inventory.md` asks for them, and `01-findings.md` flagged this.
- **A4 — Pricing-card buttons can't be reached by keyboard (A11y, already on the roadmap). Fixed by PR 3.** They're
  `<a (click)>` with no `href`; they should be `<button type="button">`.
- **A5 — Language toggle label (A11y, WCAG 2.5.3). Fixed by PR 3.** `aria-label="Toggle language"` replaces the visible "EN/日本語".
  The fan-art hashtag link has the same problem.
- **A6 — Gallery.**
  - **Clickable images:** the `<img (click)>` elements aren't buttons, so there's no keyboard access.
  - **Lightbox:** no `role="dialog"`/`aria-modal` and no focus handling. Its close button `×` has no `aria-label` or
    `type`, and it's `lg:text-transparent`.
  - **Wrong label:** the section is labelled "Streaming Section".
  - **Leftover:** a migration helper, `$safeNavigationMigration(...)`.
  - **Already parked:** the lightbox rebuild, in open idea 6.
- **A7 — Landmarks and lists.**
  - **Fake lists:** `role="list"` on the social wrappers in `about.html` and `contact.html`, whose children are bare
    `<a>`s (`display: contents`), with no list items.
  - **Extra landmarks:** the hero renders two nested labelled `<section>`s, and the inner one is an empty decorative
    layer.
  - **Headings:**
    - the request form's section headings are `<p>`s;
    - `streaming.html` uses `<h3>` for time values;
    - the donate iframe's `title="summerfloofy"` doesn't describe it.
- **A8 — Contrast (worked out from `tokens.css`, ignoring `saturate()`).**
  - **Too low:**
    - Form-status `text-success`/`text-error` on the middle card: 2.0–3.6:1.
    - Navbar active and hover `text-brand`: about 1.6:1.
    - The `outline-brand-strong` focus ring on middle backgrounds: 1.7:1.
    - Eyebrow `on-light-body-subtle` on `section-light`: 3.1:1.
    - `border-border` input edges: 1.5:1.
  - **Stale doc:** the roadmap says every button gradient stop is at least 4.5:1, but `btn-on-light.btn-secondary`'s
    start stop is 4.16:1.
- **A9 — Reduced motion is ignored in places.**
  - **Gallery:** `gallery.css` has no `prefers-reduced-motion` block for its slide-in, hover scale and lightbox fades.
  - **Smooth scrolling:** `scrollToElement()` and the footer's `scrollToTop()` force `behavior: 'smooth'`.

## Standards and convention breaks (`C`)

- **C1 — Hard-coded English (Std, CLAUDE.md "User-facing strings").** The roadmap records only the streaming hero
  copy and the reviews section header as known gaps.
  - **Validation messages:** all three forms (`contact.ts`, `reviews.ts`, `request-form.ts`).
  - **Templates:**
    - contact and reviews form labels, placeholders, the submit button and the agreement text;
    - "General Inquiry Form";
    - "Reviews loading...";
    - the donate section header and Ko-fi link text;
    - the about socials header.
  - **Labels:**
    - navbar "Open main menu";
    - hero "Hero Background"/"Hero section";
    - section `?? 'Section'`;
    - parallax-section `'Parallax section'`;
    - "About Section";
    - "Social links";
    - "Commission Example 1".
  - **Streaming TypeScript:** `'local time'`, `` `Saturdays at …` ``, `'11:00 AM EDT'`, `'JST'`.
  - **Undecided:** the `models/social.ts` `ariaLabel`s are English in both locales.
- **C2 — Old-style APIs (Std).**
  - **`parallax-section.ts`:**
    - `@ViewChild(..., { static: true }) root!` should be `viewChild`;
    - `ngOnDestroy` has no `implements OnDestroy`;
    - an `if (this.root)` check can never fail;
    - `onWindowScroll` is misnamed.
  - **Change detection:** `app.ts` and `gallery.ts` use `ChangeDetectionStrategy.Eager`, not OnPush.
  - **Host listener:** `gallery.ts` uses `@HostListener`, not `host: {}`.
  - **Mixed `OnPush`:** some components write it out and others rely on the v22 default.
  - **Host display:** set three different ways: `styles`, `host.class` and `host.style`.
- **C3 — Raw colours instead of tokens (Std, "No raw hex/rgba").**
  - **Raw values:**
    - `gallery.css` `#ff4081`;
    - `slideshow-carousel.css` `rgb(0 0 0 / 35%)`;
    - `shadow-[0_0_3rem_rgb(0,0,0)]`;
    - `border-white/40`;
    - about ten `rgba` values in `streaming.css` (streaming is excluded from Phase 3b).
  - **Missing hero colour:** the donate hero uses `bg-white` instead of a sampled `--color-hero-donate`.
- **C4 — Component CSS isn't layered (Std / Tailwind lesson).** `.btn` and `.card-on-*` in `styles/components/*.css`
  aren't in a `@layer`, so they beat a caller's utility classes. It's the same problem the `flourish.ts` fix solved.
- **C5 — Tone mismatches (Std, Phase 3b "tone matching their actual section").**
  - The contact, reviews and commission form sections are `tone="light"` but use `section-header tone="middle"`.
  - Donate's cards are middle on a light section.
  - The commission price and the about/contact socials grids use `text-on-light-heading` inside middle cards.
- **C6 — Duplicated comments and missing step comments (Std, CLAUDE.md "Comments").**
  - **Duplicated comments** (one comment repeating the one above it):
    - `about.ts:14-15`;
    - `gallery.ts:35-36`, `47-48`, `65-66`, plus a trailing comment at `:74`;
    - `reviews.ts:87-88`;
    - `slideshow-carousel.spec.ts:87-88`, `136-137`.
  - **Misplaced:** `slideshow-carousel.spec.ts:198` has `// Arrange: render.` above an `it(`.
  - **Missing step comments:**
    - the `button.ts` `hostClass`;
    - the `contact` fixture in `test_floof_contact`;
    - `token_for` in `test_floof_admin`;
    - `review_event` in `test_logging`;
    - `build.sh`'s `__pycache__` cleanup.
  - **Wrong or vague Lambda comments:**
    - `floof-contact`'s Resend dict is named `commission_details`;
    - "Format and send emails", though contact sends one;
    - "Input validation" and "Query strings";
    - "Parse the request body into dataclass";
    - the `floof-api` GET comment reads as if it fetches deleted reviews.
  - **Inconsistent punctuation:** `shared/admin_links.py` mixes comments with and without full stops.
- **C7 — Tests can leak into later tests (Std, test hygiene).**
  - **The leak:** `streaming.spec`'s `vi.unstubAllGlobals()`, the i18n spec's `warn.mockRestore()` and the parallax
    spec's `errorSpy.mockRestore()` only run when the assertions pass. They belong in `afterEach` or `try/finally`.
  - **Unneeded cleanup:** `parallax-scroll.service.spec.ts` unstubs globals it never stubbed.
  - **Wrong file:** `test_logging` imports `commission_body` from `test_floof_comm`; it belongs in `conftest`.
  - **Inconsistent fakes:** the blocklist fake rows differ (`{"exists": True}` vs `{"blocked": 1}`).
- **C8 — The visual-baseline script.**
  - **Missed images:** with `reducedMotion: 'reduce'` and full-page captures that never scroll, the gallery's
    `@defer (on viewport)` images stay as placeholders.
  - **Orphaned server:** `spawn(..., { shell: true })` followed by `kill()` can leave `ng serve` running on :4200.

## Code smells (`M`) — judgement calls

- **M1 — The three form Lambdas have grown apart.** The same jobs are done differently in each:
  - **Email sending:** `send_email` is copied into `floof-comm` and `floof-contact`, and `floof-api` sends inline. They
    also read the API key differently (`os.environ.get` vs `os.environ[...]`).
  - **Parsing:** a frozen dataclass in comm and contact; bare `body.get(...).strip()` in api.
  - **Validation:** `>=` vs `>`, and contact caps email at 50 while comm caps it at 100.
  - **Escaping:** comm uses a generic `escaped()`, contact escapes per field, and api inline.
  - **Success status:** 201 in api, 200 in the others.
  - **Email failure:** api still replies 201, comm replies 500.
  - **Connections:** see `B8`.
  - **Email-result check:** `send_email` returns an HTTP reply dict, and callers check `statusCode >= 400`.
  - **Handler names:** `main(event)` in comm and contact, `create_review` in api.
- **M2 — Repeated code.**
  - **The SGT date format:** written out four times (api, comm, contact, admin); only admin has an `SGT` constant.
  - **`floof-admin`:** branches on the action in six functions (`load_target`, `already_done`, `source_label`,
    `describe`, `target_details`, `perform_action`), and `html.escape(str(target["ip_address"]))` appears three times.
- **M3 — Tests copied across the three Lambdas.** Six tests are near-identical: every-admin, full-HTML-plus-text,
  failure-hides-admins, 405, unreadable-body and db-outage. They could be parametrised, the way `test_logging` already
  is.
- **M4 — Tone is defined several times.**
  - **Types:** `HeroTone` (hero) and `Tone` (section-header) duplicate `models/tone.ts`. `section.ts` declares a
    _different_ `Tone` (with the `-alt` values) under the same name; that one should be a `SectionTone` in `models/`.
  - **Colour maps:** the tone→class maps are written four times (hero, section-header, labelled-list, control).
  - **Spec hosts:** they inline the tone unions instead of importing them.
- **M5 — Pricing and forms.**
  - **Repeated code:**
    - the "label (+50%)" add-on label is built in both `request-form.ts` and `terms-section.ts` (it belongs in
      `PricingService`);
    - `UsageTypeId | 'unsure'` is spelled out three times;
    - the validator blocks are near-identical across the three forms;
    - `{ kind: 'idle', key: '' }` is written three times;
    - `reset({...})` repeats the initial model.
  - **Weak types:** `CreateCommissionRequest.commissionType` and `usageType` are plain `string`.
  - **Copied markup:** `pricing-card.ts` re-implements `labelled-list`'s grouped list.
- **M6 — Dead or misleading code.**
  - **`streaming.ts`:**
    - `streamScheduleSummary` is never used;
    - `` `${dateText}` `` wraps a string in a pointless template literal;
    - its GMT-4 check tests the same thing twice;
    - `#twitchEmbed` is declared but never used;
    - `(window as any).Twitch` is written ×3;
    - the channel name appears twice.
  - **Elsewhere:**
    - `Social.label` is never read;
    - `app.spec.ts` tests that the removed `observerInit` is still absent;
    - `ApiCode` is exported but unused;
    - `PricingService`'s getters are only public for its spec;
    - `.leave-grid` is unused, and `id="kofiframe"` is never referenced;
    - `home.css` holds only a stale comment;
    - `I18nService.locale` could be `asReadonly()`.
  - **Misleading names:**
    - `id="navbar-language"` is the nav-links panel, not a language control;
    - `JumpButton.hostClass` styles the inner button, not the host;
    - `gallery.ts` has mutable public fields.
- **M7 — Repeated markup.**
  - **`rolling-carousel.html`:** the `<img>` block is written out four times; one `ng-template` would do.
  - **`home.html`:** the h2/h3-plus-flourish heading is copied seven times.
  - **`streaming.html`:** hand-rolls buttons and cards (`.stream-cta`, `.stream-schedule-card`) although `appButton`
    and `appCard` exist.
  - **Menu button:** the navbar's menu-button classes duplicate `language-toggle.ts`.
  - **Contradicting CSS:** `.nav-intro` overrides the template's `w-full inset-s-0`.
- **M8 — The hero's per-page override inputs** (`titleClass`, `kickerClass`, `taglineClass`) are still set by home,
  commission and streaming. That contradicts the hero docstring's "per-page overrides were standardized away".

## Out-of-date docs (`D`)

In each case the code is right and the doc needs updating, unless marked otherwise.

- **D1 — The duplicated comments from the comment pass.** These are listed under `C6`; they're tracked here too
  because they came from #54.
- **D2 — `docs/features/review-moderation/spec.md`.**
  - **`floof-comm` replies:** it still describes the old prose replies
    (`403 {"message": "Internal Server Error"}`, "a plain 'try again later' message"). Those were replaced by
    `{code: error}` and `{code: rate_limited, limit, window_hours}`.
  - **Raw IPs:** it says links name an id, "never a raw IP", which its own contact section contradicts
    (`block-contact-ip`).
- **D3 — `aws-setup.md`.**
  - **Step 9:** it says tapping the same Delete link again, then Confirm, shows "already done". In fact the page
    shows no Confirm button once the action is done.
  - **"Reading the logs":** it's missing `admin_not_found`, `unexpected_error`, `owner_email_sent`,
    `commission_emails_sent` and `contact_email_sent`.
- **D4 — `docs/refactor/13-phase-5-plan.md`.**
  - **Out-of-date code:** the `createFormSubmission` signature (`pendingMessage`, `TResponse extends { message }`),
    the `src/app/forms/` location, and "URLs move to `environment.ts`" (they're in `config/api-urls.ts`).
  - **Promised but missing:** a `tone` input on `app-form-field`; only `Control` has one. Roadmap open idea 3 says this
    was "resolved". **Owner decision:** add the input, or fix the docs?
- **D5 — Component specs (`docs/refactor/specs/*`).**
  - **Status lines:** all five still say "draft, awaiting owner review".
  - **Language toggle:** the spec says the label names the language it will switch to; the code shows both languages,
    current first.
  - **Flag paths:** the roadmap says the flags live at `src/assets/flag-*.svg`; they're now under `assets/icons/`.
- **D6 — `05-roadmap.md`.**
  - **Phase 7:** still lists the status messages as hard-coded English (they're translated now).
  - **Contrast:** says "every gradient stop ≥4.5:1" (see `A8`).
- **D7 — `robots.txt` and `CONTEXT.md`.**
  - **`src/robots.txt`:** it's dead (only `public/robots.txt` ships), but `03` and `17` still say to keep it in sync.
    Delete the file and fix the docs.
  - **AI crawler list:** the user-agent list in `public/robots.txt` could add a couple of newer agents, e.g.
    `DuckAssistBot` and `MistralAI-User`.
  - **`CONTEXT.md`:** it calls `--color-lightbox-backdrop` "the dark scrim", but the scrim is `bg-black/80`. It also
    says glass panels sit "specifically over a hero's background image", while 3b deliberately used glass on the
    about page's middle section.
- **D8 — The api-status-codes plan doesn't say what happens if a `rate_limited` reply arrives without numbers.** The
  visitor would see a raw `{limit}`. The current Lambdas always send the numbers.

---

## Fix outline

These are proposed PRs, roughly in priority order. Each needs its own planning pass (grilling if needed, a plan,
test-first build, two-axis review) before building. All of them branch off `working`, never stacked.

1. **Real bugs** — `B1`–`B12`, `B14` and the comment fixes in `C6`/`D1`. Planned in
   [`2026-10-02-pr1-plan.md`](2026-10-02-pr1-plan.md), which moved `B4` and `B6` to a separate streaming page refresh.
   - **Off-by-one limits** (`B1`): align them (a field may hold exactly its maximum), with boundary tests.
   - **Locale keys** (`B2`): add the missing `ja.json` keys, prune the stale and unused ones, and add a key-parity
     test.
   - **Double submit** (`B3`): guard against it; disable the button while pending, or make `action` await.
   - **Streaming date** (`B4`, moved to the streaming page refresh): fix the Saturday calculation, with tests (this overlaps Stage 4's
     `StreamScheduleService`).
   - **Empty submissions** (`B5`): reject blank required fields on the backend, and on the frontend if
     `required` lets whitespace through.
   - **Schedule link** (`B6`, moved to the streaming page refresh): the refresh removes the link.
   - **Timeouts** (`B7`): add a DB `connect_timeout` and an explicit Resend timeout that fit inside the Lambda limits,
     or raise the Lambda timeouts in `aws-setup.md`.
   - **Connections** (`B8`): use `with` in `floof-api`.
   - **Admin crash safety** (`B9`): an error-page wrapper for `floof-admin`, with its security headers.
   - **Partial email failure** (`B10`): decide what happens when the customer email fails after the owner email
     succeeds, and add the `request_id` to the failure log.
   - **Price rounding** (`B11`): round before checking.
   - **Reviews list** (`B12`): add empty and failure states.
   - **Small bugs** (`B14`): the remaining items, apart from the locale-aware date/price pipes.
2. **Abuse protection** — `S1`, `S2`, `S3`, `S5`, and the hardening items in `S6`. Needs a planning round with the
   owner first.
   - **Email checks** (`S1`): a strict check on the customer address, and the visitor's own text left out of the
     customer copy.
   - **Contact rate limit** (`S2`): a per-IP limit (which may need a small `contact_messages` table).
   - **IP matching** (`S3`): match IPv6 by /64 for limits and blocks.
   - **Global caps** (`S2`/`S3`): one cap per Lambda per window.
   - **Concurrency** (`S2`): AWS reserved concurrency, as an `aws-setup.md` step.
   - **Owner choice** (`S3`): optionally Cloudflare Turnstile.
   - **Dependencies** (`S5`): pin them with hashes, and drop the unused `requests` and `certifi`.
   - **Admin header** (`S6`): `nosniff` on `floof-admin`, plus a check that Resend click tracking is off.
3. **Form accessibility** — `A1`–`A5`.
   - **Field errors** (`A1`): `aria-invalid` plus `aria-describedby`, with the error list moved out of the `<label>`.
   - **Radio groups** (`A2`): `fieldset`/`legend` and a visible focus style.
   - **Status line** (`A3`): `role="status"` on `FormStatus`.
   - **Pricing-card buttons** (`A4`): make them `<button>`s.
   - **Language toggle** (`A5`): fix its accessible name.
4. **Lambda tidy-up** — `M1`–`M3` and `C7` (the Python test hygiene). PR 1 fixed the `C6` Lambda comments.
   - **One email sender:** shared `email_sender.send()`.
   - **Shared building blocks:** one parse/validate/escape pattern, one handler name, and an `SGT` date helper.
   - **`floof-admin`:** a per-action table.
   - **Tests:** parametrise the copied tests across the Lambdas.
   - **Success status:** settled in PR 1; every form Lambda replies 200.
5. **Docs refresh** — `D2`–`D8`, plus deleting `src/robots.txt`. This can run any time; it's doc-only.
6. **Recorded follow-ups** — larger, or already on the roadmap. Each needs its own planning.
   - **Gallery** (`A6`): the gallery and lightbox accessibility rebuild (open idea 6).
   - **Phase 7 accessibility pass:** landmarks (`A7`), contrast (`A8`) and reduced motion (`A9`).
   - **Phase 7 i18n:** the hard-coded English (`C1`) and the locale-aware date/price pipes (from `B14`).
   - **Angular conventions** (`C2`).
   - **Design system:** raw colours (`C3`), CSS layering (`C4`), the tone clean-up (`C5`, `M4`) and the
     streaming-page pass (`M7`; open idea 1).
   - **Security header:** a site CSP (`S4`).
   - **Smaller clean-ups:**
     - the remaining smells (`M5`, `M6`, `M8`);
     - the slideshow pause state (`B13`, alongside the stuck-`instant` bug);
     - the frontend test hygiene (`C7`);
     - the baseline script (`C8`).
