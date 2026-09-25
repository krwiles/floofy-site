import { Directive, computed, inject, input } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import { Tone } from '../models/tone';

/** Joins class fragments with a single space, dropping any empty ones. Mirrors hero.ts's own helper. */
function joinClasses(...parts: string[]): string {
  return parts.filter(Boolean).join(' ');
}

/**
 * Supplies the shared input styling (today duplicated ~12 times across contact/reviews/commission) -- see
 * CONTEXT.md's "Control" entry and docs/refactor/13-phase-5-plan.md. Needs no explicit binding to the field:
 * every control in this codebase already carries Signal Forms' own `[formField]` directive, which publicly
 * exposes its field's live state -- `inject(FormField, { self: true })` reads that directly from the sibling
 * directive already on this same host element, rather than requiring a second, redundant `[field]` binding.
 *
 * `bg-section-light` stays fixed regardless of `tone` -- in every current usage the input's own inset
 * background is deliberately light even though the surrounding card is always `tone="middle"`, so there's no
 * evidence it should track the form's tone the way the placeholder color does. Only what's verifiably
 * tone-coupled today varies here.
 *
 * One deliberate, small addition beyond today's exact pixel output, settled during Phase 5 grilling (not
 * introduced silently here): an error-colored border once the field is both invalid and touched. No field
 * anywhere shows this today -- only the error text above it turns red -- but the owner confirmed this design
 * across two grilling rounds before it was written into the merged plan doc.
 */
@Directive({
  selector: '[appControl]',
  host: { '[class]': 'hostClass()' },
})
export class Control {
  readonly tone = input<Tone>('middle');

  private readonly formField = inject(FormField, { self: true });

  private readonly invalid = computed(() => {
    const state = this.formField.state();
    return state.invalid() && state.touched();
  });

  readonly hostClass = computed(() =>
    joinClasses(
      'mt-2 w-full rounded-xl border p-3 bg-section-light',
      this.invalid() ? 'border-error' : 'border-border',
      `placeholder:text-on-${this.tone()}-body-subtle`,
      'focus-visible:outline-2 focus-visible:outline-brand-strong',
    ),
  );
}
