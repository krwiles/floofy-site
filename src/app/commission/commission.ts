import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ParallaxSection } from '../components/parallax-section/parallax-section';
import { TranslatePipe } from '../pipes/translate.pipe';
import { Carousel } from '../components/carousel/carousel';
import { GalleryImageService } from '../services/gallery-image.service';
import { form, FormField } from '@angular/forms/signals';
import { PricingService } from '../services/pricing.service';
import { CurrencyPipe } from '@angular/common';

interface CommissionData {
  name: string;
  email: string;

  commissionType: 'illustration' | 'chibi' | 'emotes';

  description: string;

  referenceLinks: string;

  usageType: 'personal' | 'commercial-tier-1' | 'commercial-tier-2' | 'unsure';

  deadline: string;

  additionalNotes: string;

  tosAccepted: boolean;
}

@Component({
  selector: 'app-commission',
  imports: [Carousel, ParallaxSection, TranslatePipe, FormField, CurrencyPipe],
  templateUrl: './commission.html',
  styleUrl: './commission.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Commission {
  private readonly galleryImageService = inject(GalleryImageService);
  readonly pricingService = inject(PricingService);

  private readonly scrollOffset = 108;
  private readonly scrollFocusClass = 'scroll-focus-highlight';
  private readonly scrollFocusDurationMs = 1600;
  private readonly focusDelay = 1000;

  readonly chibiCarouselImages = this.galleryImageService.chibiImages.map((image) => [image]);
  readonly emoteCarouselImages = this.galleryImageService.emoteImages.map((image) => [image]);
  readonly illustrationCarouselImages = this.galleryImageService.illustrationImages.map((image) => [image]);

  private readonly commissionModel = signal<CommissionData>({
    name: '',
    email: '',

    commissionType: 'chibi',

    description: '',

    referenceLinks: '',

    usageType: 'personal',

    deadline: '',

    additionalNotes: '',

    tosAccepted: false,
  });

  commissionForm = form(this.commissionModel);

  scrollToCommissionTypes(): void {
    this.scrollToElement('commission-types');
  }

  scrollToCommercialUsage(): void {
    this.scrollToElement('commercial-usage');
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
