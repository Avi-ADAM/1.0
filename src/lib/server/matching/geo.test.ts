import { describe, it, expect } from 'vitest';
import { haversineKm, isLocationCompatible, DEFAULT_ENTITY_RADIUS_KM } from './geo';

// Reference points (approx.): Tel Aviv, Jerusalem (~54km), Haifa (~85km from TLV)
const TLV = { lat: 32.0853, lng: 34.7818 };
const JLM = { lat: 31.7683, lng: 35.2137 };
const HAIFA = { lat: 32.794, lng: 34.9896 };

describe('haversineKm', () => {
  it('computes known distances approximately', () => {
    const d = haversineKm(TLV.lat, TLV.lng, JLM.lat, JLM.lng);
    expect(d).toBeGreaterThan(45);
    expect(d).toBeLessThan(60);
  });

  it('zero distance for same point', () => {
    expect(haversineKm(TLV.lat, TLV.lng, TLV.lat, TLV.lng)).toBe(0);
  });
});

describe('isLocationCompatible', () => {
  it('entity without location matches everyone', () => {
    expect(isLocationCompatible(null, [{ ...JLM }])).toBe(true);
    expect(isLocationCompatible(undefined, [])).toBe(true);
    expect(isLocationCompatible({}, [{ ...JLM }])).toBe(true);
  });

  it('online / hybrid entity matches everyone regardless of coords', () => {
    expect(isLocationCompatible({ ...TLV, location_mode: 'online' }, [{ ...HAIFA }])).toBe(true);
    expect(isLocationCompatible({ ...TLV, location_mode: 'hybrid' }, [{ lat: 48.85, lng: 2.35 }])).toBe(true);
  });

  it('user with no located points is kept', () => {
    expect(isLocationCompatible({ ...TLV, location_mode: 'onsite' }, [])).toBe(true);
    expect(isLocationCompatible({ ...TLV, location_mode: 'onsite' }, null)).toBe(true);
    expect(isLocationCompatible({ ...TLV, location_mode: 'onsite' }, [{ location_mode: 'online' }])).toBe(true);
  });

  it('physical entity within default radius matches', () => {
    // TLV↔JLM ~54km > default 50km → out; with radius 60 → in
    expect(isLocationCompatible({ ...TLV, radius: 60, location_mode: 'onsite' }, [{ ...JLM }])).toBe(true);
    expect(isLocationCompatible({ ...TLV, location_mode: 'onsite' }, [{ ...JLM }])).toBe(false);
  });

  it("user's own radius extends the reach", () => {
    expect(
      isLocationCompatible({ ...TLV, location_mode: 'onsite' }, [{ ...JLM, radius: 20 }])
    ).toBe(true);
  });

  it('any of several user locations can match', () => {
    expect(
      isLocationCompatible({ ...TLV, radius: 10, location_mode: 'onsite' }, [
        { lat: 48.85, lng: 2.35 }, // Paris — no
        { ...TLV } // TLV — yes
      ])
    ).toBe(true);
  });

  it('coordinates with unspecified mode are treated as physical', () => {
    expect(isLocationCompatible({ ...TLV, radius: 10 }, [{ lat: 48.85, lng: 2.35 }])).toBe(false);
  });

  it('radius arrives as string (biginteger) and still works', () => {
    expect(
      isLocationCompatible({ ...TLV, radius: '60', location_mode: 'onsite' }, [{ ...JLM }])
    ).toBe(true);
    expect(DEFAULT_ENTITY_RADIUS_KM).toBe(50);
  });
});
