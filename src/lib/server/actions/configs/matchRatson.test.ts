import { describe, it, expect } from 'vitest';
import { matanotPoint } from './matchRatson';

describe('matanotPoint', () => {
  it('reads the location component written by current product flows', () => {
    expect(
      matanotPoint({ location: { lat: 32.79, lng: 35.53, radius: '15' }, lat: null, lng: null })
    ).toEqual({ lat: 32.79, lng: 35.53 });
  });

  it('falls back to the flat lat/lng of older rows', () => {
    expect(matanotPoint({ location: null, lat: 32.08, lng: 34.78 })).toEqual({
      lat: 32.08,
      lng: 34.78
    });
  });

  it("falls back to the hosting rikma's location", () => {
    expect(
      matanotPoint({
        projectcreates: { data: [{ attributes: { location: { lat: '32.79', lng: '35.53' } } }] }
      })
    ).toEqual({ lat: 32.79, lng: 35.53 });
  });

  it('ignores a component with no coordinates (online / hint only)', () => {
    expect(
      matanotPoint({ location: { location_mode: 'online', lat: null, lng: null }, lat: 31.7, lng: 35.2 })
    ).toEqual({ lat: 31.7, lng: 35.2 });
  });

  it('returns null for an unlocated product', () => {
    expect(matanotPoint({})).toBeNull();
  });
});
