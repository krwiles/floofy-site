import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import en from '../../assets/i18n/en.json';
import ja from '../../assets/i18n/ja.json';

export type Locale = 'en' | 'ja';

export interface NavItem {
  key: string;
  label: string;
  route: string;
}

const translations: Record<Locale, Record<string, unknown>> = { en, ja };

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly document = inject(DOCUMENT);
  private readonly localeSignal = signal<Locale>(this.getInitialLocale());

  readonly locale = computed(() => this.localeSignal());

  constructor() {
    effect(() => {
      const locale = this.localeSignal();
      localStorage.setItem('locale', locale);
      this.document.documentElement.lang = locale;
    });
  }

  setLocale(locale: Locale): void {
    this.localeSignal.set(locale);
  }

  t(key: string): string {
    const keys = key.split('.');
    let current: unknown = translations[this.localeSignal()];
    for (const k of keys) {
      if (current !== null && typeof current === 'object' && k in (current as object)) {
        current = (current as Record<string, unknown>)[k];
      } else {
        return key;
      }
    }
    return typeof current === 'string' ? current : key;
  }

  nav(): NavItem[] {
    const navSection = translations[this.localeSignal()]['nav'] as Record<
      string,
      { label: string; route: string }
    >;
    return Object.entries(navSection).map(([key, value]) => ({
      key,
      label: value.label,
      route: value.route,
    }));
  }

  private getInitialLocale(): Locale {
    const savedLocale = localStorage.getItem('locale');
    return savedLocale === 'ja' ? 'ja' : 'en';
  }
}
