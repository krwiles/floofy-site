import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';

export type Locale = 'en' | 'ja';

type MessageKey =
  | 'language.english'
  | 'language.japanese'
  | 'nav.about'
  | 'nav.streaming'
  | 'nav.gallery'
  | 'nav.oc'
  | 'nav.contact'
  | 'nav.commission';

const messages: Record<Locale, Record<MessageKey, string>> = {
  en: {
    'language.english': 'English',
    'language.japanese': 'Japanese',
    'nav.about': 'ABOUT',
    'nav.streaming': 'STREAMING',
    'nav.gallery': 'GALLERY',
    'nav.oc': 'OC',
    'nav.contact': 'CONTACT',
    'nav.commission': 'COMMISSION',
  },
  ja: {
    'language.english': '英語',
    'language.japanese': '日本語',
    'nav.about': '概要',
    'nav.streaming': '配信',
    'nav.gallery': 'ギャラリー',
    'nav.oc': 'オリジナルキャラ',
    'nav.contact': 'お問い合わせ',
    'nav.commission': '依頼',
  },
};

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

  t(key: MessageKey): string {
    return messages[this.localeSignal()][key];
  }

  private getInitialLocale(): Locale {
    const savedLocale = localStorage.getItem('locale');
    return savedLocale === 'ja' ? 'ja' : 'en';
  }
}