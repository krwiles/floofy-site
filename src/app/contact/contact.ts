import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import type { CreateContactRequest } from '../models/contact.model';
import { ParallaxSection } from '../components/parallax-section/parallax-section';
import { TranslatePipe } from '../pipes/translate.pipe';
import { email, form, FormField, FormRoot, maxLength, required } from '@angular/forms/signals';
import { ContactService } from '../services/contact.service';

interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

@Component({
  selector: 'app-contact',
  imports: [ParallaxSection, TranslatePipe, FormRoot, FormField],
  templateUrl: './contact.html',
  styleUrl: './contact.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Contact implements OnInit {
  private readonly contactService = inject(ContactService);
  readonly status = signal<string>('');
  statusElement: HTMLElement | null = null;

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
      submission: {
        action: async () => {
          // Indicate to UI that the contact submission is in progress
          this.status.set('Submitting contact...');
          this.statusElement?.classList.remove('text-success', 'text-error');

          // Prepare the contact submission data to be sent to the backend service
          const contactRequest: CreateContactRequest = {
            name: this.contactFormModel().name,
            email: this.contactFormModel().email,
            message: this.contactFormModel().message,
          };

          // Send the contact submission to the backend service (HttpClient returns an Observable that we subscribe to)
          this.contactService.submitContact(contactRequest).subscribe({
            next: (reply) => {
              console.log('server response:', reply);
              // Update the status message and UI to indicate successful contact submission
              this.status.set(reply.message);
              this.statusElement?.classList.add('text-success');
              this.contactForm().reset({
                name: '',
                email: '',
                message: '',
              });
            },
            error: (err) => {
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
    this.statusElement = document.getElementById('contact-status');
  }
}
