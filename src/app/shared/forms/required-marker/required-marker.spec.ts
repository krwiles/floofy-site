import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { form, required } from '@angular/forms/signals';
import { RequiredMarker } from './required-marker';

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
    return fixture.nativeElement.querySelector('[aria-hidden="true"]');
  }

  it('shows the asterisk when the field is required', async () => {
    await TestBed.configureTestingModule({ imports: [RequiredFieldHost] }).compileComponents();
    const fixture = TestBed.createComponent(RequiredFieldHost);
    fixture.detectChanges();

    expect(asteriskEl(fixture)?.textContent).toBe('*');
  });

  it('shows nothing when the field is not required', async () => {
    await TestBed.configureTestingModule({ imports: [OptionalFieldHost] }).compileComponents();
    const fixture = TestBed.createComponent(OptionalFieldHost);
    fixture.detectChanges();

    expect(asteriskEl(fixture)).toBeNull();
  });
});
