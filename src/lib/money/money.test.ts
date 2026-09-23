import { describe, expect, it } from 'vitest';
import {
  convert,
  currencyForTag,
  currencySymbol,
  entryOriginal,
  formatMoney,
  guessCurrency,
  matbeaCode,
  minorDigits,
  normalizeCode,
  rateBetween,
  rikmaCurrency,
  roundTo,
  toRikma,
  type FxTable
} from './index.js';

const T: FxTable = {
  base: 'USD',
  date: '2026-09-18',
  rates: { USD: 1, ILS: 3.0377, EUR: 0.8726, JPY: 157.89, KWD: 0.3057 }
};

describe('currencies', () => {
  it('normalizes codes', () => {
    expect(normalizeCode('usd')).toBe('USD');
    expect(normalizeCode(' ils ')).toBe('ILS');
    expect(normalizeCode('')).toBeNull();
    expect(normalizeCode('dollars')).toBeNull();
    expect(normalizeCode(null)).toBeNull();
  });
  it('knows minor digits from Intl', () => {
    expect(minorDigits('ILS')).toBe(2);
    expect(minorDigits('JPY')).toBe(0);
    expect(minorDigits('KWD')).toBe(3);
  });
  it('rounds to the currency, not to a fixed 2', () => {
    expect(roundTo(1.005, 'ILS')).toBe(1.01);
    expect(roundTo(99.6, 'JPY')).toBe(100);
  });
});

describe('convert', () => {
  it('same currency is identity even with no table', () => {
    expect(convert(10, 'ILS', 'ILS', null)).toBe(10);
  });
  it('cross-rates through the base', () => {
    expect(rateBetween('USD', 'ILS', T)).toBeCloseTo(3.0377);
    expect(rateBetween('ILS', 'USD', T)).toBeCloseTo(1 / 3.0377);
    expect(convert(100, 'EUR', 'ILS', T)).toBeCloseTo((100 / 0.8726) * 3.0377, 6);
  });
  it('returns null for an unknown currency instead of guessing', () => {
    expect(convert(10, 'XXX', 'ILS', T)).toBeNull();
    expect(convert(10, 'USD', 'ILS', null)).toBeNull();
  });
});

describe('toRikma / entryOriginal', () => {
  it('writing in the rikma currency stores no entry fields (legacy shape)', () => {
    expect(toRikma({ amount: 120, currency: 'ILS' }, 'ILS', T)).toEqual({
      amount: 120,
      entryCurrency: null,
      entryRate: null
    });
  });
  it('freezes the rate and converts to the rikma currency', () => {
    const s = toRikma({ amount: 50, currency: 'USD' }, 'ILS', T);
    expect(s.entryCurrency).toBe('USD');
    expect(s.entryRate).toBeCloseTo(3.0377);
    expect(s.amount).toBe(151.89);
  });
  it('recovers what the writer typed', () => {
    const s = toRikma({ amount: 50, currency: 'USD' }, 'ILS', T);
    expect(entryOriginal(s.amount, s)).toEqual({ amount: 50, currency: 'USD' });
  });
  it('reads a second money field of the same row with the same rate', () => {
    const row = { entryCurrency: 'USD', entryRate: '3.0377' };
    expect(entryOriginal(303.77, row)).toEqual({ amount: 100, currency: 'USD' });
  });
  it('has no original for a legacy row', () => {
    expect(entryOriginal(100, {})).toBeNull();
    expect(entryOriginal(100, null)).toBeNull();
  });
  it('refuses to store an unconverted amount', () => {
    expect(() => toRikma({ amount: 5, currency: 'XXX' }, 'ILS', T)).toThrow();
  });
});

describe('format', () => {
  it('whole amounts drop the decimals', () => {
    expect(formatMoney(120, 'USD', 'en')).toBe('$120');
    expect(formatMoney(120.5, 'USD', 'en')).toBe('$120.50');
  });
  it('Hebrew puts ₪ where Hebrew puts it', () => {
    const s = formatMoney(120, 'ILS', 'he');
    expect(s).toContain('₪');
    expect(s).toContain('120');
  });
  it('marks a conversion', () => {
    expect(formatMoney(10, 'USD', 'en', { approx: true })).toBe('≈$10');
  });
  it('an unknown code still prints, with the code', () => {
    expect(formatMoney(3, 'XXQ', 'en')).toContain('XXQ');
  });
  it('empty for no amount', () => {
    expect(formatMoney(null, 'ILS', 'he')).toBe('');
    expect(formatMoney(NaN, 'ILS', 'he')).toBe('');
  });
  it('symbols', () => {
    expect(currencySymbol('ILS', 'he')).toBe('₪');
    expect(currencySymbol('EUR', 'en')).toBe('€');
  });
});

describe('guess', () => {
  it('reads the region, not the language', () => {
    expect(currencyForTag('en-GB')).toBe('GBP');
    expect(currencyForTag('de-DE')).toBe('EUR');
    expect(currencyForTag('zh-Hant-TW')).toBeNull();
    expect(currencyForTag('en')).toBeNull();
  });
  it('honours q-order and skips region-less tags', () => {
    expect(guessCurrency('en;q=0.9,he-IL;q=0.8')).toBe('ILS');
    expect(guessCurrency('fr-FR,en-US;q=0.9')).toBe('EUR');
    expect(guessCurrency('en-US;q=0.5,en-GB;q=0.9')).toBe('GBP');
  });
  it('defaults to ILS', () => {
    expect(guessCurrency(null)).toBe('ILS');
    expect(guessCurrency('ru')).toBe('ILS');
  });
});

describe('resolve', () => {
  it('null project currency is legacy ILS', () => {
    expect(rikmaCurrency(null)).toBe('ILS');
    expect(rikmaCurrency({ currencyCode: null })).toBe('ILS');
    expect(rikmaCurrency({ attributes: { currencyCode: 'eur' } })).toBe('EUR');
  });
  it('legacy matbea 2 is the shekel', () => {
    expect(matbeaCode({ data: { id: '2' } })).toBe('ILS');
    expect(matbeaCode({ data: { id: '7', attributes: { code: 'USD' } } })).toBe('USD');
    expect(matbeaCode({ data: null })).toBeNull();
  });
});
