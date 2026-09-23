# Spec — Mobile navigation menu

Status: **draft, awaiting owner review**.

This piece genuinely depends on the third-party plugin being removed in this phase, so — unlike the language
toggle — it doesn't need to look or behave exactly like it does today. It stays part of the main navigation bar
rather than becoming its own separate piece, since nothing else would ever reuse it.

## 1. Problem

On small screens, the navigation bar's menu opens and closes using a third-party plugin. Two real problems exist
today, separate from just depending on that plugin:

- The menu always tells screen readers it's closed, even while it's open.
- Closing the menu after tapping a link uses an indirect trick that only happens to work because of how the
  plugin is wired up.

## 2. Goals

The menu should open and close on its own, correctly tell screen readers whether it's open or closed at all
times, and close itself when a visitor taps a link, presses Escape, or navigates away by any other means
(including the browser's back button) — all without depending on the plugin. Build the simplest reasonable
version of this first; its appearance doesn't need to match today's and can be adjusted afterward once it's
working.

## 3. Non-goals

- Turning this into its own separate, reusable piece — it stays part of the main navigation bar.
- Any change to the language toggle (covered separately).
- Matching today's exact appearance — see Goals above.
- Any change to the navigation bar on larger screens, where this menu is already always visible.

## 4. Requirements

- The menu opens and closes when the menu button is tapped.
- Screen readers are always correctly told whether the menu is open or closed.
- Pressing Escape while it's open closes it.
- Tapping a link inside the open menu closes it.
- Any other kind of navigation away from the current page (browser back/forward, or any other way of leaving)
  also closes it.
- Removing this dependency, together with the carousel work elsewhere in this phase, means the site no longer
  needs the third-party plugin for any of its interactive behavior.

## 5. Constraints

- Must not change how the navigation bar looks or works on larger screens, where the menu is already always
  shown.

## 6. Edge Cases

- Resizing the browser window from small to large while the menu is open, then back to small again — should it
  reopen on its own, or stay closed until tapped again? Default: stay closed, so it never reopens without the
  visitor asking for it.
- Pressing Escape when the menu is already closed — nothing should happen.
- Should focus move into the menu when it opens, and back to the button when it closes? Not yet decided — worth
  deciding before this is built.

## 7. Acceptance Criteria

- The menu correctly tells screen readers whether it's open or closed at all times.
- Escape, tapping a link, and any other kind of navigation all correctly close it.
- Looks and works exactly the same as today on larger screens.
- The third-party plugin is no longer needed anywhere in the site's interactive behavior once this and the
  carousel work are both done.
