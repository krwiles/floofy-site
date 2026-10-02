/** The codes every form Lambda replies with -- see docs/features/api-status-codes/plan.md. */
export type ApiCode = 'ok' | 'invalid' | 'rate_limited' | 'error';

/** The error codes, for checking that a reply's code is one the site knows how to word. */
export const API_ERROR_CODES: readonly ApiError['code'][] = ['invalid', 'rate_limited', 'error'];

/** A failed request as `ApiService` hands it back: its code, plus the server's rule when rate-limited. */
export interface ApiError {
  code: Exclude<ApiCode, 'ok'>;
  limit?: number;
  window_hours?: number;
}
