export type CommissionTypeId = 'chibi' | 'emotes' | 'illustration';

export type CommercialTypeId = 'personal' | 'promotion' | 'distribution' | 'products';

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
