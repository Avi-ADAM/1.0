import { describe, expect, it } from 'vitest';
import {
  budgetFields,
  dealPricingTrack,
  effectivePricingTrack,
  parsePricingTrack,
  refuseBudget
} from './pricingTrack';

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

describe('refuseBudget', () => {
  it('needs a ceiling above 0 for at-cost', () => {
    expect(refuseBudget('atCost', null)).toBe('ceiling');
    expect(refuseBudget('atCost', 0)).toBe('ceiling');
    expect(refuseBudget('atCost', 500)).toBeNull();
  });
  it('takes 0 or nothing for a fixed price', () => {
    expect(refuseBudget('fixed', 0)).toBeNull();
    expect(refuseBudget('fixed', null)).toBeNull();
  });
  it('refuses a negative amount on any track', () => {
    expect(refuseBudget(null, -1)).toBe('amount');
    expect(refuseBudget('fixed', -5)).toBe('amount');
  });
});

describe('budgetFields', () => {
  it('stores a fixed price of 0 as given — help, not "no amount"', () => {
    expect(budgetFields('fixed', 0)).toEqual({ bounti: true, totalbounti: 0 });
  });
  it('keeps 0 as "no amount" off the fixed track, as it always was', () => {
    expect(budgetFields(null, 0)).toEqual({ bounti: false, totalbounti: 0 });
    expect(budgetFields(null, null)).toEqual({ bounti: false, totalbounti: 0 });
  });
  it('stores a positive amount on any track', () => {
    expect(budgetFields('atCost', 900)).toEqual({ bounti: true, totalbounti: 900 });
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
