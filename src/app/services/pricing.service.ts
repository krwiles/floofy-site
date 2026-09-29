import { Injectable, LOCALE_ID, inject } from '@angular/core';
import { formatPercent } from '@angular/common';
import pricingJson from '../../assets/data/pricing.json';
import { ArtworkCategory } from '../models/artwork-category';
import { ArtworkCategoryPricing, PricingData, UsageTypeId, UsageTypePricing } from '../models/pricing.model';

@Injectable({
  providedIn: 'root',
})
export class PricingService {
  private readonly locale = inject(LOCALE_ID);

  // Narrow the JSON's plain-string ids to the domain types; the JSON import alone types them as `string`.
  readonly data: PricingData = {
    artworkCategories: pricingJson.artworkCategories.map((category) => ({
      id: category.id as ArtworkCategory,
      basePriceUsd: category.basePriceUsd,
    })),
    usageTypes: pricingJson.usageTypes.map((type) => ({
      id: type.id as UsageTypeId,
      percentAddon: type.percentAddon,
    })),
  };

  getArtworkCategoryPricing(id: ArtworkCategory): ArtworkCategoryPricing | undefined {
    return this.data.artworkCategories.find((category) => category.id === id);
  }

  getBasePriceUsd(id: ArtworkCategory): number | undefined {
    return this.getArtworkCategoryPricing(id)?.basePriceUsd;
  }

  getUsageTypePricing(id: UsageTypeId): UsageTypePricing | undefined {
    return this.data.usageTypes.find((type) => type.id === id);
  }

  getPercentAddon(id: UsageTypeId): number | undefined {
    return this.getUsageTypePricing(id)?.percentAddon;
  }

  /** Mechanical move from `Commission`'s own `totalPriceUsd` -- same formula, no behavior change. */
  getTotalPriceUsd(artworkCategory: ArtworkCategory, usageTypeId: UsageTypeId | 'unsure'): number {
    // The form's 'unsure' has no price entry, so it adds nothing on top of the base price.
    const addon = usageTypeId === 'unsure' ? 0 : (this.getPercentAddon(usageTypeId) ?? 0);
    // A category missing from the JSON prices at zero rather than throwing.
    return (this.getBasePriceUsd(artworkCategory) ?? 0) * (addon + 1);
  }

  /** A usage type's addon as a whole-number percent ("50%"), shared by the terms cards and the request form. */
  formatPercentAddon(id: UsageTypeId): string {
    // formatPercent is PercentPipe's own formatter, so '1.0-0' rounds exactly as the page always has.
    return formatPercent(this.getPercentAddon(id) ?? 0, this.locale, '1.0-0');
  }
}
