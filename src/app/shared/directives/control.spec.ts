import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { form, FormField, required } from '@angular/forms/signals';
import { Control } from './control';

// Host with a real Signal Forms field (required, so it starts invalid) wearing appControl.
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
    // Render the host, applying per-test overrides before the first change detection.
    fixture = TestBed.createComponent(ControlTestHost);
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
  }

  function inputEl(): HTMLInputElement {
    // The input under test.
    return fixture.nativeElement.querySelector('input');
  }

  beforeEach(async () => {
    // Compile the host once per test.
    await TestBed.configureTestingModule({ imports: [ControlTestHost] }).compileComponents();
  });

  it('applies the shared base classes', () => {
    // Act: render with defaults.
    create();
    const classList = inputEl().classList;
    // Assert: the shared base classes are present.
    expect(classList.contains('rounded-xl')).toBe(true);
    expect(classList.contains('bg-section-light')).toBe(true);
    expect(classList.contains('focus-visible:outline-2')).toBe(true);
  });

  it('defaults to the middle-tone placeholder color', () => {
    // Act and assert: the default tone's placeholder color.
    create();
    expect(inputEl().classList.contains('placeholder:text-on-middle-body-subtle')).toBe(true);
  });

  it('uses the given tone for the placeholder color', () => {
    // Act and assert: the given tone's placeholder color.
    create({ tone: 'dark' });
    expect(inputEl().classList.contains('placeholder:text-on-dark-body-subtle')).toBe(true);
  });

  it('uses the light-tone placeholder color when given light', () => {
    // Regression: 'light' once silently had no CSS because its class was built from a template literal.
    create({ tone: 'light' });
    expect(inputEl().classList.contains('placeholder:text-on-light-body-subtle')).toBe(true);
  });

  it('uses the neutral border while untouched, even if invalid', () => {
    // Act and assert: an untouched (if invalid) field keeps the neutral border.
    create();
    expect(inputEl().classList.contains('border-border')).toBe(true);
    expect(inputEl().classList.contains('border-error')).toBe(false);
  });

  it('switches to the error border once invalid and touched', () => {
    // Arrange: render, then touch the still-empty, so invalid, field.
    create();
    fixture.componentInstance.testForm.name().markAsTouched();
    fixture.detectChanges();

    // Assert: error border instead of neutral.
    expect(inputEl().classList.contains('border-error')).toBe(true);
    expect(inputEl().classList.contains('border-border')).toBe(false);
  });

  it('uses the neutral border once valid and touched', () => {
    // Arrange: fill in the field and touch it.
    create();
    fixture.componentInstance.testForm.name().value.set('Tangerine');
    fixture.componentInstance.testForm.name().markAsTouched();
    fixture.detectChanges();

    // Assert: back to the neutral border.
    expect(inputEl().classList.contains('border-border')).toBe(true);
    expect(inputEl().classList.contains('border-error')).toBe(false);
  });
});
