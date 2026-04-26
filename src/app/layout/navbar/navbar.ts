import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { I18nService, Locale } from '../../services/i18n.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navbar {
  readonly i18n = inject(I18nService);
  readonly navKeys = [
    'nav.gallery',
    'nav.about',
    'nav.commission',
    'nav.streaming',
    'nav.reviews',
    'nav.donate',
    'nav.contact',
  ] as const;

  toggleLanguage(): void {
    const nextLocale: Locale = this.i18n.locale() === 'en' ? 'ja' : 'en';
    this.i18n.setLocale(nextLocale);
  }
}
