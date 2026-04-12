import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService, Locale } from '../../core/i18n.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navbar {
  readonly i18n = inject(I18nService);  
  readonly navKeys = [
    'nav.about',
    'nav.streaming',
    'nav.gallery',
    'nav.oc',
    'nav.contact',
    'nav.commission',
  ] as const;

  toggleLanguage(): void {
    const nextLocale: Locale = this.i18n.locale() === 'en' ? 'ja' : 'en';
    this.i18n.setLocale(nextLocale);
  }
}
