import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ParallaxSection } from '../components/parallax-section/parallax-section';
import { TranslatePipe } from '../pipes/translate.pipe';
import { ReviewsService } from '../services/reviews.service';
import { DatePipe } from '@angular/common';
import { Review, ReviewSubmission, ServerResponse } from '../models/review';
import { App } from '../app';
import { form, FormField, FormRoot, max, maxLength, required, submit } from '@angular/forms/signals';
import { HttpErrorResponse } from '@angular/common/http';

interface ReviewData {
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

  private readonly reviewModel = signal<ReviewData>({
    author: '',
    comment: '',
    agreement: false,
  });

  // Form configuration for the review submission form
  reviewForm = form(
    this.reviewModel,
    (schemaPath) => {
      required(schemaPath.author, { message: 'Name is required.' });
      required(schemaPath.comment, { message: 'Review is required.' });
      required(schemaPath.agreement, { message: 'You must agree to the terms and conditions.' });
      maxLength(schemaPath.author, 50, { message: 'Name cannot exceed 50 characters.' });
      maxLength(schemaPath.comment, 2000, { message: 'Review cannot exceed 2000 characters.' });
    },
    {
      submission: {
        action: async () => {
          this.status.set('Submitting review...');
          this.statusElement?.classList.remove('text-success', 'text-error');

          // Prepare the review submission data
          const reviewSubmission: ReviewSubmission = {
            author: this.reviewModel().author,
            comment: this.reviewModel().comment,
          };

          // Send the review submission to the backend service
          this.reviewsService.submitReview(reviewSubmission).subscribe({
            next: (reply: ServerResponse) => {
              console.log('server response:', reply);
              this.status.set(reply.message);
              this.statusElement?.classList.add('text-success');
              this.statusElement?.classList.remove('text-error');
              this.requestReviews(); // Refresh the reviews list after successful submission
            },
            error: (err: HttpErrorResponse) => {
              console.log('server error:', err.error ?? err.message);
              this.status.set(err.error?.message ?? err.message);
              this.statusElement?.classList.add('text-error');
              this.statusElement?.classList.remove('text-success');
            },
          });

          console.log('Backend POST sent');
        },
      },
    },
  );

  ngOnInit(): void {
    this.requestReviews();
    this.statusElement = document.getElementById('review-status');
  }

  requestReviews(): void {
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
