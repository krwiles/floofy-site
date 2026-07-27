import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateCommissionRequest, CreateCommissionResponse } from '../models/commission.model';

@Injectable({
  providedIn: 'root',
})
export class CommissionService {
  private readonly http = inject(HttpClient);
  private readonly backendUrl = 'https://isaytzssxo6crcwmqfyoqp54py0yjiyt.lambda-url.us-east-1.on.aws/';

  submitCommission(commissionRequest: CreateCommissionRequest): Observable<CreateCommissionResponse> {
    return this.http.post<CreateCommissionResponse>(this.backendUrl, commissionRequest);
  }
}
