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

  it('should price emotes under the singular ArtworkCategory id shared with the gallery', () => {
    const service = TestBed.inject(PricingService);

    // 'emote' (singular) is the one ArtworkCategory spelling; the old plural id no longer resolves.
    expect(service.getBasePriceUsd('emote')).toBe(30);
    expect(service.getBasePriceUsd('emotes')).toBeUndefined();
  });

  it('should expose usage-type addons under usageTypes', () => {
    const service = TestBed.inject(PricingService);

    // All four priced usage types load from pricing.json's renamed usageTypes list.
    expect(service.data.usageTypes.map((type) => type.id)).toEqual([
      'personal',
      'promotion',
      'distribution',
      'products',
    ]);
    expect(service.getUsageTypePricing('promotion')?.percentAddon).toBe(0.5);
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

  it('should apply the usage-type addon percentage on top of the base price', () => {
    const service = TestBed.inject(PricingService);
    const addon = service.getPercentAddon('promotion') ?? 0;

    expect(service.getTotalPriceUsd('chibi', 'promotion')).toBeCloseTo(27 * (1 + addon), 5);
  });

  it('should treat unknown artwork categories/usage types as zero base price / zero addon', () => {
    const service = TestBed.inject(PricingService);

    expect(service.getTotalPriceUsd('unknown', 'unknown')).toBe(0);
  });
});
