import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of, Subject, throwError } from 'rxjs';

import { Reviews } from './reviews';
import { ApiService } from '../../services/api.service';
import { Review } from '../../models/review.model';

const REVIEW: Review = { id: 7, author: 'Robin', comment: 'Lovely art!', created_at: '2026-09-30T04:00:00Z' };

describe('Reviews', () => {
  let fixture: ComponentFixture<Reviews>;
  let api: { getReviews: ReturnType<typeof vi.fn>; submitReview: ReturnType<typeof vi.fn> };

  /** Render the page, with the first reviews request answered by `firstLoad`. */
  async function create(firstLoad: Observable<Review[]>): Promise<void> {
    // A fake ApiService: the list comes from `firstLoad`, and posting a review always succeeds.
    api = { getReviews: vi.fn(() => firstLoad), submitReview: vi.fn(() => of({ code: 'ok' })) };

    // Start in English: no saved language from an earlier test.
    localStorage.clear();

    // Render the real page with the fake API (real English translations).
    await TestBed.configureTestingModule({
      imports: [Reviews],
      providers: [{ provide: ApiService, useValue: api }],
    }).compileComponents();
    fixture = TestBed.createComponent(Reviews);
    await fixture.whenStable();
  }

  /** The visible text of the reviews section (the first section after the hero). */
  function listText(): string {
    return fixture.nativeElement.querySelector('app-section').textContent;
  }

  /** How many review cards are showing. */
  function reviewCount(): number {
    return fixture.nativeElement.querySelectorAll('ol li').length;
  }

  it('says the reviews are loading until the list arrives', async () => {
    // Act: render with a list request that hasn't answered yet.
    await create(new Subject<Review[]>());

    // Assert: the loading message, and no cards.
    expect(listText()).toContain('Reviews loading...');
    expect(reviewCount()).toBe(0);
  });

  it('says there are no reviews yet when the list is empty', async () => {
    // Act: render with an empty list.
    await create(of([]));

    // Assert: the empty message instead of "loading".
    expect(listText()).toContain('No reviews yet');
    expect(listText()).not.toContain('Reviews loading...');
  });

  it("says the reviews couldn't load when the request fails", async () => {
    // Act: render with a failing list request.
    await create(throwError(() => ({ code: 'error' })));

    // Assert: the failure message instead of "loading".
    expect(listText()).toContain("Couldn't load reviews");
    expect(listText()).not.toContain('Reviews loading...');
  });

  it('shows each review once the list arrives', async () => {
    // Act: render with one review.
    await create(of([REVIEW]));

    // Assert: one card, with its comment.
    expect(reviewCount()).toBe(1);
    expect(listText()).toContain('Lovely art!');
  });

  it('keeps the reviews already showing if a later refresh fails', async () => {
    // Arrange: one review showing, and the next request will fail.
    await create(of([REVIEW]));
    api.getReviews.mockReturnValue(throwError(() => ({ code: 'error' })));

    // Act: refresh the list.
    fixture.componentInstance.requestReviews();
    await fixture.whenStable();

    // Assert: the review is still there, with no failure message.
    expect(reviewCount()).toBe(1);
    expect(listText()).not.toContain("Couldn't load reviews");
  });

  it('refuses a review whose name is only spaces', async () => {
    // Arrange: a page with no reviews, and a form filled in with a blank name.
    await create(of([]));
    const form: HTMLElement = fixture.nativeElement.querySelector('form');
    const name = form.querySelector('input[type="text"]') as HTMLInputElement;
    const comment = form.querySelector('textarea') as HTMLTextAreaElement;
    const agreement = form.querySelector('input[type="checkbox"]') as HTMLInputElement;
    name.value = '   ';
    name.dispatchEvent(new Event('input'));
    comment.value = 'Lovely art!';
    comment.dispatchEvent(new Event('input'));
    agreement.click();

    // Act: submit.
    (form.querySelector('button[type="submit"]') as HTMLButtonElement).click();
    await fixture.whenStable();

    // Assert: nothing was sent, and the field explains why.
    expect(api.submitReview).not.toHaveBeenCalled();
    expect(form.textContent).toContain('Name is required.');
  });
});
