import { TranslateParams } from './translate-params';

/**
 * A form's submission state: `createFormSubmission` writes it and `app-form-status` reads it, so the message and its
 * success/error styling can't drift apart. `key` is an i18n key, translated when shown, so it follows the site's
 * language; `params` fill its `{name}` placeholders. See CONTEXT.md's "Form Status" / "Form Submission" entries.
 */
export type FormSubmissionStatus = {
  kind: 'idle' | 'pending' | 'success' | 'error';
  key: string;
  params?: TranslateParams;
};
