import { describe, expect, it } from 'vitest';
import { computeSiteShare } from './computeSiteShare';

describe('computeSiteShare', () => {
  it('charges a provider a % of their earnings', () => {
    const r = computeSiteShare({ payerRole: 'provider', baseAmount: 1000, config: { pctProvider: 0.03 } });
    expect(r.basis).toBe('provider_earnings');
    expect(r.suggestedPct).toBe(0.03);
    expect(r.siteAmount).toBe(30);
  });

  it('charges a customer a % of their spend', () => {
    const r = computeSiteShare({ payerRole: 'customer', baseAmount: 1000, config: { pctCustomer: 0.02 } });
    expect(r.basis).toBe('transaction_value');
    expect(r.suggestedPct).toBe(0.02);
    expect(r.siteAmount).toBe(20);
  });

  it('rounds to 2 decimals', () => {
    const r = computeSiteShare({ payerRole: 'provider', baseAmount: 333.33, config: { pctProvider: 0.03 } });
    expect(r.siteAmount).toBe(10); // 9.9999 → 10.00
  });

  it('returns 0 for a non-positive base', () => {
    expect(computeSiteShare({ payerRole: 'provider', baseAmount: 0 }).siteAmount).toBe(0);
    expect(computeSiteShare({ payerRole: 'provider', baseAmount: -50 }).siteAmount).toBe(0);
    expect(computeSiteShare({ payerRole: 'customer', baseAmount: NaN }).siteAmount).toBe(0);
  });

  it('applies a min floor and a max cap', () => {
    const floored = computeSiteShare({ payerRole: 'provider', baseAmount: 100, config: { pctProvider: 0.03, min: 10 } });
    expect(floored.siteAmount).toBe(10); // 3 → floored to 10

    const capped = computeSiteShare({ payerRole: 'customer', baseAmount: 100000, config: { pctCustomer: 0.02, max: 50 } });
    expect(capped.siteAmount).toBe(50); // 2000 → capped to 50
  });

  it('clamps an out-of-range percentage into [0,1]', () => {
    expect(computeSiteShare({ payerRole: 'provider', baseAmount: 100, config: { pctProvider: 2 } }).siteAmount).toBe(100);
    expect(computeSiteShare({ payerRole: 'provider', baseAmount: 100, config: { pctProvider: -1 } }).siteAmount).toBe(0);
  });

  it('carries currency through and frames the line as a service', () => {
    const r = computeSiteShare({ payerRole: 'provider', baseAmount: 500, matbea: '2' });
    expect(r.matbea).toBe('2');
    expect(r.line.he).toContain('1lev1');
    expect(r.line.en.toLowerCase()).toContain('service');
  });
});
