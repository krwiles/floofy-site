import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { I18nService } from '../../../services/i18n.service';

interface FlagDisplay {
  readonly src: string;
  readonly label: string;
}

// The label names both languages (current first), so it's the same words in either locale, just swapped.
const FLAG_BY_LOCALE: Record<'en' | 'ja', FlagDisplay> = {
  en: { src: 'assets/icons/flag-en.svg', label: 'EN/日本語' },
  ja: { src: 'assets/icons/flag-ja.svg', label: '日本語/EN' },
};

/**
 * The navbar's language switch: the current language's flag and both language names, flipping the site's locale on
 * click -- see docs/refactor/specs/app-language-toggle.md. Persistence and <html lang> belong to I18nService.
 */
@Component({
  selector: 'app-language-toggle',
  imports: [NgOptimizedImage, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // `display: contents` so the navbar's flex layout sees the <button> directly.
  styles: ':host { display: contents; }',
  template: `
    <button
      type="button"
      (click)="toggleLanguage()"
      class="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-brand-subtle px-3 text-sm leading-5 font-semibold text-on-light-heading transition-colors hover:bg-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-strong"
      [attr.aria-label]="'components.language_toggle.name' | translate: { label: flag().label }"
    >
      <!-- Empty alt: the flag is decorative; the label beside it names the languages. -->
      <img [ngSrc]="flag().src" alt="" width="18" height="18" class="h-4 w-4 md:me-1.5" />
      <!-- Always present so the spoken name matches it; visually hidden on phones, where only the flag shows -->
      <span class="sr-only md:not-sr-only">{{ flag().label }}</span>
    </button>
  `,
})
export class LanguageToggle {
  readonly i18n = inject(I18nService);

  // The flag and label for the current locale.
  readonly flag = computed(() => FLAG_BY_LOCALE[this.i18n.locale()]);

  toggleLanguage(): void {
    // Switch to whichever language isn't active.
    const nextLocale = this.i18n.locale() === 'en' ? 'ja' : 'en';
    this.i18n.setLocale(nextLocale);
  }
}
