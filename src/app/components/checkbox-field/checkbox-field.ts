import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Field, FormField } from '@angular/forms/signals';

/**
 * Choice's checkbox presentation -- see CONTEXT.md's "Choice" entry and docs/refactor/13-phase-5-plan.md. A
 * single boolean, its label rendered inline beside it rather than above it the way `FormFieldGroup`'s label
 * is -- its own shape, not a Form Field variant, so it doesn't reuse `FormFieldGroup`'s wrapper. Renders the
 * checkbox itself directly (`class="h-4 w-4"`, unchanged from today) rather than via `appControl`, which is
 * built for text-like controls (`FormFieldGroup`'s own doc comment covers why).
 *
 * Built here, in reviews' PR, rather than commission's: reviews is the first page to actually have a checkbox
 * to migrate, ahead of commission in the sequencing, so it creates this shared piece rather than waiting.
 * `15-phase-5-reviews-plan.md`'s own "New files: none" line didn't account for this -- corrected here, along
 * with a matching note in `16-phase-5-commission-plan.md`. Commission's own checkbox row currently uses
 * `gap-1` instead of this component's `gap-2` (reviews' value, carried over unchanged) -- a pre-existing,
 * one-page difference between the two forms this component doesn't resolve; left for commission's own PR to
 * raise with the owner, not decided here.
 */
@Component({
  selector: 'app-checkbox-field',
  imports: [FormField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-start gap-2">
      <label class="flex items-center space-x-3">
        <input type="checkbox" [formField]="field()" class="h-4 w-4" />
        <span class="text-sm leading-6">
          <ng-content />
          @if (state().required()) {
            <span class="text-error" aria-hidden="true">*</span>
          }
        </span>
      </label>
    </div>
    @if (state().invalid() && state().touched()) {
      <div class="text-error">
        @for (error of state().errors(); track error.kind) {
          <span>{{ error.message }}</span>
        }
      </div>
    }
  `,
})
export class CheckboxField {
  readonly field = input.required<Field<boolean>>();

  readonly state = computed(() => this.field()());
}
