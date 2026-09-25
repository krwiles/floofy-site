# Spec — Language toggle

Status: **draft, awaiting owner review**.

**Note on scope**: unlike the carousel work, this isn't actually tied to the third-party plugin being removed
elsewhere in this phase — it's only being pulled out because it currently lives inside the same file as work that
is. This is a plain extraction, not a redesign: it should look and behave exactly as it does today.

## 1. Problem

The button that switches the site's language between English and Japanese is currently built directly into the
navigation bar's own markup, including two full flag images drawn out as raw code rather than as real image
files. This makes that file harder to read and mixes an independent piece of UI into markup that's otherwise just
about the navigation bar's layout.

## 2. Goals

Pull this into its own self-contained piece, with the two flag images moved into real image files instead of
being written out as code.

## 3. Non-goals

- Any change to how it looks or behaves — this should be indistinguishable from today.

## 4. Requirements

- Shows the current language's flag and a label for the language it will switch to.
- Clicking it switches the site's language, exactly as it does today.
- The two flag images exist as their own image files rather than as inline code.
- Looks identical to today in every way.

## 5. Constraints

- Must not affect anything else about how the site's language switching already works (saving the choice,
  updating the page's language setting, etc.) — those already work correctly and shouldn't be touched.

## 6. Edge Cases

- None expected, beyond making sure nothing else in the site still expects this to be built the old way.

## 7. Acceptance Criteria

- Looks and behaves identically to today, on every page.
- No flag artwork remains written out as raw code anywhere.
