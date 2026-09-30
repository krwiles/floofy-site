import { SCROLL_FOCUS_CLASS, scrollToElement } from './scroll-to-element';

describe('scrollToElement', () => {
  let target: HTMLElement;
  let scrollTo: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // A real element in the document to jump to, and timers we can fast-forward.
    target = document.createElement('div');
    target.id = 'jump-target';
    document.body.appendChild(target);
    vi.useFakeTimers();
    // jsdom doesn't implement scrolling, so record the call instead.
    scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  });

  afterEach(() => {
    // Leave the document, timers and window as we found them.
    target.remove();
    vi.useRealTimers();
    scrollTo.mockRestore();
  });

  it('smooth-scrolls to the element, leaving room for the fixed navbar', () => {
    // jsdom lays nothing out, so pin where the element "is".
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({ top: 500 } as DOMRect);

    scrollToElement('jump-target');

    // 500px down, minus the navbar offset.
    expect(scrollTo).toHaveBeenCalledWith({ top: 500 + window.scrollY - 108, behavior: 'smooth' });
  });

  it('does nothing when no element has that id', () => {
    scrollToElement('no-such-id');

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('focuses and briefly highlights the element after the scroll settles', () => {
    scrollToElement('jump-target');

    // Nothing yet: focus waits for the scroll so the ring appears on a visible element.
    expect(document.activeElement).not.toBe(target);

    // After the focus delay the element is focused and highlighted...
    vi.advanceTimersByTime(1000);
    expect(document.activeElement).toBe(target);
    expect(target.classList.contains(SCROLL_FOCUS_CLASS)).toBe(true);

    // ...and the highlight clears on its own.
    vi.advanceTimersByTime(1600);
    expect(target.classList.contains(SCROLL_FOCUS_CLASS)).toBe(false);
  });

  it('makes a non-focusable element focusable only until it loses focus', () => {
    scrollToElement('jump-target');

    // A plain div needs a temporary tabindex to take focus.
    expect(target.getAttribute('tabindex')).toBe('-1');

    // Once focus moves on, the temporary tabindex is removed again.
    vi.advanceTimersByTime(1000);
    target.blur();
    expect(target.hasAttribute('tabindex')).toBe(false);
  });

  it('only scrolls, without focusing, when focus is turned off', () => {
    scrollToElement('jump-target', { focus: false });

    // The scroll happens, but no tabindex, focus or highlight follows.
    vi.advanceTimersByTime(3000);
    expect(scrollTo).toHaveBeenCalled();
    expect(target.hasAttribute('tabindex')).toBe(false);
    expect(document.activeElement).not.toBe(target);
  });
});
