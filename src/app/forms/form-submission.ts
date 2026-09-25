import { Signal, WritableSignal } from '@angular/core';
import { Observable } from 'rxjs';
import { FormSubmissionStatus } from '../models/form-submission-status';

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
 * Builds the `{ action, onInvalid }` shape Signal Forms' `form()` third argument expects -- see
 * docs/refactor/13-phase-5-plan.md's "FormSubmission helper" section. Every form on the site shares this same
 * skeleton (set pending, build a typed request, submit, update status) even though each form's own request
 * shape and on-success side effect differ.
 */
export function createFormSubmission<TModel, TRequest, TResponse extends { message: string }>(
  config: CreateFormSubmissionConfig<TModel, TRequest, TResponse>,
): { action: () => Promise<void>; onInvalid: () => void } {
  return {
    // Fire-and-forget, matching today's exact behavior: the submission's own `next`/`error` update `status`
    // whenever they resolve, rather than this function awaiting that. Nothing today reads Signal Forms' own
    // `submitting()` state, so there's no loss in not blocking `action`'s returned promise on the HTTP call.
    action: async () => {
      config.status.set({ kind: 'pending', message: config.pendingMessage });

      const request = config.buildRequest(config.model());

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
      config.status.set({ kind: 'error', message: config.invalidMessage });
    },
  };
}
