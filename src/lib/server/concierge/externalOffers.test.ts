import { describe, it, expect, vi } from 'vitest';
import {
  buildQueries,
  clip,
  coarseLocationLabel,
  dedupeAgainstInternal,
  normalizeResults,
  offerIdOf,
  parsePrice,
  plainText,
  readCache,
  scrubNeed,
  searchExternalOffers,
  visibleOffers,
  LIMITS,
  type ExternalCache
} from './externalOffers';
import { resolveExternalProvider, type ExternalSearchProvider } from './searchProviders/index';
import type { NeedCoverage } from './coverage';

const gap = (over: Partial<NeedCoverage> = {}): NeedCoverage => ({
  kind: 'mission',
  idx: 0,
  name: 'צלם אירועים',
  importance: 'must',
  key: 'm:0',
  coverage: 'uncovered',
  internalCount: 0,
  ...over
});

const need = { key: 'm:0', kind: 'mission' as const, name: 'צלם אירועים' };

describe('coarseLocationLabel', () => {
  it('cuts an address to its settlement', () => {
    expect(coarseLocationLabel('הרצל 12, חיפה, ישראל')).toBe('חיפה');
    expect(coarseLocationLabel('רחוב הגפן, טבריה')).toBe('טבריה');
    expect(coarseLocationLabel('12 Main Street, Haifa, Israel')).toBe('Haifa');
  });
  it('keeps a plain place name', () => {
    expect(coarseLocationLabel('אזור טבריה')).toBe('אזור טבריה');
  });
  it('is null when nothing coarse is left', () => {
    expect(coarseLocationLabel('הרצל 12')).toBeNull();
    expect(coarseLocationLabel('')).toBeNull();
    expect(coarseLocationLabel(null)).toBeNull();
  });
});

describe('buildQueries', () => {
  it('carries exactly the need, a coarse place, the language and the kind', () => {
    const [q] = buildQueries([gap()], { locationHint: 'הרצל 12, חיפה' }, 'he');
    expect(Object.keys(q).sort()).toEqual(['key', 'kind', 'language', 'locationLabel', 'need']);
    expect(q).toEqual({ key: 'm:0', need: 'צלם אירועים', locationLabel: 'חיפה', language: 'he', kind: 'mission' });
  });
  it('drops the place for an online wish', () => {
    const [q] = buildQueries([gap()], { locationHint: 'חיפה', isOnline: true }, 'en');
    expect(q.locationLabel).toBeNull();
    expect(q.language).toBe('en');
  });
  it('falls back to Hebrew for an unknown language', () => {
    expect(buildQueries([gap()], {}, 'xx')[0].language).toBe('he');
    expect(buildQueries([gap()], {}, null)[0].language).toBe('he');
  });
  it('scrubs contact details out of the need', () => {
    const [q] = buildQueries([gap({ name: 'צלם a@b.com 050-1234567 https://x.io' })], {}, 'he');
    expect(q.need).toBe('צלם');
  });
  it('skips a need that scrubs to nothing', () => {
    expect(buildQueries([gap({ name: '050-1234567' })], {}, 'he')).toEqual([]);
  });
});

describe('text helpers', () => {
  it('plainText strips markup and decodes entities', () => {
    expect(plainText('<b>Tom&amp;Co</b>\n  studio')).toBe('Tom&Co studio');
  });
  it('clip respects the limit and marks the cut', () => {
    const s = clip('a'.repeat(300), 200);
    expect(s.length).toBeLessThanOrEqual(200);
    expect(s.endsWith('…')).toBe(true);
    expect(clip('short', 200)).toBe('short');
  });
  it('parsePrice reads published prices only', () => {
    expect(parsePrice('₪1,200')).toEqual({ price: 1200, currency: 'ILS' });
    expect(parsePrice('350 ש״ח')).toEqual({ price: 350, currency: 'ILS' });
    expect(parsePrice('from $40')).toEqual({ price: 40, currency: 'USD' });
    expect(parsePrice('-')).toEqual({ price: null, currency: null });
    expect(parsePrice(null)).toEqual({ price: null, currency: null });
  });
  it('scrubNeed caps the length', () => {
    expect(scrubNeed('מילה '.repeat(40)).length).toBeLessThanOrEqual(LIMITS.need);
  });
});

describe('normalizeResults', () => {
  it('drops results without an http(s) link', () => {
    const out = normalizeResults(
      [
        { url: '', title: 'x' },
        { url: 'javascript:alert(1)', title: 'x' },
        { url: 'ftp://files.example.com', title: 'x' },
        { url: 'https://photo.co.il/', title: 'צלם אירועים בחיפה' }
      ],
      { provider: 'gemini', need }
    );
    expect(out.map((o) => o.domain)).toEqual(['photo.co.il']);
  });

  it('keeps one card per domain and honours the blocklist', () => {
    const out = normalizeResults(
      [
        { url: 'https://www.a.co.il/1', title: 'צלם' },
        { url: 'https://a.co.il/2', title: 'צלם' },
        { url: 'https://m.spam.com/x', title: 'צלם' }
      ],
      { provider: 'gemini', need, blocklist: ['spam.com'] }
    );
    expect(out.map((o) => o.domain)).toEqual(['a.co.il']);
  });

  it('cuts fields, strips markup and only keeps a currency with a price', () => {
    const [o] = normalizeResults(
      [
        {
          url: 'https://x.com',
          title: '<h1>' + 'T'.repeat(500) + '</h1>',
          snippet: 'S '.repeat(400),
          price: '-',
          currency: 'ILS',
          locationLabel: 'L'.repeat(200)
        }
      ],
      { provider: 'gemini', need }
    );
    expect(o.title.length).toBeLessThanOrEqual(LIMITS.title);
    expect(o.title).not.toContain('<');
    expect(o.snippet!.length).toBeLessThanOrEqual(LIMITS.snippet);
    expect(o.locationLabel!.length).toBeLessThanOrEqual(LIMITS.locationLabel);
    expect(o.price).toBeNull();
    expect(o.currency).toBeNull();
    expect(o.id).toBe(offerIdOf('https://x.com'));
    expect(o.matchedNeed).toEqual(need);
  });

  it('ranks what names the need first', () => {
    const out = normalizeResults(
      [
        { url: 'https://other.com', title: 'סטודיו', snippet: 'עיצוב' },
        { url: 'https://photo.com', title: 'צלם אירועים', snippet: 'צילום' }
      ],
      { provider: 'gemini', need }
    );
    expect(out[0].domain).toBe('photo.com');
    expect(out[0].score).toBeGreaterThan(out[1].score);
  });
});

describe('dedupeAgainstInternal', () => {
  const mk = (url: string, title: string, key = 'm:0') =>
    normalizeResults([{ url, title }], { provider: 'gemini', need: { ...need, key } })[0];

  it('drops a card that names an internal provider', () => {
    const out = dedupeAgainstInternal([mk('https://a.com', 'סטודיו אור'), mk('https://b.com', 'צלם חיפה')], [
      'סטודיו אור'
    ]);
    expect(out.map((o) => o.domain)).toEqual(['b.com']);
  });

  it('caps per need and in total, and keeps one card per id', () => {
    const many = Array.from({ length: 8 }, (_, i) => mk(`https://s${i}.com`, 'צלם'));
    expect(dedupeAgainstInternal(many, [], 5, 15)).toHaveLength(5);
    expect(dedupeAgainstInternal([many[0], many[0]], [])).toHaveLength(1);
    const spread = Array.from({ length: 20 }, (_, i) => mk(`https://t${i}.com`, 'צלם', `m:${i}`));
    expect(dedupeAgainstInternal(spread, [], 5, 15)).toHaveLength(15);
  });
});

describe('resolveExternalProvider', () => {
  const p = (id: 'gemini' | 'tavily', ok: boolean): ExternalSearchProvider => ({
    id,
    available: () => ok,
    search: async () => []
  });
  it('prefers the named provider when it is available', () => {
    expect(resolveExternalProvider([p('gemini', true), p('tavily', true)], 'tavily')?.id).toBe('tavily');
  });
  it('falls back to the first available', () => {
    expect(resolveExternalProvider([p('gemini', true), p('tavily', false)], 'tavily')?.id).toBe('gemini');
  });
  it('is null when nothing is configured', () => {
    expect(resolveExternalProvider([p('gemini', false)])).toBeNull();
  });
});

describe('searchExternalOffers', () => {
  it('searches each gap, keeps the rest when one fails', async () => {
    const search = vi.fn(async (q) => {
      if (q.key === 'r:0') throw new Error('boom');
      return [{ url: `https://${q.key.replace(':', '')}.com`, title: q.need }];
    });
    const run = await searchExternalOffers({
      gaps: [gap(), gap({ key: 'r:0', kind: 'resource', name: 'אוהל' })],
      geo: { locationHint: 'חיפה' },
      language: 'he',
      provider: { id: 'gemini', available: () => true, search }
    });
    expect(search).toHaveBeenCalledTimes(2);
    expect(run.failed).toEqual(['r:0']);
    expect(run.offers.map((o) => o.domain)).toEqual(['m0.com']);
    expect(run.queries[0].locationLabel).toBe('חיפה');
  });
});

describe('the cache', () => {
  const now = new Date('2026-09-25T12:00:00Z');
  const offer = normalizeResults([{ url: 'https://a.com', title: 'צלם' }], {
    provider: 'gemini',
    need,
    now
  })[0];
  const cache: ExternalCache = {
    version: 1,
    fetchedAt: now.toISOString(),
    provider: 'gemini',
    queries: [],
    gaps: [],
    offers: [offer],
    dismissed: []
  };
  const rows = [{ key: 'm:0', name: 'צלם אירועים' }];

  it('readCache rejects anything that is not a saved run', () => {
    expect(readCache(null)).toBeNull();
    expect(readCache({ version: 2 })).toBeNull();
    expect(readCache(cache)).toEqual(cache);
  });

  it('shows fresh offers on their row', () => {
    expect(visibleOffers(cache, rows, 168, now)).toHaveLength(1);
  });

  it('hides everything once stale', () => {
    const later = new Date(now.getTime() + 169 * 3_600_000);
    expect(visibleOffers(cache, rows, 168, later)).toEqual([]);
  });

  it('hides dismissed cards and cards whose row was renamed', () => {
    expect(visibleOffers({ ...cache, dismissed: [offer.id] }, rows, 168, now)).toEqual([]);
    expect(visibleOffers(cache, [{ key: 'm:0', name: 'קייטרינג' }], 168, now)).toEqual([]);
  });
});
