import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { API_URLS } from '../config/api-urls';
import { ApiError } from '../models/api-error';
import { CreateCommissionRequest, CreateCommissionResponse } from '../models/commission.model';
import { CreateContactRequest, CreateContactResponse } from '../models/contact.model';
import { CreateReviewRequest, CreateReviewResponse, Review } from '../models/review.model';

/**
 * One merged service for all 3 backend Lambdas, replacing `ContactService`/`ReviewsService`/`CommissionService`
 * -- see docs/refactor/13-phase-5-plan.md's "ApiService" section. Built with all 4 methods
 * (`submitContact`/`getReviews`/`submitReview`/`submitCommission`) at once in contact's own PR, cheaper than
 * editing this file three separate times as reviews' and commission's migrations landed -- all 4 now have real
 * callers.
 *
 * Normalizes every failure to a plain `{ message: string }` shape here, once, instead of each form doing its
 * own `err.error?.message ?? err.message` fallback chain.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  submitContact(request: CreateContactRequest): Observable<CreateContactResponse> {
    return this.http.post<CreateContactResponse>(API_URLS.contact, request).pipe(catchError(this.normalizeError));
  }

  getReviews(): Observable<Review[]> {
    return this.http.get<Review[]>(API_URLS.reviews).pipe(catchError(this.normalizeError));
  }

  submitReview(request: CreateReviewRequest): Observable<CreateReviewResponse> {
    return this.http.post<CreateReviewResponse>(API_URLS.reviews, request).pipe(catchError(this.normalizeError));
  }

  submitCommission(request: CreateCommissionRequest): Observable<CreateCommissionResponse> {
    return this.http.post<CreateCommissionResponse>(API_URLS.commission, request).pipe(catchError(this.normalizeError));
  }

  private readonly normalizeError = (error: HttpErrorResponse): Observable<never> => {
    const bodyMessage =
      error.error && typeof error.error === 'object' && typeof error.error.message === 'string'
        ? error.error.message
        : undefined;
    return throwError((): ApiError => ({ message: bodyMessage ?? error.message }));
  };
}
