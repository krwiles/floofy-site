import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';

import { I18nService } from './i18n.service';
import en from '../../assets/i18n/en.json';
import ja from '../../assets/i18n/ja.json';
import { PricingService } from './pricing.service';

describe('I18nService', () => {
  let document: Document;

  beforeEach(() => {
    // Start each test with no saved locale and no <html lang>, since the service reads/writes both.
    localStorage.clear();
    TestBed.configureTestingModule({});
    document = TestBed.inject(DOCUMENT);
    document.documentElement.lang = '';
  });

  afterEach(() => {
    // Leave nothing behind for the next test file.
    localStorage.clear();
    document.documentElement.lang = '';
  });

  it('should be created with english as the default locale', () => {
    // Act: create the service with nothing saved, and let its effect run.
    const service = TestBed.inject(I18nService);
    TestBed.flushEffects();

    // Assert: English, saved for next visit, and set on <html lang>.
    expect(service).toBeTruthy();
    expect(service.locale()).toBe('en');
    expect(localStorage.getItem('locale')).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });

  it('should initialize the locale from localStorage', () => {
    // Arrange: a returning visitor who chose Japanese.
    localStorage.setItem('locale', 'ja');

    // Act: create the service and let its effect run.
    const service = TestBed.inject(I18nService);
    TestBed.flushEffects();

    // Assert: it starts in Japanese, translations included.
    expect(service.locale()).toBe('ja');
    expect(service.t('footer.legal.backToTop')).toBe('上へ戻る');
    expect(document.documentElement.lang).toBe('ja');
  });

  it('should fall back to english for unsupported saved locales', () => {
    // Arrange: a saved locale the site doesn't support.
    localStorage.setItem('locale', 'fr');

    // Act: create the service and let its effect run.
    const service = TestBed.inject(I18nService);
    TestBed.flushEffects();

    // Assert: it falls back to English.
    expect(service.locale()).toBe('en');
    expect(service.t('footer.legal.backToTop')).toBe('Back to top');
    expect(document.documentElement.lang).toBe('en');
  });

  it('should update the locale, persisted value, and translations', () => {
    // Arrange: a service starting in English.
    const service = TestBed.inject(I18nService);
    TestBed.flushEffects();

    // Act: switch to Japanese.
    service.setLocale('ja');
    TestBed.flushEffects();

    // Assert: the locale, translations, saved value and <html lang> all follow.
    expect(service.locale()).toBe('ja');
    expect(service.t('footer.legal.backToTop')).toBe('上へ戻る');
    expect(localStorage.getItem('locale')).toBe('ja');
    expect(document.documentElement.lang).toBe('ja');
  });

  describe('list()', () => {
    it('returns a card list as an ordered string array', () => {
      // The service reads the real en.json, English by default.
      const service = TestBed.inject(I18nService);

      // Chibi's two "includes" entries, in their original order.
      expect(service.list('commission.cards.chibi.includes')).toEqual([
        'One half-body chibi character',
        'Basic two-tone background',
      ]);
    });

    it('follows the current locale, like t() does', () => {
      // The service reads the real en/ja JSON.
      const service = TestBed.inject(I18nService);

      // Switch to Japanese before reading the same list.
      service.setLocale('ja');

      // The same key now returns the Japanese entries.
      expect(service.list('commission.cards.chibi.includes')).toEqual(['半身ちびキャラ1体', 'シンプルな2トーン背景']);
    });

    it('reads a terms card body from its items array', () => {
      // The service reads the real en.json, English by default.
      const service = TestBed.inject(I18nService);

      // Workflow is the numbered list, so its order matters.
      const workflow = service.list('commission.terms.workflow.items');

      // All five steps, starting from the first.
      expect(workflow.length).toBe(5);
      expect(workflow[0]).toBe('Discussion & quotation.');
    });

    it('returns [] and warns, rather than throwing, for a missing or non-list key', () => {
      // The service reads the real en.json, English by default.
      const service = TestBed.inject(I18nService);
      // Silence and record the warning.
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      // A typo'd key, and a key that exists but holds a string, not a list.
      const missing = service.list('commission.cards.chibi.inclodes');
      const notAList = service.list('commission.cards.chibi.title');

      // Both come back empty, and each warning names its bad key.
      expect(missing).toEqual([]);
      expect(notAList).toEqual([]);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('commission.cards.chibi.inclodes'));
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('commission.cards.chibi.title'));

      // Put the real console.warn back for other tests.
      warn.mockRestore();
    });
  });

  describe('groups()', () => {
    it('returns grouped terms as { id, label, items } in their original order', () => {
      // The service reads the real en.json, English by default.
      const service = TestBed.inject(I18nService);

      // ToS keeps all eight groups, ids taken from the old key names.
      const tos = service.groups('commission.terms.tos.groups');

      // Ids in their original order, and the first group's label and items.
      expect(tos.map((group) => group.id)).toEqual([
        'usage',
        'ownership_licensing',
        'portfolio',
        'modifications',
        'ai_blockchain',
        'delivery',
        'refunds',
        'conduct',
      ]);
      expect(tos[0].label).toBe('Usage');
      expect(tos[0].items.length).toBe(2);
    });

    it("keeps Artwork Usage's group ids identical to the priced usage types, in both locales", () => {
      // The service reads the real en/ja JSON.
      const service = TestBed.inject(I18nService);
      // 3c attaches each group's percent add-on by this id -- see docs/refactor/18-phase-6-stage-3-plan.md.
      const usageTypeIds = TestBed.inject(PricingService).data.usageTypes.map((type) => type.id);

      // Check the English groups, then the Japanese ones.
      const enIds = service.groups('commission.terms.artwork_usage.groups').map((group) => group.id);
      service.setLocale('ja');
      const jaIds = service.groups('commission.terms.artwork_usage.groups').map((group) => group.id);

      // Same set of ids in any order; attaching percents by id doesn't depend on order.
      expect(enIds).toEqual(expect.arrayContaining(usageTypeIds));
      expect(enIds.length).toBe(usageTypeIds.length);
      expect(jaIds).toEqual(expect.arrayContaining(usageTypeIds));
      expect(jaIds.length).toBe(usageTypeIds.length);
    });

    it('returns [] and warns for a missing key', () => {
      // The service reads the real en.json, English by default.
      const service = TestBed.inject(I18nService);
      // Silence and record the warning.
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      // Read a typo'd key.
      const groups = service.groups('commission.terms.tos.grops');

      // It comes back empty, and the warning names the bad key.
      expect(groups).toEqual([]);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('commission.terms.tos.grops'));

      // Put the real console.warn back for other tests.
      warn.mockRestore();
    });
  });

  describe('commission form keys', () => {
    it('has the usage explanation label and placeholder in both locales', () => {
      // The service reads the real en/ja JSON.
      const service = TestBed.inject(I18nService);
      // The two keys the request form's usage-explanation field needs.
      const keys = ['commission.form.usage_explanation.label', 'commission.form.usage_explanation.placeholder'];

      // t() echoes a missing key back, so a real translation never equals its own key.
      keys.forEach((key) => expect(service.t(key)).not.toBe(key));
      service.setLocale('ja');
      keys.forEach((key) => expect(service.t(key)).not.toBe(key));
    });

    it("folds deadline's and additional notes' notes into their labels, each locale with its own spacing", () => {
      // The service reads the real en/ja JSON.
      const service = TestBed.inject(I18nService);

      // English: a space before the bracketed note.
      expect(service.t('commission.form.deadline.label')).toBe('Deadline (optional and not guaranteed)');
      expect(service.t('commission.form.additional_notes.label')).toBe('Additional Notes (optional)');

      // Japanese: full-width brackets, no space.
      service.setLocale('ja');
      expect(service.t('commission.form.deadline.label')).toBe('希望納期（任意・確約ではありません）');
      expect(service.t('commission.form.additional_notes.label')).toBe('補足事項（任意）');

      // The separate note keys are gone (t() echoes a missing key back).
      expect(service.t('commission.form.deadline.note')).toBe('commission.form.deadline.note');
      expect(service.t('commission.form.additional_notes.note')).toBe('commission.form.additional_notes.note');
    });
  });

  describe('commission card keys and removed terms', () => {
    it('keys the emote card by its singular ArtworkCategory id', () => {
      // The service reads the real en.json, English by default.
      const service = TestBed.inject(I18nService);

      // 'emote' resolves; the old plural key is gone.
      expect(service.t('commission.cards.emote.title')).toBe('Emotes');
      expect(service.t('commission.cards.emotes.title')).toBe('commission.cards.emotes.title');
    });

    it("drops the never-rendered artwork-usage 'unsure' sentence but keeps the form's Unsure option", () => {
      // The service reads the real en.json, English by default.
      const service = TestBed.inject(I18nService);

      // t() echoes the key back when it no longer exists.
      expect(service.t('commission.terms.artwork_usage.unsure')).toBe('commission.terms.artwork_usage.unsure');
      expect(service.t('commission.form.usage_type.unsure')).not.toBe('commission.form.usage_type.unsure');
    });
  });

  describe('t() placeholders', () => {
    it('fills {name} placeholders from the values given', () => {
      // The service reads the real en.json, English by default.
      const service = TestBed.inject(I18nService);

      // The commission rate-limit message carries the server's limit and window.
      const text = service.t('forms.commission.rate_limited', { limit: 2, window_hours: 24 });

      // Both numbers are in, and no placeholder is left.
      expect(text).toContain('2');
      expect(text).toContain('24');
      expect(text).not.toContain('{');
    });

    it('leaves a placeholder visible when no value is given, so the gap shows up in testing', () => {
      // The service reads the real en.json, English by default.
      const service = TestBed.inject(I18nService);

      // No values passed at all.
      expect(service.t('forms.commission.rate_limited')).toContain('{limit}');
    });
  });

  describe('form status keys', () => {
    it('has every status message for every form, in both locales', () => {
      // The service reads the real en/ja JSON.
      const service = TestBed.inject(I18nService);

      // Every status key for every form: 3 forms x 5 statuses.
      const keys = ['contact', 'review', 'commission'].flatMap((form) =>
        ['pending', 'invalid', 'ok', 'rate_limited', 'error'].map((status) => `forms.${form}.${status}`),
      );

      // t() echoes a missing key back, so a real translation never equals its own key.
      keys.forEach((key) => expect(service.t(key)).not.toBe(key));

      // The same check in Japanese.
      service.setLocale('ja');
      keys.forEach((key) => expect(service.t(key)).not.toBe(key));
    });
  });

  describe('locale files', () => {
    /** Every key path in a locale file, e.g. `home.hero.kicker`; a list counts as one path, whatever its length. */
    function keyPaths(value: unknown, prefix = ''): string[] {
      // A leaf (text or a list) is one path; lists may differ in length between languages.
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return [prefix];
      }

      // An object contributes each of its children's paths.
      return Object.entries(value).flatMap(([key, child]) => keyPaths(child, prefix ? `${prefix}.${key}` : key));
    }

    it('has exactly the same keys in English and Japanese', () => {
      // Assert: no key missing from either file, and none left over in one.
      expect(keyPaths(ja).sort()).toEqual(keyPaths(en).sort());
    });

    it("has no home.contact_page leftovers (the contact page's text lives under contact)", () => {
      // Assert: gone from both files.
      expect(keyPaths(en).some((path) => path.startsWith('home.contact_page'))).toBe(false);
      expect(keyPaths(ja).some((path) => path.startsWith('home.contact_page'))).toBe(false);
    });
  });
});
