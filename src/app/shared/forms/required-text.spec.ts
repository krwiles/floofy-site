import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form } from '@angular/forms/signals';
import { requiredText } from './required-text';

describe('requiredText', () => {
  /** A one-field form whose `name` uses `requiredText`, starting with the given value. */
  function nameField(value: string) {
    // Signal Forms' form() must be created inside an injection context.
    const model = signal({ name: value });
    const nameForm = TestBed.runInInjectionContext(() =>
      form(model, (path) => requiredText(path.name, { message: 'Name is required.' })),
    );
    // Calling a field returns its live state (errors, required, ...).
    return nameForm.name();
  }

  it.each([
    ['empty', ''],
    ['only spaces', '   '],
    ['only a newline and a tab', '\n\t'],
  ])('reports the message when the value is %s', (_label, value) => {
    // Act and assert: exactly one error, with the field's own message.
    expect(
      nameField(value)
        .errors()
        .map((error) => error.message),
    ).toEqual(['Name is required.']);
  });

  it('accepts real text, even with spaces around it', () => {
    // Act and assert: no errors.
    expect(nameField(' Robin ').errors()).toEqual([]);
  });

  it('marks the field as required, so its label shows the required marker', () => {
    // Act and assert: required metadata is set.
    expect(nameField('').required()).toBe(true);
  });
});
