import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { form, FormField, maxLength, required } from '@angular/forms/signals';
import { FormFieldGroup } from './form-field';

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
    fixture = TestBed.createComponent(FormFieldTestHost);
    fixture.detectChanges();
  }

  function labelText(): string {
    return fixture.nativeElement.querySelector('label p')?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  }

  function errorEls(): NodeListOf<HTMLElement> {
    return fixture.nativeElement.querySelectorAll('label .text-error span');
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FormFieldTestHost] }).compileComponents();
  });

  it('renders the label text', () => {
    create();
    expect(labelText()).toContain('Name');
  });

  it('projects the control inside its own label', () => {
    create();
    const input = fixture.nativeElement.querySelector('label input');
    expect(input).toBeTruthy();
  });

  it('shows the required asterisk when the field is required', () => {
    create();
    const asterisk = fixture.nativeElement.querySelector('label [aria-hidden="true"]');
    expect(asterisk?.textContent).toBe('*');
  });

  it('shows no errors before the field is touched, even if invalid', () => {
    create();
    expect(errorEls().length).toBe(0);
  });

  it('shows the field errors once invalid and touched', () => {
    create();
    fixture.componentInstance.testForm.name().markAsTouched();
    fixture.detectChanges();

    const messages = Array.from(errorEls()).map((el) => el.textContent);
    expect(messages).toContain('Name is required.');
  });

  it('shows every active error, not just the first', () => {
    create();
    fixture.componentInstance.testForm.name().value.set('waytoolong');
    fixture.componentInstance.testForm.name().markAsTouched();
    fixture.detectChanges();

    const messages = Array.from(errorEls()).map((el) => el.textContent);
    expect(messages).toContain('Name cannot exceed 5 characters.');
    expect(messages).not.toContain('Name is required.');
  });
});
