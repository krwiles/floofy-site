import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { API_URLS } from '../config/api-urls';
import { ApiError } from '../models/api-error';
import { CreateCommissionRequest, CreateCommissionResponse } from '../models/commission.model';
import { CreateContactRequest, CreateContactResponse } from '../models/contact.model';
import { CreateReviewRequest, CreateReviewResponse, Review } from '../models/review.model';

/**
 * The one client for all three backend Lambdas (contact, reviews, commission) -- see docs/refactor/13-phase-5-plan.md's
 * "ApiService" section. Every failure is normalized here to a plain `{ message: string }`, so forms don't each need
 * their own fallback chain.
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
    // Prefer the Lambda's own `{ message }` body, which carries the user-facing reason (e.g. the rate-limit text).
    const bodyMessage =
      error.error && typeof error.error === 'object' && typeof error.error.message === 'string'
        ? error.error.message
        : undefined;

    // Otherwise fall back to Angular's generic HTTP message, so callers always get a string.
    return throwError((): ApiError => ({ message: bodyMessage ?? error.message }));
  };
}
