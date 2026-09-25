import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FieldState } from '@angular/forms/signals';

/**
 * A field's active validation errors, shown once it's both invalid and touched -- never before, so a field
 * doesn't scold the person before they've had a chance to fill it in. Shared by `FormFieldGroup`,
 * `CheckboxField`, and `RadioGroup` -- extracted after `/code-review` flagged this markup as duplicated
 * verbatim between the first two, before `RadioGroup` existed to make it a third.
 */
@Component({
  selector: 'app-field-error-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Same layout-transparency reasoning as RequiredMarker's own host binding -- see its comment.
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
  readonly state = input.required<FieldState<unknown>>();
}
