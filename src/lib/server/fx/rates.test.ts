import { beforeEach, describe, expect, it, vi } from 'vitest';
import { _resetFxMemo, getRates, slimTable, type FxRow, type FxStore } from './rates.js';
import { cleanRates, erApi, type FxProvider } from './providers.js';

const DAY = Date.parse('2026-09-19T10:00:00Z');
const rates = { USD: 1, ILS: 3.04, EUR: 0.87, GBP: 0.75, JPY: 157, CAD: 1.4, AUD: 1.4, CHF: 0.82, SEK: 9, NOK: 10, DKK: 6.5 };

function memStore(initial: FxRow[] = []): FxStore & { rows: FxRow[] } {
  const rows = [...initial];
  return {
    rows,
    getDay: async (d) => rows.find((r) => r.date === d) ?? null,
    getLatest: async () => [...rows].sort((a, b) => b.date.localeCompare(a.date))[0] ?? null,
    putDay: async (r) => {
      rows.push(r);
    }
  };
}

const okProvider = (id = 'p1'): FxProvider & { calls: number } => {
  const p = {
    id,
    calls: 0,
    async fetchTable() {
      p.calls++;
      return { base: 'USD', date: '2026-09-18', rates };
    }
  };
  return p;
};
const badProvider: FxProvider = {
  id: 'bad',
  async fetchTable() {
    throw new Error('down');
  }
};

const fetchFn = vi.fn() as unknown as typeof fetch;
const quiet = () => {};

beforeEach(() => _resetFxMemo());

describe('getRates', () => {
  it('uses the stored day without asking any provider', async () => {
    const store = memStore([{ date: '2026-09-19', base: 'USD', rates }]);
    const p = okProvider();
    const t = await getRates({ fetchFn, store, providers: [p], now: () => DAY, log: quiet });
    expect(t?.rates.ILS).toBe(3.04);
    expect(p.calls).toBe(0);
  });

  it('fetches once, writes the day, and serves memory after', async () => {
    const store = memStore();
    const p = okProvider();
    const deps = { fetchFn, store, providers: [p], now: () => DAY, log: quiet };
    const t = await getRates(deps);
    expect(t?.date).toBe('2026-09-19');
    expect(t?.source).toBe('p1 2026-09-18');
    await getRates(deps);
    await getRates(deps);
    expect(p.calls).toBe(1);
    await new Promise((r) => setTimeout(r, 0));
    expect(store.rows).toHaveLength(1);
    expect(store.rows[0].date).toBe('2026-09-19');
  });

  it('falls through to the next provider', async () => {
    const p = okProvider('second');
    const t = await getRates({ fetchFn, store: null, providers: [badProvider, p], now: () => DAY, log: quiet });
    expect(t?.source).toContain('second');
  });

  it('serves the last known day when every provider is down', async () => {
    const store = memStore([{ date: '2026-09-10', base: 'USD', rates }]);
    const t = await getRates({ fetchFn, store, providers: [badProvider], now: () => DAY, log: quiet });
    expect(t?.date).toBe('2026-09-10');
  });

  it('is null — not a made-up rate — when nothing was ever obtained', async () => {
    const t = await getRates({ fetchFn, store: null, providers: [badProvider], now: () => DAY, log: quiet });
    expect(t).toBeNull();
  });

  it('dedupes concurrent cold requests', async () => {
    const p = okProvider();
    const deps = { fetchFn, store: null, providers: [p], now: () => DAY, log: quiet };
    await Promise.all([getRates(deps), getRates(deps), getRates(deps)]);
    expect(p.calls).toBe(1);
  });

  it('refreshes on a new UTC day', async () => {
    const p = okProvider();
    let now = DAY;
    const deps = { fetchFn, store: null, providers: [p], now: () => now, log: quiet };
    await getRates(deps);
    now = Date.parse('2026-09-20T00:30:00Z');
    const t = await getRates(deps);
    expect(p.calls).toBe(2);
    expect(t?.date).toBe('2026-09-20');
  });
});

describe('providers', () => {
  it('cleanRates keeps ISO codes only', () => {
    const r = cleanRates({ ils: 3, usd: 1, ape: 7, bitcoin: 0.00001, EUR: '0.9', bad: -1 });
    expect(r.ILS).toBe(3);
    expect(r.EUR).toBe(0.9);
    expect(r.APE).toBeUndefined();
    expect(r.BITCOIN).toBeUndefined();
  });

  it('parses the open.er-api shape', async () => {
    const f = vi.fn(async () => ({
      ok: true,
      json: async () => ({ result: 'success', time_last_update_unix: 1789689751, rates })
    })) as unknown as typeof fetch;
    const t = await erApi.fetchTable(f);
    expect(t.base).toBe('USD');
    expect(t.rates.ILS).toBe(3.04);
    expect(t.date).toBe('2026-09-18');
  });

  it('rejects a table without the shekel', async () => {
    const f = vi.fn(async () => ({
      ok: true,
      json: async () => ({ result: 'success', rates: { USD: 1, EUR: 0.9 } })
    })) as unknown as typeof fetch;
    await expect(erApi.fetchTable(f)).rejects.toThrow();
  });
});

describe('slimTable', () => {
  it('keeps only the asked codes', () => {
    const s = slimTable({ base: 'USD', date: 'd', rates }, ['ILS', 'EUR', 'XXX']);
    expect(Object.keys(s!.rates).sort()).toEqual(['EUR', 'ILS']);
  });
});
