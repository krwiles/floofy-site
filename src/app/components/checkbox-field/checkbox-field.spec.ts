import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { form, required } from '@angular/forms/signals';
import { CheckboxField } from './checkbox-field';

@Component({
  selector: 'app-checkbox-field-test-host',
  imports: [CheckboxField],
  template: `
    <app-checkbox-field [field]="testForm.agreement" [rowGapClass]="rowGapClass">
      I agree to the terms.
      @if (withLabelExtra) {
        <button labelExtra type="button">?</button>
      }
    </app-checkbox-field>
  `,
})
class CheckboxFieldTestHost {
  // Explicitly 'gap-2' (CheckboxField's own default) rather than leaving the binding unset -- an explicit
  // `undefined` binding would override the component's default input value with `undefined`, not fall back to
  // it, so tests for the default behavior bind the default's own value here on purpose.
  rowGapClass = 'gap-2';
  withLabelExtra = false;
  private readonly model = signal({ agreement: false });
  testForm = form(this.model, (schemaPath) => {
    required(schemaPath.agreement, { message: 'You must agree.' });
  });
}

describe('CheckboxField', () => {
  let fixture: ComponentFixture<CheckboxFieldTestHost>;

  function create(overrides: Partial<CheckboxFieldTestHost> = {}): void {
    fixture = TestBed.createComponent(CheckboxFieldTestHost);
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
  }

  function checkboxEl(): HTMLInputElement {
    return fixture.nativeElement.querySelector('input[type="checkbox"]');
  }

  function rowEl(): HTMLElement {
    return fixture.nativeElement.querySelector('.flex.items-start');
  }

  function labelText(): string {
    return fixture.nativeElement.querySelector('label span')?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  }

  function errorEls(): NodeListOf<HTMLElement> {
    return fixture.nativeElement.querySelectorAll('.text-error span');
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CheckboxFieldTestHost] }).compileComponents();
  });

  it('renders a checkbox bound to the given field', () => {
    create();
    expect(checkboxEl()).toBeTruthy();
    expect(checkboxEl().classList.contains('h-4')).toBe(true);
  });

  it('projects the label content', () => {
    create();
    expect(labelText()).toContain('I agree to the terms.');
  });

  it('shows the required asterisk after the projected text when required', () => {
    create();
    expect(labelText()).toContain('*');
  });

  it('shows no errors before touched, even if invalid', () => {
    create();
    expect(errorEls().length).toBe(0);
  });

  it('shows the error once invalid and touched', () => {
    create();
    fixture.componentInstance.testForm.agreement().markAsTouched();
    fixture.detectChanges();

    const messages = Array.from(errorEls()).map((el) => el.textContent);
    expect(messages).toContain('You must agree.');
  });

  it('checking the box clears the error once touched', () => {
    create();
    fixture.componentInstance.testForm.agreement().markAsTouched();
    fixture.componentInstance.testForm.agreement().value.set(true);
    fixture.detectChanges();

    expect(errorEls().length).toBe(0);
  });

  it('defaults the row spacing to gap-2', () => {
    create();
    expect(rowEl().classList.contains('gap-2')).toBe(true);
  });

  it("uses a caller-supplied row gap class instead, e.g. commission's own gap-1", () => {
    create({ rowGapClass: 'gap-1' });
    expect(rowEl().classList.contains('gap-1')).toBe(true);
    expect(rowEl().classList.contains('gap-2')).toBe(false);
  });

  it('projects labelExtra content as a sibling of the label row', () => {
    create({ withLabelExtra: true });
    const button = fixture.nativeElement.querySelector('button');
    expect(button?.textContent?.trim()).toBe('?');
  });

  it('renders no labelExtra content when none is projected', () => {
    create();
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
  });
});
