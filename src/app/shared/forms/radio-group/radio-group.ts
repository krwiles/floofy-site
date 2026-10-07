import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Field, FormField } from '@angular/forms/signals';
import { RequiredMarker } from '../required-marker/required-marker';
import { FieldErrorList } from '../field-error-list/field-error-list';
import { createFieldIds } from '../field-ids';
import { showsErrors } from '../shows-errors';

/**
 * Choice's pill-style radio group: mutually exclusive options shown as buttons, with one error list for the whole
 * group -- see CONTEXT.md's "Choice" entry and docs/refactor/13-phase-5-plan.md. `[labelExtra]` projects optional
 * content after the label, e.g. commission's "?" jump buttons.
 */
@Component({
  selector: 'app-radio-group',
  imports: [FormField, RequiredMarker, FieldErrorList],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- A radiogroup fieldset: its legend names the radios, and it carries the group's invalid state and error link -->
    <fieldset
      role="radiogroup"
      class="min-w-0"
      [attr.aria-labelledby]="ids.controlId"
      [attr.aria-invalid]="showsErrors() ? 'true' : null"
      [attr.aria-describedby]="showsErrors() ? ids.errorId : null"
    >
      <legend class="inline-flex items-center gap-1 font-semibold" [id]="ids.controlId">
        {{ label() }}
        <app-required-marker [field]="field()" />
        <ng-content select="[labelExtra]" />
      </legend>
      <div class="mt-2 flex flex-wrap gap-3">
        @for (option of options(); track option.value) {
          <label class="block min-w-40 cursor-pointer">
            <input type="radio" [formField]="field()" [value]="option.value" class="peer sr-only" />
            <span
              class="block rounded-xl border border-border bg-section-light px-4 py-3 text-center text-sm font-semibold text-on-middle-heading transition-colors peer-checked:border-brand-strong peer-checked:bg-brand peer-checked:text-on-light-heading peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-strong"
            >
              {{ option.label }}
            </span>
          </label>
        }
      </div>
    </fieldset>
    <app-field-error-list [field]="field()" [id]="ids.errorId" />
  `,
})
export class RadioGroup {
  readonly label = input.required<string>();
  readonly field = input.required<Field<string>>();
  readonly options = input.required<readonly { value: string; label: string }[]>();

  // This group's ids: its legend's (which names the group) and its error list's. Made here, not provided like
  // FormFieldGroup's, because the group owns its radios instead of projecting a control.
  protected readonly ids = createFieldIds();

  // Mark the group invalid only once it's been touched, the same rule as the visible error.
  protected readonly showsErrors = computed(() => showsErrors(this.field()()));
}
