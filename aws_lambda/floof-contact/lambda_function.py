import html
import ipaddress
import json
import os
import resend
from datetime import datetime
from zoneinfo import ZoneInfo
from dataclasses import dataclass

# Shared helpers from aws_lambda/shared/, copied beside this file by build.sh
from admin_links import link
from blocklist import is_blocked
from db import connect_to_db
from email_sender import EMAIL_FROM
from request_log import log, log_request


@dataclass(frozen=True)
class ContactRequest:
    name: str
    email: str
    message: str

    @classmethod
    def from_body(cls, body: dict) -> "ContactRequest":
        return cls(
            name=str(body.get("name", "")).strip(),
            email=str(body.get("email", "")).strip(),
            message=str(body.get("message", "")).strip(),
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
    contact_request = ContactRequest.from_body(body)
    
    # Validate the request
    sender_ip_address = event["requestContext"]["http"]["sourceIp"]
    validation_response = validate_request(contact_request)
    if validation_response is not None:
        log("refused", reason="invalid", ip=sender_ip_address)
        return validation_response

    # Refuse blocked IPs with the same vague reply the other endpoints give
    with connect_to_db() as conn, conn.cursor() as cur:
        blocked = is_blocked(cur, sender_ip_address)
    if blocked:
        log("refused", reason="blocked", ip=sender_ip_address)
        return response(403, {"message": "Internal Server Error"})

    # Format and send emails
    floofy_email_result = email_floofy(contact_request, sender_ip_address)
    if floofy_email_result["statusCode"] >= 400:
        return floofy_email_result
    log("contact_email_sent", ip=sender_ip_address)
    
    return response(200, {"message": "Commission request submitted successfully! You will receive a confirmation email shortly."})


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
    return send_email(os.environ.get("FLOOFY_EMAIL"), email_subject, email_body)


def validate_request(contact_request: ContactRequest):
    # Input validation
    if len(contact_request.name) >= 50:
        return response(400, {"message": "Bad Request: name must be fewer than 50 characters"})
    if len(contact_request.email) >= 50:
        return response(400, {"message": "Bad Request: email must be fewer than 50 characters"})
    if len(contact_request.message) >= 2000:
        return response(400, {"message": "Bad Request: message must be fewer than 2000 characters"})

    return None


def send_email(to_email, subject, body):
    
    resend.api_key = os.environ.get("RESEND_API_KEY")
    
    try:
        commission_details: resend.Emails.SendParams = {
        "from": EMAIL_FROM,
        "to": [to_email],
        "subject": subject,
        "html": body
        }
        
        resend.Emails.send(commission_details)
    
    except Exception as e:
        # Record the real error; the visitor only sees the generic message below
        log("email_failed", error=repr(e))
        return response(500, {"message": f"Failed to send email to {to_email}, please report this issue to the site owner.",})
            
    return response(200, {"message": "email sent successfully"})


def response(status, body):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
        },
        "body": json.dumps(body)
    }