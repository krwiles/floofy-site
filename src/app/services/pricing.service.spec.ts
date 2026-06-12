import { TestBed } from '@angular/core/testing';

import { PricingService } from './pricing.service';

describe('PricingService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    const service = TestBed.inject(PricingService);
    expect(service).toBeTruthy();
  });

  it('should expose pricing data loaded from the JSON file', () => {
    const service = TestBed.inject(PricingService);

    expect(service.data.commissionTypes.length).toBe(3);
    expect(service.getBasePriceUsd('chibi')).toBe(27);
  });

  it('should return undefined for unknown commission type IDs', () => {
    const service = TestBed.inject(PricingService);

    expect(service.getCommissionTypePricing('unknown')).toBeUndefined();
    expect(service.getBasePriceUsd('unknown')).toBeUndefined();
  });
});
