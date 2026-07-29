import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateContactRequest, CreateContactResponse } from '../models/contact.model';

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  private readonly http = inject(HttpClient);
  private readonly backendUrl = 'https://zh7bsnp2zn4awfk5q7khv64dxu0wiktc.lambda-url.us-east-1.on.aws/';

  submitContact(contactRequest: CreateContactRequest): Observable<CreateContactResponse> {
    return this.http.post<CreateContactResponse>(this.backendUrl, contactRequest);
  }
}
