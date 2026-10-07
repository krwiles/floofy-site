"""Fails the build if any Lambda builds SQL by string formatting instead of passing parameters."""

import ast
import re
from pathlib import Path

import pytest

LAMBDA_ROOT = Path(__file__).resolve().parent.parent

# Uppercase-only, so English words in email text ("Delete this review") don't count as SQL.
SQL_KEYWORD = re.compile(r"\b(SELECT|INSERT INTO|UPDATE|DELETE FROM|WHERE)\b")


def literal_text(node):
    """All the constant string pieces inside an expression, joined up."""
    return " ".join(
        part.value for part in ast.walk(node) if isinstance(part, ast.Constant) and isinstance(part.value, str)
    )


def sql_problems(source):
    """Describe every place `source` formats SQL, or hands execute() something other than a plain string."""
    problems = []
    for node in ast.walk(ast.parse(source)):
        # f"SELECT ... {x}", "SELECT ..." + x, "SELECT ... %s" % x and "SELECT ...".format(x) all splice values in.
        is_fstring = isinstance(node, ast.JoinedStr)
        is_operator = isinstance(node, ast.BinOp) and isinstance(node.op, (ast.Add, ast.Mod))
        is_format = (
            isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute) and node.func.attr == "format"
        )
        if (is_fstring or is_operator or is_format) and SQL_KEYWORD.search(literal_text(node)):
            problems.append(f"line {node.lineno}: SQL built by string formatting")

        # execute()'s first argument must be a literal or a named constant, never an expression.
        is_execute = isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute) and node.func.attr == "execute"
        if is_execute and node.args and not isinstance(node.args[0], (ast.Constant, ast.Name)):
            problems.append(f"line {node.lineno}: execute() given a computed query")
    return problems


def lambda_sources():
    """Every Python file that ships in a Lambda zip."""
    files = sorted(LAMBDA_ROOT.glob("*/lambda_function.py")) + sorted(LAMBDA_ROOT.glob("shared/*.py"))
    return [pytest.param(path, id=str(path.relative_to(LAMBDA_ROOT))) for path in files]


@pytest.mark.parametrize("path", lambda_sources())
def test_lambda_source_has_no_formatted_sql(path):
    # Parse the file and list any SQL that splices values in directly.
    assert sql_problems(path.read_text()) == []


@pytest.mark.parametrize(
    "bad",
    [
        'cur.execute(f"SELECT * FROM reviews WHERE id = {review_id}")',
        'query = f"DELETE FROM reviews WHERE id = {review_id}"',
        'cur.execute("SELECT * FROM reviews WHERE id = " + review_id)',
        'cur.execute("UPDATE reviews SET deleted = TRUE WHERE id = %s" % review_id)',
        'cur.execute("SELECT * FROM reviews WHERE id = {}".format(review_id))',
        "cur.execute(build_query(review_id))",
    ],
)
def test_checker_catches_each_unsafe_pattern(bad):
    # Guard the guard: each classic injection pattern must be reported.
    assert sql_problems(bad) != []


def test_checker_allows_parameterised_sql_and_email_text():
    # The safe forms: a query constant passed with separate parameters, and prose that merely mentions "delete".
    safe = (
        'QUERY = "SELECT id FROM reviews WHERE id = %s"\n'
        "cur.execute(QUERY, (review_id,))\n"
        'body = f"<p>Delete this review: {name}</p>"\n'
    )
    assert sql_problems(safe) == []
