import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { ParallaxSection } from '../components/parallax-section/parallax-section';
import { TranslatePipe } from '../pipes/translate.pipe';
import { Carousel } from '../components/carousel/carousel';
import { GalleryImageService } from '../services/gallery-image.service';
import { email, form, FormField, FormRoot, maxLength, required } from '@angular/forms/signals';
import { PricingService } from '../services/pricing.service';
import { CurrencyPipe, PercentPipe } from '@angular/common';

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
      maxLength(schemaPath.email, 100, { message: 'Email cannot exceed 100 characters.' });
      maxLength(schemaPath.description, 2000, { message: 'Description cannot exceed 2000 characters.' });
      maxLength(schemaPath.referenceLinks, 2000, { message: 'Reference links cannot exceed 2000 characters.' });
      maxLength(schemaPath.additionalNotes, 2000, { message: 'Additional notes cannot exceed 2000 characters.' });
      email(schemaPath.email, { message: 'Please enter a valid email address.' });
    },
    {
      submission: {
        action: async () => {
          // Indicate to UI that the review submission is in progress
          this.status.set('Submitting review...');
          this.statusElement?.classList.remove('text-success', 'text-error');

          this.status.set(
            'Form submitted! Thank you for your commission request. I will review the details and get back to you as soon as possible.',
          );
          this.statusElement?.classList.add('text-success');

          console.log('Commission form submitted:', this.commissionModel());
        },
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
