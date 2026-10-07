import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormStatus } from './form-status';
import { FormSubmissionStatus } from '../../../models/form-submission-status';
import { I18nService } from '../../../services/i18n.service';

describe('FormStatus', () => {
  let fixture: ComponentFixture<FormStatus>;

  // Render the component with the given status.
  function create(status: FormSubmissionStatus): void {
    fixture = TestBed.createComponent(FormStatus);
    fixture.componentRef.setInput('status', status);
    fixture.detectChanges();
  }

  // The message paragraph's text.
  function text(): string {
    return fixture.nativeElement.querySelector('p').textContent.trim();
  }

  // The message paragraph's classes.
  function classes(): DOMTokenList {
    return fixture.nativeElement.querySelector('p').classList;
  }

  beforeEach(async () => {
    // Real translations, starting in English (nothing saved).
    localStorage.clear();

    // Compile the component once per test.
    await TestBed.configureTestingModule({ imports: [FormStatus] }).compileComponents();
  });

  afterEach(() => {
    // Leave no saved locale for later tests.
    localStorage.clear();
  });

  it('is a status region, so screen readers announce each new message', () => {
    // Act: render idle.
    create({ kind: 'idle', key: '' });

    // Assert: a polite live region, present before any message arrives.
    expect(fixture.nativeElement.querySelector('p').getAttribute('role')).toBe('status');
  });

  it('renders nothing, uncolored, while idle', () => {
    // Act: render idle.
    create({ kind: 'idle', key: '' });

    // Assert: empty and uncolored.
    expect(text()).toBe('');
    expect(classes().contains('text-success')).toBe(false);
    expect(classes().contains('text-error')).toBe(false);
  });

  it('translates the pending message, uncolored', () => {
    // Act: render pending.
    create({ kind: 'pending', key: 'forms.review.pending' });

    // Assert: the English text, with no color class.
    expect(text()).toBe('Submitting your review...');
    expect(classes().contains('text-success')).toBe(false);
    expect(classes().contains('text-error')).toBe(false);
  });

  it('translates the success message in the success color', () => {
    // Act: render success.
    create({ kind: 'success', key: 'forms.review.ok' });

    // Assert: the English text, in green.
    expect(text()).toBe('Thank you for your review!');
    expect(classes().contains('text-success')).toBe(true);
  });

  it('fills the rate-limit numbers into the error message, in the error color', () => {
    // Act: render a rate-limit error with the server's rule.
    create({ kind: 'error', key: 'forms.commission.rate_limited', params: { limit: 2, window_hours: 24 } });

    // Assert: both numbers appear, in red.
    expect(text()).toContain('2');
    expect(text()).toContain('24');
    expect(text()).not.toContain('{');
    expect(classes().contains('text-error')).toBe(true);
  });

  it('switches language along with the site', () => {
    // Arrange: an English success message.
    create({ kind: 'success', key: 'forms.contact.ok' });
    const english = text();

    // Act: switch the site to Japanese.
    TestBed.inject(I18nService).setLocale('ja');
    fixture.detectChanges();

    // Assert: the same status now reads in Japanese.
    expect(text()).not.toBe(english);
    expect(text()).not.toBe('forms.contact.ok');
  });
});
