import { describe, expect, it } from 'vitest';
import {
  clusterWishes,
  isCompatible,
  similarity,
  type ClusterWish
} from './clustering.js';

const wish = (over: Partial<ClusterWish>): ClusterWish => ({
  id: Math.random().toString(36).slice(2),
  name: '',
  isOnline: false,
  lat: 32.08,
  lng: 34.78,
  radius: 20,
  frequency: 'weekly',
  categoryIds: ['veg'],
  language: 'he',
  ...over
});

describe('similarity', () => {
  it('scores near-identical demands high', () => {
    const a = wish({ name: 'סל ירקות אורגני שבועי', categoryIds: ['veg'] });
    const b = wish({ name: 'סל ירקות שבועי אורגני', categoryIds: ['veg'] });
    expect(similarity(a, b)).toBeGreaterThan(0.5);
  });
  it('scores unrelated demands low', () => {
    const a = wish({ name: 'שיעורי גיטרה', categoryIds: ['music'] });
    const b = wish({ name: 'הסעה לעבודה', categoryIds: ['transport'] });
    expect(similarity(a, b)).toBeLessThan(0.2);
  });
});

describe('isCompatible — hard gates (§5.3)', () => {
  it('rejects different frequencies', () => {
    expect(
      isCompatible(wish({ frequency: 'weekly' }), wish({ frequency: 'one_time' }))
    ).toBe(false);
  });
  it('requires a shared category', () => {
    expect(
      isCompatible(wish({ categoryIds: ['veg'] }), wish({ categoryIds: ['music'] }))
    ).toBe(false);
  });
  it('rejects mixing an online wish with a physical one', () => {
    expect(isCompatible(wish({ isOnline: true }), wish({ isOnline: false }))).toBe(false);
  });
  it('clusters two online wishes ignoring geo, gated by language', () => {
    const a = wish({ isOnline: true, lat: null, lng: null, language: 'he' });
    const b = wish({ isOnline: true, lat: null, lng: null, language: 'he' });
    expect(isCompatible(a, b)).toBe(true);
    expect(isCompatible(a, wish({ isOnline: true, lat: null, lng: null, language: 'en' }))).toBe(
      false
    );
  });
  it('rejects physical wishes outside the mutual radius', () => {
    const tlv = wish({ lat: 32.08, lng: 34.78, radius: 10 });
    const haifa = wish({ lat: 32.79, lng: 34.99, radius: 10 }); // ~80km away
    expect(isCompatible(tlv, haifa)).toBe(false);
  });
  it('accepts physical wishes within the mutual radius', () => {
    const a = wish({ lat: 32.08, lng: 34.78, radius: 20 });
    const b = wish({ lat: 32.12, lng: 34.8, radius: 20 }); // a few km
    expect(isCompatible(a, b)).toBe(true);
  });
});

describe('clusterWishes', () => {
  it('groups similar nearby weekly-veg wishes and drops the outliers', () => {
    const wishes: ClusterWish[] = [
      wish({ id: '1', name: 'סל ירקות שבועי', lat: 32.08, lng: 34.78 }),
      wish({ id: '2', name: 'ירקות אורגניים כל שבוע', lat: 32.09, lng: 34.79 }),
      wish({ id: '3', name: 'סל ירקות אורגני שבועי', lat: 32.1, lng: 34.77 }),
      // Far away → gate fails:
      wish({ id: '4', name: 'סל ירקות שבועי', lat: 32.79, lng: 34.99, radius: 10 }),
      // One-time → frequency gate fails:
      wish({ id: '5', name: 'סל ירקות', frequency: 'one_time' })
    ];
    const clusters = clusterWishes(wishes, { minClusterSize: 3, simThreshold: 0.3 });
    expect(clusters).toHaveLength(1);
    expect(clusters[0].members.map((m) => m.id).sort()).toEqual(['1', '2', '3']);
    expect(clusters[0].online).toBe(false);
    expect(clusters[0].lat).not.toBeNull();
    expect(clusters[0].radiusKm).toBeGreaterThanOrEqual(0);
  });

  it('does not form a cluster below minClusterSize', () => {
    const wishes = [
      wish({ id: '1', name: 'סל ירקות שבועי' }),
      wish({ id: '2', name: 'ירקות שבועי אורגני' })
    ];
    expect(clusterWishes(wishes, { minClusterSize: 3 })).toHaveLength(0);
  });

  it('forms an online (global) cluster with null centroid', () => {
    const mk = (id: string) =>
      wish({ id, name: 'מנוי כלי AI חודשי', isOnline: true, lat: null, lng: null, frequency: 'monthly', categoryIds: ['saas'] });
    const clusters = clusterWishes([mk('1'), mk('2'), mk('3')], { minClusterSize: 3, simThreshold: 0.3 });
    expect(clusters).toHaveLength(1);
    expect(clusters[0].online).toBe(true);
    expect(clusters[0].lat).toBeNull();
  });
});
