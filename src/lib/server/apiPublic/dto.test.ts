/**
 * The projector's contract — PLAN_HEADLESS_PRODUCTS_API §5.3 and §6.1.
 *
 * The first test is the important one: a *maximally populated* raw row (every
 * field the API reads, plus every field it must never read) goes through the
 * projector, and the result is walked key by key. Anything in
 * `FORBIDDEN_DTO_KEYS` appearing anywhere — at any depth — fails. That is the
 * tripwire that turns "somebody added a field to the DTO" into a red test
 * instead of a quiet leak of the rikma's cost sheet.
 */

import { describe, it, expect } from 'vitest';
import {
  API_PRODUCT_FIELDS,
  API_PRODUCT_FIELD_SET,
  FORBIDDEN_DTO_KEYS,
  availabilityOf,
  canSeeStatus,
  defaultListStatuses,
  imageOf,
  isApiStatus,
  productStatusOf,
  projectFields,
  statusFilterFor,
  toApiCategory,
  toApiProduct,
  toApiRikma,
  toApiRikmaRef,
  visibleStatusesFor,
  type ApiAccess
} from './dto.js';

/** Every key of a nested object, at any depth. */
function keysDeep(value: unknown, out: string[] = []): string[] {
  if (Array.isArray(value)) {
    for (const item of value) keysDeep(item, out);
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      out.push(key);
      keysDeep(child, out);
    }
  }
  return out;
}

const RIKMA_REF = toApiRikmaRef({
  id: '57',
  slug: 'haohel',
  name: 'רקמת האוכל'
});

/**
 * A row that knows everything: the fields the DTO is built from, and the ones
 * it must drop. Written by hand rather than minimized — the point is to have
 * the forbidden data *present in the input*.
 */
const MAXIMAL_ROW = {
  id: '1842',
  attributes: {
    name: 'סדנת בישול ל-8',
    desc: '<p>סדנה של <strong>שלוש שעות</strong> במטבח שלנו</p>',
    price: 320,
    currency: { data: { id: '3', attributes: { code: 'ILS', name: 'שקל' } } },
    pricingMode: 'fixed',
    quant: 6,
    kindOf: 'total',
    origin: 'project',
    locale: 'he',
    createdAt: '2026-01-02T10:00:00.000Z',
    updatedAt: '2026-10-14T08:12:00.000Z',
    startDate: '2026-11-01T00:00:00.000Z',
    finnishDate: '2026-11-30T00:00:00.000Z',
    appruved: false,
    archived: false,
    lifecycle: 'active',
    hideFromDiscovery: false,
    lat: 31.89,
    lng: 34.81,
    radius: 15000,
    location: {
      lat: 31.89,
      lng: 34.81,
      radius: 15000,
      location_hint: 'רחובות',
      location_mode: 'physical'
    },
    pic: {
      data: {
        attributes: {
          url: 'https://res.cloudinary.com/love1/image/upload/v1/hero.jpg',
          alternativeText: 'שולחן ערוך',
          formats: {
            small: {
              url: 'https://res.cloudinary.com/love1/image/upload/v1/hero-small.jpg',
              width: 500,
              height: 375
            },
            thumbnail: {
              url: 'https://res.cloudinary.com/love1/image/upload/v1/hero-tiny.jpg',
              width: 245,
              height: 156
            }
          }
        }
      }
    },
    categories: { data: [{ id: '12', attributes: { name: 'סדנאות' } }] },
    owner_user: {
      data: {
        id: '9',
        attributes: { username: 'dana', email: 'dana@example.com' }
      }
    },
    projectcreates: {
      data: [
        {
          id: '57',
          attributes: {
            projectName: 'רקמת האוכל',
            slug: 'haohel',
            profilePic: {
              data: {
                attributes: { url: 'https://cdn.example/r.jpg', formats: {} }
              }
            },
            location: {
              lat: 31.89,
              lng: 34.81,
              radius: 15000,
              location_hint: 'רחובות',
              location_mode: 'physical'
            }
          }
        }
      ]
    },
    // ── internal: present in the input on purpose ──────────────────────────
    marginPct: 22,
    estimatedPrice: 410,
    entryCurrency: 'USD',
    entryRate: 3.7,
    maxsaleyearone: 50000,
    minsaleyearone: 1000,
    maxsaleyearsec: 60000,
    minsaleyearsec: 2000,
    status_of_voting: 'active',
    discoveryKeywords: 'בישול, סדנה',
    tosplits: { data: [{ id: '1' }] },
    holderStatus: 'open',
    sales: 12,
    monter: { data: { id: '1' } },
    matanot_recipe_missions: {
      data: [
        {
          id: '5',
          attributes: {
            hoursPerUnit: 3,
            ratePerHour: 80,
            unitsPerProduct: 1,
            stepCapacity: 8,
            costShape: 'perUnit',
            assignedMember: { data: { id: '9' } }
          }
        }
      ]
    },
    matanot_recipe_resources: {
      data: [{ id: '6', attributes: { pricePerUnit: 40, quantityPerUnit: 2 } }]
    },
    ratson: { data: { id: '3' } },
    nego: { data: { id: '4' } },
    matanotpend: { data: { id: '7' } },
    decision: { data: { id: '8' } },
    timegrama: { data: { id: '9' } },
    oneForeProject: true,
    process: { data: { id: '10' } },
    sp: { data: { id: '11' } }
  }
};

describe('toApiProduct — the whitelist', () => {
  const dto = toApiProduct(MAXIMAL_ROW, RIKMA_REF)!;

  it('never carries an internal key, at any depth', () => {
    const leaked = keysDeep(dto).filter((key) =>
      FORBIDDEN_DTO_KEYS.includes(key)
    );
    expect(
      leaked,
      `internal keys leaked into the public DTO: ${leaked.join(', ')}`
    ).toEqual([]);
  });

  it('emits exactly the fields the contract lists — nothing more', () => {
    // A new field on the DTO is a change to a public contract: this assertion
    // is what forces the change to be deliberate (and reviewed) rather than a
    // side effect of a refactor.
    expect(Object.keys(dto).sort()).toEqual([...API_PRODUCT_FIELDS].sort());
    expect(Object.keys(dto)).not.toContain('marginPct');
  });

  it('builds the values a shop actually renders', () => {
    expect(dto).toMatchObject({
      id: '1842',
      name: 'סדנת בישול ל-8',
      status: 'published',
      price: 320,
      currency: 'ILS',
      pricingMode: 'fixed',
      availability: { unlimited: false, quantity: 6 },
      kindOf: 'total',
      locale: 'he',
      translated: false,
      url: 'https://www.1lev1.com/gift/1842'
    });
    expect(dto.descriptionText).toBe('סדנה של שלוש שעות במטבח שלנו');
    expect(dto.categories).toEqual([{ id: '12', name: 'סדנאות' }]);
    expect(dto.images[0]).toMatchObject({
      width: 500,
      height: 375,
      alt: 'שולחן ערוך'
    });
    expect(dto.seller).toMatchObject({
      type: 'rikma',
      id: '57',
      name: 'רקמת האוכל',
      url: '/r/haohel'
    });
    expect(dto.geo).toMatchObject({
      lat: 31.89,
      lng: 34.81,
      radius: 15000,
      hint: 'רחובות',
      isOnline: false
    });
  });

  it('returns null for a row with no name', () => {
    expect(toApiProduct({ id: '1', attributes: {} }, RIKMA_REF)).toBeNull();
  });
});

describe('status derivation (§4.3, corrected — §12 #1)', () => {
  it('reads status_of_voting, lifecycle and archived as one word', () => {
    expect(
      productStatusOf({ status_of_voting: 'active', archived: false, lifecycle: 'active' })
    ).toBe('published');
    expect(productStatusOf({ status_of_voting: 'voting' })).toBe('draft');
    expect(productStatusOf({ status_of_voting: 'draft' })).toBe('draft');
    expect(productStatusOf({ status_of_voting: 'archived' })).toBe('archived');
    expect(productStatusOf({ lifecycle: 'archived' })).toBe('archived');
    expect(productStatusOf({ lifecycle: 'released' })).toBe('archived');
    expect(productStatusOf({ archived: true, status_of_voting: 'active' })).toBe(
      'archived'
    );
  });

  it('never reads appruved — creation leaves it false, and no screen sets it', () => {
    // Strapi defaults `appruved` to false and only the unused `approveMatanot`
    // writes it: gating on it made every real product a draft.
    expect(productStatusOf({ status_of_voting: 'active', appruved: false })).toBe(
      'published'
    );
    expect(productStatusOf({ status_of_voting: 'voting', appruved: true })).toBe(
      'draft'
    );
  });

  it('treats NULL flags as the legacy defaults — published, not archived', () => {
    // `lifecycle` and `status_of_voting` are newer than many rows: a bare
    // equality check would hide every product that predates them.
    expect(productStatusOf({ lifecycle: null, status_of_voting: null })).toBe(
      'published'
    );
    expect(productStatusOf({})).toBe('published');
  });

  it('keeps a product visible while its archive is only proposed', () => {
    expect(productStatusOf({ lifecycle: 'archiveProposed' })).toBe('published');
  });

  it('does not treat hideFromDiscovery as a status — the shop lists it (§4.3)', () => {
    expect(
      productStatusOf({ status_of_voting: 'active', hideFromDiscovery: true })
    ).toBe('published');
  });

  it('derives a `quote` product as published but priceless', () => {
    const dto = toApiProduct(
      {
        id: '5',
        attributes: {
          name: 'סל קניות',
          pricingMode: 'quote',
          price: 999,
          status_of_voting: 'active'
        }
      },
      RIKMA_REF
    )!;
    expect(dto.price).toBeNull();
    expect(dto.pricingMode).toBe('quote');
  });
});

describe('who sees what (§4.3, §6.2)', () => {
  const anon: ApiAccess = { level: 'anonymous' };
  const keyed: ApiAccess = { level: 'key' };
  const drafted: ApiAccess = { level: 'draft' };

  it('shows anonymous callers exactly what the rikma page shows: published', () => {
    expect(visibleStatusesFor(anon)).toEqual(['published']);
  });

  it('keeps drafts and archives away from everyone who is not a key', () => {
    expect(canSeeStatus(anon, 'draft')).toBe(false);
    expect(canSeeStatus(keyed, 'draft')).toBe(false);
    expect(canSeeStatus(drafted, 'draft')).toBe(true);
    expect(canSeeStatus(anon, 'archived')).toBe(false);
    expect(canSeeStatus(keyed, 'archived')).toBe(true);
  });

  it('never lists an archived product in a default list, even for a draft key', () => {
    expect(defaultListStatuses(drafted)).not.toContain('archived');
    expect(defaultListStatuses(drafted)).toContain('draft');
  });

  it('knows its statuses — and `hidden` is no longer one of them', () => {
    expect(isApiStatus('published')).toBe(true);
    expect(isApiStatus('hidden')).toBe(false);
    expect(isApiStatus('deleted')).toBe(false);
  });
});

describe('statusFilterFor', () => {
  it('guards NULL columns so legacy rows are not silently dropped', () => {
    const json = JSON.stringify(statusFilterFor(['published']));
    expect(json).toContain('"null":true');
    expect(json).toContain('status_of_voting');
    expect(json).toContain('released');
    expect(json).not.toContain('appruved');
    expect(json).not.toContain('hideFromDiscovery');
  });

  it('answers null when the caller may see nothing', () => {
    expect(statusFilterFor([])).toBeNull();
  });
});

describe('availabilityOf', () => {
  it('maps -1 to unlimited, everything else to a count', () => {
    expect(availabilityOf({ quant: -1 })).toEqual({
      unlimited: true,
      quantity: null
    });
    expect(availabilityOf({ quant: 0 })).toEqual({
      unlimited: false,
      quantity: 0
    });
    expect(availabilityOf({ quant: 6 })).toEqual({
      unlimited: false,
      quantity: 6
    });
  });

  it('reads a missing quant as out of stock, like /gift/[id] does', () => {
    expect(availabilityOf({})).toEqual({ unlimited: false, quantity: 0 });
  });
});

describe('imageOf', () => {
  it('prefers the small format and makes the URL absolute', () => {
    expect(imageOf(MAXIMAL_ROW.attributes.pic)).toMatchObject({
      width: 500,
      alt: 'שולחן ערוך'
    });
    const legacy = imageOf({ data: { attributes: { url: '/uploads/x.jpg' } } });
    expect(
      legacy?.url.startsWith('/uploads') ||
        legacy?.url.includes('/uploads/x.jpg')
    ).toBe(true);
  });

  it('returns null when there is no picture at all', () => {
    expect(imageOf(null)).toBeNull();
    expect(imageOf({ data: { attributes: {} } })).toBeNull();
  });
});

describe('a personal product is a person', () => {
  const dto = toApiProduct(
    {
      id: '99',
      attributes: {
        name: 'שיעור פרטי',
        origin: 'personal',
        owner_user: {
          data: {
            id: '9',
            attributes: { username: 'dana', email: 'dana@example.com' }
          }
        },
        projectcreates: {
          data: [
            { id: '88', attributes: { projectName: 'בית', slug: 'home-88' } }
          ]
        }
      }
    },
    RIKMA_REF
  )!;

  it('names the person, not the home rikma, and leaks no contact details', () => {
    expect(dto.seller).toMatchObject({ type: 'person', id: '9', name: 'dana' });
    expect(JSON.stringify(dto)).not.toContain('dana@example.com');
  });
});

describe('toApiRikma', () => {
  it('carries the look, the currency and the public address', () => {
    const dto = toApiRikma(
      {
        projectName: 'רקמת האוכל',
        publicDescription: '<p>אוכל טוב</p>',
        city: 'רחובות',
        currencyCode: 'ILS',
        supportPage: 'on',
        location: {
          lat: 31.9,
          lng: 34.8,
          radius: 20000,
          location_hint: 'רחובות',
          location_mode: 'physical'
        },
        look: { focus: 'business', style: { hue: '#123456' } }
      },
      { id: '57', slug: 'haohel' },
      { productsCount: 137 }
    );

    expect(dto).toMatchObject({
      id: '57',
      slug: 'haohel',
      canonicalPath: '/api/v1/r/haohel',
      url: 'https://www.1lev1.com/r/haohel',
      currency: 'ILS',
      productsCount: 137,
      city: 'רחובות'
    });
    expect(dto.look).toMatchObject({ focus: 'business' });
    expect(dto.about).toContain('אוכל טוב');
  });

  it('answers a look of null when none was stored', () => {
    expect(
      toApiRikma({ projectName: 'x' }, { id: '5', slug: null }).look
    ).toBeNull();
  });

  it('falls back to the id when the rikma has no address yet', () => {
    expect(
      toApiRikmaRef({ id: '57', slug: null, name: 'x' }).canonicalPath
    ).toBe('/api/v1/r/57');
  });
});

describe('projectFields', () => {
  const dto = toApiProduct(MAXIMAL_ROW, RIKMA_REF)!;

  it('keeps id and only what was asked for', () => {
    expect(projectFields(dto, ['name', 'price'])).toEqual({
      id: '1842',
      name: 'סדנת בישול ל-8',
      price: 320
    });
  });

  it('understands one level of nesting', () => {
    expect(projectFields(dto, ['seller.name', 'geo.lat'])).toEqual({
      id: '1842',
      seller: { name: 'רקמת האוכל' },
      geo: { lat: 31.89 }
    });
  });

  it('returns everything when nothing was asked for', () => {
    expect(projectFields(dto, [])).toBe(dto);
  });

  it('refuses names it does not know, rather than answering a wider question', () => {
    expect(API_PRODUCT_FIELD_SET.has('marginPct')).toBe(false);
    expect(API_PRODUCT_FIELD_SET.has('seller.name')).toBe(true);
    expect(API_PRODUCT_FIELD_SET.has('geo.lat')).toBe(true);
  });
});

describe('toApiCategory', () => {
  it('carries the visible-product count', () => {
    expect(
      toApiCategory({ id: '12', attributes: { name: 'סדנאות' } }, 3)
    ).toEqual({
      id: '12',
      name: 'סדנאות',
      productsCount: 3
    });
  });
});

describe('descriptionHtml is rebuilt, never forwarded (§5.3, §12 #8)', () => {
  it('keeps the formatting and drops what a consumer site would execute', () => {
    const dto = toApiProduct(
      {
        id: '7',
        attributes: {
          name: 'סדנה',
          desc: '<p class="x">שלוש <strong>שעות</strong></p><img src=x onerror=alert(1)><script>alert(1)</script>'
        }
      },
      RIKMA_REF
    )!;
    expect(dto.descriptionHtml).toBe('<p>שלוש <strong>שעות</strong></p>');
    expect(dto.descriptionText).toBe('שלוש שעות');
  });
});
