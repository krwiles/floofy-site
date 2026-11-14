"""floof-admin: the confirm page and actions behind the signed links in the owner's emails.

GET shows what a link will do and never changes anything (email scanners open links on their own); only the Confirm
button's POST acts. Design: docs/features/review-moderation/spec.md.
"""

import base64
import functools
import html
import ipaddress
import time
from dataclasses import dataclass
from urllib.parse import parse_qs

from psycopg.rows import dict_row

# Shared helpers from aws_lambda/shared/, copied beside this file by build.sh
from admin_links import verify
from blocklist import block, is_blocked
from dates import format_sgt
from db import connect_to_db
from ip_scope import canonical_ip, ip_scope
from request_log import log, log_request

# Headers on every page, so tokens aren't cached, leaked via Referer, indexed or framed — see spec.md
SECURITY_HEADERS = {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer",
    "X-Robots-Tag": "noindex",
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'",
    # Browsers must trust the declared Content-Type rather than guess one from the body
    "X-Content-Type-Options": "nosniff",
}

# Both lookups return the same column names (who / text / ...), so the page code doesn't care which table it came from
REVIEW_QUERY = """
SELECT author AS who, comment AS text, created_at, ip_address, deleted
FROM reviews
WHERE id = %s
"""
COMMISSION_QUERY = """
SELECT name AS who, description AS text, created_at, ip_address, FALSE AS deleted
FROM commission_requests
WHERE id = %s
"""
DELETE_REVIEW_QUERY = "UPDATE reviews SET deleted = TRUE WHERE id = %s"


@dataclass(frozen=True)
class AdminAction:
    """Everything that differs between the signed-link actions; `{id}` in `title` and `source` is the link's target."""

    # How to look up the target by id, or None when the link carries the sender's IP itself (contact messages)
    query: str | None
    # The confirm page's title
    title: str
    # True: soft-delete the review; False: block the target's IP
    deletes: bool
    # How the block reason names its source, e.g. "review #7"
    source: str

    @property
    def link_carries_ip(self):
        """True for contact messages: nothing is stored, so the link's target is the sender's IP itself."""
        return self.query is None


# One entry per action admin_links can sign, so adding or changing an action is one edit
ACTIONS = {
    "delete-review": AdminAction(REVIEW_QUERY, "Delete review #{id}?", deletes=True, source="review #{id}"),
    "block-review-ip": AdminAction(
        REVIEW_QUERY, "Block the reviewer behind review #{id}?", deletes=False, source="review #{id}"
    ),
    "block-commission-ip": AdminAction(
        COMMISSION_QUERY,
        "Block the requester behind commission request #{id}?",
        deletes=False,
        source="commission #{id}",
    ),
    "block-contact-ip": AdminAction(
        None, "Block the sender of a contact message?", deletes=False, source="contact message"
    ),
}

SNIPPET_LENGTH = 200


def shows_error_page_on_unexpected_errors(handler):
    """Wraps the handler so an unexpected exception becomes a safe 500 page (with the security headers), not AWS's
    raw 502. Logs only the error, never the event, which holds the token."""

    @functools.wraps(handler)
    def wrapped(event, context):
        # Run the real handler; anything it didn't plan for still gets a page with the security headers
        try:
            return handler(event, context)
        except Exception as error:
            log("unexpected_error", error=repr(error))
            return error_page()

    return wrapped


@shows_error_page_on_unexpected_errors
def lambda_handler(event, context):
    # Record every call: anyone reaching this Lambda is either the owner or someone probing it
    log_request(event)
    method = event["requestContext"]["http"]["method"]
    ip = event["requestContext"]["http"]["sourceIp"]

    # GET only ever shows the confirm page; POST (the Confirm button) is the only thing that acts
    if method == "GET":
        return show_confirm_page(query_token(event), ip)
    if method == "POST":
        return perform_action(form_token(event), ip)

    return page(405, "Method not allowed", "<p>This page only supports opening a link and pressing Confirm.</p>")


def query_token(event):
    """The `?token=` value from the link, or None."""
    return (event.get("queryStringParameters") or {}).get("token")


def form_token(event):
    """The `token` field from the Confirm form's url-encoded body, or None."""
    # Function URLs may base64-encode a form body; decode it back to text first
    body = event.get("body") or ""
    if event.get("isBase64Encoded"):
        body = base64.b64decode(body).decode("utf-8", errors="replace")

    # parse_qs turns "token=abc" into {"token": ["abc"]}
    return parse_qs(body).get("token", [None])[0]


def show_confirm_page(token, ip):
    # Refuse bad or expired links before touching the database (logged without the token, which is a credential)
    verified = verify(token, now=time.time())
    if verified is None:
        log("admin_invalid_link", method="GET", ip=ip)
        return invalid_link_page()
    action, target_id = verified

    # Look up what the link points at, and whether its action has already happened
    with connect_to_db() as conn, conn.cursor(row_factory=dict_row) as cur:
        target = load_target(cur, action, target_id)
        if target is None:
            log("admin_not_found", action=action, target_id=target_id, ip=ip)
            return not_found_page()
        done = already_done(cur, action, target)
    log("admin_confirm_shown", action=action, target_id=target_id, ip=ip)

    # Describe the target, and offer a Confirm button only if there's something left to do
    title, consequence = describe(action, target_id, target)
    details = target_details(action, target)
    if done:
        return page(200, title, f"{details}<p><strong>This has already been done.</strong> Nothing more to do.</p>")

    # The form posts the same token back to this URL; html.escape keeps the attribute value intact
    form = (
        '<form method="post">'
        f'<input type="hidden" name="token" value="{html.escape(token)}">'
        "<button type=\"submit\">Confirm</button>"
        "</form>"
    )
    return page(200, title, f"{details}<p>{consequence}</p>{form}")


def perform_action(token, ip):
    # Re-check the token: the POST is a fresh request and could come from anywhere
    verified = verify(token, now=time.time())
    if verified is None:
        log("admin_invalid_link", method="POST", ip=ip)
        return invalid_link_page()
    action, target_id = verified

    # Load the target, then act; leaving the `with` block commits and closes the connection
    with connect_to_db() as conn, conn.cursor(row_factory=dict_row) as cur:
        target = load_target(cur, action, target_id)
        if target is None:
            log("admin_not_found", action=action, target_id=target_id, ip=ip)
            return not_found_page()

        if ACTIONS[action].deletes:
            # Soft delete: hides the review but keeps the row, so it can be restored by hand
            changed = not target["deleted"]
            if changed:
                cur.execute(DELETE_REVIEW_QUERY, (target_id,))
        else:
            # Block the IP stored on the row; the token only ever names an id, never an IP
            changed = block(cur, target["ip_address"], f"admin email: {source_label(action, target_id)}")

    # Record and report what happened
    log("admin_action", action=action, target_id=target_id, result="done" if changed else "already_done", ip=ip)
    title, _ = describe(action, target_id, target)
    if not changed:
        return page(200, title, "<p><strong>Already done.</strong> Nothing changed.</p>")
    return page(200, title, "<p><strong>Done.</strong></p>")


def load_target(cur, action, target_id):
    """The review or commission request the action applies to, or None if it doesn't exist."""
    # Contact messages aren't stored: the link itself carries the sender's IP, as a number
    if ACTIONS[action].link_carries_ip:
        return {"ip_address": ipaddress.ip_address(target_id), "deleted": False}

    # Otherwise read the row the link names, from the action's own table
    query = ACTIONS[action].query
    cur.execute(query, (target_id,))
    return cur.fetchone()


def already_done(cur, action, target):
    """Whether confirming would change nothing: the review is already hidden, or its IP already blocked."""
    # A delete is done once the review's flag is set
    if ACTIONS[action].deletes:
        return target["deleted"]

    # A block is done once the row's IP is in blocked_ips
    return is_blocked(cur, target["ip_address"])


def source_label(action, target_id):
    """How the block reason names its source, e.g. 'review #7', 'commission #42' or 'contact message'."""
    return ACTIONS[action].source.format(id=target_id)


def describe(action, target_id, target):
    """The page title and a sentence saying exactly what Confirm will do."""
    # The title names the review or request the link points at (contact blocks have no number)
    title = ACTIONS[action].title.format(id=target_id)

    # Deleting only hides the one review
    if ACTIONS[action].deletes:
        return title, "The review will be hidden from the site."

    # Every block has the same effect, whatever its source
    block_effect = (
        f"{blocked_range(target['ip_address'])} will no longer be able to post reviews, send commission requests or "
        "send contact messages."
    )
    return title, block_effect


def blocked_range(ip):
    """What a block on `ip` covers, escaped: "IP 203.0.113.7", or "IP range 2001:db8:1:2::/64" for IPv6."""
    # ip_scope gives an IPv4 address unchanged, or an IPv6 address's /64 network
    scope = ip_scope(ip)
    label = "IP" if ipaddress.ip_address(canonical_ip(ip)).version == 4 else "IP range"
    return f"{label} {html.escape(scope)}"


def escaped_ip(ip):
    """`ip` (text or an ipaddress object) as text that's safe inside the page's HTML."""
    return html.escape(str(ip))


def target_details(action, target):
    """The escaped who / when / what of the target; blocks show a snippet, deletes show the full review."""
    # A contact block has only the IP to show
    if ACTIONS[action].link_carries_ip:
        return f"<p><strong>IP:</strong> {escaped_ip(target['ip_address'])}</p>"

    # Deletes show the whole review so the owner can judge it; blocks just need enough to recognise it
    text = target["text"]
    if not ACTIONS[action].deletes and len(text) > SNIPPET_LENGTH:
        text = text[:SNIPPET_LENGTH] + "…"

    # Show the time in Singapore time, matching the notification emails
    posted = format_sgt(target["created_at"])

    return (
        f"<p><strong>From:</strong> {html.escape(target['who'])}</p>"
        f"<p><strong>Sent:</strong> {posted}</p>"
        f"<p><strong>IP:</strong> {escaped_ip(target['ip_address'])}</p>"
        f"<blockquote>{html.escape(text)}</blockquote>"
    )


def invalid_link_page():
    # One message for every kind of bad token, so a prober learns nothing about why it failed
    return page(403, "Link not valid", "<p>This link is invalid or has expired.</p>")


def error_page():
    # Retrying is safe: every action is idempotent, so a half-finished one simply completes
    return page(
        500,
        "Something went wrong",
        "<p>Nothing was changed, or the change may not have finished. Please try the link again.</p>",
    )


def not_found_page():
    return page(404, "Not found", "<p>That review or request was not found. It may have been removed from the database.</p>")


def page(status, title, body_html):
    """A minimal HTML page with the security headers. `title` must already be safe (it never holds user input)."""
    return {
        "statusCode": status,
        "headers": dict(SECURITY_HEADERS),
        "body": (
            "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\">"
            "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">"
            f"<title>{title}</title>"
            "<style>body{font-family:system-ui,sans-serif;max-width:40rem;margin:2rem auto;padding:0 1rem;line-height:1.5}"
            "blockquote{border-left:3px solid #ccc;margin:1rem 0;padding-left:1rem;white-space:pre-wrap}"
            "button{font-size:1.1rem;padding:.6rem 1.4rem;cursor:pointer}</style>"
            f"</head><body><h1>{title}</h1>{body_html}</body></html>"
        ),
    }
