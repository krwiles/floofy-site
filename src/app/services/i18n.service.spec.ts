import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';

import { I18nService } from './i18n.service';
import { PricingService } from './pricing.service';

describe('I18nService', () => {
  let document: Document;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    document = TestBed.inject(DOCUMENT);
    document.documentElement.lang = '';
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.lang = '';
  });

  it('should be created with english as the default locale', () => {
    const service = TestBed.inject(I18nService);
    TestBed.flushEffects();

    expect(service).toBeTruthy();
    expect(service.locale()).toBe('en');
    expect(localStorage.getItem('locale')).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });

  it('should initialize the locale from localStorage', () => {
    localStorage.setItem('locale', 'ja');

    const service = TestBed.inject(I18nService);
    TestBed.flushEffects();

    expect(service.locale()).toBe('ja');
    expect(service.t('footer.legal.backToTop')).toBe('上へ戻る');
    expect(document.documentElement.lang).toBe('ja');
  });

  it('should fall back to english for unsupported saved locales', () => {
    localStorage.setItem('locale', 'fr');

    const service = TestBed.inject(I18nService);
    TestBed.flushEffects();

    expect(service.locale()).toBe('en');
    expect(service.t('footer.legal.backToTop')).toBe('Back to top');
    expect(document.documentElement.lang).toBe('en');
  });

  it('should update the locale, persisted value, and translations', () => {
    const service = TestBed.inject(I18nService);
    TestBed.flushEffects();

    service.setLocale('ja');
    TestBed.flushEffects();

    expect(service.locale()).toBe('ja');
    expect(service.t('footer.legal.backToTop')).toBe('上へ戻る');
    expect(localStorage.getItem('locale')).toBe('ja');
    expect(document.documentElement.lang).toBe('ja');
  });

  describe('list()', () => {
    it('returns a card list as an ordered string array', () => {
      const service = TestBed.inject(I18nService);

      // Chibi's two "includes" entries, in their original order.
      expect(service.list('commission.cards.chibi.includes')).toEqual([
        'One half-body chibi character',
        'Basic two-tone background',
      ]);
    });

    it('follows the current locale, like t() does', () => {
      const service = TestBed.inject(I18nService);

      // Switch to Japanese before reading the same list.
      service.setLocale('ja');

      expect(service.list('commission.cards.chibi.includes')).toEqual(['半身ちびキャラ1体', 'シンプルな2トーン背景']);
    });

    it('reads a terms card body from its items array', () => {
      const service = TestBed.inject(I18nService);

      // Workflow is the numbered list, so its order matters.
      const workflow = service.list('commission.terms.workflow.items');

      expect(workflow.length).toBe(5);
      expect(workflow[0]).toBe('Discussion & quotation.');
    });

    it('returns [] and warns, rather than throwing, for a missing or non-list key', () => {
      const service = TestBed.inject(I18nService);
      // Silence and record the warning.
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      // A typo'd key, and a key that exists but holds a string, not a list.
      const missing = service.list('commission.cards.chibi.inclodes');
      const notAList = service.list('commission.cards.chibi.title');

      expect(missing).toEqual([]);
      expect(notAList).toEqual([]);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('commission.cards.chibi.inclodes'));
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('commission.cards.chibi.title'));
      warn.mockRestore();
    });
  });

  describe('groups()', () => {
    it('returns grouped terms as { id, label, items } in their original order', () => {
      const service = TestBed.inject(I18nService);

      // ToS keeps all eight groups, ids taken from the old key names.
      const tos = service.groups('commission.terms.tos.groups');

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
      const service = TestBed.inject(I18nService);
      // 3c attaches each group's percent add-on by this id -- see 18-phase-6-stage-3-plan.md.
      const usageTypeIds = TestBed.inject(PricingService).data.usageTypes.map((type) => type.id);

      // Check the English groups, then the Japanese ones.
      const enIds = service.groups('commission.terms.artwork_usage.groups').map((group) => group.id);
      service.setLocale('ja');
      const jaIds = service.groups('commission.terms.artwork_usage.groups').map((group) => group.id);

      expect(enIds).toEqual(usageTypeIds);
      expect(jaIds).toEqual(usageTypeIds);
    });

    it('returns [] and warns for a missing key', () => {
      const service = TestBed.inject(I18nService);
      // Silence and record the warning.
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      const groups = service.groups('commission.terms.tos.grops');

      expect(groups).toEqual([]);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('commission.terms.tos.grops'));
      warn.mockRestore();
    });
  });

  describe('stage 3b data changes', () => {
    it('keys the emote card by its singular ArtworkCategory id', () => {
      const service = TestBed.inject(I18nService);

      // 'emote' resolves; the old plural key is gone.
      expect(service.t('commission.cards.emote.title')).toBe('Emotes');
      expect(service.t('commission.cards.emotes.title')).toBe('commission.cards.emotes.title');
    });

    it("drops the never-rendered artwork-usage 'unsure' sentence but keeps the form's Unsure option", () => {
      const service = TestBed.inject(I18nService);

      // t() echoes the key back when it no longer exists.
      expect(service.t('commission.terms.artwork_usage.unsure')).toBe('commission.terms.artwork_usage.unsure');
      expect(service.t('commission.form.usage_type.unsure')).not.toBe('commission.form.usage_type.unsure');
    });
  });
});
