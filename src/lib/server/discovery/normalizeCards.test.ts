import { describe, expect, it } from 'vitest';
import { normalizeProductCard, normalizeProjectCard } from './normalizeCards.js';

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
