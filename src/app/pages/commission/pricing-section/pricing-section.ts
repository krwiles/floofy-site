import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { ArtworkCategory } from '../../../models/artwork-category';
import { Section } from '../../../shared/components/section/section';
import { SectionHeader } from '../../../shared/components/section-header/section-header';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { PricingCard } from '../pricing-card/pricing-card';
import { CAROUSEL_SHAPE, PRICING_CARD_ORDER } from '../commission-content';

/** The commission pricing section: one `PricingCard` per artwork category, in `PRICING_CARD_ORDER`. */
@Component({
  selector: 'app-pricing-section',
  imports: [Section, SectionHeader, TranslatePipe, PricingCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <app-section tone="dark">
      <div class="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div id="commission-types" class="rounded-4xl">
          <app-section-header
            [eyebrow]="'commission.pricing_section.kicker' | translate"
            [title]="'commission.pricing_section.title' | translate"
            [description]="'commission.pricing_section.description' | translate"
            tone="dark"
          />

          <div class="grid gap-6 lg:grid-cols-3">
            @for (category of cardOrder; track category) {
              <app-pricing-card
                [category]="category"
                [carouselShape]="carouselShape[category]"
                (pick)="pick.emit($event)"
              />
            }
          </div>
        </div>
      </div>
    </app-section>
  `,
})
export class PricingSection {
  protected readonly cardOrder = PRICING_CARD_ORDER;
  protected readonly carouselShape = CAROUSEL_SHAPE;

  /** Fires with the category whose call-to-action was clicked; the page hands it to the request form. */
  readonly pick = output<ArtworkCategory>();
}
