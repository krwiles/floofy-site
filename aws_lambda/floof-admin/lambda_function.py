"""floof-admin: the confirm page and actions behind the signed links in the owner's emails.

GET shows what a link will do and never changes anything (email scanners open links on their own); only the Confirm
button's POST acts. Design: docs/features/review-moderation/spec.md.
"""

import base64
import html
import time
from urllib.parse import parse_qs
from zoneinfo import ZoneInfo

from psycopg.rows import dict_row

# Shared helpers from aws_lambda/shared/, copied beside this file by build.sh
from admin_links import verify
from blocklist import block, is_blocked
from db import connect_to_db
from request_log import log, log_request

# Headers on every page, so tokens aren't cached, leaked via Referer, indexed or framed — see spec.md
SECURITY_HEADERS = {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer",
    "X-Robots-Tag": "noindex",
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'",
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

SNIPPET_LENGTH = 200
SGT = ZoneInfo("Asia/Singapore")


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

        if action == "delete-review":
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
    # Commission links read commission_requests; both review actions read reviews
    query = COMMISSION_QUERY if action == "block-commission-ip" else REVIEW_QUERY
    cur.execute(query, (target_id,))
    return cur.fetchone()


def already_done(cur, action, target):
    """Whether confirming would change nothing: the review is already hidden, or its IP already blocked."""
    # A delete is done once the review's flag is set
    if action == "delete-review":
        return target["deleted"]

    # A block is done once the row's IP is in blocked_ips
    return is_blocked(cur, target["ip_address"])


def source_label(action, target_id):
    """How the block reason names its source, e.g. 'review #7' or 'commission #42'."""
    return f"commission #{target_id}" if action == "block-commission-ip" else f"review #{target_id}"


def describe(action, target_id, target):
    """The page title and a sentence saying exactly what Confirm will do."""
    # Deleting only hides the one review
    if action == "delete-review":
        return f"Delete review #{target_id}?", "The review will be hidden from the site."

    # Both blocks have the same effect; only the title names a different source
    ip = html.escape(str(target["ip_address"]))
    block_effect = f"IP {ip} will no longer be able to post reviews, send commission requests or send contact messages."
    if action == "block-review-ip":
        return f"Block the reviewer behind review #{target_id}?", block_effect
    return f"Block the requester behind commission request #{target_id}?", block_effect


def target_details(action, target):
    """The escaped who / when / what of the target; blocks show a snippet, deletes show the full review."""
    # Deletes show the whole review so the owner can judge it; blocks just need enough to recognise it
    text = target["text"]
    if action != "delete-review" and len(text) > SNIPPET_LENGTH:
        text = text[:SNIPPET_LENGTH] + "…"

    # Show the time in Singapore time, matching the notification emails
    posted = target["created_at"].astimezone(SGT).strftime("%A, %d %B %Y at %I:%M %p (SGT)")

    return (
        f"<p><strong>From:</strong> {html.escape(target['who'])}</p>"
        f"<p><strong>Sent:</strong> {posted}</p>"
        f"<p><strong>IP:</strong> {html.escape(str(target['ip_address']))}</p>"
        f"<blockquote>{html.escape(text)}</blockquote>"
    )


def invalid_link_page():
    # One message for every kind of bad token, so a prober learns nothing about why it failed
    return page(403, "Link not valid", "<p>This link is invalid or has expired.</p>")


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
