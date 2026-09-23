# Spec — Rolling carousel (home page)

Status: **draft, awaiting owner review**. Depends on [`image-asset-model.md`](image-asset-model.md) landing
first. This is a new design, not a copy of anything that exists today — see
[`app-slideshow-carousel.md`](app-slideshow-carousel.md) for the other, separate new carousel.

## 1. Problem

Home's image preview today shows a fixed group of images at a time, paged by a third-party plugin. That doesn't
match what this spot on the page is actually meant to be: an ambient, continuously flowing strip of images.

## 2. Goals

A continuously scrolling strip of images that flow smoothly from one side to the other, looping endlessly with no
visible seam, at a size and speed the page can control.

## 3. Non-goals

- Making the images clickable — noted as a future idea, not built now.
- Any manual controls (buttons, dots) — none are wanted.
- Grouping images together — every image flows individually.
- A way for a visitor to change the scroll speed themselves.

## 4. Requirements

- Shows a plain list of images, one after another, each sized to fit a shared height while keeping its own
  natural proportions — so images of different shapes end up different widths.
- Evenly spaced.
- Optionally, every image can be shown with a card-style frame (shadow, rounded edge) — the page decides this for
  the whole strip, not per image.
- Scrolls continuously in one direction and loops seamlessly, without ever visibly restarting.
- Speed is something the page sets, not something a visitor sees a control for.
- If a visitor has motion-reduction turned on, the strip stays still instead of scrolling.

## 5. Constraints

- No dependency on the third-party plugin used today.
- Nothing in this strip needs to be reachable by keyboard, since none of it is interactive — the motion-reduction
  behavior is the only pause mechanism needed for now. If images become clickable later (see the future ideas
  below), this needs revisiting.

## 6. Edge Cases

- A very short list of images — does the loop still look continuous, or does it visibly repeat too soon?
- The page navigating away while the strip is mid-scroll — nothing should keep running or cause an error.
- Right-to-left languages — should the strip flow the opposite direction? Worth a look once this is built, not
  decided here.

## 7. Acceptance Criteria

- Looks and behaves as described above, using the home page's real images.
- Hovering pauses it; motion-reduction settings stop it entirely.
- The optional card-style framing works correctly whether turned on or off.

---

**Future ideas, not built now**:
- Making individual images clickable.
- Pausing the scroll when a visitor hovers over the strip.
