import { describe, expect, it, vi } from 'vitest';

vi.mock('$lib/server/strapiUrl.js', () => ({ STRAPI_GRAPHQL: 'http://strapi.test/graphql' }));
vi.mock('$lib/server/fx/index.js', () => ({
  serverRates: async () => ({ base: 'USD', date: '2026-09-19', rates: { USD: 1, ILS: 3.04, EUR: 0.87 } })
}));

import { convertEntry, entryFields, normalizeEntry } from './normalizeEntry.js';

const T = { base: 'USD', date: 'd', rates: { USD: 1, ILS: 3.04, EUR: 0.87 } };

describe('convertEntry', () => {
  it('legacy path stores as given with no entry fields', () => {
    const n = convertEntry({ in: 120 }, null, 'ILS', null);
    expect(n).toEqual({ values: { in: 120 }, currency: 'ILS', entryCurrency: null, entryRate: null });
    expect(entryFields(n)).toEqual({});
  });
  it('converts every amount of the row with one frozen rate', () => {
    const n = convertEntry({ perhour: 50, price: 1000 }, 'USD', 'ILS', T);
    expect(n.values).toEqual({ perhour: 152, price: 3040 });
    expect(n.entryRate).toBe(3.04);
    expect(entryFields(n)).toEqual({ entryCurrency: 'USD', entryRate: 3.04 });
  });
  it('keeps nulls null', () => {
    expect(convertEntry({ a: null, b: 10 }, 'USD', 'ILS', T).values).toEqual({ a: null, b: 30.4 });
  });
  it('refuses without a rate', () => {
    expect(() => convertEntry({ a: 1 }, 'XAF', 'ILS', T)).toThrow(/No exchange rate/);
  });
});

describe('normalizeEntry', () => {
  it('does no network at all without entryCurrency', async () => {
    const fetchFn = vi.fn();
    const n = await normalizeEntry({ amounts: { in: 5 }, entryCurrency: undefined, projectId: '1', jwt: 'j', fetchFn });
    expect(fetchFn).not.toHaveBeenCalled();
    expect(n.values.in).toBe(5);
  });
  it('reads the rikma currency and converts', async () => {
    const fetchFn = vi.fn(async () => ({
      json: async () => ({ data: { project: { data: { attributes: { currencyCode: 'EUR' } } } } })
    })) as unknown as typeof fetch;
    const n = await normalizeEntry({ amounts: { in: 100 }, entryCurrency: 'ils', projectId: '1', jwt: 'j', fetchFn });
    expect(n.currency).toBe('EUR');
    expect(n.entryCurrency).toBe('ILS');
    expect(n.values.in).toBeCloseTo(28.62, 2);
  });
  it('same currency as the rikma is the legacy shape', async () => {
    const fetchFn = vi.fn(async () => ({
      json: async () => ({ data: { project: { data: { attributes: { currencyCode: null } } } } })
    })) as unknown as typeof fetch;
    const n = await normalizeEntry({ amounts: { in: 100 }, entryCurrency: 'ILS', projectId: '1', jwt: 'j', fetchFn });
    expect(n.entryCurrency).toBeNull();
    expect(n.values.in).toBe(100);
  });
});
