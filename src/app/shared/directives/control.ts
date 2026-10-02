import { Directive, computed, inject, input } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import { Tone } from '../../models/tone';
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
 * background stays light whatever the tone; the border turns red once the field is invalid and touched.
 */
@Directive({
  selector: '[appControl]',
  host: { '[class]': 'hostClass()' },
})
export class Control {
  readonly tone = input<Tone>('middle');

  private readonly formField = inject(FormField, { self: true });

  // Show the error state only once the visitor has touched an invalid field, not on first render.
  private readonly invalid = computed(() => {
    const state = this.formField.state();
    return state.invalid() && state.touched();
  });

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
