import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ArtworkCategory } from '../../../models/artwork-category';
import { GalleryImageService } from '../../../services/gallery-image.service';
import { I18nService } from '../../../services/i18n.service';
import { PricingService } from '../../../services/pricing.service';
import { Button } from '../../../shared/directives/button';
import { Card } from '../../../shared/directives/card';
import { Reveal } from '../../../shared/directives/reveal';
import { SlideshowCarousel } from '../../../shared/components/slideshow-carousel/slideshow-carousel';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { PRICING_LIST_ORDER } from '../commission-content';

/** One commission pricing card: title, base price, sample carousel, the five shared lists, and a pick CTA. */
@Component({
  selector: 'app-pricing-card',
  imports: [CurrencyPipe, Button, Card, Reveal, SlideshowCarousel, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div appCard tone="dark" class="p-8">
      <h3 appReveal class="text-2xl font-black text-on-dark-heading">
        {{ 'commission.cards.' + category() + '.title' | translate }}
      </h3>
      <p appReveal class="mt-6 flex items-baseline">
        <span class="text-5xl font-extrabold text-on-dark-heading">
          {{ pricing.getBasePriceUsd(category()) | currency: 'USD' : 'symbol' : '2.0-0' }}
        </span>
        <span class="ml-2 text-base font-semibold tracking-wide text-on-dark-body-subtle uppercase">USD</span>
      </p>

      <div appReveal class="mt-6" [class]="carouselShape()">
        <app-slideshow-carousel appCard tone="dark" [images]="images()" />
      </div>

      <div class="mt-6 space-y-4 text-sm leading-7 text-on-dark-body">
        @for (list of lists(); track list.id) {
          <div appReveal>
            <p class="text-xs font-semibold tracking-[0.2em] text-on-dark-heading uppercase">
              {{ 'commission.labels.' + list.id | translate }}
            </p>
            <ul class="mt-1 list-disc space-y-1 pl-5">
              @for (item of list.items; track $index) {
                <li>{{ item }}</li>
              }
            </ul>
          </div>
        }
      </div>

      <button
        type="button"
        (click)="pick.emit(category())"
        appReveal
        appButton
        variant="primary"
        tone="dark"
        class="mt-8"
      >
        {{ 'commission.cards.' + category() + '.cta' | translate }}
      </button>
    </div>
  `,
})
export class PricingCard {
  private readonly i18n = inject(I18nService);
  private readonly gallery = inject(GalleryImageService);
  protected readonly pricing = inject(PricingService);

  readonly category = input.required<ArtworkCategory>();
  /** The carousel's aspect-ratio class, from `CAROUSEL_SHAPE`. */
  readonly carouselShape = input.required<string>();
  /** Fires with this card's category when its call-to-action is clicked. */
  readonly pick = output<ArtworkCategory>();

  // This category's commission-page samples from the gallery collection.
  protected readonly images = computed(() => this.gallery.imagesFor('commission', this.category()));

  // Each of the five shared lists with this card's own entries; re-reads on a locale change.
  protected readonly lists = computed(() =>
    PRICING_LIST_ORDER.map((id) => ({ id, items: this.i18n.list(`commission.cards.${this.category()}.${id}`) })),
  );
}
