import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LanguageToggle } from './language-toggle';
import { I18nService } from '../../../services/i18n.service';

describe('LanguageToggle', () => {
  let fixture: ComponentFixture<LanguageToggle>;
  let i18n: I18nService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [LanguageToggle] }).compileComponents();

    fixture = TestBed.createComponent(LanguageToggle);
    i18n = TestBed.inject(I18nService);
    TestBed.flushEffects();
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('shows the English flag and the "switch to Japanese" label while the site is in English', () => {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');

    expect(button.getAttribute('aria-label')).toBe('Toggle language');
    expect(img.getAttribute('ng-src') ?? img.src).toContain('flag-en.svg');
    expect(fixture.nativeElement.textContent).toContain('EN/日本語');
  });

  it("labels itself in the site's current language, not always in English", () => {
    i18n.setLocale('ja');
    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button.getAttribute('aria-label')).toBe('言語を切り替える');
  });

  it('clicking the button switches the site to Japanese, and shows the Japanese flag and label', () => {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');

    button.click();
    fixture.detectChanges();

    expect(i18n.locale()).toBe('ja');
    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');
    expect(img.getAttribute('ng-src') ?? img.src).toContain('flag-ja.svg');
    expect(fixture.nativeElement.textContent).toContain('日本語/EN');
  });

  it('clicking it again switches back to English', () => {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');

    button.click();
    fixture.detectChanges();
    button.click();
    fixture.detectChanges();

    expect(i18n.locale()).toBe('en');
    expect(fixture.nativeElement.textContent).toContain('EN/日本語');
  });
});
