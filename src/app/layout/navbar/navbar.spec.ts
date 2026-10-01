import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { Navbar } from './navbar';
import { routes } from '../../app.routes';

describe('Navbar', () => {
  let component: Navbar;
  let fixture: ComponentFixture<Navbar>;
  let router: Router;

  function menuButton(): HTMLButtonElement {
    // The mobile menu toggle button.
    return fixture.nativeElement.querySelector('button[aria-controls="navbar-language"]');
  }

  function menuPanel(): HTMLElement {
    // The collapsible panel holding the links.
    return fixture.nativeElement.querySelector('#navbar-language');
  }

  function navElement(): HTMLElement {
    // The navbar's own <nav> element.
    return fixture.nativeElement.querySelector('nav');
  }

  // The dimming overlay: `.fixed.inset-0` matches only it (the <nav> is `fixed` but uses `inset-s-0`).
  function overlay(): HTMLElement | null {
    return fixture.nativeElement.querySelector('.fixed.inset-0');
  }

  function pressEscape(): void {
    // Escape is listened for on the document, so dispatch it there.
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  }

  beforeEach(async () => {
    // Render the navbar with the real routes, and keep the router for navigation tests.
    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [provideRouter(routes)],
    }).compileComponents();

    fixture = TestBed.createComponent(Navbar);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    // Escape goes to the shared document, so tear down explicitly to stop this fixture reacting in later tests.
    (document.activeElement as HTMLElement | null)?.blur();
    fixture.destroy();
  });

  it('should create', () => {
    // Assert: the component builds.
    expect(component).toBeTruthy();
  });

  it('starts closed -- the menu is hidden and the button correctly announces it as collapsed', () => {
    // Assert: hidden, and announced as collapsed.
    expect(menuButton().getAttribute('aria-expanded')).toBe('false');
    expect(menuPanel().classList.contains('hidden')).toBe(true);
  });

  it('tapping the menu button opens the menu and announces it as expanded', () => {
    // Act: tap the menu button.
    menuButton().click();
    fixture.detectChanges();

    // Assert: shown, and announced as expanded.
    expect(menuButton().getAttribute('aria-expanded')).toBe('true');
    expect(menuPanel().classList.contains('hidden')).toBe(false);
  });

  it('tapping the menu button again closes it', () => {
    // Arrange: open the menu.
    menuButton().click();
    fixture.detectChanges();
    expect(menuButton().getAttribute('aria-expanded')).toBe('true'); // sanity check: it did open first

    // Act: tap the button again.
    menuButton().click();
    fixture.detectChanges();

    // Assert: closed again.
    expect(menuButton().getAttribute('aria-expanded')).toBe('false');
    expect(menuPanel().classList.contains('hidden')).toBe(true);
  });

  it('pressing Escape while open closes the menu', () => {
    // Arrange: open the menu.
    menuButton().click();
    fixture.detectChanges();
    expect(menuButton().getAttribute('aria-expanded')).toBe('true'); // sanity check: it did open first

    // Act: press Escape.
    pressEscape();
    fixture.detectChanges();

    // Assert: closed.
    expect(menuButton().getAttribute('aria-expanded')).toBe('false');
    expect(menuPanel().classList.contains('hidden')).toBe(true);
  });

  it('pressing Escape while already closed does nothing', () => {
    // Act: press Escape on the closed menu; it must not throw.
    expect(() => pressEscape()).not.toThrow();
    fixture.detectChanges();

    // Assert: still closed.
    expect(menuButton().getAttribute('aria-expanded')).toBe('false');
    expect(menuPanel().classList.contains('hidden')).toBe(true);
  });

  it('tapping a link inside the open menu closes it', () => {
    // Arrange: open the menu.
    menuButton().click();
    fixture.detectChanges();
    expect(menuButton().getAttribute('aria-expanded')).toBe('true'); // sanity check: it did open first

    // Act: tap the first link inside it.
    const link: HTMLAnchorElement | null = menuPanel().querySelector('a');
    expect(link).toBeTruthy();
    link!.click();
    fixture.detectChanges();

    // Assert: closed.
    expect(menuButton().getAttribute('aria-expanded')).toBe('false');
    expect(menuPanel().classList.contains('hidden')).toBe(true);
  });

  it('navigating away by any other means (e.g. straight through the router) also closes the menu', async () => {
    // Arrange: open the menu.
    menuButton().click();
    fixture.detectChanges();
    expect(menuButton().getAttribute('aria-expanded')).toBe('true'); // sanity check: it did open first

    // Act: navigate through the router instead of a link.
    await router.navigateByUrl('/about');
    fixture.detectChanges();

    // Assert: closed.
    expect(menuButton().getAttribute('aria-expanded')).toBe('false');
    expect(menuPanel().classList.contains('hidden')).toBe(true);
  });

  it('does not move focus into the menu when it opens', () => {
    // Act: focus the button and open the menu.
    menuButton().focus();
    menuButton().click();
    fixture.detectChanges();

    // Assert: focus stays on the button.
    expect(document.activeElement).toBe(menuButton());
  });

  it('returns focus to the menu button when Escape closes it while focus was inside the menu', () => {
    // Arrange: open the menu and focus a link inside it.
    menuButton().click();
    fixture.detectChanges();

    const link: HTMLAnchorElement | null = menuPanel().querySelector('a');
    link!.focus();
    expect(document.activeElement).toBe(link);

    // Act: press Escape.
    pressEscape();
    fixture.detectChanges();

    // Assert: focus returns to the button.
    expect(document.activeElement).toBe(menuButton());
  });

  it('does not steal focus on close when focus was never inside the menu', async () => {
    // Arrange: open the menu, with focus in an input elsewhere on the page.
    menuButton().click();
    fixture.detectChanges();

    const outsideInput = document.createElement('input');
    document.body.appendChild(outsideInput);
    try {
      outsideInput.focus();

      // Act: navigate away, which closes the menu.
      await router.navigateByUrl('/about');
      fixture.detectChanges();

      // Assert: the input keeps focus.
      expect(document.activeElement).toBe(outsideInput);
    } finally {
      // try/finally, so a failed expectation still can't leave this stray input behind for later tests.
      outsideInput.remove();
    }
  });

  it('rounds the border around the nav links', () => {
    // Assert: the links' list has rounded corners.
    const links = menuPanel().querySelector('ul');
    expect(links!.classList.contains('rounded-xl')).toBe(true);
  });

  it("rounds only the navbar's own bottom corners while the mobile menu is open, not while closed", () => {
    // Assert: square bottom corners while closed...
    expect(navElement().classList.contains('rounded-b-2xl')).toBe(false);

    // ...rounded once the menu opens.
    menuButton().click();
    fixture.detectChanges();

    expect(navElement().classList.contains('rounded-b-2xl')).toBe(true);
  });

  it('shows a dimming overlay behind the navbar while the menu is open, and hides it once closed', () => {
    // Assert: no overlay while closed...
    expect(overlay()).toBeFalsy();

    // ...one appears when opened...
    menuButton().click();
    fixture.detectChanges();
    expect(overlay()).toBeTruthy();

    // ...and goes when closed.
    menuButton().click();
    fixture.detectChanges();
    expect(overlay()).toBeFalsy();
  });

  it("clicking the overlay closes the menu, same as clicking outside the gallery lightbox's content closes that", () => {
    // Arrange: open the menu.
    menuButton().click();
    fixture.detectChanges();
    expect(menuButton().getAttribute('aria-expanded')).toBe('true'); // sanity check: it did open first

    // Act: click the overlay.
    overlay()!.click();
    fixture.detectChanges();

    // Assert: menu closed and overlay gone.
    expect(menuButton().getAttribute('aria-expanded')).toBe('false');
    expect(menuPanel().classList.contains('hidden')).toBe(true);
    expect(overlay()).toBeFalsy();
  });

  it('does not try to focus the (lg:hidden, unfocusable) menu button when closing at a desktop viewport width', () => {
    // Arrange: pretend the viewport is desktop-width, where the menu button is hidden.
    const matchMediaSpy = vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true,
      media: '(min-width: 1024px)',
      addEventListener: () => {},
      removeEventListener: () => {},
    } as unknown as MediaQueryList);

    try {
      // Open the menu and focus a link inside it.
      menuButton().click();
      fixture.detectChanges();

      const link: HTMLAnchorElement | null = menuPanel().querySelector('a');
      link!.focus();
      expect(document.activeElement).toBe(link);

      // Act: press Escape.
      pressEscape();
      fixture.detectChanges();

      // Assert only that focus didn't go to the (unfocusable) button; jsdom never hides the panel, so it won't blur.
      expect(document.activeElement).not.toBe(menuButton());
    } finally {
      // Put the real matchMedia back.
      matchMediaSpy.mockRestore();
    }
  });
});
