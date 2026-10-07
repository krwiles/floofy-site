import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NEVER, Observable, of, Subject, throwError } from 'rxjs';
import { FieldTree } from '@angular/forms/signals';
import { createFormSubmission } from './form-submission';
import { FormSubmissionStatus } from '../../models/form-submission-status';

describe('createFormSubmission', () => {
  /** A submission wired to fresh model/status signals and the given `submit`, with `forms.test` messages. */
  function setup(submit: (request: unknown) => Observable<unknown>, onSuccess?: (response: unknown) => void) {
    // A model with one value, and a status starting idle.
    const model = signal({ name: 'Tangerine' });
    const status = signal<FormSubmissionStatus>({ kind: 'idle', key: '' });

    // The submission under test, using the "forms.test" keys, built in an injection context as a form field would be.
    const submission = TestBed.runInInjectionContext(() =>
      createFormSubmission({
        i18nPrefix: 'forms.test',
        model,
        status,
        buildRequest: (m) => ({ requestName: m.name }),
        submit,
        onSuccess,
      }),
    );
    // Hand back the status to inspect, plus action/onInvalid to call.
    return { status, ...submission };
  }

  it('shows the pending message synchronously, before the submission resolves', () => {
    // Arrange: a submit that never answers (NEVER), so only the synchronous "pending" step can have run.
    const { status, action } = setup(() => NEVER);

    // Act: submit.
    void action();

    // Assert: the form's pending key is already showing.
    expect(status()).toEqual({ kind: 'pending', key: 'forms.test.pending' });
  });

  it('stays pending until the reply arrives, so Signal Forms blocks a second submit meanwhile', async () => {
    // Arrange: a submit whose reply the test sends by hand, and a flag set once action() resolves.
    const reply = new Subject<unknown>();
    const { status, action } = setup(() => reply);
    let resolved = false;

    // Act: submit, then let any already-queued work run.
    const done = action().then(() => (resolved = true));
    await Promise.resolve();

    // Assert: still waiting, so Signal Forms' submitting() stays true.
    expect(resolved).toBe(false);

    // Act: the reply arrives.
    reply.next({ code: 'ok' });
    reply.complete();
    await done;

    // Assert: resolved, with the success message showing.
    expect(resolved).toBe(true);
    expect(status()).toEqual({ kind: 'success', key: 'forms.test.ok' });
  });

  it('resolves rather than rejecting when the request fails', async () => {
    // Arrange: a submit that fails.
    const { action } = setup(() => throwError(() => ({ code: 'error' })));

    // Act and assert: the promise resolves, so a failure never becomes an unhandled rejection.
    await expect(action()).resolves.toBeUndefined();
  });

  it('builds the request from the current model value at submit time', () => {
    // Arrange: a submit that records the request it was given.
    let capturedRequest: unknown;
    const { action } = setup((request) => {
      capturedRequest = request;
      return of({ code: 'ok' });
    });

    // Act: submit.
    void action();

    // Assert: the request was built from the model's value.
    expect(capturedRequest).toEqual({ requestName: 'Tangerine' });
  });

  it("shows the form's own ok message on success", async () => {
    // Arrange: a submit that succeeds.
    const { status, action } = setup(() => of({ code: 'ok' }));

    // Act: submit and wait.
    await action();

    // Assert: success, with this form's ok key.
    expect(status()).toEqual({ kind: 'success', key: 'forms.test.ok' });
  });

  it('calls onSuccess with the response after a successful submission', async () => {
    // Arrange: a submit that succeeds, plus an onSuccess that records its argument.
    let onSuccessCalledWith: unknown;
    const { action } = setup(
      () => of({ code: 'ok' }),
      (response) => (onSuccessCalledWith = response),
    );

    // Act: submit and wait.
    await action();

    // Assert: onSuccess got the response.
    expect(onSuccessCalledWith).toEqual({ code: 'ok' });
  });

  it("shows the form's message for the error code the server sent", async () => {
    // Arrange: a submit that fails with a plain error code.
    const { status, action } = setup(() => throwError(() => ({ code: 'invalid' })));

    // Act: submit and wait.
    await action();

    // Assert: error, keyed by that code, with no numbers to fill in.
    expect(status()).toEqual({ kind: 'error', key: 'forms.test.invalid', params: {} });
  });

  it('passes the rate-limit rule from the server through to the message', async () => {
    // Arrange: a submit refused by the rate limit, which reports the rule.
    const { status, action } = setup(() => throwError(() => ({ code: 'rate_limited', limit: 2, window_hours: 24 })));

    // Act: submit and wait.
    await action();

    // Assert: the rate_limited key, with the server's numbers for its placeholders.
    expect(status()).toEqual({
      kind: 'error',
      key: 'forms.test.rate_limited',
      params: { limit: 2, window_hours: 24 },
    });
  });

  it('does not call onSuccess on failure', async () => {
    // Arrange: a submit that fails, plus an onSuccess that records whether it ran.
    let onSuccessCalled = false;
    const { action } = setup(
      () => throwError(() => ({ code: 'error' })),
      () => (onSuccessCalled = true),
    );

    // Act: submit and wait.
    await action();

    // Assert: onSuccess never ran.
    expect(onSuccessCalled).toBe(false);
  });

  /** A stand-in form whose error summary lists fields with these focus spies, in field order. */
  function invalidForm(...focusSpies: (() => void)[]) {
    // Each summary entry names a field whose state can focus its input.
    const errorSummary = () => focusSpies.map((focusBoundControl) => ({ fieldTree: () => ({ focusBoundControl }) }));

    // Only the parts onInvalid touches exist, so the cast through unknown stands in for a whole FieldTree.
    return (() => ({ errorSummary })) as unknown as FieldTree<{ name: string }>;
  }

  it("shows the form's invalid message when submitted while invalid", () => {
    // Arrange: a submission whose submit should never run.
    const { status, onInvalid } = setup(() => of({ code: 'ok' }));

    // Act: report the form as invalid.
    onInvalid(invalidForm(vi.fn()));

    // Assert: error, with this form's invalid key.
    expect(status()).toEqual({ kind: 'error', key: 'forms.test.invalid' });
  });

  it('moves focus to the first invalid field when submitted while invalid', () => {
    // Arrange: a form with two invalid fields, in order.
    const { onInvalid } = setup(() => of({ code: 'ok' }));
    const first = vi.fn();
    const second = vi.fn();

    // Act: report the form as invalid.
    onInvalid(invalidForm(first, second));

    // Assert: nothing is focused until the errors have rendered, so focus lands on a field already marked invalid.
    expect(first).not.toHaveBeenCalled();

    // Act: let the next render happen.
    TestBed.tick();

    // Assert: only the first invalid field takes focus, so the visitor lands on it.
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();
  });
});
