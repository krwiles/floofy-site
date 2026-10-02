import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Field } from '@angular/forms/signals';

/**
 * A field's validation errors, shown only once it's both invalid and touched, so nobody is scolded before they've
 * had a chance to fill it in. Shared by `FormFieldGroup`, `CheckboxField` and `RadioGroup`; takes the `field` itself.
 */
@Component({
  selector: 'app-field-error-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // `display: contents` keeps the empty host out of the parent's flex layout -- see RequiredMarker.
  host: { style: 'display: contents' },
  template: `
    @if (state().invalid() && state().touched()) {
      <div class="text-error">
        @for (error of state().errors(); track error.kind) {
          <span>{{ error.message }}</span>
        }
      </div>
    }
  `,
})
export class FieldErrorList {
  readonly field = input.required<Field<unknown>>();
  // Calling a Signal Forms field returns its live state (errors, touched, ...).
  readonly state = computed(() => this.field()());
}
