import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { form, FormField, required } from '@angular/forms/signals';
import { Control } from './control';

@Component({
  selector: 'app-control-test-host',
  imports: [FormField, Control],
  template: `
    <input appControl [tone]="tone" [formField]="testForm.name" type="text" />
  `,
})
class ControlTestHost {
  tone: 'light' | 'middle' | 'dark' = 'middle';
  private readonly model = signal({ name: '' });
  testForm = form(this.model, (schemaPath) => {
    required(schemaPath.name, { message: 'Name is required.' });
  });
}

describe('Control', () => {
  let fixture: ComponentFixture<ControlTestHost>;

  function create(overrides: Partial<ControlTestHost> = {}): void {
    fixture = TestBed.createComponent(ControlTestHost);
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
  }

  function inputEl(): HTMLInputElement {
    return fixture.nativeElement.querySelector('input');
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ControlTestHost] }).compileComponents();
  });

  it('applies the shared base classes', () => {
    create();
    const classList = inputEl().classList;
    expect(classList.contains('rounded-xl')).toBe(true);
    expect(classList.contains('bg-section-light')).toBe(true);
    expect(classList.contains('focus-visible:outline-2')).toBe(true);
  });

  it('defaults to the middle-tone placeholder color', () => {
    create();
    expect(inputEl().classList.contains('placeholder:text-on-middle-body-subtle')).toBe(true);
  });

  it('uses the given tone for the placeholder color', () => {
    create({ tone: 'dark' });
    expect(inputEl().classList.contains('placeholder:text-on-dark-body-subtle')).toBe(true);
  });

  it('uses the light-tone placeholder color when given light', () => {
    // Regression coverage for a real bug /code-review caught: a template-literal-built class name
    // (`placeholder:text-on-${tone}-body-subtle`) only gets its CSS generated for whichever tone happens to
    // appear as a literal string elsewhere in the codebase -- 'light' didn't, so it silently built with no
    // rule at all. Fixed via a lookup table (control.ts's PLACEHOLDER_CLASS); this test exercises the branch
    // that was previously unverified.
    create({ tone: 'light' });
    expect(inputEl().classList.contains('placeholder:text-on-light-body-subtle')).toBe(true);
  });

  it('uses the neutral border while untouched, even if invalid', () => {
    create();
    expect(inputEl().classList.contains('border-border')).toBe(true);
    expect(inputEl().classList.contains('border-error')).toBe(false);
  });

  it('switches to the error border once invalid and touched', () => {
    create();
    fixture.componentInstance.testForm.name().markAsTouched();
    fixture.detectChanges();

    expect(inputEl().classList.contains('border-error')).toBe(true);
    expect(inputEl().classList.contains('border-border')).toBe(false);
  });

  it('uses the neutral border once valid and touched', () => {
    create();
    fixture.componentInstance.testForm.name().value.set('Tangerine');
    fixture.componentInstance.testForm.name().markAsTouched();
    fixture.detectChanges();

    expect(inputEl().classList.contains('border-border')).toBe(true);
    expect(inputEl().classList.contains('border-error')).toBe(false);
  });
});
