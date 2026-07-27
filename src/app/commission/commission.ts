import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { ParallaxSection } from '../components/parallax-section/parallax-section';
import { TranslatePipe } from '../pipes/translate.pipe';
import { Carousel } from '../components/carousel/carousel';
import { GalleryImageService } from '../services/gallery-image.service';
import { email, form, FormField, FormRoot, maxLength, required } from '@angular/forms/signals';
import { PricingService } from '../services/pricing.service';
import { CurrencyPipe, PercentPipe } from '@angular/common';
import { CreateCommissionRequest } from '../models/commission.model';
import { CommissionService } from '../services/commission.service';

interface CommissionFormValue {
  name: string;
  email: string;
  commissionType: 'illustration' | 'chibi' | 'emotes';
  description: string;
  referenceLinks: string;
  usageType: 'personal' | 'promotion' | 'distribution' | 'products' | 'unsure';
  usageExplanation: string;
  deadline: string;
  additionalNotes: string;
  tosAccepted: boolean;
}

@Component({
  selector: 'app-commission',
  imports: [Carousel, ParallaxSection, TranslatePipe, FormField, CurrencyPipe, PercentPipe, FormRoot],
  templateUrl: './commission.html',
  styleUrl: './commission.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Commission implements OnInit {
  private readonly galleryImageService = inject(GalleryImageService);
  private readonly commissionService = inject(CommissionService);
  readonly pricingService = inject(PricingService);
  readonly status = signal<string>('');
  statusElement: HTMLElement | null = null;

  private readonly scrollOffset = 108;
  private readonly scrollFocusClass = 'scroll-focus-highlight';
  private readonly scrollFocusDurationMs = 1600;
  private readonly focusDelay = 1000;

  readonly chibiCarouselImages = this.galleryImageService.chibiImages.map((image) => [image]);
  readonly emoteCarouselImages = this.galleryImageService.emoteImages.map((image) => [image]);
  readonly illustrationCarouselImages = this.galleryImageService.illustrationImages.map((image) => [image]);

  private readonly commissionModel = signal<CommissionFormValue>({
    name: '',
    email: '',
    commissionType: 'chibi',
    description: '',
    referenceLinks: '',
    usageType: 'personal',
    usageExplanation: '',
    deadline: '',
    additionalNotes: '',
    tosAccepted: false,
  });

  commissionForm = form(
    this.commissionModel,
    (schemaPath) => {
      required(schemaPath.name, { message: 'Name is required.' });
      required(schemaPath.email, { message: 'Email is required.' });
      required(schemaPath.description, { message: 'Description is required.' });
      required(schemaPath.usageType, { message: 'Usage type is required.' });
      required(schemaPath.tosAccepted, { message: 'You must accept the terms of service to submit the form.' });
      required(schemaPath.usageExplanation, { message: 'Usage explanation is required.' });
      maxLength(schemaPath.email, 50, { message: 'Email cannot exceed 50 characters.' });
      maxLength(schemaPath.name, 50, { message: 'Name cannot exceed 50 characters.' });
      maxLength(schemaPath.description, 2000, { message: 'Description cannot exceed 2000 characters.' });
      maxLength(schemaPath.referenceLinks, 2000, { message: 'Reference links cannot exceed 2000 characters.' });
      maxLength(schemaPath.additionalNotes, 2000, { message: 'Additional notes cannot exceed 2000 characters.' });
      maxLength(schemaPath.usageExplanation, 1000, { message: 'Usage explanation cannot exceed 1000 characters.' });
      email(schemaPath.email, { message: 'Please enter a valid email address.' });
    },
    {
      submission: {
        action: async () => {
          // Indicate to UI that the commission submission is in progress
          this.status.set('Submitting commission...');
          this.statusElement?.classList.remove('text-success', 'text-error');

          // Prepare the commission submission data to be sent to the backend service
          const commissionRequest: CreateCommissionRequest = {
            name: this.commissionModel().name,
            email: this.commissionModel().email,
            commissionType: this.commissionModel().commissionType,
            description: this.commissionModel().description,
            referenceLinks: this.commissionModel().referenceLinks,
            usageType: this.commissionModel().usageType,
            usageExplanation: this.commissionModel().usageExplanation,
            estimatedPrice: this.totalPriceUsd(this.commissionModel().commissionType, this.commissionModel().usageType),
            deadline: this.commissionModel().deadline,
            additionalNotes: this.commissionModel().additionalNotes,
          };

          // Send the commission submission to the backend service (HttpClient returns an Observable that we subscribe to)
          this.commissionService.submitCommission(commissionRequest).subscribe({
            next: (reply) => {
              console.log('server response:', reply);
              // Update the status message and UI to indicate successful submission
              this.status.set(reply.message);
              this.statusElement?.classList.add('text-success');
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
    this.statusElement = document.getElementById('commission-form-status');
  }

  scrollToCommissionTypes(): void {
    this.scrollToElement('commission-types');
  }

  scrollToArtworkUsage(): void {
    this.scrollToElement('artwork-usage');
  }

  scrollToTerms(): void {
    this.scrollToElement('commission-terms');
  }

  scrollToForm(type: 'illustration' | 'chibi' | 'emotes'): void {
    this.scrollToElement('commission-form', false);
    this.commissionForm.commissionType().value.set(type);
  }

  private scrollToElement(elementId: string, shouldFocus = true): void {
    const target = document.getElementById(elementId);

    if (!target) {
      return;
    }

    const top = target.getBoundingClientRect().top + window.scrollY - this.scrollOffset;

    window.scrollTo({
      top,
      behavior: 'smooth',
    });

    if (!shouldFocus) {
      return;
    }

    const focusTarget = target as HTMLElement;
    const hadTabIndex = focusTarget.hasAttribute('tabindex');

    if (!hadTabIndex) {
      focusTarget.setAttribute('tabindex', '-1');
    }

    // Delay focus slightly so the element is visible when the outline appears.
    window.setTimeout(() => {
      focusTarget.focus({ preventScroll: true });
      focusTarget.classList.add(this.scrollFocusClass);

      window.setTimeout(() => {
        focusTarget.classList.remove(this.scrollFocusClass);
      }, this.scrollFocusDurationMs);

      if (!hadTabIndex) {
        const cleanupTabIndex = () => {
          focusTarget.removeAttribute('tabindex');
          focusTarget.removeEventListener('blur', cleanupTabIndex);
        };

        focusTarget.addEventListener('blur', cleanupTabIndex);
      }
    }, this.focusDelay);
  }

  totalPriceUsd(commission: string, commercial: string): number {
    const multiplier = (this.pricingService.getPercentAddon(commercial) ?? 0) + 1;
    return (this.pricingService.getBasePriceUsd(commission) ?? 0) * multiplier;
  }
}
