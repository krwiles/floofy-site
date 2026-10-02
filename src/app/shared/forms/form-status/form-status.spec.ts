import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormStatus } from './form-status';
import { FormSubmissionStatus } from '../../../models/form-submission-status';

describe('FormStatus', () => {
  let fixture: ComponentFixture<FormStatus>;
  let component: FormStatus;

  function create(status: FormSubmissionStatus): void {
    // Render the component with the given status.
    fixture = TestBed.createComponent(FormStatus);
    fixture.componentRef.setInput('status', status);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function textEl(): HTMLElement {
    // The message paragraph.
    return fixture.nativeElement.querySelector('p');
  }

  beforeEach(async () => {
    // Compile the component once per test.
    await TestBed.configureTestingModule({ imports: [FormStatus] }).compileComponents();
  });

  it('renders the message text', () => {
    // Act and assert: an idle status renders an empty message.
    create({ kind: 'idle', message: '' });
    expect(textEl().textContent?.trim()).toBe('');
  });

  it('renders no color class while idle', () => {
    // Act: render idle.
    create({ kind: 'idle', message: '' });
    // Assert: no color class.
    expect(textEl().classList.contains('text-success')).toBe(false);
    expect(textEl().classList.contains('text-error')).toBe(false);
  });

  it('renders no color class while pending, but shows the pending message', () => {
    // Act: render pending.
    create({ kind: 'pending', message: 'Submitting...' });
    // Assert: the message shows, uncolored.
    expect(textEl().textContent?.trim()).toBe('Submitting...');
    expect(textEl().classList.contains('text-success')).toBe(false);
    expect(textEl().classList.contains('text-error')).toBe(false);
  });

  it('renders the success color and message on success', () => {
    // Act: render success.
    create({ kind: 'success', message: 'Thanks!' });
    // Assert: the message shows in the success color.
    expect(textEl().textContent?.trim()).toBe('Thanks!');
    expect(textEl().classList.contains('text-success')).toBe(true);
    expect(textEl().classList.contains('text-error')).toBe(false);
  });

  it('renders the error color and message on error', () => {
    // Act: render error.
    create({ kind: 'error', message: 'Something went wrong.' });
    // Assert: the message shows in the error color.
    expect(textEl().textContent?.trim()).toBe('Something went wrong.');
    expect(textEl().classList.contains('text-error')).toBe(true);
    expect(textEl().classList.contains('text-success')).toBe(false);
  });
});
