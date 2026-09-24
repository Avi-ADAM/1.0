import { describe, it, expect } from 'vitest';
import {
  bestNeedFor,
  byDistance,
  labelOverlap,
  personPlaces,
  productPlace,
  reachFor,
  reachForPerson,
  significantTokens,
  textRelevance
} from './localMatch';

// Tiberias, Nazareth (~27km away), Tel Aviv (~105km away).
const TIBERIAS = { lat: 32.7922, lng: 35.5312 };
const NAZARETH = { lat: 32.6996, lng: 35.3035 };
const TEL_AVIV = { lat: 32.0853, lng: 34.7818 };

describe('productPlace', () => {
  it('reads the location component written by current product flows', () => {
    expect(productPlace({ location: { ...TIBERIAS, radius: '15' } })).toMatchObject({
      ...TIBERIAS,
      radius: 15
    });
  });

  it('falls back to flat lat/lng, then to the hosting rikma', () => {
    expect(productPlace({ lat: 32.08, lng: 34.78 })).toMatchObject({ lat: 32.08, lng: 34.78 });
    expect(
      productPlace({
        projectcreates: { data: [{ attributes: { location: { lat: '32.79', lng: '35.53' } } }] }
      })
    ).toMatchObject({ lat: 32.79, lng: 35.53 });
  });

  it('treats an online product as reachable anywhere, even with an old point', () => {
    expect(productPlace({ location: { location_mode: 'online' }, ...TEL_AVIV })).toEqual({
      location_mode: 'online'
    });
  });

  it('returns null for an unlocated product', () => {
    expect(productPlace({})).toBeNull();
  });
});

describe('reachFor (product service area)', () => {
  const wish = { ...TIBERIAS, radius: 10 };

  it('keeps a grocery that delivers to the wish, with its distance', () => {
    const r = reachFor({ ...TIBERIAS, radius: 20 }, wish);
    expect(r.ok).toBe(true);
    expect(r.distanceKm).toBe(0);
  });

  it('drops a product whose delivery area does not reach her', () => {
    expect(reachFor({ ...TEL_AVIV, radius: 20 }, wish).ok).toBe(false);
  });

  it('uses the product radius plus the wish radius', () => {
    // ~27km: out of 10+10, inside 20+10.
    expect(reachFor({ ...NAZARETH, radius: 10 }, wish).ok).toBe(false);
    expect(reachFor({ ...NAZARETH, radius: 20 }, wish).ok).toBe(true);
  });

  it('keeps online / unlocated products and wishes with no place', () => {
    expect(reachFor({ location_mode: 'online' }, wish)).toEqual({ ok: true, distanceKm: null });
    expect(reachFor(null, wish)).toEqual({ ok: true, distanceKm: null });
    expect(reachFor({ ...TEL_AVIV, radius: 1 }, { isOnline: true, ...TIBERIAS })).toEqual({
      ok: true,
      distanceKm: null
    });
    expect(reachFor({ ...TEL_AVIV, radius: 1 }, {})).toEqual({ ok: true, distanceKm: null });
  });
});

describe('reachForPerson', () => {
  it('matches a member when any located point is in range, reporting the nearest', () => {
    const places = personPlaces({ location: [{ ...TEL_AVIV }, { ...TIBERIAS, radius: 5 }] });
    const r = reachForPerson(places, { ...TIBERIAS, radius: 10 });
    expect(r.ok).toBe(true);
    expect(r.distanceKm).toBe(0);
  });

  it('drops a member located only far away', () => {
    expect(reachForPerson(personPlaces({ location: [TEL_AVIV] }), { ...TIBERIAS, radius: 10 }).ok).toBe(
      false
    );
  });

  it('keeps a member who never set a location', () => {
    expect(reachForPerson(personPlaces({ location: null }), TIBERIAS)).toEqual({
      ok: true,
      distanceKm: null
    });
  });
});

describe('byDistance', () => {
  it('orders nearest first and unknown distances last', () => {
    const list = [{ distanceKm: null }, { distanceKm: 12 }, { distanceKm: 3 }];
    expect(list.sort(byDistance).map((x) => x.distanceKm)).toEqual([3, 12, null]);
  });
});

describe('text relevance', () => {
  it('drops connectives and short words', () => {
    expect(significantTokens('משלוח מצרכים עד הבית')).toEqual(['משלוח', 'מצרכים', 'הבית']);
  });

  it('sees past a Hebrew prefix and plural', () => {
    expect(textRelevance('משלוח עד הבית', 'משלוחים לבית בטבריה')).toBe(1);
  });

  it('scores the share of the need that the product names', () => {
    expect(textRelevance('משלוח מצרכים עד הבית', 'משלוח מכולת טבריה')).toBeCloseTo(1 / 3);
    expect(textRelevance('צילום אירועים', 'משלוח מכולת')).toBe(0);
  });

  it('finds the need a product answers', () => {
    const needs = [
      { name: 'צילום אירוע', isResource: false, idx: 0 },
      { name: 'משלוח מצרכים', isResource: false, idx: 1 }
    ];
    expect(bestNeedFor(needs, 'משלוח מכולת')?.need.idx).toBe(1);
    expect(bestNeedFor(needs, 'שיעור יוגה')).toBeNull();
  });

  it('compares category labels by words', () => {
    expect(labelOverlap(['מזון', 'משלוחים'], ['מזון ומשקאות'])).toBe(0.5);
    expect(labelOverlap([], ['מזון'])).toBe(0);
  });
});
