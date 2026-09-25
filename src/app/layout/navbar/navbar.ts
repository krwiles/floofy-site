import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { Brand } from '../../components/brand/brand';
import { LanguageToggle } from '../../components/language-toggle/language-toggle';
import { I18nService } from '../../services/i18n.service';

// Tailwind's default `lg` breakpoint -- unmodified in this project (no `--breakpoint-lg` override in
// styles.css) -- above which the menu button is `lg:hidden` and the panel is always shown via `lg:flex`
// regardless of isMenuOpen. Kept in one place so the focus-guard and the resize handling below agree
// with the template's own breakpoint.
const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, Brand, LanguageToggle],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Escape should close the mobile menu no matter where focus happens to be (it's never moved into
  // the menu on open -- see closeMenu()'s own doc comment -- so it could legitimately be anywhere on
  // the page), which means a listener scoped to this component's own host element isn't enough.
  host: {
    '(document:keydown.escape)': 'closeMenu()',
  },
})
export class Navbar {
  readonly i18n = inject(I18nService);
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);

  private readonly menuButton = viewChild<ElementRef<HTMLButtonElement>>('menuButton');
  private readonly menuPanel = viewChild<ElementRef<HTMLElement>>('menuPanel');

  /** Whether the small-screen menu is open. Irrelevant at the `lg` breakpoint, where it's always shown. */
  readonly isMenuOpen = signal(false);

  constructor() {
    // Covers "any other kind of navigation away" (back/forward, a programmatic redirect, etc.) --
    // NavigationStart fires for all of them, including ones Angular's Router itself intercepts from
    // the browser's back/forward buttons. Tapping a link inside the menu is handled separately, by
    // closeMenu() bound directly to that link's own click -- so it closes immediately rather than
    // waiting on this (necessarily async) event.
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationStart),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.closeMenu());

    // Resize edge case from the spec: if the menu is left open on a small screen and the viewport is
    // widened past `lg` (where the button that would otherwise close it is itself hidden), force it
    // closed now rather than let it silently reappear "open" once the viewport narrows again later --
    // it should never reopen on its own, only because a visitor tapped the button.
    // NOT exercised by a real event in unit tests: this project's test-setup.ts installs a static
    // `window.matchMedia` stub for jsdom (which has no real one) whose `addEventListener` is a no-op,
    // so this listener registers but never actually fires there.
    const media = this.document.defaultView?.matchMedia(DESKTOP_MEDIA_QUERY);
    media?.addEventListener('change', (event) => {
      if (event.matches) this.isMenuOpen.set(false);
    });
  }

  toggleMenu(): void {
    this.isMenuOpen.set(!this.isMenuOpen());
  }

  /**
   * Closes the menu if it's open; a no-op otherwise (so Escape on an already-closed menu, or a
   * navigation the menu wasn't open for, does nothing -- see the spec's edge cases).
   *
   * Opening the menu never moves focus into it -- a visitor tabs into its links same as any other
   * newly-visible content, rather than having focus snap somewhere unexpected. Closing it is the one
   * case that needs help: if focus is currently *inside* the menu (a link the visitor tabbed to, or
   * just clicked -- both cases land here), that element is about to become unreachable, so focus is
   * returned to the menu button rather than silently falling back to the document body. If focus is
   * anywhere else on the page (this menu was never focused into, e.g. a navigation-away close while a
   * visitor was typing in some unrelated form), it's left alone. And if the viewport is currently at
   * the `lg` breakpoint, the button itself is `lg:hidden` (unfocusable), so this skips trying to focus
   * it at all -- calling `.focus()` on it there would silently no-op and strand focus on <body> instead.
   */
  closeMenu(): void {
    if (!this.isMenuOpen()) return;

    this.isMenuOpen.set(false);

    const panel = this.menuPanel()?.nativeElement;
    const button = this.menuButton()?.nativeElement;
    const isDesktopViewport = this.document.defaultView?.matchMedia(DESKTOP_MEDIA_QUERY).matches ?? false;
    if (!isDesktopViewport && panel && button && panel.contains(this.document.activeElement)) {
      button.focus();
    }
  }
}
