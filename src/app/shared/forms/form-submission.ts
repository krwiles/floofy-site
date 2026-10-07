import { Signal, WritableSignal } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
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
    // Waits for the reply, so Signal Forms' `submitting()` stays true meanwhile and a second submit is refused.
    action: async () => {
      // Show the pending message straight away.
      config.status.set({ kind: 'pending', key: `${config.i18nPrefix}.pending` });

      // Build the typed request from the model's current value.
      const request = config.buildRequest(config.model());

      // Send it and wait; firstValueFrom turns the one-reply Observable into a Promise of that reply.
      let response: TResponse;
      try {
        response = await firstValueFrom(config.submit(request));
      } catch (error) {
        // Failed: show the message for its code; extra fields (a rate limit's rule) fill its placeholders.
        const { code, ...params } = error as ApiError;
        config.status.set({ kind: 'error', key: `${config.i18nPrefix}.${code}`, params });
        return;
      }

      // Sent: show the form's ok message, then any extra success work (outside the try, so its errors aren't hidden).
      config.status.set({ kind: 'success', key: `${config.i18nPrefix}.ok` });
      config.onSuccess?.(response);
    },
    onInvalid: () => {
      // Submitted while invalid: show the form's "please fix" message instead of sending.
      config.status.set({ kind: 'error', key: `${config.i18nPrefix}.invalid` });
    },
  };
}
