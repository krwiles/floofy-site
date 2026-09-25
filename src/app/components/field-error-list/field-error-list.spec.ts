import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { form, maxLength, required } from '@angular/forms/signals';
import { FieldErrorList } from './field-error-list';

@Component({
  selector: 'app-field-error-list-test-host',
  imports: [FieldErrorList],
  template: `
    <app-field-error-list [state]="testForm.name()" />
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
    return Array.from(fixture.nativeElement.querySelectorAll('.text-error span')).map(
      (el) => (el as HTMLElement).textContent ?? '',
    );
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FieldErrorListTestHost] }).compileComponents();
    fixture = TestBed.createComponent(FieldErrorListTestHost);
    fixture.detectChanges();
  });

  it('shows nothing before the field is touched, even if invalid', () => {
    expect(errorTexts()).toEqual([]);
  });

  it('shows the active errors once invalid and touched', () => {
    fixture.componentInstance.testForm.name().markAsTouched();
    fixture.detectChanges();

    expect(errorTexts()).toEqual(['Name is required.']);
  });

  it('shows every active error, not just the first', () => {
    fixture.componentInstance.testForm.name().value.set('waytoolong');
    fixture.componentInstance.testForm.name().markAsTouched();
    fixture.detectChanges();

    expect(errorTexts()).toEqual(['Name cannot exceed 5 characters.']);
  });

  it('shows nothing once the field becomes valid', () => {
    fixture.componentInstance.testForm.name().value.set('ok');
    fixture.componentInstance.testForm.name().markAsTouched();
    fixture.detectChanges();

    expect(errorTexts()).toEqual([]);
  });
});
