# Coding standards

Read at review time: the two-axis review checks every diff against these. CLAUDE.md's Conventions also apply.

## Comments

- Every distinct logical step in a function gets a short comment above it — not just the steps that seem
  non-trivial. Skimming just the comments should show the whole shape of the function, top to bottom, without
  reading the code itself.
- A comment states what the block accomplishes and, where it's not obvious, why — not the mechanics already
  visible in the line(s) below it.
- Keep it to one line. A second line is fine only when a real nuance would otherwise be lost — if a comment is
  stretching to three-plus lines, cut it down rather than explaining more. Skimmable in a second, not a paragraph
  to read. (Docstrings/JSDoc can run longer.)
- A decision documented elsewhere (`docs/refactor/*`, an ADR) gets a pointer next to the code, not a second copy
  of the reasoning — name the decision and cite the doc, don't restate it.
- A call whose name or return value isn't obvious from how it's used gets a brief note on what it actually does
  and returns.
- Comment at the block level, not line-by-line: one comment per logical step, not a separate comment for every
  line inside a multi-line block.
- Applies to test files exactly the same as source files.

**Enforced** by `scripts/check_comment_length.py`, which flags a comment block over 2 lines: `//` in `.ts`/`.tsx`, `#`
in `.py`, `/* */` in `.css` and `<!-- -->` in `.html` (docstrings, JSDoc and CSS `/** */` doc comments are exempt). It
warns after every Claude Code `Write`/`Edit` (the `PostToolUse` hook in `.claude/settings.json`) and fails the CI
check on a PR's changed files (`.github/workflows/checks.yml`). The whole codebase follows these rules, so any warning
is a real one to fix.
