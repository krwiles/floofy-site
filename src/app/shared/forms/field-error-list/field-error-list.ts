import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Field } from '@angular/forms/signals';
import { showsErrors } from '../shows-errors';

/**
 * A field's validation errors, shown only once it's both invalid and touched, so nobody is scolded before they've
 * had a chance to fill it in. Shared by `FormFieldGroup`, `CheckboxField` and `RadioGroup`; takes the `field` itself.
 */
@Component({
  selector: 'app-field-error-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // `display: contents` keeps the empty host out of the parent's flex layout -- see RequiredMarker.
  host: { style: 'display: contents' },
  // Always rendered (hidden while empty), so a control's aria-describedby never points at a missing element.
  template: `
    <div class="text-error empty:hidden" [id]="id()">
      @if (visible()) {
        @for (error of state().errors(); track error.kind) {
          <span>{{ error.message }}</span>
        }
      }
    </div>
  `,
})
export class FieldErrorList {
  readonly field = input.required<Field<unknown>>();
  /** The wrapper's id, which the field's control names in `aria-describedby`. */
  readonly id = input<string | null>(null);
  // Calling a Signal Forms field returns its live state (errors, touched, ...).
  readonly state = computed(() => this.field()());
  // Whether to list the errors now (once invalid and touched).
  protected readonly visible = computed(() => showsErrors(this.state()));
}
