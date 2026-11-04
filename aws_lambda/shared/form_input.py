"""The shared length and blank-field check every form Lambda runs on its request, driven by each form's own rules."""


def invalid_fields(request, max_lengths, required):
    """True if a `required` field is blank or any field in `max_lengths` is longer than its limit (exactly at the
    limit is fine). `request` is a form's dataclass, already trimmed."""
    # Refuse a required field left blank
    if any(not getattr(request, field) for field in required):
        return True

    # Refuse any text longer than the form allows
    return any(len(getattr(request, field)) > limit for field, limit in max_lengths.items())


def text_field(body, key):
    """One field of a form's JSON body as trimmed text; missing or null counts as empty (never the text "None")."""
    value = body.get(key)
    return "" if value is None else str(value).strip()
