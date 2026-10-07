import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Commission } from './commission';

describe('Commission', () => {
  let fixture: ComponentFixture<Commission>;
  let el: HTMLElement;
  let scrollTo: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    // jsdom can't scroll, so record scroll requests; fake timers let the delayed focus run on demand.
    scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    vi.useFakeTimers();

    // The real page against the real JSON data, in English.
    await TestBed.configureTestingModule({ imports: [Commission] }).compileComponents();
    fixture = TestBed.createComponent(Commission);
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  afterEach(() => {
    // Leave timers and window as we found them.
    vi.useRealTimers();
    scrollTo.mockRestore();
  });

  it('is an outline of hero, pricing, terms and request form, in that order', () => {
    // The page's top-level sections, top to bottom.
    const sections = Array.from(el.children)
      .map((child) => child.tagName.toLowerCase())
      .filter((tag) => tag !== 'app-section-divider');
    expect(sections).toEqual(['app-hero', 'app-pricing-section', 'app-terms-section', 'app-request-form']);
  });

  it("hands a pricing card's pick to the request form and scrolls there", () => {
    // Click "Request Emotes" on the second pricing card.
    (el.querySelectorAll('app-pricing-card button[appbutton]')[1] as HTMLButtonElement).click();
    fixture.detectChanges();

    // The form now has emote selected, and the page scrolled to it.
    const checked = el.querySelector('app-request-form app-radio-group input:checked') as HTMLInputElement;
    expect(checked.value).toBe('emote');
    expect(scrollTo).toHaveBeenCalled();

    // Focus moved with the page: keyboard users land on the type they just picked.
    expect(document.activeElement).toBe(checked);
  });

  it('jumps to and focuses the section a form\'s "?" button asks for', () => {
    // Click the Usage Type "?" button (the second one in the form).
    (el.querySelectorAll('app-request-form app-jump-button button')[1] as HTMLButtonElement).click();

    // After the scroll settles, the Artwork Usage card has focus.
    vi.advanceTimersByTime(1000);
    expect(scrollTo).toHaveBeenCalled();
    expect(document.activeElement?.id).toBe('artwork-usage');
  });
});
