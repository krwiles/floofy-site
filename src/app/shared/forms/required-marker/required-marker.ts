import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Field } from '@angular/forms/signals';

/**
 * The `*` beside a field's label, shown only when the field's own validators make it required. Shared by
 * `FormFieldGroup`, `CheckboxField` and `RadioGroup`; takes the `field` itself, so callers pass one input.
 */
@Component({
  selector: 'app-required-marker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // `display: contents` so an empty marker doesn't take up a gap in its parent's flex row.
  host: { style: 'display: contents' },
  template: `
    @if (state().required()) {
      <span class="text-error" aria-hidden="true">*</span>
    }
  `,
})
export class RequiredMarker {
  readonly field = input.required<Field<unknown>>();
  // Calling a Signal Forms field returns its live state (required, ...).
  readonly state = computed(() => this.field()());
}
