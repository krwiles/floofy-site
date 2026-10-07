import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { form, required } from '@angular/forms/signals';
import { RequiredMarker } from './required-marker';

// Host whose field is required.
@Component({
  selector: 'app-required-marker-test-host',
  imports: [RequiredMarker],
  template: `
    <app-required-marker [field]="testForm.name" />
  `,
})
class RequiredFieldHost {
  private readonly model = signal({ name: '' });
  testForm = form(this.model, (schemaPath) => {
    required(schemaPath.name, { message: 'Name is required.' });
  });
}

// Host whose field has no validators.
@Component({
  selector: 'app-required-marker-optional-test-host',
  imports: [RequiredMarker],
  template: `
    <app-required-marker [field]="testForm.name" />
  `,
})
class OptionalFieldHost {
  private readonly model = signal({ name: '' });
  testForm = form(this.model);
}

describe('RequiredMarker', () => {
  function asteriskEl(fixture: ComponentFixture<unknown>): HTMLElement | null {
    // The asterisk, if rendered.
    return fixture.nativeElement.querySelector('[aria-hidden="true"]');
  }

  it('shows the asterisk when the field is required', async () => {
    // Arrange: render the required host.
    await TestBed.configureTestingModule({ imports: [RequiredFieldHost] }).compileComponents();
    const fixture = TestBed.createComponent(RequiredFieldHost);
    fixture.detectChanges();

    // Assert: the asterisk shows.
    expect(asteriskEl(fixture)?.textContent).toBe('*');
  });

  it('shows nothing when the field is not required', async () => {
    // Arrange: render the optional host.
    await TestBed.configureTestingModule({ imports: [OptionalFieldHost] }).compileComponents();
    const fixture = TestBed.createComponent(OptionalFieldHost);
    fixture.detectChanges();

    // Assert: no asterisk.
    expect(asteriskEl(fixture)).toBeNull();
  });
});
