import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Hero } from '../components/hero/hero';
import { TranslatePipe } from '../pipes/translate.pipe';
import { ApiService } from '../services/api.service';
import { DatePipe } from '@angular/common';
import { CreateReviewRequest, Review } from '../models/review.model';
import { form, FormField, FormRoot, maxLength, required } from '@angular/forms/signals';
import { Reveal } from '../directives/reveal';
import { SectionDivider } from '../components/section-divider/section-divider';
import { SectionHeader } from '../components/section-header/section-header';
import { Section } from '../components/section/section';
import { Card } from '../directives/card';
import { Button } from '../directives/button';
import { FormFieldGroup } from '../components/form-field-group/form-field-group';
import { Control } from '../directives/control';
import { CheckboxField } from '../components/checkbox-field/checkbox-field';
import { FormStatus } from '../components/form-status/form-status';
import { createFormSubmission } from '../forms/form-submission';
import { FormSubmissionStatus } from '../models/form-submission-status';

interface ReviewFormValue {
  author: string;
  comment: string;
  agreement: boolean;
}

@Component({
  selector: 'app-reviews',
  imports: [
    Hero,
    TranslatePipe,
    DatePipe,
    FormField,
    FormRoot,
    Reveal,
    SectionDivider,
    SectionHeader,
    Section,
    Card,
    Button,
    FormFieldGroup,
    Control,
    CheckboxField,
    FormStatus,
  ],
  templateUrl: './reviews.html',
  styleUrl: './reviews.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Reviews implements OnInit {
  private readonly apiService = inject(ApiService);
  readonly reviews = signal<Review[]>([]);
  readonly status = signal<FormSubmissionStatus>({ kind: 'idle', message: '' });

  private readonly reviewModel = signal<ReviewFormValue>({
    author: '',
    comment: '',
    agreement: false,
  });

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
      submission: createFormSubmission({
        pendingMessage: 'Submitting review...',
        invalidMessage: 'Please correct the errors in the form before submitting.',
        model: this.reviewModel,
        status: this.status,
        buildRequest: (model): CreateReviewRequest => ({
          author: model.author,
          comment: model.comment,
        }),
        submit: (request) => this.apiService.submitReview(request),
        onSuccess: () => {
          // Refresh the reviews list after a successful submission to display the newly added review.
          this.requestReviews();
          // Reset the form, matching contact's own established pattern -- /code-review flagged that without
          // this, the form stayed populated and valid, so a second click (double-click, or an unsure user)
          // would silently re-post the identical review. The original pre-migration code didn't do this
          // either, so this is a deliberate small fix, not a preserved behavior.
          this.reviewForm().reset({ author: '', comment: '', agreement: false });
        },
      }),
    },
  );

  ngOnInit(): void {
    this.requestReviews();
  }

  requestReviews(): void {
    this.apiService.getReviews().subscribe({
      next: (reviews) => {
        // Each review card carries appReveal, which registers itself with RevealService on creation -- no
        // manual re-scan needed here.
        this.reviews.set(reviews);
      },
      error: () => {
        // Silently keeps today's "Reviews loading..." placeholder state -- matches existing behavior, not
        // introduced by this migration.
      },
    });
  }
}
