import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LanguageToggle } from './language-toggle';
import { I18nService } from '../../../services/i18n.service';

describe('LanguageToggle', () => {
  let fixture: ComponentFixture<LanguageToggle>;
  let i18n: I18nService;

  beforeEach(async () => {
    // Start in English (nothing saved), render the toggle, and let I18nService's effect run.
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [LanguageToggle] }).compileComponents();

    fixture = TestBed.createComponent(LanguageToggle);
    i18n = TestBed.inject(I18nService);
    TestBed.flushEffects();
    fixture.detectChanges();
  });

  afterEach(() => {
    // Leave no saved locale for later tests.
    localStorage.clear();
  });

  it('should create', () => {
    // Assert: the component builds.
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('shows the English flag and the "switch to Japanese" label while the site is in English', () => {
    // Arrange: the rendered button and flag.
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');

    // Assert: English flag, the English aria-label, and "EN" first in the label.
    expect(button.getAttribute('aria-label')).toBe('Toggle language');
    expect(img.getAttribute('ng-src') ?? img.src).toContain('flag-en.svg');
    expect(fixture.nativeElement.textContent).toContain('EN/日本語');
  });

  it("labels itself in the site's current language, not always in English", () => {
    // Act: switch the site to Japanese.
    i18n.setLocale('ja');
    fixture.detectChanges();

    // Assert: the aria-label is now in Japanese.
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button.getAttribute('aria-label')).toBe('言語を切り替える');
  });

  it('clicking the button switches the site to Japanese, and shows the Japanese flag and label', () => {
    // Arrange: the rendered button.
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');

    // Act: click it.
    button.click();
    fixture.detectChanges();

    // Assert: Japanese locale, Japanese flag, "日本語" first.
    expect(i18n.locale()).toBe('ja');
    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');
    expect(img.getAttribute('ng-src') ?? img.src).toContain('flag-ja.svg');
    expect(fixture.nativeElement.textContent).toContain('日本語/EN');
  });

  it('clicking it again switches back to English', () => {
    // Arrange: the rendered button.
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');

    // Act: click it twice.
    button.click();
    fixture.detectChanges();
    button.click();
    fixture.detectChanges();

    // Assert: back to English.
    expect(i18n.locale()).toBe('en');
    expect(fixture.nativeElement.textContent).toContain('EN/日本語');
  });
});
