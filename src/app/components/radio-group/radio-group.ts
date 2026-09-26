import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Field, FormField } from '@angular/forms/signals';
import { RequiredMarker } from '../required-marker/required-marker';
import { FieldErrorList } from '../field-error-list/field-error-list';

/**
 * Choice's pill-radio-group presentation -- see CONTEXT.md's "Choice" entry and
 * docs/refactor/13-phase-5-plan.md. A set of mutually-exclusive options, each rendered as a button-styled
 * radio button (`peer-checked` visual treatment). Renders its own label/error wrapper (error shown below the
 * whole group, not per-option) rather than reusing `FormFieldGroup`'s wrapper -- its own shape, same reasoning
 * as `CheckboxField`. Shares `RequiredMarker`/`FieldErrorList` with both of them, passing `field` directly
 * rather than a locally pre-computed `state` -- see `RequiredMarker`'s own doc comment for why.
 *
 * `[labelExtra]` is an optional projected slot after the label/required-marker, for commission's own
 * jump-to-detail "?" buttons -- not part of Choice's own concept, but real content some callers need next to
 * the label; keeping `RadioGroup` itself commission-agnostic rather than baking that button in.
 */
@Component({
  selector: 'app-radio-group',
  imports: [FormField, RequiredMarker, FieldErrorList],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <p class="inline-flex items-center gap-1 font-semibold">
        {{ label() }}
        <app-required-marker [field]="field()" />
        <ng-content select="[labelExtra]" />
      </p>
      <div class="mt-2 flex flex-wrap gap-3">
        @for (option of options(); track option.value) {
          <label class="block min-w-40 cursor-pointer">
            <input type="radio" [formField]="field()" [value]="option.value" class="peer sr-only" />
            <span
              class="block rounded-xl border border-border bg-section-light px-4 py-3 text-center text-sm font-semibold text-on-middle-heading transition-colors peer-checked:border-brand-strong peer-checked:bg-brand peer-checked:text-on-light-heading"
            >
              {{ option.label }}
            </span>
          </label>
        }
      </div>
    </div>
    <app-field-error-list [field]="field()" />
  `,
})
export class RadioGroup {
  readonly label = input.required<string>();
  readonly field = input.required<Field<string>>();
  readonly options = input.required<readonly { value: string; label: string }[]>();
}
