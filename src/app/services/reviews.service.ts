import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Review, ReviewSubmission, ServerResponse } from '../models/review';

@Injectable({
  providedIn: 'root',
})
export class ReviewsService {
  private readonly http = inject(HttpClient);
  private readonly backendUrl = 'https://isaytzssxo6crcwmqfyoqp54py0yjiyt.lambda-url.us-east-1.on.aws/';

  getReviews(): Observable<Review[]> {
    return this.http.get<Review[]>(this.backendUrl);
  }

  submitReview(reviewSubmission: ReviewSubmission): Observable<ServerResponse> {
    return this.http.post<ServerResponse>(this.backendUrl, reviewSubmission);
  }
}
