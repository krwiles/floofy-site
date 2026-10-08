import html
import json
import os
from dataclasses import dataclass

from psycopg.rows import dict_row

# Shared helpers from aws_lambda/shared/, copied beside this file by build.sh
from admin_links import link
from blocklist import is_blocked
from dates import format_sgt
from db import connect_to_db
from email_sender import admin_recipients, send
from form_input import invalid_fields
from ip_scope import canonical_ip, ip_scope
from limits import busy_reply, over_global_cap
from replies import replies_on_unexpected_errors, reply, response
from request_log import log, log_request

# At most this many reviews per IP per window; the reply carries both, so the site never hard-codes them
REVIEWS_PER_WINDOW = 1
REVIEW_WINDOW_HOURS = 1

# At most this many reviews per rolling day from everyone together, then the form replies "busy"
REVIEWS_PER_DAY = 20

# The longest author and comment the form allows; the author column is varchar(50), the comment limit is the site's rule
MAX_LENGTHS = {"author": 50, "comment": 2000}

# Both fields are required
REQUIRED_FIELDS = tuple(MAX_LENGTHS)


# The review form's fields, as this Lambda works with them
@dataclass(frozen=True)
class ReviewRequest:
    author: str
    comment: str

    # Build one from the JSON body, with text trimmed and anything missing left empty
    @classmethod
    def from_body(cls, body: dict) -> "ReviewRequest":
        return cls(author=str(body.get("author", "")).strip(), comment=str(body.get("comment", "")).strip())


@replies_on_unexpected_errors
def lambda_handler(event, context):
    # Record every call: requests are rare, so each one is worth seeing in CloudWatch
    log_request(event)
    method = event["requestContext"]["http"]["method"]
    
    # GET lists the reviews; POST adds one; anything else is refused
    if method == "GET":
        return get_reviews()
    elif method == "POST":
        return handle_post(event)
    
    return reply(405, "error")


def get_reviews():
    # Every review not hidden by the owner, newest first, without the reviewers' IP addresses
    query = """
    SELECT
        id,
        author,
        comment,
        created_at
    FROM reviews
    WHERE deleted = FALSE
    ORDER BY created_at DESC
    """

    # Run the query; leaving the `with` block closes the connection, even if the query fails
    with connect_to_db() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(query)
        rows = cur.fetchall()

    return response(200, rows)


def handle_post(event):
    # Read the JSON body into a ReviewRequest, with its text trimmed
    body = json.loads(event["body"])
    review = ReviewRequest.from_body(body)
    author, comment = review.author, review.comment

    # The visitor's IP in standard form, so the same visitor is always stored and matched the same way
    ip_address = canonical_ip(event["requestContext"]["http"]["sourceIp"])

    # Refuse input the form would never send (a blank field, or one longer than the form allows)
    if invalid_fields(review, MAX_LENGTHS, REQUIRED_FIELDS):
        log("refused", reason="invalid", ip=ip_address)
        return reply(400, "invalid")

    # The SQL for the rate-limit count, the insert and the owner email's earlier-reviews count
    rate_limit_query = """
    SELECT COUNT(*)
    FROM reviews
    WHERE ip_address <<= %s::inet
        AND created_at >= NOW() - %s * INTERVAL '1 hour'
    """
    insert_query = """
    INSERT INTO reviews (author, comment, ip_address)
    VALUES (%s, %s, %s)
    RETURNING id, created_at
    """
    earlier_reviews_query = """
    SELECT COUNT(*) AS earlier
    FROM reviews
    WHERE ip_address = %s
        AND id < %s
    """

    # One connection for the checks, the insert and the notification; leaving the `with` block closes it
    with connect_to_db() as conn, conn.cursor(row_factory=dict_row) as cur:
        # Check if the IP address is blocked (the same shared check every endpoint uses)
        if is_blocked(cur, ip_address):
            log("refused", reason="blocked", ip=ip_address)
            return reply(403, "error")

        # Refuse the visitor (their IPv4 address, or IPv6 /64) once they've reached the limit within the window
        cur.execute(rate_limit_query, (ip_scope(ip_address), REVIEW_WINDOW_HOURS))
        result = cur.fetchone()
        if result and result["count"] >= REVIEWS_PER_WINDOW:
            log("refused", reason="rate_limited", ip=ip_address)
            return reply(429, "rate_limited", limit=REVIEWS_PER_WINDOW, window_hours=REVIEW_WINDOW_HOURS)

        # Refuse everyone once today's reviews reach the global cap
        if over_global_cap(cur, "reviews", REVIEWS_PER_DAY):
            return busy_reply("review")

        # Insert the review and commit straight away; RETURNING hands back its new id (for the admin links) and time
        cur.execute(insert_query, (author, comment, ip_address))
        saved = cur.fetchone()
        review_id = saved["id"]
        conn.commit()
        log("review_saved", review_id=review_id, ip=ip_address)

        # Tell the owner, but never let a notification problem undo or fail a saved review
        try:
            cur.execute(earlier_reviews_query, (ip_address, review_id))
            earlier_reviews = cur.fetchone()["earlier"]
            sent = email_floofy(review_id, saved["created_at"], author, comment, ip_address, earlier_reviews)
        except Exception as error:
            # Building the email failed (e.g. a missing setting): logged like a failed send
            log("email_failed", review_id=review_id, to="owner", error=repr(error))
            sent = False

        # A failed send was already logged inside send(); record the success too
        if sent:
            log("owner_email_sent", review_id=review_id)

    # Saved: 200, the success status every form Lambda uses
    return reply(200, "ok")


def email_floofy(review_id, created_at, author, comment, ip_address, earlier_reviews):
    """Email the owner a new review, with signed Delete / Block links. Returns whether it was sent; raises only if the
    email can't be built (e.g. a missing setting)."""
    # Signed links that act only after a confirm step — see spec.md "Security model"
    admin_url = os.environ["ADMIN_URL"]
    delete_url = link(admin_url, "delete-review", review_id)
    block_url = link(admin_url, "block-review-ip", review_id)

    # Escape every user value so it shows as text in the email instead of live markup
    safe_author = html.escape(author)
    safe_comment = html.escape(comment)

    email_body = f"""
        <h1>New review #{review_id}</h1>
        <p><strong>Author:</strong> {safe_author}</p>
        <p><strong>Comment:</strong> {safe_comment}</p>
        <p><em>Posted at: {format_sgt(created_at)}</em></p>
        <p><em>Sender IP Address: {html.escape(ip_address)}</em></p>
        <p><strong>Earlier reviews from this IP:</strong> {earlier_reviews}</p>
        <p><a href="{html.escape(delete_url)}">Delete this review</a></p>
        <p><a href="{html.escape(block_url)}">Block this reviewer</a></p>
    """

    # Send it (subjects are plain text, never rendered as HTML, so they use the raw value); True if it went out
    subject = f"New review #{review_id} from {author}"
    return send(admin_recipients(), subject, email_body, review_id=review_id, to="owner")
