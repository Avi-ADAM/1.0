import { describe, expect, it } from 'vitest';
import {
  normalizeJoinableRatson,
  normalizeMaagadim,
  normalizeOpenMashaabim,
  normalizeOpenMission,
  normalizeProduct
} from './normalizeMapItems.js';

const TLV = { lat: 32.0853, lng: 34.7818 };

describe('normalizeJoinableRatson', () => {
  it('rounds coordinates to the ~1km privacy grid', () => {
    const item = normalizeJoinableRatson({
      id: 1,
      attributes: { name: 'סל ירקות', lat: 32.08537, lng: 34.78181, isOnline: false }
    });
    expect(item).not.toBeNull();
    expect(item?.lat).toBeCloseTo(32.09, 10);
    expect(item?.lng).toBeCloseTo(34.78, 10);
    expect(item?.href).toBe('/wish/1');
  });

  it('drops physical wishes without a point, keeps online ones', () => {
    expect(
      normalizeJoinableRatson({ id: 2, attributes: { name: 'x', isOnline: false } })
    ).toBeNull();
    const online = normalizeJoinableRatson({
      id: 3,
      attributes: { name: 'קורס אונליין', isOnline: true }
    });
    expect(online?.isOnline).toBe(true);
    expect(online?.lat).toBeNull();
  });

  it('exposes aggregate joiner counts, never identities', () => {
    const item = normalizeJoinableRatson({
      id: 4,
      attributes: {
        name: 'טיול',
        ...TLV,
        minJoiners: 5,
        ratson_shares: { data: [{ id: 9 }, { id: 10 }] }
      }
    });
    expect(item?.meta.joinersCount).toBe(2);
    expect(item?.meta.minJoiners).toBe(5);
    expect(JSON.stringify(item)).not.toContain('username');
  });
});

describe('normalizeOpenMission — location fallback chain', () => {
  it('prefers the mission own location', () => {
    const item = normalizeOpenMission({
      id: 1,
      attributes: {
        name: 'm',
        location: { ...TLV },
        project: {
          data: { id: 1, attributes: { projectName: 'p', location: { lat: 31, lng: 35 } } }
        }
      }
    });
    expect(item?.lat).toBe(TLV.lat);
  });

  it('falls back to project location, then to the source wish', () => {
    const viaProject = normalizeOpenMission({
      id: 2,
      attributes: {
        name: 'm',
        project: { data: { id: 1, attributes: { projectName: 'p', location: { lat: 31, lng: 35 } } } }
      }
    });
    expect(viaProject?.lat).toBe(31);
    expect(viaProject?.meta.projectName).toBe('p');

    const viaWish = normalizeOpenMission({
      id: 3,
      attributes: { name: 'm', ratson: { data: { id: 7, attributes: { ...TLV } } } }
    });
    expect(viaWish?.lat).toBe(TLV.lat);
    expect(viaWish?.concierge).toBe(true);
    expect(viaWish?.href).toBe('/availableMission/3');
  });

  it('drops missions with no location anywhere and no online mode', () => {
    expect(normalizeOpenMission({ id: 4, attributes: { name: 'm' } })).toBeNull();
  });
});

describe('normalizeOpenMashaabim', () => {
  it('marks concierge resources and links the public page', () => {
    const item = normalizeOpenMashaabim({
      id: 5,
      attributes: {
        name: 'r',
        kindOf: 'tool',
        location: { ...TLV },
        ratson: { data: { id: 1, attributes: {} } }
      }
    });
    expect(item?.concierge).toBe(true);
    expect(item?.href).toBe('/availiableResorce/5');
    expect(item?.meta.kindOf).toBe('tool');
  });
});

describe('normalizeMaagadim', () => {
  it('emits pool + offer items with aggregate progress only', () => {
    const [maagadim, offers] = normalizeMaagadim([
      {
        id: 1,
        attributes: {
          name: 'סל ירקות שבועי',
          scope: 'local',
          ...TLV,
          members: { data: [{ id: 1 }, { id: 2 }, { id: 3 }] },
          viability_hint: 10,
          offers: {
            data: [
              {
                id: 8,
                attributes: {
                  title: 'הצעת ספק',
                  unit_price: 90,
                  min_participants: 5,
                  signed_count: 2
                }
              }
            ]
          }
        }
      }
    ]);
    expect(maagadim).toHaveLength(1);
    expect(maagadim[0].meta.membersCount).toBe(3);
    expect(offers).toHaveLength(1);
    expect(offers[0].meta.signed).toBe(2);
    expect(offers[0].meta.min).toBe(5);
    expect(offers[0].id).toBe('1-8');
  });

  it('keeps global pools as online items and drops unlocated local ones', () => {
    const [maagadim] = normalizeMaagadim([
      { id: 2, attributes: { name: 'saas', scope: 'global' } },
      { id: 3, attributes: { name: 'local-no-point', scope: 'local' } }
    ]);
    expect(maagadim).toHaveLength(1);
    expect(maagadim[0].isOnline).toBe(true);
  });
});

describe('normalizeProduct', () => {
  it('shows the owning user as seller for personal products', () => {
    const item = normalizeProduct({
      id: 5,
      attributes: {
        name: 'עוגת שמרים',
        price: 80,
        origin: 'personal',
        location: { lat: 32.0853, lng: 34.7818 },
        owner_user: { data: { id: 7, attributes: { username: 'dana' } } },
        projectcreates: { data: [{ id: 9, attributes: { projectName: 'הריקמה של dana' } }] }
      }
    });
    expect(item).not.toBeNull();
    expect(item?.kind).toBe('product');
    expect(item?.href).toBe('/gift/5');
    expect(item?.meta.sellerName).toBe('dana');
    expect(item?.meta.personal).toBe(true);
    expect(item?.meta.price).toBe(80);
  });

  it('shows the rikma as seller for project products and falls back to its location', () => {
    const item = normalizeProduct({
      id: 6,
      attributes: {
        name: 'סדנה',
        price: 120,
        origin: 'project',
        projectcreates: {
          data: [
            {
              id: 3,
              attributes: {
                projectName: 'מאפיית השכונה',
                location: { lat: 32.0853, lng: 34.7818 }
              }
            }
          ]
        }
      }
    });
    expect(item?.meta.sellerName).toBe('מאפיית השכונה');
    expect(item?.meta.personal).toBe(false);
    expect(item?.lat).not.toBeNull();
  });

  it('drops products with no location and no online mode', () => {
    expect(
      normalizeProduct({ id: 7, attributes: { name: 'x', price: 5 } })
    ).toBeNull();
    const online = normalizeProduct({
      id: 8,
      attributes: { name: 'קורס', price: 5, location: { location_mode: 'online' } }
    });
    expect(online?.isOnline).toBe(true);
  });
});
