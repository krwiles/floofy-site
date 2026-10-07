import html
import ipaddress
import json
import os
import resend
from datetime import datetime
from zoneinfo import ZoneInfo
from dataclasses import dataclass
from psycopg.rows import dict_row

# Shared helpers from aws_lambda/shared/, copied beside this file by build.sh
from admin_links import link
from blocklist import is_blocked
from db import connect_to_db
from email_sender import EMAIL_FROM, admin_recipients, email_content
from ip_scope import canonical_ip, ip_scope
from limits import busy_reply, over_global_cap
from replies import replies_on_unexpected_errors, reply
from request_log import log, log_request

# The longest each field may be, matching the form (exactly at the limit is fine)
MAX_LENGTHS = {"name": 50, "email": 50, "message": 2000}

# At most this many messages per visitor per window, and per rolling day from everyone; the reply carries the former
MESSAGES_PER_WINDOW = 3
MESSAGE_WINDOW_HOURS = 24
MESSAGES_PER_DAY = 20

# Count this visitor's recent messages (their IPv4 address, or anything in their IPv6 /64)
RECENT_MESSAGES_QUERY = """
SELECT COUNT(*) AS recent
FROM contact_messages
WHERE ip_address <<= %s::inet
    AND created_at >= NOW() - %s * INTERVAL '1 hour'
"""

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
            name=str(body.get("name", "")).strip(),
            email=str(body.get("email", "")).strip(),
            message=str(body.get("message", "")).strip(),
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
    # Read the JSON body into a ContactRequest, with its text trimmed
    body = json.loads(event["body"])
    contact_request = ContactRequest.from_body(body)
    
    # Validate the request
    # The visitor's IP in standard form, so the same visitor is always stored and matched the same way
    sender_ip_address = canonical_ip(event["requestContext"]["http"]["sourceIp"])
    validation_response = validate_request(contact_request)
    if validation_response is not None:
        log("refused", reason="invalid", ip=sender_ip_address)
        return validation_response

    # Check the blocklist and limits, then record the message before any email is attempted
    # (leaving the `with` block commits the insert and closes the connection)
    with connect_to_db() as conn, conn.cursor(row_factory=dict_row) as cur:
        # Refuse blocked IPs with the same vague reply the other endpoints give
        if is_blocked(cur, sender_ip_address):
            log("refused", reason="blocked", ip=sender_ip_address)
            return reply(403, "error")

        # Refuse the visitor once they've reached the limit within the window
        cur.execute(RECENT_MESSAGES_QUERY, (ip_scope(sender_ip_address), MESSAGE_WINDOW_HOURS))
        if cur.fetchone()["recent"] >= MESSAGES_PER_WINDOW:
            log("refused", reason="rate_limited", ip=sender_ip_address)
            return reply(429, "rate_limited", limit=MESSAGES_PER_WINDOW, window_hours=MESSAGE_WINDOW_HOURS)

        # Refuse everyone once today's messages reach the global cap
        if over_global_cap(cur, "contact_messages", MESSAGES_PER_DAY):
            return busy_reply("contact")

        # Record it, so a failed send still counts towards the limits
        cur.execute(INSERT_QUERY, (sender_ip_address,))

    # Email the owner; a failure is already logged and answered inside send_email
    floofy_email_result = email_floofy(contact_request, sender_ip_address)
    if floofy_email_result["statusCode"] >= 400:
        return floofy_email_result
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
        <p><em>Submitted at: {datetime.now(ZoneInfo("Asia/Singapore")).strftime('%A, %d %B %Y at %I:%M %p (SGT)')}</em></p>
        <p><em>Sender IP Address: {html.escape(sender_ip_address)}</em></p>
        <p><a href="{html.escape(block_url)}">Block this sender</a></p>
    """
    
    # Send the email to Floofy
    return send_email(admin_recipients(), email_subject, email_body)


def validate_request(contact_request: ContactRequest):
    # Every field is required: refuse one that is blank or longer than the form allows
    for field, max_length in MAX_LENGTHS.items():
        value = getattr(contact_request, field)
        if not value or len(value) > max_length:
            return reply(400, "invalid")

    return None


def send_email(to_emails, subject, body):
    
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

        # Send it; resend.Emails.send raises on any API or network error
        resend.Emails.send(email_params)
    
    except Exception as e:
        # Record the real error; the visitor only sees the generic message below
        log("email_failed", error=repr(e))
        # A generic reply: naming the recipients would reveal the admins' addresses to the visitor
        return reply(500, "error")
            
    # Sent: callers only check the status code
    return reply(200, "ok")
