import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { Navbar } from './navbar';
import { routes } from '../../app.routes';

describe('Navbar', () => {
  let component: Navbar;
  let fixture: ComponentFixture<Navbar>;
  let router: Router;

  function menuButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button[aria-controls="navbar-language"]');
  }

  function menuPanel(): HTMLElement {
    return fixture.nativeElement.querySelector('#navbar-language');
  }

  function navElement(): HTMLElement {
    return fixture.nativeElement.querySelector('nav');
  }

  // `.fixed.inset-0` uniquely matches the dimming overlay within this component -- `<nav>` itself uses
  // `fixed` too, but not `inset-0` (it uses the unrelated `inset-s-0`).
  function overlay(): HTMLElement | null {
    return fixture.nativeElement.querySelector('.fixed.inset-0');
  }

  function pressEscape(): void {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  }

  beforeEach(async () => {
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
    // Escape is dispatched on `document` itself (see pressEscape()), so a fixture this suite leaves
    // attached/focused would keep reacting to it in later tests -- tear down explicitly rather than
    // relying on the harness to do it.
    (document.activeElement as HTMLElement | null)?.blur();
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('starts closed -- the menu is hidden and the button correctly announces it as collapsed', () => {
    expect(menuButton().getAttribute('aria-expanded')).toBe('false');
    expect(menuPanel().classList.contains('hidden')).toBe(true);
  });

  it('tapping the menu button opens the menu and announces it as expanded', () => {
    menuButton().click();
    fixture.detectChanges();

    expect(menuButton().getAttribute('aria-expanded')).toBe('true');
    expect(menuPanel().classList.contains('hidden')).toBe(false);
  });

  it('tapping the menu button again closes it', () => {
    menuButton().click();
    fixture.detectChanges();
    expect(menuButton().getAttribute('aria-expanded')).toBe('true'); // sanity check: it did open first

    menuButton().click();
    fixture.detectChanges();

    expect(menuButton().getAttribute('aria-expanded')).toBe('false');
    expect(menuPanel().classList.contains('hidden')).toBe(true);
  });

  it('pressing Escape while open closes the menu', () => {
    menuButton().click();
    fixture.detectChanges();
    expect(menuButton().getAttribute('aria-expanded')).toBe('true'); // sanity check: it did open first

    pressEscape();
    fixture.detectChanges();

    expect(menuButton().getAttribute('aria-expanded')).toBe('false');
    expect(menuPanel().classList.contains('hidden')).toBe(true);
  });

  it('pressing Escape while already closed does nothing', () => {
    expect(() => pressEscape()).not.toThrow();
    fixture.detectChanges();

    expect(menuButton().getAttribute('aria-expanded')).toBe('false');
    expect(menuPanel().classList.contains('hidden')).toBe(true);
  });

  it('tapping a link inside the open menu closes it', () => {
    menuButton().click();
    fixture.detectChanges();
    expect(menuButton().getAttribute('aria-expanded')).toBe('true'); // sanity check: it did open first

    const link: HTMLAnchorElement | null = menuPanel().querySelector('a');
    expect(link).toBeTruthy();
    link!.click();
    fixture.detectChanges();

    expect(menuButton().getAttribute('aria-expanded')).toBe('false');
    expect(menuPanel().classList.contains('hidden')).toBe(true);
  });

  it('navigating away by any other means (e.g. straight through the router) also closes the menu', async () => {
    menuButton().click();
    fixture.detectChanges();
    expect(menuButton().getAttribute('aria-expanded')).toBe('true'); // sanity check: it did open first

    await router.navigateByUrl('/about');
    fixture.detectChanges();

    expect(menuButton().getAttribute('aria-expanded')).toBe('false');
    expect(menuPanel().classList.contains('hidden')).toBe(true);
  });

  it('does not move focus into the menu when it opens', () => {
    menuButton().focus();
    menuButton().click();
    fixture.detectChanges();

    expect(document.activeElement).toBe(menuButton());
  });

  it('returns focus to the menu button when Escape closes it while focus was inside the menu', () => {
    menuButton().click();
    fixture.detectChanges();

    const link: HTMLAnchorElement | null = menuPanel().querySelector('a');
    link!.focus();
    expect(document.activeElement).toBe(link);

    pressEscape();
    fixture.detectChanges();

    expect(document.activeElement).toBe(menuButton());
  });

  it('does not steal focus on close when focus was never inside the menu', async () => {
    menuButton().click();
    fixture.detectChanges();

    const outsideInput = document.createElement('input');
    document.body.appendChild(outsideInput);
    try {
      outsideInput.focus();

      await router.navigateByUrl('/about');
      fixture.detectChanges();

      expect(document.activeElement).toBe(outsideInput);
    } finally {
      // try/finally so a failed expectation above still can't leave this stray node behind for
      // later tests in this file.
      outsideInput.remove();
    }
  });

  it('rounds the border around the nav links', () => {
    const links = menuPanel().querySelector('ul');
    expect(links!.classList.contains('rounded-xl')).toBe(true);
  });

  it("rounds only the navbar's own bottom corners while the mobile menu is open, not while closed", () => {
    expect(navElement().classList.contains('rounded-b-2xl')).toBe(false);

    menuButton().click();
    fixture.detectChanges();

    expect(navElement().classList.contains('rounded-b-2xl')).toBe(true);
  });

  it('shows a dimming overlay behind the navbar while the menu is open, and hides it once closed', () => {
    expect(overlay()).toBeFalsy();

    menuButton().click();
    fixture.detectChanges();
    expect(overlay()).toBeTruthy();

    menuButton().click();
    fixture.detectChanges();
    expect(overlay()).toBeFalsy();
  });

  it("clicking the overlay closes the menu, same as clicking outside the gallery lightbox's content closes that", () => {
    menuButton().click();
    fixture.detectChanges();
    expect(menuButton().getAttribute('aria-expanded')).toBe('true'); // sanity check: it did open first

    overlay()!.click();
    fixture.detectChanges();

    expect(menuButton().getAttribute('aria-expanded')).toBe('false');
    expect(menuPanel().classList.contains('hidden')).toBe(true);
    expect(overlay()).toBeFalsy();
  });

  it('does not try to focus the (lg:hidden, unfocusable) menu button when closing at a desktop viewport width', () => {
    const matchMediaSpy = vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true,
      media: '(min-width: 1024px)',
      addEventListener: () => {},
      removeEventListener: () => {},
    } as unknown as MediaQueryList);

    try {
      menuButton().click();
      fixture.detectChanges();

      const link: HTMLAnchorElement | null = menuPanel().querySelector('a');
      link!.focus();
      expect(document.activeElement).toBe(link);

      pressEscape();
      fixture.detectChanges();

      // Not asserting *where* focus ends up (a real browser would blur it to <body> once the panel
      // actually goes display:none, which jsdom -- not loading the real Tailwind stylesheet -- won't
      // do here) -- only that the guard didn't try to move it onto a button that isn't focusable at
      // this width.
      expect(document.activeElement).not.toBe(menuButton());
    } finally {
      matchMediaSpy.mockRestore();
    }
  });
});
