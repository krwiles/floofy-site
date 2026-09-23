import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Brand } from '../../components/brand/brand';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, Brand],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navbar {
  readonly i18n = inject(I18nService);

  toggleLanguage(): void {
    const nextLocale = this.i18n.locale() === 'en' ? 'ja' : 'en';
    this.i18n.setLocale(nextLocale);
  }
}
