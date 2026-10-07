import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Field, FormField } from '@angular/forms/signals';
import { RequiredMarker } from '../required-marker/required-marker';
import { FieldErrorList } from '../field-error-list/field-error-list';
import { createFieldIds } from '../field-ids';
import { showsErrors } from '../shows-errors';

/**
 * Choice's checkbox presentation: one boolean with its label beside it -- see CONTEXT.md's "Choice" entry and
 * docs/refactor/13-phase-5-plan.md. It's a different shape from `FormFieldGroup` (label beside, not above), so it
 * renders its own wrapper, sharing `RequiredMarker`/`FieldErrorList`. `[labelExtra]` projects optional content next
 * to the row, e.g. commission's jump-to-terms button.
 */
@Component({
  selector: 'app-checkbox-field',
  imports: [FormField, RequiredMarker, FieldErrorList],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-start gap-2">
      <label class="flex items-center space-x-3">
        <input
          type="checkbox"
          [formField]="field()"
          class="h-4 w-4"
          [attr.aria-invalid]="showsErrors() ? 'true' : null"
          [attr.aria-describedby]="showsErrors() ? ids.errorId : null"
        />
        <span class="text-sm leading-6">
          <ng-content />
          <app-required-marker [field]="field()" />
        </span>
      </label>
      <ng-content select="[labelExtra]" />
    </div>
    <app-field-error-list [field]="field()" [id]="ids.errorId" />
  `,
})
export class CheckboxField {
  readonly field = input.required<Field<boolean>>();

  // This field's error-list id, which the checkbox names in aria-describedby. Made here, not provided like
  // FormFieldGroup's, because the field owns its checkbox instead of projecting a control.
  protected readonly ids = createFieldIds();

  // Mark the checkbox invalid only once it's been touched, the same rule as the visible error.
  protected readonly showsErrors = computed(() => showsErrors(this.field()()));
}
