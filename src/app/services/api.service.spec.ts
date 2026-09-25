import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ApiService } from './api.service';
import { API_URLS } from '../config/api-urls';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('posts a contact submission to the contact Lambda URL', () => {
    const request = { name: 'Tangerine', email: 'a@b.com', message: 'Hi!' };
    service.submitContact(request).subscribe();

    const req = httpMock.expectOne(API_URLS.contact);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBe(request);
    req.flush({ message: 'Thanks!' });
  });

  it('gets reviews from the reviews Lambda URL', () => {
    service.getReviews().subscribe();

    const req = httpMock.expectOne(API_URLS.reviews);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('posts a review submission to the reviews Lambda URL', () => {
    const request = { author: 'Tangerine', comment: 'Great!' };
    service.submitReview(request).subscribe();

    const req = httpMock.expectOne(API_URLS.reviews);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBe(request);
    req.flush({ message: 'Thanks!' });
  });

  it('posts a commission submission to the commission Lambda URL', () => {
    const request = {
      name: 'Tangerine',
      email: 'a@b.com',
      commissionType: 'chibi',
      description: 'A chibi please',
      referenceLinks: '',
      usageType: 'personal',
      usageExplanation: 'For myself',
      estimatedPrice: 20,
      deadline: '',
      additionalNotes: '',
    };
    service.submitCommission(request).subscribe();

    const req = httpMock.expectOne(API_URLS.commission);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBe(request);
    req.flush({ message: 'Thanks!' });
  });

  it('normalizes a JSON error body into a plain { message } shape', () => {
    let caught: unknown;
    service.submitContact({ name: '', email: '', message: '' }).subscribe({
      error: (err) => (caught = err),
    });

    httpMock
      .expectOne(API_URLS.contact)
      .flush({ message: 'Server-side validation failed.' }, { status: 400, statusText: 'Bad Request' });

    expect(caught).toEqual({ message: 'Server-side validation failed.' });
  });

  it('normalizes an error with no JSON body into a plain { message } shape using the HTTP status text', () => {
    let caught: unknown;
    service.submitContact({ name: '', email: '', message: '' }).subscribe({
      error: (err) => (caught = err),
    });

    httpMock.expectOne(API_URLS.contact).flush(null, { status: 500, statusText: 'Internal Server Error' });

    expect((caught as { message: string }).message).toContain('500');
  });
});
