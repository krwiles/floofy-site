import { Signal, WritableSignal } from '@angular/core';
import { Observable } from 'rxjs';
import { FormSubmissionStatus } from '../../models/form-submission-status';

interface CreateFormSubmissionConfig<TModel, TRequest, TResponse extends { message: string }> {
  /** Shown while the request is in flight. */
  pendingMessage: string;
  /** Shown when the form is submitted while invalid. */
  invalidMessage: string;
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
 */
export function createFormSubmission<TModel, TRequest, TResponse extends { message: string }>(
  config: CreateFormSubmissionConfig<TModel, TRequest, TResponse>,
): { action: () => Promise<void>; onInvalid: () => void } {
  return {
    // Fire-and-forget: status updates whenever the request resolves; nothing reads Signal Forms' `submitting()`.
    action: async () => {
      // Show the pending message straight away.
      config.status.set({ kind: 'pending', message: config.pendingMessage });

      // Build the typed request from the model's current value.
      const request = config.buildRequest(config.model());

      // Send it, then show the server's message on success (plus any extra success work) or the error's on failure.
      config.submit(request).subscribe({
        next: (response) => {
          config.status.set({ kind: 'success', message: response.message });
          config.onSuccess?.(response);
        },
        error: (error: { message: string }) => {
          config.status.set({ kind: 'error', message: error.message });
        },
      });
    },
    onInvalid: () => {
      // Submitted while invalid: show the form's "please fix" message instead of sending.
      config.status.set({ kind: 'error', message: config.invalidMessage });
    },
  };
}
