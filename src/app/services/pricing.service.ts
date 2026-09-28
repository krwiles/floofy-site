import { Injectable } from '@angular/core';
import pricingJson from '../../assets/data/pricing.json';
import { ArtworkCategory } from '../models/artwork-category';
import { CommissionTypePricing, PricingData, UsageTypeId, UsageTypePricing } from '../models/pricing.model';

@Injectable({
  providedIn: 'root',
})
export class PricingService {
  readonly data: PricingData = {
    commissionTypes: pricingJson.commissionTypes.map((type) => ({
      id: type.id as ArtworkCategory,
      basePriceUsd: type.basePriceUsd,
    })),
    usageTypes: pricingJson.usageTypes.map((type) => ({
      id: type.id as UsageTypeId,
      percentAddon: type.percentAddon,
    })),
  };

  getCommissionTypePricing(id: string): CommissionTypePricing | undefined {
    return this.data.commissionTypes.find((type) => type.id === id);
  }

  getBasePriceUsd(id: string): number | undefined {
    return this.getCommissionTypePricing(id)?.basePriceUsd;
  }

  getUsageTypePricing(id: string): UsageTypePricing | undefined {
    return this.data.usageTypes.find((type) => type.id === id);
  }

  getPercentAddon(id: string): number | undefined {
    return this.getUsageTypePricing(id)?.percentAddon;
  }

  /** Mechanical move from `Commission`'s own `totalPriceUsd` -- same formula, no behavior change. */
  getTotalPriceUsd(artworkCategory: string, usageTypeId: string): number {
    // Unknown usage types (e.g. the form's 'unsure') add nothing on top of the base price.
    const multiplier = (this.getPercentAddon(usageTypeId) ?? 0) + 1;
    // Unknown categories price at zero rather than throwing.
    return (this.getBasePriceUsd(artworkCategory) ?? 0) * multiplier;
  }
}
