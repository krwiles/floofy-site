# Spec — Slideshow carousel (commission page)

Status: **draft, awaiting owner review**. Depends on [`image-asset-model.md`](image-asset-model.md) landing
first. This is a new design, not a copy of anything that exists today — see
[`app-rolling-carousel.md`](app-rolling-carousel.md) for the other, separate new carousel.

## 1. Problem

Commission's pricing-card image carousels today share a single implementation built around a third-party plugin
that assumes only one carousel exists per page — but this page shows three at once, so only one of them can
really work correctly. It's also unusable by keyboard or touch.

## 2. Goals

A slideshow that shows one image at a time, cropped to a consistent shape, automatically advancing after a pause,
with a smooth transition, looping endlessly. Fully usable by mouse, keyboard, or touch, and works correctly no
matter how many copies of it appear on the same page.

## 3. Non-goals

- Dot or numbered indicators — not wanted.
- Making the shown image itself clickable — noted as a future idea, not built now.
- Any visual style beyond what's described here.
- Any card-style framing of its own. Every image stays plain and rectangular, so nothing casts a shadow onto
  the neighboring image while it slides past. A page that wants the whole thing framed applies its card
  styling directly to this component's own tag, the same way it would to any other element — that's not this
  component's concern.

## 4. Requirements

- Shows one image at a time, cropped to fill a consistent shape (the page chooses the shape).
- Automatically moves to the next image after a pause; the length of that pause can be set by the page.
- Loops endlessly — after the last image it returns to the first, and going backward from the first goes to the
  last.
- The new image slides in while the old one slides out, always in the correct direction (forward or backward,
  matching whichever way the visitor moved).
- Small arrows on either side move forward/backward manually — invisible until a visitor points at, taps toward,
  or keyboard-focuses the component, then visible; always visible for visitors on a touch device, since there's
  no equivalent of "hovering" there.
- Swiping left or right also moves forward/backward.
- Hovering or focusing the component pauses the automatic advance; moving away resumes it.
- If a visitor has motion-reduction turned on, the slide transition doesn't animate — it changes instantly
  instead (automatic advancing still happens, just without the animated motion).
- No dots or numbered indicators of any kind.

## 5. Constraints

- No dependency on the third-party plugin used today.
- Every copy of this component on the same page must work completely independently of every other copy.

## 6. Edge Cases

- Only one image to show — no transition is possible, so the arrows shouldn't appear.
- A visitor rapidly clicking or swiping repeatedly — it shouldn't skip, jump, or lose track of which image is
  showing.
- The automatic timer firing in the middle of a visitor's own swipe — the visitor's action should win.
- The page navigating away mid-transition or mid-pause — nothing should keep running or cause an error.
- Right-to-left languages — should swipe direction and arrow placement mirror? Worth a look once this is built,
  not decided here.

## 7. Acceptance Criteria

- All three copies on the commission page work fully independently.
- Usable entirely by mouse, keyboard, or touch.
- Automatic advance pauses on hover/focus and resumes afterward; loops endlessly in both directions.
- Motion-reduction turns off the transition animation without stopping automatic advancing.

---

**Future idea, not built now**: making the shown image clickable.
