import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Hero } from '../../shared/components/hero/hero';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { ApiService } from '../../services/api.service';
import { DatePipe } from '@angular/common';
import { CreateReviewRequest, Review } from '../../models/review.model';
import { form, FormField, FormRoot, maxLength, required } from '@angular/forms/signals';
import { Reveal } from '../../shared/directives/reveal';
import { SectionDivider } from '../../shared/components/section-divider/section-divider';
import { SectionHeader } from '../../shared/components/section-header/section-header';
import { Section } from '../../shared/components/section/section';
import { Card } from '../../shared/directives/card';
import { Button } from '../../shared/directives/button';
import { FormFieldGroup } from '../../shared/forms/form-field-group/form-field-group';
import { Control } from '../../shared/directives/control';
import { CheckboxField } from '../../shared/forms/checkbox-field/checkbox-field';
import { FormStatus } from '../../shared/forms/form-status/form-status';
import { createFormSubmission } from '../../shared/forms/form-submission';
import { FormSubmissionStatus } from '../../models/form-submission-status';

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
  // Every visible review, newest first (empty until loaded).
  readonly reviews = signal<Review[]>([]);
  // The message shown beside the submit button.
  readonly status = signal<FormSubmissionStatus>({ kind: 'idle', key: '' });

  // The form's current values.
  private readonly reviewModel = signal<ReviewFormValue>({
    author: '',
    comment: '',
    agreement: false,
  });

  // The form: its validation rules, then what happens on submit.
  reviewForm = form(
    this.reviewModel,
    (schemaPath) => {
      // Name, review and the terms checkbox are required; lengths match the Lambda's limits.
      required(schemaPath.author, { message: 'Name is required.' });
      required(schemaPath.comment, { message: 'Review is required.' });
      required(schemaPath.agreement, { message: 'You must agree to the terms and conditions.' });
      maxLength(schemaPath.author, 50, { message: 'Name cannot exceed 50 characters.' });
      maxLength(schemaPath.comment, 2000, { message: 'Review cannot exceed 2000 characters.' });
    },
    {
      // Show progress, send the review, then refresh the list and clear the form on success.
      submission: createFormSubmission({
        i18nPrefix: 'forms.review',
        model: this.reviewModel,
        status: this.status,
        buildRequest: (model): CreateReviewRequest => ({
          author: model.author,
          comment: model.comment,
        }),
        submit: (request) => this.apiService.submitReview(request),
        onSuccess: () => {
          // Reload the list so the new review appears.
          // Refresh the reviews list after a successful submission to display the newly added review.
          this.requestReviews();
          // Clear the form, so a double-click can't post the same review twice.
          this.reviewForm().reset({ author: '', comment: '', agreement: false });
        },
      }),
    },
  );

  ngOnInit(): void {
    // Load reviews when the page opens.
    this.requestReviews();
  }

  requestReviews(): void {
    // Fetch reviews and show them.
    this.apiService.getReviews().subscribe({
      next: (reviews) => {
        // Each card's appReveal registers itself, so nothing needs re-scanning here.
        this.reviews.set(reviews);
      },
      error: () => {
        // On failure, leave the "loading" placeholder showing.
      },
    });
  }
}
