import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { I18nService } from '../../services/i18n.service';

interface FlagDisplay {
  readonly src: string;
  readonly label: string;
}

// The visible label always names *both* languages together (current, then the one a click switches
// to) -- it isn't conventional per-locale copy, it's the language names themselves, so both locales
// show the same pair of words in swapped order rather than something looked up per current locale.
const FLAG_BY_LOCALE: Record<'en' | 'ja', FlagDisplay> = {
  en: { src: 'assets/flag-en.svg', label: 'EN/日本語' },
  ja: { src: 'assets/flag-ja.svg', label: '日本語/EN' },
};

/**
 * The navbar's language switch: shows the current language's flag plus a
 * label naming the language it will switch to, and flips the site's locale
 * on click. Pulled out of Navbar's own markup -- which drew both flags as
 * inline <svg> code -- as a plain extraction: see
 * docs/refactor/specs/app-language-toggle.md. Looks and behaves exactly as
 * it did inline; nothing about how the site's language switching works
 * (persistence, <html lang>, etc., all owned by I18nService) changed.
 */
@Component({
  selector: 'app-language-toggle',
  imports: [NgOptimizedImage, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // display: contents -- this host has no styling of its own; Navbar's
  // surrounding flex/space-x layout should see the <button> directly, the
  // same as when it was inline navbar markup.
  styles: ':host { display: contents; }',
  template: `
    <button
      type="button"
      (click)="toggleLanguage()"
      class="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-brand-subtle px-3 text-sm leading-5 font-semibold text-on-light-heading transition-colors hover:bg-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-strong"
      [attr.aria-label]="'components.language_toggle.toggle' | translate"
    >
      <!-- alt="" -- the adjacent label already names the current/target language; the flag is
           decorative here, same as before extraction. -->
      <img [ngSrc]="flag().src" alt="" width="18" height="18" class="h-4 w-4 md:me-1.5" />
      <span class="hidden md:inline">{{ flag().label }}</span>
    </button>
  `,
})
export class LanguageToggle {
  readonly i18n = inject(I18nService);

  readonly flag = computed(() => FLAG_BY_LOCALE[this.i18n.locale()]);

  toggleLanguage(): void {
    const nextLocale = this.i18n.locale() === 'en' ? 'ja' : 'en';
    this.i18n.setLocale(nextLocale);
  }
}
