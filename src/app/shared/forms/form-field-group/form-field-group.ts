import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Field } from '@angular/forms/signals';
import { RequiredMarker } from '../required-marker/required-marker';
import { FieldErrorList } from '../field-error-list/field-error-list';

/**
 * A field's label, required marker and error list, with the control itself projected in, so it works for any input,
 * textarea or date picker -- see CONTEXT.md's "Form Field" entry and docs/refactor/13-phase-5-plan.md. Named
 * `FormFieldGroup` because Signal Forms already exports a `FormField` directive.
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
