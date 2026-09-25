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

  it('should compute the total price as base price times (1 + percent addon)', () => {
    const service = TestBed.inject(PricingService);

    // chibi's base price is 27; 'personal' has no addon (0%), so total stays 27.
    expect(service.getTotalPriceUsd('chibi', 'personal')).toBe(27);
  });

  it('should apply the commercial addon percentage on top of the base price', () => {
    const service = TestBed.inject(PricingService);
    const addon = service.getPercentAddon('promotion') ?? 0;

    expect(service.getTotalPriceUsd('chibi', 'promotion')).toBeCloseTo(27 * (1 + addon), 5);
  });

  it('should treat unknown commission/commercial types as zero base price / zero addon', () => {
    const service = TestBed.inject(PricingService);

    expect(service.getTotalPriceUsd('unknown', 'unknown')).toBe(0);
  });
});
