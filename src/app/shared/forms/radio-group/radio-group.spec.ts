import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { form, required } from '@angular/forms/signals';
import { RadioGroup } from './radio-group';

@Component({
  selector: 'app-radio-group-test-host',
  imports: [RadioGroup],
  template: `
    <app-radio-group label="Pick one" [field]="testForm.choice" [options]="options">
      <button labelExtra type="button">?</button>
    </app-radio-group>
  `,
})
class RadioGroupTestHost {
  options = [
    { value: 'a', label: 'Option A' },
    { value: 'b', label: 'Option B' },
    { value: 'c', label: 'Option C' },
  ];
  private readonly model = signal({ choice: 'a' });
  testForm = form(this.model, (schemaPath) => {
    required(schemaPath.choice, { message: 'Pick one is required.' });
  });
}

describe('RadioGroup', () => {
  let fixture: ComponentFixture<RadioGroupTestHost>;

  function create(): void {
    fixture = TestBed.createComponent(RadioGroupTestHost);
    fixture.detectChanges();
  }

  function radioInputs(): HTMLInputElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('input[type="radio"]'));
  }

  function pillLabels(): string[] {
    return Array.from(fixture.nativeElement.querySelectorAll('input[type="radio"] + span')).map(
      (el) => (el as HTMLElement).textContent?.trim() ?? '',
    );
  }

  function errorEls(): NodeListOf<HTMLElement> {
    return fixture.nativeElement.querySelectorAll('.text-error span');
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [RadioGroupTestHost] }).compileComponents();
  });

  it('renders one radio input per option', () => {
    create();
    expect(radioInputs().length).toBe(3);
  });

  it('renders each option label', () => {
    create();
    expect(pillLabels()).toEqual(['Option A', 'Option B', 'Option C']);
  });

  it('reflects the current field value as the checked option', () => {
    create();
    const checked = radioInputs().find((el) => el.checked);
    expect(checked?.value).toBe('a');
  });

  it('updates the field value when a different option is clicked', () => {
    create();
    const optionB = radioInputs().find((el) => el.value === 'b')!;
    optionB.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.testForm.choice().value()).toBe('b');
  });

  it('shows the label', () => {
    create();
    expect(fixture.nativeElement.textContent).toContain('Pick one');
  });

  it('shows the required asterisk when the field is required', () => {
    create();
    const asterisk = fixture.nativeElement.querySelector('p [aria-hidden="true"]');
    expect(asterisk?.textContent).toBe('*');
  });

  it('projects extra label content (e.g. a jump-to-detail button)', () => {
    create();
    const button = fixture.nativeElement.querySelector('button');
    expect(button?.textContent?.trim()).toBe('?');
  });

  it('shows no errors before touched, even if invalid', () => {
    create();
    expect(errorEls().length).toBe(0);
  });

  it('shows the error once invalid and touched', () => {
    create();
    fixture.componentInstance.testForm.choice().markAsTouched();
    fixture.componentInstance.testForm.choice().value.set('');
    fixture.detectChanges();

    const messages = Array.from(errorEls()).map((el) => el.textContent);
    expect(messages).toContain('Pick one is required.');
  });
});
