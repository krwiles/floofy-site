import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { form, required } from '@angular/forms/signals';
import { CheckboxField } from './checkbox-field';

@Component({
  selector: 'app-checkbox-field-test-host',
  imports: [CheckboxField],
  template: `
    <app-checkbox-field [field]="testForm.agreement">I agree to the terms.</app-checkbox-field>
  `,
})
class CheckboxFieldTestHost {
  private readonly model = signal({ agreement: false });
  testForm = form(this.model, (schemaPath) => {
    required(schemaPath.agreement, { message: 'You must agree.' });
  });
}

describe('CheckboxField', () => {
  let fixture: ComponentFixture<CheckboxFieldTestHost>;

  function create(): void {
    fixture = TestBed.createComponent(CheckboxFieldTestHost);
    fixture.detectChanges();
  }

  function checkboxEl(): HTMLInputElement {
    return fixture.nativeElement.querySelector('input[type="checkbox"]');
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
});
