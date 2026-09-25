# Spec — Image asset model

Status: **draft, awaiting owner review**. Prerequisite for both new carousel components — see
[`app-rolling-carousel.md`](app-rolling-carousel.md) and [`app-slideshow-carousel.md`](app-slideshow-carousel.md).

## 1. Problem

The site currently describes a picture's information in two different, overlapping ways depending on where it's
used — one for carousels, one for the gallery grid and lightbox. The second one also carries a "thumbnail"
version of each picture that has never actually been different from the full-size one; it exists in the code but
does nothing.

## 2. Goals

Describe every picture, everywhere on the site, the same way — one shared record. Drop the unused thumbnail
concept for now.

## 3. Non-goals

- Actually building a real thumbnail (a smaller preview loaded separately from the full image) — that idea is
  preserved as a future possibility, not being built now.
- Changing how the gallery grid or the lightbox look or behave — only the underlying description of a picture
  changes, not what a visitor sees.

## 4. Requirements

- Every picture — in the gallery grid, the lightbox, and both new carousels — is described the same way: an
  image, its alt text, and its dimensions.
- No picture anywhere on the site should look, load, or behave any differently after this change.

## 5. Constraints

- This needs to be finished before either new carousel component is built, since both depend on the final shape.
- Nothing else about the gallery or lightbox's appearance or behavior may change as a side effect.

## 6. Edge Cases

- Every place still describing a picture the old way needs to be found and updated — nothing should be missed.

## 7. Acceptance Criteria

- Every picture on every page looks and behaves exactly as it did before this change.
- No trace of the old thumbnail concept, or anything that only existed to support it, remains anywhere.

---

**Future idea, not built now**: a real thumbnail/full-size split, if gallery load performance ever becomes a real
problem.
