import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { ParallaxSection } from '../components/parallax-section/parallax-section';
import { TranslatePipe } from '../pipes/translate.pipe';
import { email, form, FormField, FormRoot, maxLength, required } from '@angular/forms/signals';

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
      maxLength(schemaPath.email, 100, { message: 'Email cannot exceed 100 characters.' });
      maxLength(schemaPath.message, 2000, {
        message: 'Message cannot exceed 2000 characters. Further details can be provided in a follow-up discussion.',
      });
      email(schemaPath.email, { message: 'Please enter a valid email address.' });
    },
    {
      submission: {
        action: async () => {
          // TODO: Implement actual message sending logic here, such as calling a backend service or API to send the message.

          this.status.set(
            'Message sent! Thank you for reaching out. I will get back to you as soon as possible. A confirmation email has been sent to your provided email address.',
          );

          this.statusElement?.classList.remove('text-error');
          this.statusElement?.classList.add('text-success');
          this.contactForm().reset();
          console.log('Form submitted:', this.contactFormModel());
        },
        onInvalid: () => {
          console.log('Form is invalid. Please correct the errors.');
          this.status.set('Please correct the errors in the form before submitting.');
          this.statusElement?.classList.remove('text-success');
          this.statusElement?.classList.add('text-error');
        },
      },
    },
  );

  ngOnInit(): void {
    this.statusElement = document.getElementById('contact-status');
  }
}
