import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { form, required } from '@angular/forms/signals';
import { RadioGroup } from './radio-group';
import { expectNoAxeViolations } from '../../../../testing/expect-no-axe-violations';

// Host with three options (starting on 'a'), a required field, and a labelExtra button.
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
    // Render the host.
    fixture = TestBed.createComponent(RadioGroupTestHost);
    fixture.detectChanges();
  }

  function radioInputs(): HTMLInputElement[] {
    // Every radio input.
    return Array.from(fixture.nativeElement.querySelectorAll('input[type="radio"]'));
  }

  function pillLabels(): string[] {
    // The visible pill text for each option.
    return Array.from(fixture.nativeElement.querySelectorAll('input[type="radio"] + span')).map(
      (el) => (el as HTMLElement).textContent?.trim() ?? '',
    );
  }

  function errorEls(): NodeListOf<HTMLElement> {
    // The rendered error messages.
    return fixture.nativeElement.querySelectorAll('.text-error span');
  }

  beforeEach(async () => {
    // Compile the host once per test.
    await TestBed.configureTestingModule({ imports: [RadioGroupTestHost] }).compileComponents();
  });

  it('renders one radio input per option', () => {
    // Act and assert: one input per option.
    create();
    expect(radioInputs().length).toBe(3);
  });

  it('renders each option label', () => {
    // Act and assert: each option's label, in order.
    create();
    expect(pillLabels()).toEqual(['Option A', 'Option B', 'Option C']);
  });

  it('reflects the current field value as the checked option', () => {
    // Act: render.
    create();
    // Assert: the field's initial value is the checked option.
    const checked = radioInputs().find((el) => el.checked);
    expect(checked?.value).toBe('a');
  });

  it('updates the field value when a different option is clicked', () => {
    // Arrange: render.
    create();
    // Act: click option B.
    const optionB = radioInputs().find((el) => el.value === 'b')!;
    optionB.click();
    fixture.detectChanges();

    // Assert: the field now holds 'b'.
    expect(fixture.componentInstance.testForm.choice().value()).toBe('b');
  });

  it('shows the label', () => {
    // Act and assert: the group's label renders.
    create();
    expect(fixture.nativeElement.textContent).toContain('Pick one');
  });

  it('shows the required asterisk when the field is required', () => {
    // Act: render.
    create();
    // Assert: the required asterisk shows.
    const asterisk = fixture.nativeElement.querySelector('legend [aria-hidden="true"]');
    expect(asterisk?.textContent).toBe('*');
  });

  it('projects extra label content (e.g. a jump-to-detail button)', () => {
    // Act: render.
    create();
    // Assert: the labelExtra button is projected.
    const button = fixture.nativeElement.querySelector('button');
    expect(button?.textContent?.trim()).toBe('?');
  });

  it('shows no errors before touched, even if invalid', () => {
    // Act and assert: no errors before the visitor has touched it.
    create();
    expect(errorEls().length).toBe(0);
  });

  it('shows the error once invalid and touched', () => {
    // Arrange: render, touch, and clear the value.
    create();
    fixture.componentInstance.testForm.choice().markAsTouched();
    fixture.componentInstance.testForm.choice().value.set('');
    fixture.detectChanges();

    // Assert: the required error shows.
    const messages = Array.from(errorEls()).map((el) => el.textContent);
    expect(messages).toContain('Pick one is required.');
  });

  it('groups the radios in a fieldset named by its legend', () => {
    // Act: render.
    create();

    // Assert: every radio sits in the fieldset, and the legend carries the group's label.
    const fieldset = fixture.nativeElement.querySelector('fieldset') as HTMLFieldSetElement;
    expect(fieldset.querySelectorAll('input[type="radio"]').length).toBe(3);
    expect(fieldset.querySelector('legend')?.textContent).toContain('Pick one');
  });

  it('shows a focus outline on the pill whose radio has keyboard focus', () => {
    // Act: render.
    create();

    // Assert: each pill styles itself from its (visually hidden) radio's keyboard focus.
    const pills: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('input[type="radio"] + span'));
    for (const pill of pills) {
      expect(pill.className).toContain('peer-focus-visible:outline-2');
    }
  });

  it('once touched and invalid, marks the group invalid and links it to its error', () => {
    // Act: clear the choice and touch the group.
    create();
    fixture.componentInstance.testForm.choice().value.set('');
    fixture.componentInstance.testForm.choice().markAsTouched();
    fixture.detectChanges();

    // Assert: the group is announced as invalid, described by the error list.
    const fieldset = fixture.nativeElement.querySelector('fieldset') as HTMLElement;
    const errors = fixture.nativeElement.querySelector('app-field-error-list > div') as HTMLElement;
    expect(fieldset.getAttribute('aria-invalid')).toBe('true');
    expect(fieldset.getAttribute('aria-describedby')).toBe(errors.id);
  });

  it('has no accessibility violations', async () => {
    // Act and assert: the rendered group passes axe.
    create();
    await expectNoAxeViolations(fixture.nativeElement);
  });
});
