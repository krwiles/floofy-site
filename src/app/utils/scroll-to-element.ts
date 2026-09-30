/** Global class (styles/utilities/scroll-focus.css) for the brief ring shown on a jumped-to element. */
export const SCROLL_FOCUS_CLASS = 'scroll-focus-highlight';

// Clears the fixed navbar so the target isn't hidden underneath it.
const SCROLL_OFFSET_PX = 108;
// Waits for the smooth scroll to settle, so the focus ring appears on a visible element.
const FOCUS_DELAY_MS = 1000;
// How long the highlight ring stays before clearing itself.
const HIGHLIGHT_DURATION_MS = 1600;

/**
 * Smooth-scrolls to the element with `elementId` and, unless `focus` is false, then focuses it and flashes a
 * highlight ring, so keyboard and screen-reader users land where they jumped to. A no-op if the id isn't found.
 */
export function scrollToElement(elementId: string, { focus = true }: { focus?: boolean } = {}): void {
  // Nothing to do if the target isn't on the page.
  const target = document.getElementById(elementId);
  if (!target) {
    return;
  }

  // Scroll so the element sits just below the navbar.
  const top = target.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET_PX;
  window.scrollTo({ top, behavior: 'smooth' });

  // Scroll-only callers (e.g. jumping to a form) stop here.
  if (!focus) {
    return;
  }

  // A plain element can't take focus without a tabindex, so add a temporary one.
  const hadTabIndex = target.hasAttribute('tabindex');
  if (!hadTabIndex) {
    target.setAttribute('tabindex', '-1');
  }

  // Once the scroll settles: focus without re-scrolling, then flash the highlight ring.
  window.setTimeout(() => {
    target.focus({ preventScroll: true });
    target.classList.add(SCROLL_FOCUS_CLASS);
    window.setTimeout(() => target.classList.remove(SCROLL_FOCUS_CLASS), HIGHLIGHT_DURATION_MS);

    // Remove the temporary tabindex again once focus moves on.
    if (!hadTabIndex) {
      const cleanupTabIndex = () => {
        target.removeAttribute('tabindex');
        target.removeEventListener('blur', cleanupTabIndex);
      };
      target.addEventListener('blur', cleanupTabIndex);
    }
  }, FOCUS_DELAY_MS);
}
