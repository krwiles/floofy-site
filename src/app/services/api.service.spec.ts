import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ApiService } from './api.service';
import { API_URLS } from '../config/api-urls';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    // Real HttpClient wired to Angular's testing backend, so no request leaves the test.
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Fail any test that made a request it didn't expect (or left one unanswered).
    httpMock.verify();
  });

  it('posts a contact submission to the contact Lambda URL', () => {
    // Act: submit a contact message.
    const request = { name: 'Tangerine', email: 'a@b.com', message: 'Hi!' };
    service.submitContact(request).subscribe();

    // Assert: one POST to the contact Lambda carrying the request unchanged, then answer it.
    const req = httpMock.expectOne(API_URLS.contact);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBe(request);
    req.flush({ message: 'Thanks!' });
  });

  it('gets reviews from the reviews Lambda URL', () => {
    // Act: load reviews.
    service.getReviews().subscribe();

    // Assert: one GET to the reviews Lambda, then answer it.
    const req = httpMock.expectOne(API_URLS.reviews);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('posts a review submission to the reviews Lambda URL', () => {
    // Act: submit a review.
    const request = { author: 'Tangerine', comment: 'Great!' };
    service.submitReview(request).subscribe();

    // Assert: one POST to the reviews Lambda carrying the request unchanged, then answer it.
    const req = httpMock.expectOne(API_URLS.reviews);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBe(request);
    req.flush({ message: 'Thanks!' });
  });

  it('posts a commission submission to the commission Lambda URL', () => {
    // Arrange: a complete commission request.
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
    // Act: submit it.
    service.submitCommission(request).subscribe();

    // Assert: one POST to the commission Lambda carrying the request unchanged, then answer it.
    const req = httpMock.expectOne(API_URLS.commission);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBe(request);
    req.flush({ message: 'Thanks!' });
  });

  it('normalizes a JSON error body into a plain { message } shape', () => {
    // Arrange: submit, capturing whatever error comes back.
    let caught: unknown;
    service.submitContact({ name: '', email: '', message: '' }).subscribe({
      error: (err) => (caught = err),
    });

    // Act: the Lambda answers 400 with its own message.
    httpMock
      .expectOne(API_URLS.contact)
      .flush({ message: 'Server-side validation failed.' }, { status: 400, statusText: 'Bad Request' });

    // Assert: the caller gets exactly that message.
    expect(caught).toEqual({ message: 'Server-side validation failed.' });
  });

  it('normalizes an error with no JSON body into a plain { message } shape using the HTTP status text', () => {
    // Arrange: submit, capturing whatever error comes back.
    let caught: unknown;
    service.submitContact({ name: '', email: '', message: '' }).subscribe({
      error: (err) => (caught = err),
    });

    // Act: the Lambda answers 500 with no body.
    httpMock.expectOne(API_URLS.contact).flush(null, { status: 500, statusText: 'Internal Server Error' });

    // Assert: the caller still gets a message, built from Angular's HTTP error text.
    expect((caught as { message: string }).message).toContain('500');
  });
});
