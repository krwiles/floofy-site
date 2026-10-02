import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { Brand } from '../../shared/components/brand/brand';
import { LanguageToggle } from '../../shared/components/language-toggle/language-toggle';
import { I18nService } from '../../services/i18n.service';

// Tailwind's default `lg` breakpoint: at and above it the menu button is hidden and the links always show.
const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, Brand, LanguageToggle],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Escape closes the menu wherever focus is, so listen on the document rather than this element.
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
    // Close the menu on any navigation (back/forward, redirects); a tapped link closes it directly, without waiting.
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationStart),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.closeMenu());

    // If the menu is open and the window widens past `lg`, close it, so it never reopens by itself on narrowing
    // (spec "Edge Cases" in docs/refactor/specs/navbar-disclosure.md). jsdom's matchMedia stub never fires this.
    const media = this.document.defaultView?.matchMedia(DESKTOP_MEDIA_QUERY);
    media?.addEventListener('change', (event) => {
      if (event.matches) this.isMenuOpen.set(false);
    });
  }

  toggleMenu(): void {
    // Flip open/closed.
    this.isMenuOpen.set(!this.isMenuOpen());
  }

  /**
   * Closes the menu if it's open. Opening never moves focus into the menu; closing returns focus to the menu button
   * only when focus was inside the menu, and not at the `lg` breakpoint, where the button is hidden and unfocusable.
   */
  closeMenu(): void {
    // Nothing to do if it's already closed (e.g. Escape on a closed menu).
    if (!this.isMenuOpen()) return;

    // Close it.
    this.isMenuOpen.set(false);

    // If focus was inside the menu (now hidden), hand it back to the menu button rather than losing it to <body>.
    const panel = this.menuPanel()?.nativeElement;
    const button = this.menuButton()?.nativeElement;
    const isDesktopViewport = this.document.defaultView?.matchMedia(DESKTOP_MEDIA_QUERY).matches ?? false;
    if (!isDesktopViewport && panel && button && panel.contains(this.document.activeElement)) {
      button.focus();
    }
  }
}
