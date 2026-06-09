import { Injectable } from '@angular/core';
import pricingJson from '../../assets/data/pricing.json';
import {
  CommissionTypeId,
  CommercialTypeId,
  CommissionTypePricing,
  CommercialTypePricing,
  PricingData,
} from '../models/pricing.model';

@Injectable({
  providedIn: 'root',
})
export class PricingService {
  readonly data: PricingData = {
    commissionTypes: pricingJson.commissionTypes.map((type) => ({
      id: type.id as CommissionTypeId,
      basePriceUsd: type.basePriceUsd,
    })),
    commercialTypes: pricingJson.commercialTypes.map((type) => ({
      id: type.id as CommercialTypeId,
      percentAddon: type.percentAddon,
    })),
  };

  getCommissionTypePricing(id: string): CommissionTypePricing | undefined {
    return this.data.commissionTypes.find((type) => type.id === id);
  }

  getBasePriceUsd(id: string): number | undefined {
    return this.getCommissionTypePricing(id)?.basePriceUsd;
  }

  getCommercialTypePricing(id: string): CommercialTypePricing | undefined {
    return this.data.commercialTypes.find((type) => type.id === id);
  }

  getPercentAddon(id: string): number | undefined {
    return this.getCommercialTypePricing(id)?.percentAddon;
  }
}
