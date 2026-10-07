"""One-line JSON logs for CloudWatch, shared by every Lambda.

Each line is `{"event": "<name>", ...fields}`, so CloudWatch Logs Insights can filter on any field. Never pass request
bodies, admin tokens or secrets in here — log ids and outcomes instead.
"""

import json


def log(event_name, **fields):
    """Print one JSON log line; print() output from a Lambda lands in its CloudWatch log group."""
    # default=str turns datetimes and IP address objects into text instead of failing
    print(json.dumps({"event": event_name, **fields}, default=str))


def log_request(event):
    """Record that someone called the Lambda: method, path, IP and browser — never the body or query string."""
    # Function URL events keep the caller's details under requestContext.http
    http = event.get("requestContext", {}).get("http", {})
    log(
        "request",
        method=http.get("method"),
        path=http.get("path"),
        ip=http.get("sourceIp"),
        user_agent=http.get("userAgent"),
    )
