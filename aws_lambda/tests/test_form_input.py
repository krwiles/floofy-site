from dataclasses import dataclass

import pytest

from form_input import invalid_fields


@dataclass(frozen=True)
class Message:
    name: str
    note: str


MAX_LENGTHS = {"name": 5, "note": 10}
REQUIRED = ("name",)


@pytest.mark.parametrize(
    "name, note",
    [("Robin", ""), ("Robin", "x" * 10), ("R", "hi")],
    ids=["optional-left-empty", "exactly-at-the-limit", "short"],
)
def test_acceptable_input_is_not_invalid(name, note):
    # Act and assert: required text present, nothing over its limit.
    assert invalid_fields(Message(name, note), MAX_LENGTHS, REQUIRED) is False


@pytest.mark.parametrize(
    "name, note",
    [("", "hi"), ("Robin!", "hi"), ("Robin", "x" * 11)],
    ids=["required-blank", "required-over-limit", "optional-over-limit"],
)
def test_blank_required_or_overlong_input_is_invalid(name, note):
    # Act and assert: a blank required field, or any field past its limit, makes the request invalid.
    assert invalid_fields(Message(name, note), MAX_LENGTHS, REQUIRED) is True
