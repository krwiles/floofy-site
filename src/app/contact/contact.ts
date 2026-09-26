import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { CreateContactRequest } from '../models/contact.model';
import { Hero } from '../components/hero/hero';
import { TranslatePipe } from '../shared/pipes/translate.pipe';
import { email, form, FormField, FormRoot, maxLength, required } from '@angular/forms/signals';
import { ApiService } from '../services/api.service';
import { Flourish } from '../components/flourish/flourish';
import { SectionDivider } from '../components/section-divider/section-divider';
import { SectionHeader } from '../components/section-header/section-header';
import { Section } from '../components/section/section';
import { Card } from '../directives/card';
import { Button } from '../directives/button';
import { SocialLinks } from '../components/social-links/social-links';
import { FormFieldGroup } from '../components/form-field-group/form-field-group';
import { Control } from '../directives/control';
import { FormStatus } from '../components/form-status/form-status';
import { createFormSubmission } from '../forms/form-submission';
import { FormSubmissionStatus } from '../models/form-submission-status';

interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

@Component({
  selector: 'app-contact',
  imports: [
    Hero,
    TranslatePipe,
    FormRoot,
    FormField,
    Flourish,
    SectionDivider,
    SectionHeader,
    Section,
    Card,
    Button,
    SocialLinks,
    FormFieldGroup,
    Control,
    FormStatus,
  ],
  templateUrl: './contact.html',
  styleUrl: './contact.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Contact {
  private readonly apiService = inject(ApiService);
  readonly status = signal<FormSubmissionStatus>({ kind: 'idle', message: '' });

  private readonly contactFormModel = signal<ContactFormData>({
    name: '',
    email: '',
    message: '',
  });

  contactForm = form(
    this.contactFormModel,
    (schemaPath) => {
      required(schemaPath.name, { message: 'Name is required.' });
      required(schemaPath.email, { message: 'Email is required.' });
      required(schemaPath.message, { message: 'Message is required.' });
      maxLength(schemaPath.name, 50, { message: 'Name cannot exceed 50 characters.' });
      maxLength(schemaPath.email, 50, { message: 'Email cannot exceed 50 characters.' });
      maxLength(schemaPath.message, 2000, {
        message: 'Message cannot exceed 2000 characters.',
      });
      email(schemaPath.email, { message: 'Please enter a valid email address.' });
    },
    {
      submission: createFormSubmission({
        pendingMessage: 'Submitting contact...',
        invalidMessage: 'Please correct the errors in the form before submitting.',
        model: this.contactFormModel,
        status: this.status,
        buildRequest: (model): CreateContactRequest => ({
          name: model.name,
          email: model.email,
          message: model.message,
        }),
        submit: (request) => this.apiService.submitContact(request),
        onSuccess: () => {
          this.contactForm().reset({ name: '', email: '', message: '' });
        },
      }),
    },
  );
}
