/**
 * §3 of docs/inprogress/PLAN_CONCIERGE_EXTERNAL_SOURCES.md as properties: whatever a
 * provider returns, no card leaves normalisation over its limits, without a
 * live link, or with markup in it — and no query carries anything but the
 * five fields it is allowed to.
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { buildQueries, normalizeResults, LIMITS } from './externalOffers';
import { detectGaps, selectGaps, type CoverageNeed } from './coverage';

const anyValue = fc.oneof(fc.string(), fc.integer(), fc.constant(null), fc.constant(undefined));
const url = fc.oneof(
  fc.webUrl(),
  fc.string(),
  fc.constantFrom('', 'javascript:alert(1)', 'mailto:a@b.c', 'ftp://x.y', 'https://')
);
// Search snippets often arrive HTML-escaped; markup must not come back on decode.
const escapedTag = fc
  .tuple(fc.string(), fc.constantFrom('b', '/b', 'script', 'a href="x"'))
  .map(([s, tag]) => `${s}&lt;${tag}&gt;${s}`);
const raw = fc.record({
  url,
  title: fc.oneof(anyValue, escapedTag),
  snippet: fc.oneof(anyValue, escapedTag, fc.string({ maxLength: 1000 }).map((s) => `<p>${s}</p>`)),
  price: anyValue,
  currency: anyValue,
  locationLabel: anyValue
});

describe('normalizeResults — properties', () => {
  it('never exceeds a limit, never lacks a link, never keeps markup', () => {
    fc.assert(
      fc.property(fc.array(raw as any, { maxLength: 30 }), (results) => {
        const out = normalizeResults(results as any, {
          provider: 'gemini',
          need: { key: 'm:0', kind: 'mission', name: 'צלם' }
        });
        const domains = new Set<string>();
        for (const o of out) {
          expect(o.title.length).toBeLessThanOrEqual(LIMITS.title);
          expect((o.snippet ?? '').length).toBeLessThanOrEqual(LIMITS.snippet);
          expect((o.locationLabel ?? '').length).toBeLessThanOrEqual(LIMITS.locationLabel);
          expect(/^https?:\/\//.test(o.url)).toBe(true);
          expect(o.domain.length).toBeGreaterThan(0);
          // Per field: title and snippet render in separate elements, so a
          // stray "<" ending one and "A>" opening the other is never a tag.
          expect(/<[a-z/][^>]*>/i.test(o.title)).toBe(false);
          expect(/<[a-z/][^>]*>/i.test(o.snippet ?? '')).toBe(false);
          expect(o.price === null || (Number.isFinite(o.price) && o.price > 0)).toBe(true);
          expect(domains.has(o.domain)).toBe(false);
          domains.add(o.domain);
        }
      })
    );
  });
});

describe('buildQueries — properties', () => {
  const need = fc.record({
    kind: fc.constantFrom('mission' as const, 'resource' as const),
    idx: fc.nat(20),
    name: fc.string({ maxLength: 300 }),
    importance: fc.constantFrom('must' as const, 'nice' as const)
  });

  it('carries only the allowed fields, never digits of a place, never over the limit', () => {
    fc.assert(
      fc.property(
        fc.array(need, { maxLength: 10 }),
        fc.string({ maxLength: 200 }),
        fc.boolean(),
        (needs, hint, online) => {
          const gaps = selectGaps(detectGaps(needs as CoverageNeed[], null), 10);
          for (const q of buildQueries(gaps, { locationHint: hint, isOnline: online }, 'he')) {
            expect(Object.keys(q).sort()).toEqual(['key', 'kind', 'language', 'locationLabel', 'need']);
            expect(q.need.length).toBeLessThanOrEqual(LIMITS.need);
            expect(q.need).not.toMatch(/\S+@\S+/);
            if (online) expect(q.locationLabel).toBeNull();
            if (q.locationLabel) expect(q.locationLabel).not.toMatch(/\d/);
          }
        }
      )
    );
  });
});
