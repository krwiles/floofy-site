import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';

import { I18nService } from './i18n.service';

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
});
