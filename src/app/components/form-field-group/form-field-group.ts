import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Field } from '@angular/forms/signals';

/**
 * Owns a field's label, required-marker, and error list -- see CONTEXT.md's "Form Field" entry and
 * docs/refactor/13-phase-5-plan.md. Projects the actual control via <ng-content> rather than rendering it
 * itself, so it works unchanged whether the projected control is a text input, a textarea, or a date input.
 *
 * Named `FormFieldGroup`, not `FormField` -- Angular's own Signal Forms already exports a class called
 * `FormField` (the `[formField]` directive), and every page importing both would collide on that identifier.
 */
@Component({
  selector: 'app-form-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="text-sm font-semibold">
      <p class="flex gap-2">
        {{ label() }}
        @if (state().required()) {
          <span class="text-error" aria-hidden="true">*</span>
        }
        @if (state().invalid() && state().touched()) {
          <div class="text-error">
            @for (error of state().errors(); track error.kind) {
              <span>{{ error.message }}</span>
            }
          </div>
        }
      </p>
      <ng-content />
    </label>
  `,
})
export class FormFieldGroup {
  readonly label = input.required<string>();
  readonly field = input.required<Field<unknown>>();

  readonly state = computed(() => this.field()());
}
