import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { form, FormField, maxLength, required } from '@angular/forms/signals';
import { FormFieldGroup } from './form-field-group';
import { Control } from '../../directives/control';
import { expectNoAxeViolations } from '../../../../testing/expect-no-axe-violations';

// Host with a required, 5-character-max field wrapped in app-form-field, its input styled by appControl.
@Component({
  selector: 'app-form-field-test-host',
  imports: [FormFieldGroup, FormField, Control],
  template: `
    <app-form-field label="Name" [field]="testForm.name">
      <input appControl [formField]="testForm.name" type="text" />
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

  function touch(value = ''): void {
    // Give the field a value and touch it, as if the visitor typed and moved on.
    fixture.componentInstance.testForm.name().value.set(value);
    fixture.componentInstance.testForm.name().markAsTouched();
    fixture.detectChanges();
  }

  /** The <label>, the <input> and the error list's wrapper. */
  function parts() {
    const el: HTMLElement = fixture.nativeElement;
    return {
      label: el.querySelector('label') as HTMLLabelElement,
      input: el.querySelector('input') as HTMLInputElement,
      errors: el.querySelector('app-field-error-list > div') as HTMLElement,
    };
  }

  /** The rendered error messages. */
  function messages(): string[] {
    return Array.from(parts().errors.querySelectorAll('span')).map((span) => span.textContent ?? '');
  }

  beforeEach(async () => {
    // Compile the host once per test.
    await TestBed.configureTestingModule({ imports: [FormFieldTestHost] }).compileComponents();
  });

  it('labels the input: the label points at it by id', () => {
    // Act: render.
    create();

    // Assert: the label's text names the field, and its `for` matches the input's id.
    const { label, input } = parts();
    expect(label.textContent?.trim()).toBe('Name');
    expect(input.id).toBeTruthy();
    expect(label.htmlFor).toBe(input.id);
  });

  it('keeps the error text out of the label, so it never becomes part of the field’s name', () => {
    // Act: render and show an error.
    create();
    touch();

    // Assert: the error shows, but not inside the label.
    expect(messages()).toContain('Name is required.');
    expect(parts().label.textContent).not.toContain('Name is required.');
  });

  it('shows the required asterisk when the field is required', () => {
    // Act: render.
    create();

    // Assert: the required asterisk shows, hidden from screen readers.
    const asterisk = fixture.nativeElement.querySelector('[aria-hidden="true"]');
    expect(asterisk?.textContent).toBe('*');
  });

  it('marks nothing invalid before the field is touched, even if it is', () => {
    // Act: render the empty required field.
    create();

    // Assert: no visible errors, and no invalid state announced yet.
    const { input } = parts();
    expect(messages()).toEqual([]);
    expect(input.hasAttribute('aria-invalid')).toBe(false);
    expect(input.hasAttribute('aria-describedby')).toBe(false);
  });

  it('once touched and invalid, marks the input invalid and links it to its errors', () => {
    // Act: render and touch the empty field.
    create();
    touch();

    // Assert: the input is announced as invalid, described by the error list.
    const { input, errors } = parts();
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe(errors.id);
    expect(errors.id).toBeTruthy();
  });

  it('shows every active error, not just the first', () => {
    // Act: enter a too-long value and touch the field.
    create();
    touch('waytoolong');

    // Assert: only the active (length) error shows.
    expect(messages()).toContain('Name cannot exceed 5 characters.');
    expect(messages()).not.toContain('Name is required.');
  });

  it('gives each field its own ids', async () => {
    // Act: render two fields.
    create();
    const first = parts().input.id;
    create();

    // Assert: the second field's ids differ from the first's.
    expect(parts().input.id).not.toBe(first);
  });

  it('has no accessibility violations, valid or showing errors', async () => {
    // Act and assert: clean before and after an error appears.
    create();
    await expectNoAxeViolations(fixture.nativeElement);
    touch();
    await expectNoAxeViolations(fixture.nativeElement);
  });
});
