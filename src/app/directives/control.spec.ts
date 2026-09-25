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
