import { describe, expect, it } from 'vitest';
import {
  normalizeMissionCard,
  normalizeProductCard,
  normalizeProjectCard,
  normalizeResourceCard
} from './normalizeCards.js';

const TLV = { lat: 32.0853, lng: 34.7818 };

describe('normalizeProjectCard', () => {
  it('reduces relation slices to aggregate counts', () => {
    const card = normalizeProjectCard({
      id: 3,
      attributes: {
        projectName: 'מאפיית השכונה',
        publicDescription: 'לחם אמיתי',
        city: 'תל אביב',
        location: { ...TLV, location_hint: 'פלורנטין' },
        profilePic: { data: { attributes: { url: '/pic.jpg', formats: { small: { url: '/pic-s.jpg' } } } } },
        user_1s: { data: [{ id: 1 }, { id: 2 }] },
        open_missions: { data: [{ id: 5 }] },
        open_mashaabims: { data: [] },
        matanotofs: { data: [{ id: 7 }, { id: 8 }, { id: 9 }] }
      }
    });
    expect(card).not.toBeNull();
    expect(card?.membersCount).toBe(2);
    expect(card?.openMissionsCount).toBe(1);
    expect(card?.openResourcesCount).toBe(0);
    expect(card?.productsCount).toBe(3);
    expect(card?.picUrl).toBe('/pic-s.jpg');
    expect(card?.lat).toBe(TLV.lat);
    expect(card?.hint).toBe('פלורנטין');
    expect(JSON.stringify(card)).not.toContain('username');
  });

  it('keeps unlocated rikmot as online/list-only cards and drops nameless nodes', () => {
    const card = normalizeProjectCard({ id: 4, attributes: { projectName: 'גלובלית' } });
    expect(card).not.toBeNull();
    expect(card?.isOnline).toBe(true);
    expect(card?.lat).toBeNull();
    expect(normalizeProjectCard({ id: 5, attributes: {} })).toBeNull();
  });
});

describe('normalizeProductCard', () => {
  it('shows the owning user as seller for personal products', () => {
    const card = normalizeProductCard({
      id: 5,
      attributes: {
        name: 'עוגת שמרים',
        price: 80,
        origin: 'personal',
        location: { ...TLV },
        owner_user: { data: { id: 7, attributes: { username: 'dana' } } },
        projectcreates: { data: [{ id: 9, attributes: { projectName: 'הריקמה של dana' } }] }
      }
    });
    expect(card?.personal).toBe(true);
    expect(card?.sellerName).toBe('dana');
    expect(card?.projectId).toBe('9');
    expect(card?.price).toBe(80);
  });

  it('falls back to the rikma location and seller for project products', () => {
    const card = normalizeProductCard({
      id: 6,
      attributes: {
        name: 'סדנה',
        price: 120,
        origin: 'project',
        projectcreates: {
          data: [{ id: 3, attributes: { projectName: 'מאפייה', location: { ...TLV } } }]
        }
      }
    });
    expect(card?.personal).toBe(false);
    expect(card?.sellerName).toBe('מאפייה');
    expect(card?.lat).toBe(TLV.lat);
  });

  it('keeps unlocated products (a directory lists everything, unlike the map)', () => {
    const card = normalizeProductCard({ id: 7, attributes: { name: 'x', price: 5 } });
    expect(card).not.toBeNull();
    expect(card?.lat).toBeNull();
  });
});

describe('normalizeMissionCard', () => {
  it('computes the shovi, strips the tiptap HTML and flattens tags', () => {
    const card = normalizeMissionCard({
      id: 11,
      attributes: {
        name: 'בניית אתר',
        descrip: '<p>נדרש <strong>מפתח</strong> &amp; מעצב</p>',
        noofhours: 10,
        perhour: 120,
        project: {
          data: {
            id: 2,
            attributes: { projectName: 'רקמת רשת', location: { ...TLV } }
          }
        },
        skills: { data: [{ id: 1, attributes: { skillName: 'svelte' } }] },
        work_ways: { data: [{ id: 1, attributes: { workWayName: 'remote' } }] },
        tafkidims: { data: [{ id: 1, attributes: { roleDescription: 'dev' } }] }
      }
    });
    expect(card?.value).toBe(1200);
    expect(card?.excerpt).toBe('נדרש מפתח & מעצב');
    expect(card?.skills).toEqual(['svelte']);
    expect(card?.workWays).toEqual(['remote']);
    expect(card?.roles).toEqual(['dev']);
    expect(card?.projectId).toBe('2');
    expect(card?.lat).toBe(TLV.lat);
  });

  it('marks concierge missions and keeps unlocated ones as online', () => {
    const card = normalizeMissionCard({
      id: 12,
      attributes: { name: 'm', ratson: { data: { id: 1, attributes: {} } } }
    });
    expect(card?.concierge).toBe(true);
    expect(card?.isOnline).toBe(true);
    expect(card?.value).toBeNull();
  });
});

describe('normalizeResourceCard', () => {
  it('carries kind, quantity and the project fallback location', () => {
    const card = normalizeResourceCard({
      id: 21,
      attributes: {
        name: 'מקרן',
        kindOf: 'tool',
        howMeny: 2,
        recurring: true,
        project: {
          data: { id: 4, attributes: { projectName: 'קולנוע שכונתי', location: { ...TLV } } }
        }
      }
    });
    expect(card?.kindOf).toBe('tool');
    expect(card?.howMany).toBe(2);
    expect(card?.recurring).toBe(true);
    expect(card?.projectId).toBe('4');
    expect(card?.lat).toBe(TLV.lat);
    expect(card?.isOnline).toBe(false);
  });
});
