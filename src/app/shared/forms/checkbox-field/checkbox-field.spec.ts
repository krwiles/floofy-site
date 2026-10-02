import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { form, required } from '@angular/forms/signals';
import { CheckboxField } from './checkbox-field';

// Host with a required checkbox field, optionally projecting a labelExtra button.
@Component({
  selector: 'app-checkbox-field-test-host',
  imports: [CheckboxField],
  template: `
    <app-checkbox-field [field]="testForm.agreement">
      I agree to the terms.
      @if (withLabelExtra) {
        <button labelExtra type="button">?</button>
      }
    </app-checkbox-field>
  `,
})
class CheckboxFieldTestHost {
  withLabelExtra = false;
  private readonly model = signal({ agreement: false });
  testForm = form(this.model, (schemaPath) => {
    required(schemaPath.agreement, { message: 'You must agree.' });
  });
}

describe('CheckboxField', () => {
  let fixture: ComponentFixture<CheckboxFieldTestHost>;

  function create(overrides: Partial<CheckboxFieldTestHost> = {}): void {
    // Render the host, applying per-test overrides before the first change detection.
    fixture = TestBed.createComponent(CheckboxFieldTestHost);
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
  }

  function checkboxEl(): HTMLInputElement {
    // The checkbox input.
    return fixture.nativeElement.querySelector('input[type="checkbox"]');
  }

  function rowEl(): HTMLElement {
    // The row holding the label and any labelExtra content.
    return fixture.nativeElement.querySelector('.flex.items-start');
  }

  function labelText(): string {
    // The label's text, whitespace collapsed.
    return fixture.nativeElement.querySelector('label span')?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  }

  function errorEls(): NodeListOf<HTMLElement> {
    // The rendered error messages.
    return fixture.nativeElement.querySelectorAll('.text-error span');
  }

  beforeEach(async () => {
    // Compile the host once per test.
    await TestBed.configureTestingModule({ imports: [CheckboxFieldTestHost] }).compileComponents();
  });

  it('renders a checkbox bound to the given field', () => {
    // Act: render.
    create();
    // Assert: a styled checkbox is there.
    expect(checkboxEl()).toBeTruthy();
    expect(checkboxEl().classList.contains('h-4')).toBe(true);
  });

  it('projects the label content', () => {
    // Act and assert: the projected text appears in the label.
    create();
    expect(labelText()).toContain('I agree to the terms.');
  });

  it('shows the required asterisk after the projected text when required', () => {
    // Act and assert: required fields get the asterisk.
    create();
    expect(labelText()).toContain('*');
  });

  it('shows no errors before touched, even if invalid', () => {
    // Act and assert: no errors before the visitor has touched it.
    create();
    expect(errorEls().length).toBe(0);
  });

  it('shows the error once invalid and touched', () => {
    // Arrange: render and touch the unchecked (invalid) box.
    create();
    fixture.componentInstance.testForm.agreement().markAsTouched();
    fixture.detectChanges();

    // Assert: its error shows.
    const messages = Array.from(errorEls()).map((el) => el.textContent);
    expect(messages).toContain('You must agree.');
  });

  it('checking the box clears the error once touched', () => {
    // Arrange: render, touch, and check the box.
    create();
    fixture.componentInstance.testForm.agreement().markAsTouched();
    fixture.componentInstance.testForm.agreement().value.set(true);
    fixture.detectChanges();

    // Assert: no error.
    expect(errorEls().length).toBe(0);
  });

  it('uses gap-2 row spacing', () => {
    // Act and assert: the row uses the standard gap.
    create();
    expect(rowEl().classList.contains('gap-2')).toBe(true);
  });

  it('projects labelExtra content as a sibling of the label row', () => {
    // Act: render with a labelExtra button.
    create({ withLabelExtra: true });
    // Assert: it's projected.
    const button = fixture.nativeElement.querySelector('button');
    expect(button?.textContent?.trim()).toBe('?');
  });

  it('renders no labelExtra content when none is projected', () => {
    // Act and assert: no labelExtra means no button.
    create();
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
  });
});
