import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FormSubmissionStatus } from '../../../models/form-submission-status';

/**
 * The visible message for a form's submission state, colored by outcome -- see CONTEXT.md's "Form Status" entry.
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
    // Green for success, red for error, the default text color otherwise.
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
