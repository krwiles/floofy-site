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
from email_sender import EMAIL_FROM

def lambda_handler(event, context):
    method = event["requestContext"]["http"]["method"]
    
    if method == "GET":
        return get_reviews()
    elif method == "POST":
        return create_review(event)
    
    return response(405, {"message": "Method Not Allowed"})


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
        return response(400, {"message": "Bad Request: author must be fewer than 50 characters"})
    if len(comment) >= 2000:
        return response(400, {"message": "Bad Request: comment must be fewer than 2000 characters"})

    # Query strings
    rate_limit_query = """
    SELECT COUNT(*)
    FROM reviews
    WHERE ip_address = %s 
        AND created_at >= NOW() - INTERVAL '1 hour'
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
    
    conn = connect_to_db()
    with conn.cursor(row_factory=dict_row) as cur:
        # Check if the IP address is blocked (the same shared check every endpoint uses)
        if is_blocked(cur, ip_address):
            conn.close()
            return response(403, {"message": "Internal Server Error"})

        # Check rate limit
        cur.execute(rate_limit_query, (ip_address,))
        result = cur.fetchone()
        if result and result["count"] > 0:
            conn.close()
            return response(429, {"message": "You have exceeded the limit of 1 comment per hour. Please try again later or contact the site administrator to request a change to your existing review."})

        # Insert the review; RETURNING hands back its new id (for the admin links) and saved time
        cur.execute(insert_query, (author, comment, ip_address))
        saved = cur.fetchone()
        review_id = saved["id"]
        conn.commit()

        # Tell the owner, but never let a notification problem undo or fail a saved review
        try:
            cur.execute(earlier_reviews_query, (ip_address, review_id))
            earlier_reviews = cur.fetchone()["earlier"]
            email_floofy(review_id, saved["created_at"], author, comment, ip_address, earlier_reviews)
        except Exception as error:
            # print() lands in CloudWatch, where the owner can see which review went un-emailed
            print(f"Review #{review_id} was saved, but the owner email failed: {error!r}")
    
    conn.close()

    return response(201, {"message": "Review created successfully"})


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
        "to": [os.environ["FLOOFY_EMAIL"]],
        # Subjects are plain text (never rendered as HTML), so they use the raw value
        "subject": f"New review #{review_id} from {author}",
        "html": email_body,
    })


def response(status, body):
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