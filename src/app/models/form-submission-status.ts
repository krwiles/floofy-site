/**
 * A form's submission state: `createFormSubmission` writes it and `app-form-status` reads it, so the message and its
 * success/error styling can't drift apart. See CONTEXT.md's "Form Status" / "Form Submission" entries.
 */
export type FormSubmissionStatus = {
  kind: 'idle' | 'pending' | 'success' | 'error';
  message: string;
};
