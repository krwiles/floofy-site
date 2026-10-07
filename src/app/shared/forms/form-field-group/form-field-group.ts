import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Field } from '@angular/forms/signals';
import { RequiredMarker } from '../required-marker/required-marker';
import { FieldErrorList } from '../field-error-list/field-error-list';
import { createFieldIds, FIELD_IDS } from '../field-ids';

/**
 * A field's label, required marker and error list, with the control itself projected in, so it works for any input,
 * textarea or date picker -- see CONTEXT.md's "Form Field" entry and docs/refactor/13-phase-5-plan.md. Named
 * `FormFieldGroup` because Signal Forms already exports a `FormField` directive. The label names the projected control
 * (`for`/`id`), and the error list describes it (`aria-describedby`, set by `appControl`).
 */
@Component({
  selector: 'app-form-field',
  imports: [RequiredMarker, FieldErrorList],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Fresh ids per field, visible to the projected control (content children see a component's providers).
  providers: [{ provide: FIELD_IDS, useFactory: createFieldIds }],
  // The label holds only the field's name; the errors sit beside it on the same row but outside it.
  template: `
    <div class="block text-sm font-semibold">
      <p class="flex gap-2">
        <label [for]="ids.controlId">{{ label() }}</label>
        <app-required-marker [field]="field()" />
        <app-field-error-list [field]="field()" [id]="ids.errorId" />
      </p>
      <ng-content />
    </div>
  `,
})
export class FormFieldGroup {
  readonly label = input.required<string>();
  readonly field = input.required<Field<unknown>>();
  // This field's control and error-list ids, shared with the projected control.
  protected readonly ids = inject(FIELD_IDS);
}
