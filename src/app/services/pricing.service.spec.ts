import { TestBed } from '@angular/core/testing';

import { PricingService } from './pricing.service';
import { ArtworkCategory } from '../models/artwork-category';
import { UsageTypeId } from '../models/pricing.model';

describe('PricingService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    const service = TestBed.inject(PricingService);
    expect(service).toBeTruthy();
  });

  it('should expose artwork-category pricing loaded from the JSON file', () => {
    // Load the real pricing.json through the service.
    const service = TestBed.inject(PricingService);

    // All three categories load from pricing.json's artworkCategories list.
    expect(service.data.artworkCategories.map((category) => category.id)).toEqual(['chibi', 'emote', 'illustration']);
    expect(service.getArtworkCategoryPricing('chibi')?.basePriceUsd).toBe(27);
    expect(service.getBasePriceUsd('emote')).toBe(30);
  });

  it('should expose usage-type addons under usageTypes', () => {
    // Load the real pricing.json through the service.
    const service = TestBed.inject(PricingService);

    // All four priced usage types load from pricing.json's usageTypes list.
    expect(service.data.usageTypes.map((type) => type.id)).toEqual([
      'personal',
      'promotion',
      'distribution',
      'products',
    ]);
    expect(service.getUsageTypePricing('promotion')?.percentAddon).toBe(0.5);
  });

  it('should return undefined for an id missing from the JSON', () => {
    // Load the real pricing.json through the service.
    const service = TestBed.inject(PricingService);

    // Cast past the types to prove the runtime fallback, e.g. if the JSON and the type ever drift apart.
    expect(service.getArtworkCategoryPricing('unknown' as ArtworkCategory)).toBeUndefined();
    expect(service.getBasePriceUsd('unknown' as ArtworkCategory)).toBeUndefined();
    expect(service.getPercentAddon('unknown' as UsageTypeId)).toBeUndefined();
  });

  it('should compute the total price as base price times (1 + percent addon)', () => {
    // Load the real pricing.json through the service.
    const service = TestBed.inject(PricingService);

    // chibi's base price is 27; 'personal' has no addon (0%), so total stays 27.
    expect(service.getTotalPriceUsd('chibi', 'personal')).toBe(27);
  });

  it('should apply the usage-type addon percentage on top of the base price', () => {
    // Load the real pricing.json and read promotion's addon.
    const service = TestBed.inject(PricingService);
    const addon = service.getPercentAddon('promotion') ?? 0;

    // chibi's 27 plus promotion's addon.
    expect(service.getTotalPriceUsd('chibi', 'promotion')).toBeCloseTo(27 * (1 + addon), 5);
  });

  it("should price the form's 'unsure' usage at the base price, with no addon", () => {
    // Load the real pricing.json through the service.
    const service = TestBed.inject(PricingService);

    // 'unsure' has no price entry, so it adds nothing.
    expect(service.getTotalPriceUsd('chibi', 'unsure')).toBe(27);
  });

  it("should format each usage type's addon as a whole-number percent", () => {
    // Load the real pricing.json through the service.
    const service = TestBed.inject(PricingService);

    // Same '1.0-0' rounding the page has always shown; personal has no addon.
    expect(service.formatPercentAddon('personal')).toBe('0%');
    expect(service.formatPercentAddon('promotion')).toBe('50%');
    expect(service.formatPercentAddon('distribution')).toBe('100%');
    expect(service.formatPercentAddon('products')).toBe('200%');
  });
});
