import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { form, FormField, maxLength, required } from '@angular/forms/signals';
import { FormFieldGroup } from './form-field-group';

// Host with a required, 5-character-max field wrapped in app-form-field.
@Component({
  selector: 'app-form-field-test-host',
  imports: [FormFieldGroup, FormField],
  template: `
    <app-form-field label="Name" [field]="testForm.name">
      <input [formField]="testForm.name" type="text" />
    </app-form-field>
  `,
})
class FormFieldTestHost {
  private readonly model = signal({ name: '' });
  testForm = form(this.model, (schemaPath) => {
    required(schemaPath.name, { message: 'Name is required.' });
    maxLength(schemaPath.name, 5, { message: 'Name cannot exceed 5 characters.' });
  });
}

describe('FormFieldGroup', () => {
  let fixture: ComponentFixture<FormFieldTestHost>;

  function create(): void {
    // Render the host.
    fixture = TestBed.createComponent(FormFieldTestHost);
    fixture.detectChanges();
  }

  function labelText(): string {
    // The label line's text, whitespace collapsed.
    return fixture.nativeElement.querySelector('label p')?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  }

  function errorEls(): NodeListOf<HTMLElement> {
    // The rendered error messages inside the label.
    return fixture.nativeElement.querySelectorAll('label .text-error span');
  }

  beforeEach(async () => {
    // Compile the host once per test.
    await TestBed.configureTestingModule({ imports: [FormFieldTestHost] }).compileComponents();
  });

  it('renders the label text', () => {
    // Act and assert: the label text renders.
    create();
    expect(labelText()).toContain('Name');
  });

  it('projects the control inside its own label', () => {
    // Act: render.
    create();
    // Assert: the input sits inside the label (so clicking the label focuses it).
    const input = fixture.nativeElement.querySelector('label input');
    expect(input).toBeTruthy();
  });

  it('shows the required asterisk when the field is required', () => {
    // Act: render.
    create();
    // Assert: the required asterisk shows.
    const asterisk = fixture.nativeElement.querySelector('label [aria-hidden="true"]');
    expect(asterisk?.textContent).toBe('*');
  });

  it('shows no errors before the field is touched, even if invalid', () => {
    // Act and assert: no errors before the visitor has touched it.
    create();
    expect(errorEls().length).toBe(0);
  });

  it('shows the field errors once invalid and touched', () => {
    // Arrange: render and touch the empty field.
    create();
    fixture.componentInstance.testForm.name().markAsTouched();
    fixture.detectChanges();

    // Assert: the required error shows.
    const messages = Array.from(errorEls()).map((el) => el.textContent);
    expect(messages).toContain('Name is required.');
  });

  it('shows every active error, not just the first', () => {
    // Arrange: render, enter a too-long value, and touch the field.
    create();
    fixture.componentInstance.testForm.name().value.set('waytoolong');
    fixture.componentInstance.testForm.name().markAsTouched();
    fixture.detectChanges();

    // Assert: only the active (length) error shows.
    const messages = Array.from(errorEls()).map((el) => el.textContent);
    expect(messages).toContain('Name cannot exceed 5 characters.');
    expect(messages).not.toContain('Name is required.');
  });
});
