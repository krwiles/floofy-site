import html
import json
import math
import os
from datetime import datetime, timezone
from dataclasses import dataclass, fields, replace
from psycopg.rows import dict_row

# Shared helpers from aws_lambda/shared/, copied beside this file by build.sh
from admin_links import link
from dates import format_sgt
from db import connect_to_db
from email_rules import MAX_ADDRESS_LENGTH, defuse_links, is_plain_address
from email_sender import admin_recipients, send
from form_input import invalid_fields
from ip_scope import canonical_ip
from limits import FormLimits, check_visitor
from replies import replies_on_unexpected_errors, reply
from request_log import log, log_request

# 2 requests per visitor per 24 h (spec.md "floof-comm"), 10 a day from everyone; the reply carries the visitor rule
COMMISSION_LIMITS = FormLimits(table="commission_requests", form="commission", per_visitor=2, window_hours=24, per_day=10)

# The only commission types and usages the form offers (src/assets/data/pricing.json, plus the form's "unsure")
COMMISSION_TYPES = ("chibi", "emote", "illustration")
USAGE_TYPES = ("personal", "promotion", "distribution", "products", "unsure")

# numeric(10, 2) in commission_requests holds prices below 100,000,000
MAX_PRICE = 100_000_000

# The longest each text field may be, matching the form and the table's columns (exactly at the limit is fine)
MAX_LENGTHS = {
    "name": 50,
    "email": MAX_ADDRESS_LENGTH,
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
        return handle_post(event)
    
    return reply(405, "error")


def handle_post(event):
    # Read the JSON body into a CommissionRequest, with its text trimmed
    body = json.loads(event["body"])
    commission_request = CommissionRequest.from_body(body)

    # The visitor's IP in standard form, so the same visitor is always stored and matched the same way
    sender_ip_address = canonical_ip(event["requestContext"]["http"]["sourceIp"])

    # Refuse input the form would never send
    if is_invalid(commission_request):
        log("refused", reason="invalid", ip=sender_ip_address)
        return reply(400, "invalid")

    
    # Check the blocklist and rate limit, then record the request before any email is attempted
    # (leaving the `with` block commits the insert and closes the connection)
    with connect_to_db() as conn, conn.cursor(row_factory=dict_row) as cur:
        # Refuse a blocked, over-limit or capped visitor (check_visitor logs why and builds the reply)
        refusal = check_visitor(cur, COMMISSION_LIMITS, sender_ip_address)
        if refusal:
            return refusal

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
    if not email_floofy(commission_request, request_id, sender_ip_address):
        return reply(500, "error")

    # Then the customer's confirmation; its failure is only logged, because the owner already has the request
    if email_customer(commission_request, request_id):
        log("commission_emails_sent", request_id=request_id)

    # The owner has the request: tell the visitor it worked
    return reply(200, "ok")


def with_text_fields(commission_request: CommissionRequest, change) -> CommissionRequest:
    """A copy with `change` applied to every text field (the price is left alone)."""
    return replace(commission_request, **{
        field.name: change(getattr(commission_request, field.name))
        for field in fields(commission_request)
        if isinstance(getattr(commission_request, field.name), str)
    })


def escaped(commission_request: CommissionRequest) -> CommissionRequest:
    """A copy with every text field HTML-escaped, so user input shows as text in an email instead of live markup."""
    return with_text_fields(commission_request, html.escape)


def defused(commission_request: CommissionRequest) -> CommissionRequest:
    """A copy with links in every text field made unclickable, for the customer's confirmation only."""
    return with_text_fields(commission_request, defuse_links)


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
        <p><em>Submitted at: {format_sgt(datetime.now(timezone.utc))}</em></p>
        <p><em>Sender IP Address: {html.escape(sender_ip_address)}</em></p>
        <p><em>Request #{request_id}</em></p>
        <p><a href="{html.escape(block_url)}">Block this requester</a></p>
    """
    
    # Send it to the admins; True if it went out
    return send(admin_recipients(), email_subject, email_body, request_id=request_id, to="owner")


def email_customer(commission_request: CommissionRequest, request_id: int):
    # Format the email content
    email_subject = "Commission Request Confirmation"
    to_email = commission_request.email

    # Escape every user value, then break up any links, so this copy can't carry clickable phishing to a stranger
    commission_request = defused(escaped(commission_request))

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
    
    # Send it to the customer, replying to the admins; True if it went out
    return send([to_email], email_subject, email_body, reply_to=admin_recipients(), request_id=request_id, to="customer")


def is_invalid(commission_request: CommissionRequest) -> bool:
    """True if the request breaks any of the form's rules."""
    # Blank required fields, or text longer than the form (and its column) allows
    if invalid_fields(commission_request, MAX_LENGTHS, REQUIRED_FIELDS):
        return True

    # An address that isn't exactly one plain address, so the confirmation can't be aimed at a list
    if not is_plain_address(commission_request.email):
        return True

    # A type or usage the form never offers, so those fields can't carry free text
    if commission_request.commission_type not in COMMISSION_TYPES or commission_request.usage_type not in USAGE_TYPES:
        return True

    # The price must be a real number the database column can store (a missing price arrives as -1)
    price = commission_request.estimated_price
    return not math.isfinite(price) or price < 0 or price >= MAX_PRICE