#!/usr/bin/env python3
"""Flags inline comment blocks longer than 2 lines (CLAUDE.md's "Comments" rule).
Checks .py (# comments), .ts/.tsx (// comments), .css (/* */ comments) and .html (<!-- --> comments).
Docstrings, JSDoc and CSS `/** */` doc comments are exempt.

Two modes: no args checks staged files and exits 1 on a violation (a pre-commit hook, blocking);
`--file PATH [PATH ...]` checks specific files and always exits 0 (the PostToolUse hook, advisory
-- warns without interrupting an in-progress edit).

A line starting a "Label:" pattern (e.g. "Arrange:", "Act & assert:") begins a fresh block even
with no blank line above it, so two adjacent short step-comments aren't flagged as one long one.

Ported from ticker-news-analysis's scripts/check_comment_length.py -- see that repo's
CODING_STANDARDS.md for the rule's original write-up.
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys

MAX_LINES = 2
# A short leading label like "Arrange:" -- tight enough not to match an ordinary sentence with a colon in it.
LABEL_RE = re.compile(r"^[A-Z][\w\s+&]{0,18}:")


def staged_files() -> list[str]:
    # The staged (added, copied or modified) file paths, from git.
    out = subprocess.run(
        ["git", "diff", "--cached", "--name-only", "--diff-filter=ACM"],
        capture_output=True,
        text=True,
        check=True,
    ).stdout
    return [f for f in out.splitlines() if f]


def check(path: str, prefix: str) -> list[tuple[int, int, int]]:
    # Read the file; a deleted one has nothing to check.
    try:
        with open(path, encoding="utf-8") as f:
            lines = f.readlines()
    except FileNotFoundError:
        return []

    # Line numbers of the comment block currently being collected.
    violations: list[tuple[int, int, int]] = []
    run: list[int] = []

    def flush() -> None:
        # Record the block if it ran over the limit.
        if len(run) > MAX_LINES:
            violations.append((run[0], run[-1], len(run)))

    # Walk the lines, growing a block on each comment line and closing it on anything else.
    for i, line in enumerate(lines, start=1):
        stripped = line.strip()
        if stripped.startswith(prefix):
            text = stripped[len(prefix) :].strip()
            # A label ("Act:") starts a fresh block even with no blank line before it.
            if run and LABEL_RE.match(text):
                flush()
                run = [i]
            else:
                run.append(i)
        else:
            flush()
            run = []
    # The file may end mid-block.
    flush()
    return violations


# Block-comment syntaxes, by file extension: (opening, closing).
BLOCK_DELIMITERS = {".css": ("/*", "*/"), ".html": ("<!--", "-->")}


def check_blocks(path: str, opening: str, closing: str) -> list[tuple[int, int, int]]:
    """Like check(), for /* */ or <!-- --> comments: a block is one comment, or several on consecutive lines."""
    try:
        with open(path, encoding="utf-8") as f:
            text = f.read()
    except FileNotFoundError:
        return []

    # Find every comment's first and last line, skipping `/** */` doc comments (exempt, like JSDoc).
    spans: list[tuple[int, int]] = []
    pattern = re.compile(re.escape(opening) + r".*?" + re.escape(closing), re.DOTALL)
    for match in pattern.finditer(text):
        if opening == "/*" and match.group().startswith("/**"):
            continue
        start = text.count("\n", 0, match.start()) + 1
        spans.append((start, start + match.group().count("\n")))

    # Merge comments that sit on back-to-back lines into one block, then flag blocks over the limit.
    violations: list[tuple[int, int, int]] = []
    block: tuple[int, int] | None = None
    for start, end in spans:
        if block and start <= block[1] + 1:
            block = (block[0], max(block[1], end))
            continue
        if block and block[1] - block[0] + 1 > MAX_LINES:
            violations.append((block[0], block[1], block[1] - block[0] + 1))
        block = (start, end)
    if block and block[1] - block[0] + 1 > MAX_LINES:
        violations.append((block[0], block[1], block[1] - block[0] + 1))
    return violations


def prefix_for(path: str) -> str | None:
    # The line-comment marker for this file type; None for block-comment types and everything else.
    if path.endswith(".py"):
        return "#"
    if path.endswith((".ts", ".tsx")):
        return "//"
    return None


def main() -> int:
    # Either --file paths (advisory, from the hook) or the staged files (blocking, as a pre-commit check).
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", action="append", default=None, help="Check specific file(s) instead of staged files; always exits 0.")
    args = parser.parse_args()

    advisory = args.file is not None
    paths = args.file if advisory else staged_files()

    had_violation = False
    for path in paths:
        # Pick the right checker for the file type; anything else is skipped.
        prefix = prefix_for(path)
        delimiters = BLOCK_DELIMITERS.get(path[path.rfind(".") :]) if "." in path else None
        if prefix is not None:
            found = check(path, prefix)
        elif delimiters is not None:
            found = check_blocks(path, *delimiters)
        else:
            continue
        # Report each over-long block.
        for start, end, n in found:
            had_violation = True
            print(f"{path}:{start}-{end}: comment block is {n} lines (CLAUDE.md caps inline comments at {MAX_LINES})")

    # Only the pre-commit mode fails; the hook just warns.
    if had_violation and not advisory:
        print("\nTrim the blocks above to 1-2 lines (see CLAUDE.md's Comments section).")
        print("To commit anyway: git commit --no-verify")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
