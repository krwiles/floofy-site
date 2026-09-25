import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormStatus } from './form-status';
import { FormSubmissionStatus } from '../../models/form-submission-status';

describe('FormStatus', () => {
  let fixture: ComponentFixture<FormStatus>;
  let component: FormStatus;

  function create(status: FormSubmissionStatus): void {
    fixture = TestBed.createComponent(FormStatus);
    fixture.componentRef.setInput('status', status);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function textEl(): HTMLElement {
    return fixture.nativeElement.querySelector('p');
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FormStatus] }).compileComponents();
  });

  it('renders the message text', () => {
    create({ kind: 'idle', message: '' });
    expect(textEl().textContent?.trim()).toBe('');
  });

  it('renders no color class while idle', () => {
    create({ kind: 'idle', message: '' });
    expect(textEl().classList.contains('text-success')).toBe(false);
    expect(textEl().classList.contains('text-error')).toBe(false);
  });

  it('renders no color class while pending, but shows the pending message', () => {
    create({ kind: 'pending', message: 'Submitting...' });
    expect(textEl().textContent?.trim()).toBe('Submitting...');
    expect(textEl().classList.contains('text-success')).toBe(false);
    expect(textEl().classList.contains('text-error')).toBe(false);
  });

  it('renders the success color and message on success', () => {
    create({ kind: 'success', message: 'Thanks!' });
    expect(textEl().textContent?.trim()).toBe('Thanks!');
    expect(textEl().classList.contains('text-success')).toBe(true);
    expect(textEl().classList.contains('text-error')).toBe(false);
  });

  it('renders the error color and message on error', () => {
    create({ kind: 'error', message: 'Something went wrong.' });
    expect(textEl().textContent?.trim()).toBe('Something went wrong.');
    expect(textEl().classList.contains('text-error')).toBe(true);
    expect(textEl().classList.contains('text-success')).toBe(false);
  });
});
