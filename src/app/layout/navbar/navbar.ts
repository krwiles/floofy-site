import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService, Locale } from '../../core/i18n.service';

@Component({
  selector: 'app-navbar',
  imports: [],
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

  setLanguage(locale: Locale): void {
    this.i18n.setLocale(locale);
  }
}
