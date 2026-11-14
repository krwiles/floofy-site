---
name: batch
description: Run a goal as a batch — grill it once, split it into tasks, run independent tasks in parallel subagents, merge them into one batch/<goal> branch, review once, and PR into main. Use when starting a goal, planning the next batch, or when the owner says "batch".
disable-model-invocation: true
---

You are the **coordinator**. Subagents implement; you plan, merge, own the shared files, review and talk to the owner.

## 1. Grill the goal

Check the goal against the real code, then run `/mattpocock-skills:grilling` on the whole goal at once: numbered
questions, a recommendation for each.

Done when the owner has answered every question.

## 2. Write the batch plan

Write `docs/batches/<yyyy-mm-dd>-<goal>.md`: the decisions from the grilling, then one section per task:

- **Footprint:** every file the task may create or edit. A task touches only its footprint.
- **Depends on:** tasks whose merged result it needs, or none.
- **Done when:** a checkable completion criterion (the tests that go green, the snapshot that still matches).

Group tasks into **waves**: a wave holds tasks whose footprints don't overlap and whose dependencies are all in earlier
waves. **Shared files** never enter a footprint; they're yours (see below).

Branch `batch/<goal>` off `origin/main`, commit the plan there.

Done when the owner approves the plan.

## 3. Run each wave

From `batch/<goal>`, dispatch one `general-purpose` subagent per task in the wave, all in one message, each with
`isolation: "worktree"`. Brief each one with:

- its task section of the plan, verbatim, and the path to the plan for the decisions;
- work test-first (`/mattpocock-skills:tdd`), touch only the footprint, commit on the worktree's branch;
- setup: symlink `node_modules` and `aws_lambda/.venv` from the main checkout (run `npm ci` instead if the task changes
  `package.json`);
- before finishing, run the checks for what it touched: `npm test`, `npm run build`, `npx prettier --check <files>`,
  `aws_lambda/.venv/bin/pytest`, `python3 scripts/check_comment_length.py --since batch/<goal>`;
- its final report: the branch name, the commits, the check results, any departure from the plan, and the
  **shared-file edits** it needs (exact keys/text, not applied).

Done when every subagent in the wave has reported.

## 4. Merge the wave

For each task branch: `git merge --no-ff` it into `batch/<goal>` (one merge commit per task, titled after the task).
Then apply every shared-file edit from the wave in one commit, and run the full checks on `batch/<goal>`.

A conflict or a red check means a footprint was wrong: fix it on `batch/<goal>` and note it in the plan.

Done when the wave is merged and the full checks are green. Repeat steps 3–4 for the next wave.

## 5. Review

Run the two-axis review on `git diff origin/main...batch/<goal>`: a standards reviewer (against `CODING_STANDARDS.md`
and CLAUDE.md's Conventions) and a spec reviewer (against the batch plan), in parallel subagents, reported under
separate headings. Agree fixes with the owner, apply them in one follow-up commit.

## 6. Hand off

Update the roadmap's status block and the plan's "Since then" notes. Then ask the owner before pushing. Open one PR
from `batch/<goal>` into `main` with `/mattpocock-skills:pr`, a section per task, and the deploy steps (Lambda zips to
upload, SQL to run, then the site). CI (`.github/workflows/checks.yml`) must pass before the owner merges.

## Shared files

Edited only by the coordinator, after each wave: `src/assets/i18n/en.json`, `src/assets/i18n/ja.json`, `CONTEXT.md`,
`docs/refactor/05-roadmap.md`, `docs/review/*`, `docs/features/review-moderation/aws-setup.md`, the batch plan. Add a
file here when two tasks in one batch need it.
