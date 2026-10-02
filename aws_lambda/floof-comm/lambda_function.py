import html
import json
import math
import os
import resend
from datetime import datetime
from zoneinfo import ZoneInfo
from dataclasses import dataclass, fields, replace
from psycopg.rows import dict_row

# Shared helpers from aws_lambda/shared/, copied beside this file by build.sh
from admin_links import link
from blocklist import is_blocked
from db import connect_to_db
from email_sender import EMAIL_FROM, admin_recipients, email_content
from replies import replies_on_unexpected_errors, reply
from request_log import log, log_request

# More than this many requests from one IP per window are refused -- see spec.md "floof-comm"; the reply carries both
REQUESTS_PER_WINDOW = 2
REQUEST_WINDOW_HOURS = 24

# numeric(10, 2) in commission_requests holds prices below 100,000,000
MAX_PRICE = 100_000_000

# The longest each text field may be, matching the form and the table's columns (exactly at the limit is fine)
MAX_LENGTHS = {
    "name": 50,
    "email": 100,
    "commission_type": 50,
    "description": 2000,
    "reference_links": 2000,
    "usage_type": 50,
    "usage_explanation": 2000,
    "deadline": 50,
    "additional_notes": 2000,
}

# The fields the form requires; the rest may be left empty
REQUIRED_FIELDS = ("name", "email", "commission_type", "description", "usage_type", "usage_explanation")

RECENT_REQUESTS_QUERY = """
SELECT COUNT(*) AS recent
FROM commission_requests
WHERE ip_address = %s
    AND created_at >= NOW() - %s * INTERVAL '1 hour'
"""

INSERT_QUERY = """
INSERT INTO commission_requests (
    ip_address, name, email, commission_type, usage_type, description,
    reference_links, usage_explanation, estimated_price, deadline, additional_notes
)
VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
RETURNING id
"""


# The commission form's fields, as this Lambda works with them
@dataclass(frozen=True)
class CommissionRequest:
    name: str
    email: str
    commission_type: str
    description: str
    reference_links: str
    usage_type: str
    usage_explanation: str
    estimated_price: float
    deadline: str
    additional_notes: str

    # Build one from the JSON body: text trimmed, missing text empty, price rounded to cents (missing: -1, rejected)
    @classmethod
    def from_body(cls, body: dict) -> "CommissionRequest":
        return cls(
            name=str(body.get("name", "")).strip(),
            email=str(body.get("email", "")).strip(),
            commission_type=str(body.get("commissionType", "")).strip(),
            description=str(body.get("description", "")).strip(),
            reference_links=str(body.get("referenceLinks", "")).strip(),
            usage_type=str(body.get("usageType", "")).strip(),
            usage_explanation=str(body.get("usageExplanation", "")).strip(),
            estimated_price=round(float(body.get("estimatedPrice", -1.0)), 2),
            deadline=str(body.get("deadline", "")).strip(),
            additional_notes=str(body.get("additionalNotes", "")).strip(),
        )


@replies_on_unexpected_errors
def lambda_handler(event, context):
    # Record every call: requests are rare, so each one is worth seeing in CloudWatch
    log_request(event)
    method = event["requestContext"]["http"]["method"]
    
    # Only POST (the form) is accepted; anything else is refused
    if method == "POST":
        return main(event)
    
    return reply(405, "error")


def main(event):
    # Read the JSON body into a CommissionRequest, with its text trimmed
    body = json.loads(event["body"])
    commission_request = CommissionRequest.from_body(body)
    
    # Validate the request
    sender_ip_address = event["requestContext"]["http"]["sourceIp"]
    validation_response = validate_request(commission_request)
    if validation_response is not None:
        log("refused", reason="invalid", ip=sender_ip_address)
        return validation_response

    
    # Check the blocklist and rate limit, then record the request before any email is attempted
    # (leaving the `with` block commits the insert and closes the connection)
    with connect_to_db() as conn, conn.cursor(row_factory=dict_row) as cur:
        # Refuse blocked IPs with the same vague reply the other endpoints give
        if is_blocked(cur, sender_ip_address):
            log("refused", reason="blocked", ip=sender_ip_address)
            return reply(403, "error")

        # Refuse the IP once it has reached the limit within the window
        cur.execute(RECENT_REQUESTS_QUERY, (sender_ip_address, REQUEST_WINDOW_HOURS))
        if cur.fetchone()["recent"] >= REQUESTS_PER_WINDOW:
            log("refused", reason="rate_limited", ip=sender_ip_address)
            return reply(429, "rate_limited", limit=REQUESTS_PER_WINDOW, window_hours=REQUEST_WINDOW_HOURS)

        # Save the request; RETURNING id hands back the new row's id for the admin link
        cur.execute(INSERT_QUERY, (
            sender_ip_address,
            commission_request.name,
            commission_request.email,
            commission_request.commission_type,
            commission_request.usage_type,
            commission_request.description,
            commission_request.reference_links,
            commission_request.usage_explanation,
            commission_request.estimated_price,
            commission_request.deadline,
            commission_request.additional_notes,
        ))
        request_id = cur.fetchone()["id"]
    log("commission_saved", request_id=request_id, ip=sender_ip_address)

    # Email the owner; if that fails the visitor gets an error, since nobody would know the request arrived
    floofy_email_result = email_floofy(commission_request, request_id, sender_ip_address)
    if floofy_email_result["statusCode"] >= 400:
        return floofy_email_result

    # Then the customer's confirmation; its failure is only logged, because the owner already has the request
    customer_email_result = email_customer(commission_request, request_id)
    if customer_email_result["statusCode"] < 400:
        log("commission_emails_sent", request_id=request_id)

    # The owner has the request: tell the visitor it worked
    return reply(200, "ok")


def escaped(commission_request: CommissionRequest) -> CommissionRequest:
    """A copy with every text field HTML-escaped, so user input shows as text in an email instead of live markup."""
    return replace(commission_request, **{
        field.name: html.escape(getattr(commission_request, field.name))
        for field in fields(commission_request)
        if isinstance(getattr(commission_request, field.name), str)
    })


def email_floofy(commission_request: CommissionRequest, request_id: int, sender_ip_address: str):
    # Subjects are plain text (never rendered as HTML), so they use the raw values
    email_subject = f"New Commission Request: {commission_request.name}"

    # Escape every user value before it goes into the HTML body
    commission_request = escaped(commission_request)

    # A signed link that blocks this request's IP after a confirm step — see spec.md "Security model"
    block_url = link(os.environ["ADMIN_URL"], "block-commission-ip", request_id)
    
    email_body = f"""
        <h1>{commission_request.commission_type.capitalize()} Request</h1>
        <p><strong>Name:</strong> {commission_request.name}</p>
        <p><strong>Email:</strong> {commission_request.email}</p>
        <p><strong>Commission Type:</strong> {commission_request.commission_type}</p>
        <p><strong>Description:</strong> {commission_request.description}</p>
        <p><strong>Reference Links:</strong> {commission_request.reference_links}</p>
        <p><strong>Usage Type:</strong> {commission_request.usage_type}</p>
        <p><strong>Usage Explanation:</strong> {commission_request.usage_explanation}</p>
        <p><strong>Estimated Price:</strong> ${commission_request.estimated_price:.2f} USD</p>
        <p><strong>Deadline:</strong> {commission_request.deadline}</p>
        <p><strong>Additional Notes:</strong> {commission_request.additional_notes}</p>
        <p><em>Submitted at: {datetime.now(ZoneInfo("Asia/Singapore")).strftime('%A, %d %B %Y at %I:%M %p (SGT)')}</em></p>
        <p><em>Sender IP Address: {html.escape(sender_ip_address)}</em></p>
        <p><em>Request #{request_id}</em></p>
        <p><a href="{html.escape(block_url)}">Block this requester</a></p>
    """
    
    # Send the email to Floofy
    return send_email(admin_recipients(), email_subject, email_body, request_id, recipient="owner")


def email_customer(commission_request: CommissionRequest, request_id: int):
    # Format the email content
    email_subject = "Commission Request Confirmation"
    to_email = commission_request.email

    # Escape every user value before it goes into the HTML body
    commission_request = escaped(commission_request)
    
    email_body = f"""
        <h1>Thank you for your commission request!</h1>
        <p>Dear {commission_request.name},</p>
        <p>I have received your {commission_request.commission_type} commission request.</p>
        <p>I will review your request and get back to you shortly!</p>
        <p><strong>Details of your request:</strong></p>
        <ul>
            <li><strong>Description:</strong> {commission_request.description}</li>
            <li><strong>Reference Links:</strong> {commission_request.reference_links}</li>
            <li><strong>Usage Type:</strong> {commission_request.usage_type}</li>
            <li><strong>Usage Explanation:</strong> {commission_request.usage_explanation}</li>
            <li><strong>Estimated Price:</strong> ${commission_request.estimated_price:.2f} USD</li>
            <li><strong>Deadline:</strong> {commission_request.deadline}</li>
            <li><strong>Additional Notes:</strong> {commission_request.additional_notes}</li>
        </ul>
    """
    
    # Send the email to the customer
    return send_email([to_email], email_subject, email_body, request_id, recipient="customer", reply_to=admin_recipients())


def validate_request(commission_request: CommissionRequest):
    # Refuse a required field left blank
    for field in REQUIRED_FIELDS:
        if not getattr(commission_request, field):
            return reply(400, "invalid")

    # Refuse any text longer than the form (and its column) allows
    for field, max_length in MAX_LENGTHS.items():
        if len(getattr(commission_request, field)) > max_length:
            return reply(400, "invalid")

    # The price must be a real number the database column can store (a missing price arrives as -1)
    price = commission_request.estimated_price
    if not math.isfinite(price) or price < 0 or price >= MAX_PRICE:
        return reply(400, "invalid")

    return None


def send_email(to_emails, subject, body, request_id, recipient, reply_to=None):
    """Send one email; on failure, log it against the saved request and return a generic error reply.
    `recipient` ("owner" or "customer") labels the log line without recording anyone's address."""
    # Authenticate with Resend using this Lambda's API key
    resend.api_key = os.environ.get("RESEND_API_KEY")

    try:
        # The email to send, from the site's own address
        email_params: resend.Emails.SendParams = {
            "from": EMAIL_FROM,
            "to": to_emails,
            "subject": subject,
            # Full HTML document plus a plain-text copy
            **email_content(body),
        }

        # Let the recipient reply to a real person rather than the no-reply sender
        if reply_to:
            email_params["reply_to"] = reply_to

        # Send it; resend.Emails.send raises on any API or network error
        resend.Emails.send(email_params)

    except Exception as e:
        # Record the real error and which saved request it belongs to; the visitor only sees the generic reply below
        log("email_failed", request_id=request_id, to=recipient, error=repr(e))
        # A generic reply: naming the recipients would reveal the admins' addresses to the visitor
        return reply(500, "error")

    # Sent: callers only check the status code
    return reply(200, "ok")
