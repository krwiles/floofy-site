import json
import os
import resend
from datetime import datetime
from zoneinfo import ZoneInfo
from dataclasses import dataclass


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
    method = event["requestContext"]["http"]["method"]
    
    if method == "POST":
        return main(event)
    
    return response(405, {"message": "Method Not Allowed"})


def main(event):
    # Parse the request body into dataclass
    body = json.loads(event["body"])
    contact_request = ContactRequest.from_body(body)
    
    # Validate the request
    validation_response = validate_request(contact_request)
    if validation_response is not None:
        return validation_response

    # Format and send emails
    sender_ip_address = event["requestContext"]["http"]["sourceIp"]
    floofy_email_result = email_floofy(contact_request, sender_ip_address)
    if floofy_email_result["statusCode"] >= 400:
        return floofy_email_result
    
    return response(200, {"message": "Commission request submitted successfully! You will receive a confirmation email shortly."})


def email_floofy(contact_request: ContactRequest, sender_ip_address):
    # Format the email content
    email_subject = f"Website Contact: {contact_request.name}"
    
    email_body = f"""
        <h1>Floofy site contact sent by {contact_request.name}</h1>
        <p><strong>Name:</strong> {contact_request.name}</p>
        <p><strong>Email:</strong> {contact_request.email}</p>
        <p><strong>Message:</strong> {contact_request.message}</p>
        <p><em>Submitted at: {datetime.now(ZoneInfo("Asia/Singapore")).strftime('%A, %d %B %Y at %I:%M %p (SGT)')}</em></p>
        <p><em>Sender IP Address: {sender_ip_address}</em></p>
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
        "from": "FloofySite <onboarding@resend.dev>",
        "to": [to_email],
        "subject": subject,
        "html": body
        }
        
        resend.Emails.send(commission_details)
    
    except Exception as e:
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