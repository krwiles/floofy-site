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
    req.flush({ code: 'ok' });
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
    req.flush({ code: 'ok' });
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
    req.flush({ code: 'ok' });
  });

  it("passes the Lambda's error code through", () => {
    // Arrange: submit, capturing whatever error comes back.
    let caught: unknown;
    service.submitContact({ name: '', email: '', message: '' }).subscribe({
      error: (err) => (caught = err),
    });

    // Act: the Lambda answers 400 with its code.
    httpMock.expectOne(API_URLS.contact).flush({ code: 'invalid' }, { status: 400, statusText: 'Bad Request' });

    // Assert: the caller gets exactly that code.
    expect(caught).toEqual({ code: 'invalid' });
  });

  it('keeps the rate-limit rule that comes with a rate_limited code', () => {
    // Arrange: submit, capturing whatever error comes back.
    let caught: unknown;
    service.submitReview({ author: 'a', comment: 'b' }).subscribe({ error: (err) => (caught = err) });

    // Act: the Lambda refuses with its limit and window.
    httpMock
      .expectOne(API_URLS.reviews)
      .flush({ code: 'rate_limited', limit: 1, window_hours: 1 }, { status: 429, statusText: 'Too Many Requests' });

    // Assert: the numbers survive, so the page can show them.
    expect(caught).toEqual({ code: 'rate_limited', limit: 1, window_hours: 1 });
  });

  it.each([
    ['no body', null],
    ['a body without a code', { message: 'old-style prose' }],
    ['an unknown code', { code: 'surprise' }],
  ])('treats an error with %s as a generic error', (_label, body) => {
    // Arrange: submit, capturing whatever error comes back.
    let caught: unknown;
    service.submitContact({ name: '', email: '', message: '' }).subscribe({ error: (err) => (caught = err) });

    // Act: the server fails without a usable code.
    httpMock.expectOne(API_URLS.contact).flush(body, { status: 500, statusText: 'Internal Server Error' });

    // Assert: the caller still gets a code it can translate.
    expect(caught).toEqual({ code: 'error' });
  });
});
