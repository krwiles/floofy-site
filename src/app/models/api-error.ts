/** The error codes a form Lambda can reply with -- see docs/features/api-status-codes/plan.md. */
export const API_ERROR_CODES = ['invalid', 'rate_limited', 'busy', 'error'] as const;
export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

/** Every code a form Lambda can reply with: success, or one of the errors. */
export type ApiCode = 'ok' | ApiErrorCode;

/** A failed request as `ApiService` hands it back: its code, plus the server's rule when rate-limited. */
export interface ApiError {
  code: ApiErrorCode;
  limit?: number;
  window_hours?: number;
}
