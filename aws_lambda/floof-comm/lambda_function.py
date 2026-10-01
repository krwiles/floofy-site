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
from email_sender import EMAIL_FROM, admin_recipients
from request_log import log, log_request

# More than this many requests from one IP in 24 hours are refused — see spec.md "floof-comm"
MAX_REQUESTS_PER_DAY = 2

# numeric(10, 2) in commission_requests holds prices below 100,000,000
MAX_PRICE = 100_000_000

RECENT_REQUESTS_QUERY = """
SELECT COUNT(*) AS recent
FROM commission_requests
WHERE ip_address = %s
    AND created_at >= NOW() - INTERVAL '24 hours'
"""

INSERT_QUERY = """
INSERT INTO commission_requests (
    ip_address, name, email, commission_type, usage_type, description,
    reference_links, usage_explanation, estimated_price, deadline, additional_notes
)
VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
RETURNING id
"""


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
            estimated_price=float(body.get("estimatedPrice", -1.0)),
            deadline=str(body.get("deadline", "")).strip(),
            additional_notes=str(body.get("additionalNotes", "")).strip(),
        )


def lambda_handler(event, context):
    # Record every call: requests are rare, so each one is worth seeing in CloudWatch
    log_request(event)
    method = event["requestContext"]["http"]["method"]
    
    if method == "POST":
        return main(event)
    
    return response(405, {"message": "Method Not Allowed"})


def main(event):
    # Parse the request body into dataclass
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
            return response(403, {"message": "Internal Server Error"})

        # Refuse a third request from the same IP within 24 hours
        cur.execute(RECENT_REQUESTS_QUERY, (sender_ip_address,))
        if cur.fetchone()["recent"] >= MAX_REQUESTS_PER_DAY:
            log("refused", reason="rate_limited", ip=sender_ip_address)
            return response(429, {"message": "You have sent several commission requests recently. Please try again later."})

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

    # Format and send emails
    floofy_email_result = email_floofy(commission_request, request_id, sender_ip_address)
    if floofy_email_result["statusCode"] >= 400:
        return floofy_email_result

    customer_email_result = email_customer(commission_request)
    if customer_email_result["statusCode"] >= 400:
        return customer_email_result
    log("commission_emails_sent", request_id=request_id)
    
    return response(200, {"message": "Thank you! Your commission request submitted successfully. You will receive a confirmation email soon."})


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
    return send_email(admin_recipients(), email_subject, email_body)


def email_customer(commission_request: CommissionRequest):
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
    return send_email([to_email], email_subject, email_body)


def validate_request(commission_request: CommissionRequest):
    # Input validation
    if len(commission_request.name) > 50:
        return response(400, {"message": "Bad Request: name must be fewer than 50 characters"})
    if len(commission_request.email) > 100:
        return response(400, {"message": "Bad Request: email must be fewer than 100 characters"})
    if len(commission_request.description) > 2000:
        return response(400, {"message": "Bad Request: description must be fewer than 2000 characters"})
    if len(commission_request.reference_links) > 2000:
        return response(400, {"message": "Bad Request: reference links must be fewer than 2000 characters"})
    if len(commission_request.additional_notes) > 2000:
        return response(400, {"message": "Bad Request: additional notes must be fewer than 2000 characters"})
    if len(commission_request.deadline) > 50:
        return response(400, {"message": "Bad Request: deadline must be fewer than 50 characters"})
    if len(commission_request.usage_type) > 50:
        return response(400, {"message": "Bad Request: usage type must be fewer than 50 characters"})
    if len(commission_request.commission_type) > 50:
        return response(400, {"message": "Bad Request: commission type must be fewer than 50 characters"})
    if len(commission_request.usage_explanation) > 2000:
        return response(400, {"message": "Bad Request: usage explanation must be fewer than 2000 characters"})

    # The price must be a real number the database column can store (a missing price arrives as -1)
    price = commission_request.estimated_price
    if not math.isfinite(price) or price < 0 or price >= MAX_PRICE:
        return response(400, {"message": "Bad Request: estimated price must be a number from 0 to 99,999,999.99"})

    return None


def send_email(to_emails, subject, body):
    
    resend.api_key = os.environ.get("RESEND_API_KEY")
    
    try:
        commission_details: resend.Emails.SendParams = {
        "from": EMAIL_FROM,
        "to": to_emails,
        "subject": subject,
        "html": body
        }
        
        resend.Emails.send(commission_details)
    
    except Exception as e:
        # Record the real error; the visitor only sees the generic message below
        log("email_failed", error=repr(e))
        return response(500, {"message": f"Failed to send email to {', '.join(to_emails)}, please report this issue to the site administrator.",})
            
    return response(200, {"message": "Email sent successfully"})


def response(status, body):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
        },
        "body": json.dumps(body)
    }