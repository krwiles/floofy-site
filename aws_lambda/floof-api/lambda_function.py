import html
import json
import datetime
import os
from zoneinfo import ZoneInfo

import resend
from psycopg.rows import dict_row

# Shared helpers from aws_lambda/shared/, copied beside this file by build.sh
from admin_links import link
from blocklist import is_blocked
from db import connect_to_db
from email_sender import EMAIL_FROM, admin_recipients, email_content
from request_log import log, log_request

# At most this many reviews per IP per window; the reply carries both, so the site never hard-codes them
REVIEWS_PER_WINDOW = 1
REVIEW_WINDOW_HOURS = 1


def lambda_handler(event, context):
    # Record every call: requests are rare, so each one is worth seeing in CloudWatch
    log_request(event)
    method = event["requestContext"]["http"]["method"]
    
    # GET lists the reviews; POST adds one; anything else is refused
    if method == "GET":
        return get_reviews()
    elif method == "POST":
        return create_review(event)
    
    return reply(405, "error")


def get_reviews():
    # Query to fetch reviews without IP addresses and deleted reviews
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
    
    # Run the query, then close the connection
    conn = connect_to_db()
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(query)
        rows = cur.fetchall()

    conn.close()
    
    return response(200, rows)


def create_review(event):
    # Parse the request body
    body = json.loads(event["body"])
    author = body.get("author", "").strip()
    comment = body.get("comment", "").strip()
    ip_address = event["requestContext"]["http"]["sourceIp"]

    # Input validation
    if len(author) >= 50:
        log("refused", reason="invalid", ip=ip_address)
        return reply(400, "invalid")
    if len(comment) >= 2000:
        log("refused", reason="invalid", ip=ip_address)
        return reply(400, "invalid")

    # Query strings
    rate_limit_query = """
    SELECT COUNT(*)
    FROM reviews
    WHERE ip_address = %s 
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
    
    # One connection for the checks, the insert and the notification
    conn = connect_to_db()
    with conn.cursor(row_factory=dict_row) as cur:
        # Check if the IP address is blocked (the same shared check every endpoint uses)
        if is_blocked(cur, ip_address):
            log("refused", reason="blocked", ip=ip_address)
            conn.close()
            return reply(403, "error")

        # Check rate limit
        cur.execute(rate_limit_query, (ip_address, REVIEW_WINDOW_HOURS))
        result = cur.fetchone()
        if result and result["count"] >= REVIEWS_PER_WINDOW:
            log("refused", reason="rate_limited", ip=ip_address)
            conn.close()
            return reply(429, "rate_limited", limit=REVIEWS_PER_WINDOW, window_hours=REVIEW_WINDOW_HOURS)

        # Insert the review; RETURNING hands back its new id (for the admin links) and saved time
        cur.execute(insert_query, (author, comment, ip_address))
        saved = cur.fetchone()
        review_id = saved["id"]
        conn.commit()
        log("review_saved", review_id=review_id, ip=ip_address)

        # Tell the owner, but never let a notification problem undo or fail a saved review
        try:
            cur.execute(earlier_reviews_query, (ip_address, review_id))
            earlier_reviews = cur.fetchone()["earlier"]
            email_floofy(review_id, saved["created_at"], author, comment, ip_address, earlier_reviews)
            log("owner_email_sent", review_id=review_id)
        except Exception as error:
            # Recorded so the owner can see which saved review went un-emailed, and why
            log("owner_email_failed", review_id=review_id, error=repr(error))
    
    conn.close()

    return reply(201, "ok")


def email_floofy(review_id, created_at, author, comment, ip_address, earlier_reviews):
    """Email the owner a new review, with signed Delete / Block links. Raises if anything goes wrong."""
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
        <p><em>Posted at: {created_at.astimezone(ZoneInfo("Asia/Singapore")).strftime('%A, %d %B %Y at %I:%M %p (SGT)')}</em></p>
        <p><em>Sender IP Address: {html.escape(ip_address)}</em></p>
        <p><strong>Earlier reviews from this IP:</strong> {earlier_reviews}</p>
        <p><a href="{html.escape(delete_url)}">Delete this review</a></p>
        <p><a href="{html.escape(block_url)}">Block this reviewer</a></p>
    """

    # Send it; resend.Emails.send raises on any API or network error
    resend.api_key = os.environ["RESEND_API_KEY"]
    resend.Emails.send({
        "from": EMAIL_FROM,
        "to": admin_recipients(),
        # Subjects are plain text (never rendered as HTML), so they use the raw value
        "subject": f"New review #{review_id} from {author}",
        # Full HTML document plus a plain-text copy
        **email_content(email_body),
    })


def reply(status, code, **extra):
    """A form reply: the HTTP status plus a short code the site translates -- see docs/features/api-status-codes/plan.md."""
    return response(status, {"code": code, **extra})


def response(status, body):
    # A JSON reply in the shape Lambda function URLs expect (datetimes as ISO text)
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
        },
        "body": json.dumps(body, default=json_serializer)
    }


def json_serializer(obj):
    # Custom JSON serializer for datetime objects
    if isinstance(obj, datetime.datetime):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")