import html
import ipaddress
import json
import os
from datetime import datetime, timezone
from dataclasses import dataclass
from psycopg.rows import dict_row

# Shared helpers from aws_lambda/shared/, copied beside this file by build.sh
from admin_links import link
from dates import format_sgt
from db import connect_to_db
from email_sender import admin_recipients, send
from form_input import invalid_fields, text_field
from ip_scope import canonical_ip
from limits import FormLimits, check_visitor
from replies import replies_on_unexpected_errors, reply
from request_log import log, log_request

# The longest each field may be, matching the form (exactly at the limit is fine)
MAX_LENGTHS = {"name": 50, "email": 50, "message": 2000}

# Every field is required
REQUIRED_FIELDS = tuple(MAX_LENGTHS)

# 3 messages per visitor per 24 hours, and 20 per rolling day from everyone; the reply carries the per-visitor rule
CONTACT_LIMITS = FormLimits(table="contact_messages", form="contact", per_visitor=3, window_hours=24, per_day=20)

# Record a message by its IP alone: nothing the visitor typed is kept
INSERT_QUERY = "INSERT INTO contact_messages (ip_address) VALUES (%s)"


# The contact form's fields, as this Lambda works with them
@dataclass(frozen=True)
class ContactRequest:
    name: str
    email: str
    message: str

    # Build one from the JSON body, with text trimmed and anything missing left empty
    @classmethod
    def from_body(cls, body: dict) -> "ContactRequest":
        return cls(
            name=text_field(body, "name"),
            email=text_field(body, "email"),
            message=text_field(body, "message"),
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
    # Read the JSON body into a ContactRequest, with its text trimmed
    body = json.loads(event["body"])
    contact_request = ContactRequest.from_body(body)

    # The visitor's IP in standard form, so the same visitor is always stored and matched the same way
    sender_ip_address = canonical_ip(event["requestContext"]["http"]["sourceIp"])

    # Refuse input the form would never send
    if invalid_fields(contact_request, MAX_LENGTHS, REQUIRED_FIELDS):
        log("refused", reason="invalid", ip=sender_ip_address)
        return reply(400, "invalid")

    # Check the blocklist and limits, then record the message before any email is attempted
    # (leaving the `with` block commits the insert and closes the connection)
    with connect_to_db() as conn, conn.cursor(row_factory=dict_row) as cur:
        # Refuse a blocked, over-limit or capped visitor (check_visitor logs why and builds the reply)
        refusal = check_visitor(cur, CONTACT_LIMITS, sender_ip_address)
        if refusal:
            return refusal

        # Record it, so a failed send still counts towards the limits
        cur.execute(INSERT_QUERY, (sender_ip_address,))

    # Email the owner; a failure (already logged inside send) means the visitor gets an error
    if not email_floofy(contact_request, sender_ip_address):
        return reply(500, "error")
    log("contact_email_sent", ip=sender_ip_address)
    
    # Sent: tell the visitor it worked
    return reply(200, "ok")


def email_floofy(contact_request: ContactRequest, sender_ip_address):
    # Subjects are plain text (never rendered as HTML), so they use the raw values
    email_subject = f"Website Contact: {contact_request.name}"

    # Escape every user value so it shows as text in the email instead of live markup
    name = html.escape(contact_request.name)
    email = html.escape(contact_request.email)
    message = html.escape(contact_request.message)

    # A signed Block link naming the sender's IP as a number, since contact messages aren't stored -- see spec.md
    block_url = link(os.environ["ADMIN_URL"], "block-contact-ip", int(ipaddress.ip_address(sender_ip_address)))

    email_body = f"""
        <h1>Floofy site contact sent by {name}</h1>
        <p><strong>Name:</strong> {name}</p>
        <p><strong>Email:</strong> {email}</p>
        <p><strong>Message:</strong> {message}</p>
        <p><em>Submitted at: {format_sgt(datetime.now(timezone.utc))}</em></p>
        <p><em>Sender IP Address: {html.escape(sender_ip_address)}</em></p>
        <p><a href="{html.escape(block_url)}">Block this sender</a></p>
    """
    
    # Send it to the admins; True if it went out
    return send(admin_recipients(), email_subject, email_body, to="owner")
