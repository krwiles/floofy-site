import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import en from '../../assets/i18n/en.json';
import ja from '../../assets/i18n/ja.json';
import { ListGroup } from '../models/list-group';

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
    // Whenever the locale changes, remember it for next visit and set <html lang> for screen readers and fonts.
    effect(() => {
      const locale = this.localeSignal();
      localStorage.setItem('locale', locale);
      this.document.documentElement.lang = locale;
    });
  }

  setLocale(locale: Locale): void {
    // Every t()/list()/groups() caller re-renders, because they all read this signal.
    this.localeSignal.set(locale);
  }

  t(key: string): string {
    // Echo the key back when it's missing, so a typo shows up visibly on the page.
    const value = this.lookup(key);
    return typeof value === 'string' ? value : key;
  }

  /** A flat list of strings, e.g. a pricing card's `includes`. Array-shaped content that `t()` can't return. */
  list(key: string): string[] {
    const value = this.lookup(key);

    // Only a real array of strings counts; anything else is a missing or mistyped key.
    if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
      return value;
    }

    // Warn instead of throwing, so a bad key empties one list rather than breaking the page.
    console.warn(`I18nService.list: no string list at "${key}"`);
    return [];
  }

  /** Labelled sub-lists, e.g. the Artwork Usage and Terms of Service cards -- see `ListGroup`. */
  groups(key: string): ListGroup[] {
    const value = this.lookup(key);

    // Shape is guaranteed by the JSON (pinned by i18n.service.spec.ts), so an array check is enough.
    if (Array.isArray(value)) {
      return value as ListGroup[];
    }

    // Warn and return nothing for a missing key, so one bad key can't break the page.
    console.warn(`I18nService.groups: no groups at "${key}"`);
    return [];
  }

  nav(): NavItem[] {
    // The current locale's `nav` section maps each page key to its label and route.
    const navSection = translations[this.localeSignal()]['nav'] as Record<string, { label: string; route: string }>;

    // Flatten it into a list, in the JSON's order, for the navbar to loop over.
    return Object.entries(navSection).map(([key, value]) => ({
      key,
      label: value.label,
      route: value.route,
    }));
  }

  /** Walks a dotted key (`a.b.c`) through the current locale's JSON; `undefined` if any segment is missing. */
  private lookup(key: string): unknown {
    // Reading the locale signal here makes every caller reactive to setLocale().
    let current: unknown = translations[this.localeSignal()];

    // Step one segment at a time, bailing out as soon as a segment doesn't exist.
    for (const segment of key.split('.')) {
      if (current === null || typeof current !== 'object' || !(segment in current)) {
        return undefined;
      }
      current = (current as Record<string, unknown>)[segment];
    }

    return current;
  }

  private getInitialLocale(): Locale {
    // Restore the visitor's last choice; anything unrecognised (or nothing saved) means English.
    const savedLocale = localStorage.getItem('locale');
    return savedLocale === 'ja' ? 'ja' : 'en';
  }
}
