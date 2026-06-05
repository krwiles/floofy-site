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

  usageType: 'personal' | 'commercial' | 'unsure';

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
}
