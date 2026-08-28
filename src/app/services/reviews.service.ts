import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateReviewRequest, CreateReviewResponse, Review } from '../models/review.model';

@Injectable({
  providedIn: 'root',
})
export class ReviewsService {
  private readonly http = inject(HttpClient);
  private readonly backendUrl = 'https://isaytzssxo6crcwmqfyoqp54py0yjiyt.lambda-url.us-east-1.on.aws/';

  getReviews(): Observable<Review[]> {
    return this.http.get<Review[]>(this.backendUrl);
  }

  submitReview(reviewRequest: CreateReviewRequest): Observable<CreateReviewResponse> {
    return this.http.post<CreateReviewResponse>(this.backendUrl, reviewRequest);
  }
}
