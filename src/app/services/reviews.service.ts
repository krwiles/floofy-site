import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ReviewsService {
  private readonly http = inject(HttpClient);
  private readonly backendUrl = 'https://isaytzssxo6crcwmqfyoqp54py0yjiyt.lambda-url.us-east-1.on.aws/';

  getReviews(): Observable<string> {
    return this.http.get<unknown>(this.backendUrl).pipe(
      // Debug helper: stringify the full JSON payload for easy display/logging.
      map((response) => JSON.stringify(response, null, 2)),
    );
  }
}
