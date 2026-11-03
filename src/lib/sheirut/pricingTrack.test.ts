import { describe, expect, it } from 'vitest';
import { dealPricingTrack, effectivePricingTrack, parsePricingTrack } from './pricingTrack';

describe('parsePricingTrack', () => {
  it('keeps the two values and drops anything else', () => {
    expect(parsePricingTrack('atCost')).toBe('atCost');
    expect(parsePricingTrack('fixed')).toBe('fixed');
    expect(parsePricingTrack(null)).toBeNull();
    expect(parsePricingTrack(undefined)).toBeNull();
    expect(parsePricingTrack('help')).toBeNull();
  });
});

describe('effectivePricingTrack', () => {
  it('reads null as atCost — how every deal behaved before the field', () => {
    expect(effectivePricingTrack(null)).toBe('atCost');
    expect(effectivePricingTrack('fixed')).toBe('fixed');
  });
});

describe('dealPricingTrack', () => {
  it('stays null when nobody chose — a legacy deal is not rewritten', () => {
    expect(dealPricingTrack(null, [])).toBeNull();
    expect(dealPricingTrack(null, [null, null])).toBeNull();
  });

  it('takes the wish when no proposal says otherwise', () => {
    expect(dealPricingTrack('fixed', [])).toBe('fixed');
    expect(dealPricingTrack('fixed', [null, null])).toBe('fixed');
  });

  it("lets the accepted proposal's track win over the wish's", () => {
    expect(dealPricingTrack(null, ['fixed'])).toBe('fixed');
    expect(dealPricingTrack('atCost', ['fixed', 'fixed'])).toBe('fixed');
  });

  it('falls back to atCost when the accepted proposals disagree', () => {
    expect(dealPricingTrack(null, ['fixed', 'atCost'])).toBe('atCost');
    // A proposal with no track offered on the wish's — and that disagrees too.
    expect(dealPricingTrack('atCost', ['fixed', null])).toBe('atCost');
  });
});
