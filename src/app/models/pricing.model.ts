export type CommissionTypeId = 'chibi' | 'emotes' | 'illustration';

export type CommercialTypeId = 'personal' | 'commercial-tier-1' | 'commercial-tier-2';

export interface CommissionTypePricing {
  id: CommissionTypeId;
  basePriceUsd: number;
}

export interface CommercialTypePricing {
  id: CommercialTypeId;
  percentAddon: number;
}

export interface PricingData {
  commissionTypes: CommissionTypePricing[];
  commercialTypes: CommercialTypePricing[];
}
