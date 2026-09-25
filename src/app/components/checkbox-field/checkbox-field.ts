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
 * with a matching note in `16-phase-5-commission-plan.md`. Commission's own checkbox row currently uses
 * `gap-1` instead of this component's default `gap-2` (reviews' value) -- see the `rowGapClass` input below.
 */
@Component({
  selector: 'app-checkbox-field',
  imports: [FormField, RequiredMarker, FieldErrorList],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-start" [class]="rowGapClass()">
      <label class="flex items-center space-x-3">
        <input type="checkbox" [formField]="field()" class="h-4 w-4" />
        <span class="text-sm leading-6">
          <ng-content />
          <app-required-marker [state]="state()" />
        </span>
      </label>
    </div>
    <app-field-error-list [state]="state()" />
  `,
})
export class CheckboxField {
  readonly field = input.required<Field<boolean>>();

  // Defaults to reviews' own current value. /code-review flagged that commission's existing checkbox row uses
  // gap-1, not gap-2 -- rather than silently changing commission's spacing when its PR adopts this component,
  // or silently deciding the two forms should match, this input lets that PR pass 'gap-1' explicitly and put
  // the actual decision (keep commission's own value, or standardize on reviews') to the owner, same as every
  // other one-page-difference this refactor has surfaced rather than resolved on its own.
  readonly rowGapClass = input('gap-2');

  readonly state = computed(() => this.field()());
}
