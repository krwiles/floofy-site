/**
 * The single source of truth `app-form-status` reads and `createFormSubmission` writes -- replaces the old
 * pattern of a plain string signal plus a separate `document.getElementById`/`classList` toggle for the
 * success/error color, two things that could (and did) drift out of sync. See CONTEXT.md's "Form Status" /
 * "Form Submission" entries.
 */
export type FormSubmissionStatus = {
  kind: 'idle' | 'pending' | 'success' | 'error';
  message: string;
};
