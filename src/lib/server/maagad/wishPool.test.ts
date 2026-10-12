import { describe, expect, it } from 'vitest';
import { buildWishPoolPanel, volumeOf, type PoolWish } from './wishPool';

const wish: PoolWish = {
  id: '50',
  name: 'סל ירקות שבועי מחקלאי מקומי',
  status: 'open',
  fulfilled: false,
  isOnline: false,
  lat: 32.08,
  lng: 34.78,
  radius: 10,
  frequency: null,
  categoryIds: []
};

const volumeMeta = { volume: { minPeople: 10, why: 'חקלאי פותח קו חלוקה מ-10 סלים' } };

function pool(id: string, attrs: Record<string, unknown>) {
  return {
    id,
    attributes: {
      name: 'סל ירקות שבועי',
      status_maagad: 'forming',
      scope: 'local',
      lat: 32.09,
      lng: 34.79,
      radius: 10,
      frequency: null,
      categories: { data: [] },
      members: { data: [{ id: '1' }, { id: '2' }] },
      ...attrs
    }
  };
}

describe('volumeOf', () => {
  it('reads what the composer saved', () => {
    expect(volumeOf(volumeMeta)).toEqual({ minPeople: 10, why: 'חקלאי פותח קו חלוקה מ-10 סלים' });
    expect(volumeOf({ volume: { minPeople: null, why: '' } })).toEqual({ minPeople: null, why: '' });
    expect(volumeOf(null)).toBeNull();
    expect(volumeOf({ skills: [] })).toBeNull();
  });
});

describe('buildWishPoolPanel', () => {
  it('says nothing about a one-person wish nobody pooled', () => {
    expect(buildWishPoolPanel({ wish, aiMeta: {}, memberships: [], pools: [pool('7', {})] })).toBeNull();
  });

  it('says nothing once the wish is fulfilled or closed', () => {
    const args = { aiMeta: volumeMeta, memberships: [], pools: [] };
    expect(buildWishPoolPanel({ ...args, wish: { ...wish, fulfilled: true } })).toBeNull();
    expect(buildWishPoolPanel({ ...args, wish: { ...wish, status: 'cancelled' } })).toBeNull();
  });

  it('offers a nearby pool that wants the same thing', () => {
    const panel = buildWishPoolPanel({ wish, aiMeta: volumeMeta, memberships: [], pools: [pool('7', {})] });
    expect(panel?.similar.map((p) => p.id)).toEqual(['7']);
    expect(panel?.similar[0].members).toBe(2);
    expect(panel?.similar[0].distanceKm).toBeLessThan(2);
    expect(panel?.canOpen).toBe(true);
  });

  it('keeps out pools that are far, closed, online, of another rhythm or another thing', () => {
    const pools = [
      pool('far', { lat: 31.25, lng: 34.79 }),
      pool('closed', { status_maagad: 'closed' }),
      pool('online', { scope: 'global', lat: null, lng: null }),
      pool('weekly', { frequency: 'weekly' }),
      pool('other', { name: 'מיניבוס לחיפה' })
    ];
    expect(buildWishPoolPanel({ wish, aiMeta: volumeMeta, memberships: [], pools })?.similar).toEqual([]);
  });

  it('holds both sides to a shared category when both have them', () => {
    const w = { ...wish, categoryIds: ['3'] };
    const other = pool('7', { categories: { data: [{ id: '9' }] } });
    const same = pool('8', { categories: { data: [{ id: '3' }] } });
    const panel = buildWishPoolPanel({ wish: w, aiMeta: volumeMeta, memberships: [], pools: [other, same] });
    expect(panel?.similar.map((p) => p.id)).toEqual(['8']);
  });

  it('shows the pool she is already in instead of suggestions', () => {
    const memberships = [{ id: '30', attributes: { status_member: 'interested', maagad: { data: pool('7', {}) } } }];
    const panel = buildWishPoolPanel({ wish, aiMeta: {}, memberships, pools: [pool('8', {})] });
    expect(panel?.mine).toMatchObject({ id: '7', memberStatus: 'interested', members: 2 });
    expect(panel?.similar).toEqual([]);
  });

  it('cannot open a pool for a physical wish with no point', () => {
    const panel = buildWishPoolPanel({
      wish: { ...wish, lat: null, lng: null },
      aiMeta: volumeMeta,
      memberships: [],
      pools: []
    });
    expect(panel?.canOpen).toBe(false);
  });
});
