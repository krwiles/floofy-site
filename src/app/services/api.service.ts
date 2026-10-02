import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { API_URLS } from '../config/api-urls';
import { API_ERROR_CODES, ApiError } from '../models/api-error';
import { CreateCommissionRequest, CreateCommissionResponse } from '../models/commission.model';
import { CreateContactRequest, CreateContactResponse } from '../models/contact.model';
import { CreateReviewRequest, CreateReviewResponse, Review } from '../models/review.model';

/**
 * The one client for all three backend Lambdas (contact, reviews, commission) -- see docs/refactor/13-phase-5-plan.md's
 * "ApiService" section. Every failure is normalized here to an `ApiError` code -- see
 * docs/features/api-status-codes/plan.md.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  submitContact(request: CreateContactRequest): Observable<CreateContactResponse> {
    // POST the contact form to the floof-contact Lambda.
    return this.http.post<CreateContactResponse>(API_URLS.contact, request).pipe(catchError(this.normalizeError));
  }

  getReviews(): Observable<Review[]> {
    // GET every visible review from the floof-api Lambda.
    return this.http.get<Review[]>(API_URLS.reviews).pipe(catchError(this.normalizeError));
  }

  submitReview(request: CreateReviewRequest): Observable<CreateReviewResponse> {
    // POST a new review to the floof-api Lambda.
    return this.http.post<CreateReviewResponse>(API_URLS.reviews, request).pipe(catchError(this.normalizeError));
  }

  submitCommission(request: CreateCommissionRequest): Observable<CreateCommissionResponse> {
    // POST a commission request to the floof-comm Lambda.
    return this.http.post<CreateCommissionResponse>(API_URLS.commission, request).pipe(catchError(this.normalizeError));
  }

  private readonly normalizeError = (error: HttpErrorResponse): Observable<never> => {
    // Use the Lambda's code if it's one the site knows; anything else (no body, a network failure) is a generic error.
    const body = error.error && typeof error.error === 'object' ? error.error : {};
    const code = API_ERROR_CODES.includes(body.code) ? body.code : 'error';
    const apiError: ApiError = { code };

    // A rate limit also carries the server's rule, so the page can say what the limit is.
    if (code === 'rate_limited' && typeof body.limit === 'number' && typeof body.window_hours === 'number') {
      apiError.limit = body.limit;
      apiError.window_hours = body.window_hours;
    }
    return throwError(() => apiError);
  };
}
