import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ParallaxSection } from '../components/parallax-section/parallax-section';
import { TranslatePipe } from '../pipes/translate.pipe';
import { Carousel } from '../components/carousel/carousel';
import { GalleryImageService } from '../services/gallery-image.service';
import { form, FormField } from '@angular/forms/signals';

interface CommissionData {
  name: string;
  email: string;

  commissionType: 'illustration' | 'chibi' | 'emote';

  description: string;

  referenceLinks: string;

  usageType: 'personal' | 'commercial-tier-1' | 'commercial-tier-2' | 'unsure';

  deadline: string;

  additionalNotes: string;

  tosAccepted: boolean;
}

@Component({
  selector: 'app-commission',
  imports: [Carousel, ParallaxSection, TranslatePipe, FormField],
  templateUrl: './commission.html',
  styleUrl: './commission.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Commission {
  private readonly galleryImageService = inject(GalleryImageService);
  private readonly scrollOffset = 120;

  readonly chibiCarouselImages = this.galleryImageService.chibiImages.map((image) => [image]);
  readonly emoteCarouselImages = this.galleryImageService.emoteImages.map((image) => [image]);
  readonly illustrationCarouselImages = this.galleryImageService.illustrationImages.map((image) => [
    image,
  ]);

  private readonly commissionModel = signal<CommissionData>({
    name: '',
    email: '',

    commissionType: 'illustration',

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

  scrollToTermsOfService(): void {
    this.scrollToElement('terms-of-service');
  }

  private scrollToElement(elementId: string): void {
    const target = document.getElementById(elementId);

    if (!target) {
      return;
    }

    const top = target.getBoundingClientRect().top + window.scrollY - this.scrollOffset;

    window.scrollTo({
      top,
      behavior: 'smooth',
    });

    const focusTarget = target as HTMLElement;
    const hadTabIndex = focusTarget.hasAttribute('tabindex');

    if (!hadTabIndex) {
      focusTarget.setAttribute('tabindex', '-1');
    }

    // Delay focus slightly so the element is visible when the outline appears.
    window.setTimeout(() => {
      focusTarget.focus({ preventScroll: true });

      if (!hadTabIndex) {
        const cleanup = () => {
          focusTarget.removeAttribute('tabindex');
          focusTarget.removeEventListener('blur', cleanup);
        };

        focusTarget.addEventListener('blur', cleanup);
      }
    }, 220);
  }
}
