import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FormSubmissionStatus } from '../../../models/form-submission-status';
import { TranslatePipe } from '../../pipes/translate.pipe';

/**
 * The visible message for a form's submission state, translated and colored by outcome -- see CONTEXT.md's "Form
 * Status" entry.
 */
@Component({
  selector: 'app-form-status',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- role="status": a polite live region, so each new message is read out after whatever is being said now -->
    <p role="status" class="min-w-0 flex-1 text-sm font-semibold wrap-break-word" [class]="colorClass()">
      {{ status().key | translate: status().params }}
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
