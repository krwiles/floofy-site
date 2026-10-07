import { Directive, computed, inject, input } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import { Tone } from '../../models/tone';
import { FIELD_IDS } from '../forms/field-ids';
import { showsErrors } from '../forms/shows-errors';
import { joinClasses } from '../../utils/join-classes';

// Full literal class names, not a `text-on-${tone}` template: Tailwind only generates classes it sees written out.
const PLACEHOLDER_CLASS: Record<Tone, string> = {
  light: 'placeholder:text-on-light-body-subtle',
  middle: 'placeholder:text-on-middle-body-subtle',
  dark: 'placeholder:text-on-dark-body-subtle',
};

/**
 * The shared form-input styling -- see CONTEXT.md's "Control" entry and docs/refactor/13-phase-5-plan.md. It reads the
 * field's state from the `[formField]` directive already on the same element, so it needs no binding of its own. The
 * background stays light whatever the tone; once the field is invalid and touched, the border turns red and it's
 * marked `aria-invalid`. Inside a `FormFieldGroup` it also takes that group's ids (see `FIELD_IDS`).
 */
@Directive({
  selector: '[appControl]',
  host: {
    '[class]': 'hostClass()',
    '[attr.id]': 'ids?.controlId ?? null',
    '[attr.aria-invalid]': 'invalid() ? "true" : null',
    '[attr.aria-describedby]': 'ids && invalid() ? ids.errorId : null',
  },
})
export class Control {
  readonly tone = input<Tone>('middle');

  private readonly formField = inject(FormField, { self: true });
  // The surrounding FormFieldGroup's ids, so its label names this control and its errors describe it (none if bare).
  protected readonly ids = inject(FIELD_IDS, { optional: true });

  // Show the error state (red border, aria-invalid) only once the visitor has touched an invalid field.
  protected readonly invalid = computed(() => showsErrors(this.formField.state()));

  // Base styling, then the border for the current state, then the tone's placeholder color, then the focus ring.
  readonly hostClass = computed(() =>
    joinClasses(
      'mt-2 w-full rounded-xl border p-3 bg-section-light',
      this.invalid() ? 'border-error' : 'border-border',
      PLACEHOLDER_CLASS[this.tone()],
      'focus-visible:outline-2 focus-visible:outline-brand-strong',
    ),
  );
}
