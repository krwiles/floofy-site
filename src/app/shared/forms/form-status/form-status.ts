import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FormSubmissionStatus } from '../../../models/form-submission-status';

/**
 * The single, page-visible readout of a form's current submission state -- see CONTEXT.md's "Form Status"
 * entry. Replaces the old pattern of a plain string signal plus a separate `document.getElementById`/
 * `classList` toggle for the success/error color: one input, one source of truth, no DOM lookups.
 */
@Component({
  selector: 'app-form-status',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="min-w-0 flex-1 text-sm font-semibold wrap-break-word" [class]="colorClass()">
      {{ status().message }}
    </p>
  `,
})
export class FormStatus {
  readonly status = input.required<FormSubmissionStatus>();

  readonly colorClass = computed(() => {
    switch (this.status().kind) {
      case 'success':
        return 'text-success';
      case 'error':
        return 'text-error';
      default:
        return '';
    }
  });
}
