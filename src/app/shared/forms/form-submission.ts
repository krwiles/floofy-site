import { Signal, WritableSignal } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiError } from '../../models/api-error';
import { FormSubmissionStatus } from '../../models/form-submission-status';

interface CreateFormSubmissionConfig<TModel, TRequest, TResponse> {
  /** The form's i18n prefix, e.g. `forms.review`; its `pending`, `invalid`, `ok` and error-code keys are the messages. */
  i18nPrefix: string;
  /** The form's own model signal -- read fresh at submit time, not captured once at setup. */
  model: Signal<TModel>;
  /** Where the resulting status is written; also what `app-form-status` reads. */
  status: WritableSignal<FormSubmissionStatus>;
  /** Builds the typed request body from the current model value. */
  buildRequest: (model: TModel) => TRequest;
  /** Sends the request; normally one of `ApiService`'s methods. */
  submit: (request: TRequest) => Observable<TResponse>;
  /** Runs after a successful submission, in addition to setting the success status (e.g. resetting the form). */
  onSuccess?: (response: TResponse) => void;
}

/**
 * Builds the `{ action, onInvalid }` pair Signal Forms' `form()` expects, sharing every form's submit skeleton (set
 * pending, build the request, send, update status) -- see docs/refactor/13-phase-5-plan.md's "FormSubmission helper".
 * Statuses hold i18n keys, which `app-form-status` translates -- see docs/features/api-status-codes/plan.md.
 */
export function createFormSubmission<TModel, TRequest, TResponse>(
  config: CreateFormSubmissionConfig<TModel, TRequest, TResponse>,
): { action: () => Promise<void>; onInvalid: () => void } {
  return {
    // Fire-and-forget: status updates whenever the request resolves; nothing reads Signal Forms' `submitting()`.
    action: async () => {
      // Show the pending message straight away.
      config.status.set({ kind: 'pending', key: `${config.i18nPrefix}.pending` });

      // Build the typed request from the model's current value.
      const request = config.buildRequest(config.model());

      // Send it; success shows the form's ok message (plus any extra success work), failure the message for its code.
      config.submit(request).subscribe({
        next: (response) => {
          config.status.set({ kind: 'success', key: `${config.i18nPrefix}.ok` });
          config.onSuccess?.(response);
        },
        error: ({ code, ...params }: ApiError) => {
          // Any extra fields (a rate limit's rule) fill the message's placeholders.
          config.status.set({ kind: 'error', key: `${config.i18nPrefix}.${code}`, params });
        },
      });
    },
    onInvalid: () => {
      // Submitted while invalid: show the form's "please fix" message instead of sending.
      config.status.set({ kind: 'error', key: `${config.i18nPrefix}.invalid` });
    },
  };
}
