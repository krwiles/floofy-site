import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FieldState } from '@angular/forms/signals';

/**
 * The `*` shown next to a field's label when it's actually required, derived from the field's own `required`
 * signal rather than a second, independently-set input. Shared by `FormFieldGroup`, `CheckboxField`, and
 * `RadioGroup` -- extracted after `/code-review` flagged this markup as duplicated verbatim between the first
 * two, before `RadioGroup` existed to make it a third.
 */
@Component({
  selector: 'app-required-marker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Angular custom elements default to display: inline, so without this the host itself would always be
  // present as a flex item in FormFieldGroup's/CheckboxField's `gap`-based row, even while rendering nothing
  // -- consuming a real gap slot it never used to when the *@if was directly in the parent's own template.
  // display: contents makes an empty host contribute nothing to the flex layout, same as before extraction.
  host: { style: 'display: contents' },
  template: `
    @if (state().required()) {
      <span class="text-error" aria-hidden="true">*</span>
    }
  `,
})
export class RequiredMarker {
  readonly state = input.required<FieldState<unknown>>();
}
