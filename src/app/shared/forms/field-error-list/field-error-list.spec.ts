import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { form, maxLength, required } from '@angular/forms/signals';
import { FieldErrorList } from './field-error-list';

// Host with a field that's required and capped at 5 characters.
@Component({
  selector: 'app-field-error-list-test-host',
  imports: [FieldErrorList],
  template: `
    <app-field-error-list [field]="testForm.name" />
  `,
})
class FieldErrorListTestHost {
  private readonly model = signal({ name: '' });
  testForm = form(this.model, (schemaPath) => {
    required(schemaPath.name, { message: 'Name is required.' });
    maxLength(schemaPath.name, 5, { message: 'Name cannot exceed 5 characters.' });
  });
}

describe('FieldErrorList', () => {
  let fixture: ComponentFixture<FieldErrorListTestHost>;

  function errorTexts(): string[] {
    // The rendered error messages' text.
    return Array.from(fixture.nativeElement.querySelectorAll('.text-error span')).map(
      (el) => (el as HTMLElement).textContent ?? '',
    );
  }

  beforeEach(async () => {
    // Render the host once per test, with the field empty (so invalid) and untouched.
    await TestBed.configureTestingModule({ imports: [FieldErrorListTestHost] }).compileComponents();
    fixture = TestBed.createComponent(FieldErrorListTestHost);
    fixture.detectChanges();
  });

  it('shows nothing before the field is touched, even if invalid', () => {
    // Assert: nothing shows while untouched.
    expect(errorTexts()).toEqual([]);
  });

  it('shows the active errors once invalid and touched', () => {
    // Act: touch the empty field.
    fixture.componentInstance.testForm.name().markAsTouched();
    fixture.detectChanges();

    // Assert: the required error shows.
    expect(errorTexts()).toEqual(['Name is required.']);
  });

  it('shows every active error, not just the first', () => {
    // Act: enter a too-long value and touch the field.
    fixture.componentInstance.testForm.name().value.set('waytoolong');
    fixture.componentInstance.testForm.name().markAsTouched();
    fixture.detectChanges();

    // Assert: the length error shows.
    expect(errorTexts()).toEqual(['Name cannot exceed 5 characters.']);
  });

  it('shows nothing once the field becomes valid', () => {
    // Act: enter a valid value and touch the field.
    fixture.componentInstance.testForm.name().value.set('ok');
    fixture.componentInstance.testForm.name().markAsTouched();
    fixture.detectChanges();

    // Assert: nothing shows.
    expect(errorTexts()).toEqual([]);
  });
});
