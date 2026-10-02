"""JSON replies for the form Lambdas -- see docs/features/api-status-codes/plan.md."""

import datetime
import functools
import json

from request_log import log


def _json_default(value):
    """Lets json.dumps write datetimes (e.g. a review's created_at) as ISO text."""
    if isinstance(value, datetime.datetime):
        return value.isoformat()
    raise TypeError(f"Type {type(value)} not serializable")


def response(status, body):
    """A JSON reply in the shape Lambda function URLs expect."""
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body, default=_json_default),
    }


def reply(status, code, **extra):
    """A form reply: the HTTP status plus a short code the site translates (and, for rate limits, the rule)."""
    return response(status, {"code": code, **extra})


def replies_on_unexpected_errors(handler):
    """Wraps a Lambda handler so any unexpected exception is logged and answered 500 {"code": "error"}, never a crash."""

    @functools.wraps(handler)
    def wrapped(event, context):
        # Run the real handler; anything it didn't plan for still gets a reply the site can translate
        try:
            return handler(event, context)
        except Exception as error:
            log("unexpected_error", error=repr(error))
            return reply(500, "error")

    return wrapped
