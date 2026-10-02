import { signal } from '@angular/core';
import { NEVER, of, throwError } from 'rxjs';
import { createFormSubmission } from './form-submission';
import { FormSubmissionStatus } from '../../models/form-submission-status';

describe('createFormSubmission', () => {
  it('sets status to pending synchronously, before the submission resolves', () => {
    // Arrange: a model and an idle status.
    const model = signal({ name: 'Tangerine' });
    const status = signal<FormSubmissionStatus>({ kind: 'idle', message: '' });

    // Arrange: a submit that never answers (NEVER), so only the synchronous "pending" step can have run.
    const { action } = createFormSubmission({
      pendingMessage: 'Submitting...',
      invalidMessage: 'Fix the errors.',
      model,
      status,
      buildRequest: (m) => ({ requestName: m.name }),
      submit: () => NEVER,
    });

    // Act: submit.
    void action();

    // Assert: pending is already showing.
    expect(status()).toEqual({ kind: 'pending', message: 'Submitting...' });
  });

  it('builds the request from the current model value at submit time', () => {
    // Arrange: a model, an idle status, and a submit that records the request it was given.
    const model = signal({ name: 'Tangerine' });
    const status = signal<FormSubmissionStatus>({ kind: 'idle', message: '' });
    let capturedRequest: unknown;

    const { action } = createFormSubmission({
      pendingMessage: 'Submitting...',
      invalidMessage: 'Fix the errors.',
      model,
      status,
      buildRequest: (m) => ({ requestName: m.name }),
      submit: (request) => {
        capturedRequest = request;
        return of({ message: 'Thanks!' });
      },
    });

    // Act: submit.
    void action();

    // Assert: the request was built from the model's value.
    expect(capturedRequest).toEqual({ requestName: 'Tangerine' });
  });

  it('sets status to success with the response message on success', async () => {
    // Arrange: a model, an idle status, and a submit that succeeds.
    const model = signal({ name: 'Tangerine' });
    const status = signal<FormSubmissionStatus>({ kind: 'idle', message: '' });

    const { action } = createFormSubmission({
      pendingMessage: 'Submitting...',
      invalidMessage: 'Fix the errors.',
      model,
      status,
      buildRequest: (m) => ({ requestName: m.name }),
      submit: () => of({ message: 'Thanks for reaching out!' }),
    });

    // Act: submit and wait.
    await action();

    // Assert: success, with the server's message.
    expect(status()).toEqual({ kind: 'success', message: 'Thanks for reaching out!' });
  });

  it('calls onSuccess with the response after a successful submission', async () => {
    // Arrange: a submit that succeeds, plus an onSuccess that records its argument.
    const model = signal({ name: 'Tangerine' });
    const status = signal<FormSubmissionStatus>({ kind: 'idle', message: '' });
    let onSuccessCalledWith: unknown;

    const { action } = createFormSubmission({
      pendingMessage: 'Submitting...',
      invalidMessage: 'Fix the errors.',
      model,
      status,
      buildRequest: (m) => ({ requestName: m.name }),
      submit: () => of({ message: 'Thanks!' }),
      onSuccess: (response) => (onSuccessCalledWith = response),
    });

    // Act: submit and wait.
    await action();

    // Assert: onSuccess got the response.
    expect(onSuccessCalledWith).toEqual({ message: 'Thanks!' });
  });

  it('sets status to error with the normalized error message on failure', async () => {
    // Arrange: a submit that fails with an already-normalized error.
    const model = signal({ name: 'Tangerine' });
    const status = signal<FormSubmissionStatus>({ kind: 'idle', message: '' });

    const { action } = createFormSubmission({
      pendingMessage: 'Submitting...',
      invalidMessage: 'Fix the errors.',
      model,
      status,
      buildRequest: (m) => ({ requestName: m.name }),
      submit: () => throwError(() => ({ message: 'The server exploded.' })),
    });

    // Act: submit and wait.
    await action();

    // Assert: error, with that message.
    expect(status()).toEqual({ kind: 'error', message: 'The server exploded.' });
  });

  it('does not call onSuccess on failure', async () => {
    // Arrange: a submit that fails, plus an onSuccess that records whether it ran.
    const model = signal({ name: 'Tangerine' });
    const status = signal<FormSubmissionStatus>({ kind: 'idle', message: '' });
    let onSuccessCalled = false;

    const { action } = createFormSubmission({
      pendingMessage: 'Submitting...',
      invalidMessage: 'Fix the errors.',
      model,
      status,
      buildRequest: (m) => ({ requestName: m.name }),
      submit: () => throwError(() => ({ message: 'nope' })),
      onSuccess: () => (onSuccessCalled = true),
    });

    // Act: submit and wait.
    await action();

    // Assert: onSuccess never ran.
    expect(onSuccessCalled).toBe(false);
  });

  it('sets status to error with the invalid message when onInvalid runs', () => {
    // Arrange: a model and an idle status.
    const model = signal({ name: 'Tangerine' });
    const status = signal<FormSubmissionStatus>({ kind: 'idle', message: '' });

    const { onInvalid } = createFormSubmission({
      pendingMessage: 'Submitting...',
      invalidMessage: 'Please fix the errors below.',
      model,
      status,
      buildRequest: (m) => ({ requestName: m.name }),
      submit: () => of({ message: 'unused' }),
    });

    // Act: report the form as invalid.
    onInvalid();

    // Assert: error, with the form's invalid message.
    expect(status()).toEqual({ kind: 'error', message: 'Please fix the errors below.' });
  });
});
