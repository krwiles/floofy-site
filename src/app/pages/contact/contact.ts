import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { CreateContactRequest } from '../../models/contact.model';
import { Hero } from '../../shared/components/hero/hero';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { email, form, FormField, FormRoot, maxLength, required } from '@angular/forms/signals';
import { ApiService } from '../../services/api.service';
import { Flourish } from '../../shared/components/flourish/flourish';
import { SectionDivider } from '../../shared/components/section-divider/section-divider';
import { SectionHeader } from '../../shared/components/section-header/section-header';
import { Section } from '../../shared/components/section/section';
import { Card } from '../../shared/directives/card';
import { Button } from '../../shared/directives/button';
import { SocialLinks } from '../../shared/components/social-links/social-links';
import { FormFieldGroup } from '../../shared/forms/form-field-group/form-field-group';
import { Control } from '../../shared/directives/control';
import { FormStatus } from '../../shared/forms/form-status/form-status';
import { createFormSubmission } from '../../shared/forms/form-submission';
import { FormSubmissionStatus } from '../../models/form-submission-status';

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
  // The message shown beside the submit button.
  readonly status = signal<FormSubmissionStatus>({ kind: 'idle', key: '' });

  // The form's current values.
  private readonly contactFormModel = signal<ContactFormData>({
    name: '',
    email: '',
    message: '',
  });

  // The form: its validation rules, then what happens on submit.
  contactForm = form(
    this.contactFormModel,
    (schemaPath) => {
      // Every field is required, length-capped to match the Lambda, and the email must look valid.
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
      // Show progress, send the request, then clear the form on success.
      submission: createFormSubmission({
        messages: 'forms.contact',
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
