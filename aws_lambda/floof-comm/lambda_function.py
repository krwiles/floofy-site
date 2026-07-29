import json
import os
import resend
from datetime import datetime
from zoneinfo import ZoneInfo
from dataclasses import dataclass


@dataclass(frozen=True)
class CommissionRequest:
    name: str
    email: str
    commission_type: str
    description: str
    reference_links: str
    usage_type: str
    usage_explaination: str
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
            usage_explaination=str(body.get("usageExplaination", "")).strip(),
            estimated_price=float(body.get("estimatedPrice", -1.0)),
            deadline=str(body.get("deadline", "")).strip(),
            additional_notes=str(body.get("additionalNotes", "")).strip(),
        )


def lambda_handler(event, context):
    method = event["requestContext"]["http"]["method"]
    
    if method == "POST":
        return main(event)
    
    return response(405, {"message": "Method Not Allowed"})


def main(event):
    # Parse the request body into dataclass
    body = json.loads(event["body"])
    commission_request = CommissionRequest.from_body(body)
    
    # Validate the request
    validation_response = validate_request(commission_request)
    if validation_response is not None:
        return validation_response

    
    # Format and send emails
    sender_ip_address = event["requestContext"]["http"]["sourceIp"]
    floofy_email_result = email_floofy(commission_request, sender_ip_address)
    if floofy_email_result["statusCode"] >= 400:
        return floofy_email_result

    customer_email_result = email_customer(commission_request)
    if customer_email_result["statusCode"] >= 400:
        return customer_email_result
    
    return response(200, {"message": "Thank you! Your commission request submitted successfully. You will receive a confirmation email soon."})


def email_floofy(commission_request: CommissionRequest, sender_ip_address: str):
    # Format the email content
    email_subject = f"New Commission Request: {commission_request.name}"
    
    email_body = f"""
        <h1>{commission_request.commission_type.capitalize()} Request</h1>
        <p><strong>Name:</strong> {commission_request.name}</p>
        <p><strong>Email:</strong> {commission_request.email}</p>
        <p><strong>Commission Type:</strong> {commission_request.commission_type}</p>
        <p><strong>Description:</strong> {commission_request.description}</p>
        <p><strong>Reference Links:</strong> {commission_request.reference_links}</p>
        <p><strong>Usage Type:</strong> {commission_request.usage_type}</p>
        <p><strong>Usage Explanation:</strong> {commission_request.usage_explaination}</p>
        <p><strong>Estimated Price:</strong> ${commission_request.estimated_price:.2f} USD</p>
        <p><strong>Deadline:</strong> {commission_request.deadline}</p>
        <p><strong>Additional Notes:</strong> {commission_request.additional_notes}</p>
        <p><em>Submitted at: {datetime.now(ZoneInfo("Asia/Singapore")).strftime('%A, %d %B %Y at %I:%M %p (SGT)')}</em></p>
        <p><em>Sender IP Address: {sender_ip_address}</em></p>
    """
    
    # Send the email to Floofy
    return send_email(os.environ.get("FLOOFY_EMAIL"), email_subject, email_body)


def email_customer(commission_request: CommissionRequest):
    # Format the email content
    email_subject = "Commission Request Confirmation"
    
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
            <li><strong>Usage Explanation:</strong> {commission_request.usage_explaination}</li>
            <li><strong>Estimated Price:</strong> ${commission_request.estimated_price:.2f} USD</li>
            <li><strong>Deadline:</strong> {commission_request.deadline}</li>
            <li><strong>Additional Notes:</strong> {commission_request.additional_notes}</li>
        </ul>
    """
    
    # Send the email to the customer
    return send_email(commission_request.email, email_subject, email_body)


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
    if len(commission_request.usage_explaination) > 2000:
        return response(400, {"message": "Bad Request: usage explanation must be fewer than 2000 characters"})

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
        return response(500, {"message": f"Failed to send email to {to_email}, please report this issue to the site administrator.",})
            
    return response(200, {"message": "Email sent successfully"})


def response(status, body):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
        },
        "body": json.dumps(body)
    }