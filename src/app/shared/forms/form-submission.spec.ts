import { signal } from '@angular/core';
import { NEVER, of, throwError } from 'rxjs';
import { createFormSubmission } from './form-submission';
import { FormSubmissionStatus } from '../../models/form-submission-status';

describe('createFormSubmission', () => {
  it('sets status to pending synchronously, before the submission resolves', () => {
    const model = signal({ name: 'Tangerine' });
    const status = signal<FormSubmissionStatus>({ kind: 'idle', message: '' });

    // NEVER emits nothing at all, isolating the synchronous "set pending" step from any (real or test-double)
    // completion -- an of()-based double would emit synchronously too, racing this assertion.
    const { action } = createFormSubmission({
      pendingMessage: 'Submitting...',
      invalidMessage: 'Fix the errors.',
      model,
      status,
      buildRequest: (m) => ({ requestName: m.name }),
      submit: () => NEVER,
    });

    void action();

    expect(status()).toEqual({ kind: 'pending', message: 'Submitting...' });
  });

  it('builds the request from the current model value at submit time', () => {
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

    void action();

    expect(capturedRequest).toEqual({ requestName: 'Tangerine' });
  });

  it('sets status to success with the response message on success', async () => {
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

    await action();

    expect(status()).toEqual({ kind: 'success', message: 'Thanks for reaching out!' });
  });

  it('calls onSuccess with the response after a successful submission', async () => {
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

    await action();

    expect(onSuccessCalledWith).toEqual({ message: 'Thanks!' });
  });

  it('sets status to error with the normalized error message on failure', async () => {
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

    await action();

    expect(status()).toEqual({ kind: 'error', message: 'The server exploded.' });
  });

  it('does not call onSuccess on failure', async () => {
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

    await action();

    expect(onSuccessCalled).toBe(false);
  });

  it('sets status to error with the invalid message when onInvalid runs', () => {
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

    onInvalid();

    expect(status()).toEqual({ kind: 'error', message: 'Please fix the errors below.' });
  });
});
