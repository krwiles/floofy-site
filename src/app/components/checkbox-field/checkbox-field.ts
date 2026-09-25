import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Field, FormField } from '@angular/forms/signals';
import { RequiredMarker } from '../required-marker/required-marker';
import { FieldErrorList } from '../field-error-list/field-error-list';

/**
 * Choice's checkbox presentation -- see CONTEXT.md's "Choice" entry and docs/refactor/13-phase-5-plan.md. A
 * single boolean, its label rendered inline beside it rather than above it the way `FormFieldGroup`'s label
 * is -- its own shape, not a Form Field variant, so it doesn't reuse `FormFieldGroup`'s wrapper. Renders the
 * checkbox itself directly (`class="h-4 w-4"`, unchanged from today) rather than via `appControl`, which is
 * built for text-like controls (`FormFieldGroup`'s own doc comment covers why). The required-marker and
 * error-list are shared with `FormFieldGroup` via `RequiredMarker`/`FieldErrorList` -- extracted after
 * `/code-review` flagged this markup as duplicated verbatim between the two.
 *
 * Built here, in reviews' PR, rather than commission's: reviews is the first page to actually have a checkbox
 * to migrate, ahead of commission in the sequencing, so it creates this shared piece rather than waiting.
 * `15-phase-5-reviews-plan.md`'s own "New files: none" line didn't account for this -- corrected here, along
 * with a matching note in `16-phase-5-commission-plan.md`. Commission's own checkbox row used `gap-1` instead
 * of `gap-2` (reviews' value) -- an earlier version of this component took a `rowGapClass` input so commission
 * could have kept `gap-1`, but the owner's call was to standardize on `gap-2` instead, so nothing ever
 * overrode it. Removed by `/code-review` on commission's own PR as genuinely dead, untested-by-usage surface.
 *
 * `[labelExtra]` (added for commission's PR): an optional projected slot, a sibling of the checkbox's own
 * `<label>`, for a caller's own jump-to-detail button next to the row -- commission's ToS checkbox needs one;
 * reviews' agreement checkbox doesn't project anything there, so nothing changes for it. Mirrors `RadioGroup`'s
 * own `[labelExtra]` slot and the reasoning behind it.
 */
@Component({
  selector: 'app-checkbox-field',
  imports: [FormField, RequiredMarker, FieldErrorList],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-start gap-2">
      <label class="flex items-center space-x-3">
        <input type="checkbox" [formField]="field()" class="h-4 w-4" />
        <span class="text-sm leading-6">
          <ng-content />
          <app-required-marker [state]="state()" />
        </span>
      </label>
      <ng-content select="[labelExtra]" />
    </div>
    <app-field-error-list [state]="state()" />
  `,
})
export class CheckboxField {
  readonly field = input.required<Field<boolean>>();

  readonly state = computed(() => this.field()());
}
