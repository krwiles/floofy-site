import { ArtworkCategory } from './artwork-category';

/** The priced usage types -- see CONTEXT.md's "Usage type" entry. The form's extra 'unsure' option has no price. */
export type UsageTypeId = 'personal' | 'promotion' | 'distribution' | 'products';

export interface ArtworkCategoryPricing {
  id: ArtworkCategory;
  basePriceUsd: number;
}

export interface UsageTypePricing {
  id: UsageTypeId;
  percentAddon: number;
}

export interface PricingData {
  artworkCategories: ArtworkCategoryPricing[];
  usageTypes: UsageTypePricing[];
}
