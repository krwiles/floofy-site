import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ParallaxSection } from '../components/parallax-section/parallax-section';
import { TranslatePipe } from '../pipes/translate.pipe';
import { ReviewsService } from '../services/reviews.service';
import { DatePipe } from '@angular/common';
import { CreateReviewRequest, CreateReviewResponse, Review } from '../models/review.model';
import { App } from '../app';
import { form, FormField, FormRoot, max, maxLength, required, submit } from '@angular/forms/signals';
import { HttpErrorResponse } from '@angular/common/http';

interface ReviewFormValue {
  author: string;
  comment: string;
  agreement: boolean;
}

@Component({
  selector: 'app-reviews',
  imports: [ParallaxSection, TranslatePipe, DatePipe, FormField, FormRoot],
  templateUrl: './reviews.html',
  styleUrl: './reviews.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Reviews implements OnInit {
  private readonly reviewsService = inject(ReviewsService);
  private readonly app = inject(App, { optional: true });
  readonly reviews = signal<Review[]>([]);
  readonly status = signal<string>('');
  statusElement: HTMLElement | null = null;

  private readonly reviewModel = signal<ReviewFormValue>({
    author: '',
    comment: '',
    agreement: false,
  });

  // Form configuration for the review submission form
  reviewForm = form(
    this.reviewModel,
    // Validation rules for the form fields
    (schemaPath) => {
      required(schemaPath.author, { message: 'Name is required.' });
      required(schemaPath.comment, { message: 'Review is required.' });
      required(schemaPath.agreement, { message: 'You must agree to the terms and conditions.' });
      maxLength(schemaPath.author, 50, { message: 'Name cannot exceed 50 characters.' });
      maxLength(schemaPath.comment, 2000, { message: 'Review cannot exceed 2000 characters.' });
    },
    // Submission configuration for the form
    {
      submission: {
        action: async () => {
          // Indicate to UI thet the review submission is in progress
          this.status.set('Submitting review...');
          this.statusElement?.classList.remove('text-success', 'text-error');

          // Prepare the review submission data to be sent to the backend service
          const reviewRequest: CreateReviewRequest = {
            author: this.reviewModel().author,
            comment: this.reviewModel().comment,
          };

          // Send the review submission to the backend service (HttpClient returns an Observable that we subscribe to)
          this.reviewsService.submitReview(reviewRequest).subscribe({
            next: (reply: CreateReviewResponse) => {
              console.log('server response:', reply);
              // Update the status message and UI to indicate successful submission
              this.status.set(reply.message);
              this.statusElement?.classList.add('text-success');
              this.requestReviews(); // Refresh the reviews list after successful submission to display the newly added review
            },
            error: (err: HttpErrorResponse) => {
              console.log('server error:', err.error ?? err.message);
              // Update the status message and UI to indicate an error from the server
              this.status.set(err.error?.message ?? err.message);
              this.statusElement?.classList.add('text-error');
            },
          });

          // Log to console that the POST request has been sent (the actual response will be handled in the subscription above)
          console.log('Backend POST sent');
        },
        // When the user submits the form but it is invalid, we update the status message and UI to indicate that there are errors in the form.
        onInvalid: () => {
          this.status.set('Please correct the errors in the form before submitting.');
          this.statusElement?.classList.add('text-error');
          this.statusElement?.classList.remove('text-success');
        },
      },
    },
  );

  ngOnInit(): void {
    this.requestReviews();
    this.statusElement = document.getElementById('review-status');
  }

  requestReviews(): void {
    // Request from the backend service
    this.reviewsService.getReviews().subscribe({
      next: (reviews) => {
        console.log('GET reviews:', reviews);
        this.reviews.set(reviews);

        // Re-scan animate-on-scroll elements after Angular renders the fetched reviews.
        setTimeout(() => {
          this.app?.observerInit();
        }, 0);
      },
      error: (err) => {
        console.log('GET error:', err);
      },
    });
  }
}
