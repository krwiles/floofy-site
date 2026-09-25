import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Field } from '@angular/forms/signals';
import { RequiredMarker } from '../required-marker/required-marker';
import { FieldErrorList } from '../field-error-list/field-error-list';

/**
 * Owns a field's label, required-marker, and error list -- see CONTEXT.md's "Form Field" entry and
 * docs/refactor/13-phase-5-plan.md. Projects the actual control via <ng-content> rather than rendering it
 * itself, so it works unchanged whether the projected control is a text input, a textarea, or a date input.
 * The required-marker and error-list themselves are shared with `CheckboxField`/`RadioGroup` via
 * `RequiredMarker`/`FieldErrorList` -- extracted after `/code-review` flagged this markup as duplicated
 * verbatim between `FormFieldGroup` and `CheckboxField`. Both take `field` directly (not a pre-computed
 * `state`) -- a later `/code-review` pass flagged that every one of the three callers was independently
 * redoing the identical one-line `computed(() => this.field()())` adapter, so `FormFieldGroup` itself has no
 * need for its own `state` anymore either, now that it's not passing one down.
 *
 * Named `FormFieldGroup`, not `FormField` -- Angular's own Signal Forms already exports a class called
 * `FormField` (the `[formField]` directive), and every page importing both would collide on that identifier.
 */
@Component({
  selector: 'app-form-field',
  imports: [RequiredMarker, FieldErrorList],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="text-sm font-semibold">
      <p class="flex gap-2">
        {{ label() }}
        <app-required-marker [field]="field()" />
        <app-field-error-list [field]="field()" />
      </p>
      <ng-content />
    </label>
  `,
})
export class FormFieldGroup {
  readonly label = input.required<string>();
  readonly field = input.required<Field<unknown>>();
}
