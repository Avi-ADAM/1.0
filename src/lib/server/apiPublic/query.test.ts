/**
 * The parameter contract of §5.5: what is refused, what is composed, and what
 * a caller may not ask for.
 */

import { describe, it, expect } from 'vitest';
import {
  buildCatalogFilters,
  parseCatalogQuery,
  DEFAULT_LIMIT
} from './query.js';
import type { ApiAccess } from './dto.js';

const anon: ApiAccess = { level: 'anonymous' };
const keyed: ApiAccess = { level: 'key' };
const drafted: ApiAccess = { level: 'draft' };

const parse = (qs: string, access: ApiAccess = anon) =>
  parseCatalogQuery(new URLSearchParams(qs), access);
const ok = (qs: string, access: ApiAccess = anon) => {
  const result = parse(qs, access);
  if (result.ok !== true)
    throw new Error(`expected ok, got ${JSON.stringify(result)}`);
  return result.value;
};
const fail = (qs: string, access: ApiAccess = anon) => {
  const result = parse(qs, access);
  if (result.ok !== false)
    throw new Error(`expected a refusal, got ${JSON.stringify(result)}`);
  return result;
};

describe('pagination and sorting', () => {
  it('defaults to 20 per page, newest change first', () => {
    const q = ok('');
    expect(q.limit).toBe(DEFAULT_LIMIT);
    expect(q.page).toBe(1);
    expect(q.sort).toEqual(['-updatedAt']);
  });

  it('refuses a limit above the ceiling instead of silently clamping it', () => {
    expect(ok('limit=100').limit).toBe(100);
    expect(fail('limit=101').message).toContain('limit');
    expect(fail('limit=0').status).toBe(400);
    expect(fail('limit=abc').status).toBe(400);
    expect(fail('page=0').status).toBe(400);
  });

  it('accepts only the documented sort keys', () => {
    expect(ok('sort=price').sort).toEqual(['price']);
    expect(ok('sort=-price,name').sort).toEqual(['-price', 'name']);
    expect(fail('sort=cheap').message).toContain('sort');
    expect(fail('sort=marginPct').status).toBe(400);
  });
});

describe('sparse fields and expand', () => {
  it('accepts the documented field names, including one level of nesting', () => {
    expect(ok('fields=id,name,price,seller.name').fields).toEqual([
      'id',
      'name',
      'price',
      'seller.name'
    ]);
  });

  it('refuses an unknown field — a filter that silently does nothing is worse', () => {
    expect(fail('fields=id,marginPct').message).toContain('marginPct');
    expect(fail('fields=id,recipe').status).toBe(400);
  });

  it('knows exactly one expand switch today', () => {
    expect(ok('expand=rikma').expand).toEqual(['rikma']);
    expect(fail('expand=everything').message).toContain('expand');
  });
});

describe('status and draft need the right caller (§5.5)', () => {
  it('lets an anonymous caller ask for the public view only', () => {
    expect(ok('status=published').statuses).toEqual(['published']);
    expect(fail('status=draft').status).toBe(403);
    // `hidden` is no longer a status (§12 #2): an unknown value, so a 400.
    expect(fail('status=hidden').status).toBe(400);
    expect(fail('status=archived').status).toBe(403);
    expect(fail('draft=true').status).toBe(403);
  });

  it('lets a products:read key ask for published or archived, not drafts', () => {
    expect(ok('status=archived', keyed).statuses).toEqual(['archived']);
    expect(ok('status=published,archived', keyed).statuses).toEqual([
      'published',
      'archived'
    ]);
    expect(fail('status=draft', keyed).status).toBe(403);
    expect(fail('draft=true', keyed).code).toBe('SCOPE_MISSING');
  });

  it('lets a products:read:draft key see drafts', () => {
    expect(ok('status=draft', drafted).statuses).toEqual(['draft']);
    expect(ok('draft=true', drafted).statuses).toContain('draft');
    expect(ok('', drafted).statuses).toEqual(['published', 'draft']);
  });

  it('never lists archived products by default, but can be asked for them', () => {
    expect(ok('', drafted).statuses).not.toContain('archived');
    expect(ok('status=archived', drafted).statuses).toEqual(['archived']);
  });

  it('refuses a status word that does not exist', () => {
    expect(fail('status=deleted', drafted).status).toBe(400);
  });
});

describe('updatedSince is a keyed feature', () => {
  it('turns an anonymous sync request into a 401', () => {
    const refusal = fail('updatedSince=2026-10-01T00:00:00Z');
    expect(refusal.status).toBe(401);
    expect(refusal.code).toBe('KEY_REQUIRED');
  });

  it('normalises the timestamp for a key', () => {
    expect(ok('updatedSince=2026-10-01T00:00:00Z', keyed).updatedSince).toBe(
      '2026-10-01T00:00:00.000Z'
    );
    expect(fail('updatedSince=last-tuesday', keyed).status).toBe(400);
  });
});

describe('the caller’s filters', () => {
  it('searches name, discovery keywords and category', () => {
    const [filter] = ok('q=סדנה').callerFilters;
    const json = JSON.stringify(filter);
    expect(json).toContain('discoveryKeywords');
    expect(json).toContain('categories');
    expect(fail(`q=${'x'.repeat(101)}`).status).toBe(400);
  });

  it('understands a seller as person:<id> or rikma:<id>', () => {
    expect(JSON.stringify(ok('seller=person:88').callerFilters)).toContain(
      'owner_user'
    );
    expect(JSON.stringify(ok('seller=rikma:57').callerFilters)).toContain(
      'projectcreates'
    );
    expect(fail('seller=dana').status).toBe(400);
  });

  it('accepts a category by id or by name, repeatable', () => {
    const branches = (ok('category=12&category=סדנאות').callerFilters[0] as any)
      .or;
    expect(branches[0]).toEqual({ categories: { id: { in: ['12'] } } });
    expect(branches[1]).toEqual({
      categories: { name: { containsi: 'סדנאות' } }
    });
  });

  it('filters price, currency, availability and kindOf', () => {
    const json = JSON.stringify(
      ok('minPrice=100&maxPrice=500&currency=ils&available=true&kindOf=monthly')
        .callerFilters
    );
    expect(json).toContain('"gte":100');
    expect(json).toContain('"lte":500');
    expect(json).toContain('"ILS"');
    expect(json).toContain('"eq":-1'); // unlimited counts as available
    expect(json).toContain('monthly');
    expect(fail('currency=shekels').status).toBe(400);
    expect(fail('kindOf=hourly').status).toBe(400);
    expect(fail('available=maybe').status).toBe(400);
  });

  it('reads available=false as out of stock, including a missing quant', () => {
    expect(JSON.stringify(ok('available=false').callerFilters)).toContain(
      '"null":true'
    );
  });

  it('turns lat/lng/radius into a box and refuses half a point', () => {
    const filters = ok('lat=31.89&lng=34.81&radius=5000').callerFilters;
    expect(JSON.stringify(filters)).toContain('"between"');
    expect(fail('lat=31.89').status).toBe(400);
    expect(fail('lat=99&lng=34').status).toBe(400);
    expect(fail('lat=31&lng=34&radius=-5').status).toBe(400);
  });

  it('validates locale against the platform languages', () => {
    expect(ok('locale=en').locale).toBe('en');
    expect(fail('locale=fr').status).toBe(400);
  });
});

describe('buildCatalogFilters — tenant + visibility, composed once', () => {
  it('pins the rikma, the statuses, then the caller’s filters', () => {
    const query = ok('q=סדנה&minPrice=10', keyed);
    const filters = buildCatalogFilters(
      '57',
      query.statuses,
      query.callerFilters
    ) as any;
    expect(filters.and[0]).toEqual({ projectcreates: { id: { eq: '57' } } });
    expect(JSON.stringify(filters.and[1])).toContain('status_of_voting');
    expect(JSON.stringify(filters.and[1])).not.toContain('appruved');
    expect(filters.and.length).toBe(4);
  });

  it('answers null when the caller may see no status at all', () => {
    expect(buildCatalogFilters('57', [], [])).toBeNull();
  });
});

// ─── the shop parameters (PLAN_SHOP_CUSTOMER_EXPERIENCE §5.2) ───────────────
//
// The interesting part is not the happy path but what happens *before* the
// shop schema is deployed: `?hasVariants=true` must be an empty list, not a
// GraphQL error and not a silent "here is everything".

describe('shop parameters — without the shop schema', () => {
  it('keeps `sort=price` on the product row and `priceMax` on price', () => {
    expect(ok('sort=price').sort).toEqual(['price']);
    expect(ok('sort=priceMax').sort).toEqual(['price']);
    expect(ok('sort=-priceMax').sort).toEqual(['-price']);
  });

  it('filters the price on the product row', () => {
    const query = ok('minPrice=100&maxPrice=300');
    expect(JSON.stringify(query.callerFilters)).toContain('"price"');
    expect(query.matchesNothing).toBe(false);
  });

  it('answers `?hasVariants=true` with "nothing matches" instead of a query', () => {
    expect(ok('hasVariants=true').matchesNothing).toBe(true);
    expect(ok('hasVariants=false').matchesNothing).toBe(false);
  });

  it('answers an option or SKU filter with "nothing matches" too', () => {
    expect(ok('option.size=m').matchesNothing).toBe(true);
    expect(ok('sku=KER-M').matchesNothing).toBe(true);
  });

  it('still refuses malformed parameters, schema or no schema', () => {
    expect(fail('hasVariants=maybe').status).toBe(400);
    expect(fail('option.2size=m').status).toBe(400);
    // The delimiters of `axisKey` never reach the filter as a search term.
    expect(fail('option.size=m|color:red').status).toBe(400);
    expect(fail('sku=' + 'x'.repeat(65)).status).toBe(400);
  });

  it('accepts `inStock` as the same switch as `available`', () => {
    expect(JSON.stringify(ok('inStock=true').callerFilters)).toContain(
      '"quant"'
    );
    expect(fail('inStock=1').status).toBe(400);
  });

  it('expands variants only when asked', () => {
    expect(ok('expand=variants').expand).toEqual(['variants']);
    expect(fail('expand=skus').status).toBe(400);
  });
});

describe('shop parameters — with the shop schema', () => {
  const shop = (qs: string, access: ApiAccess = anon) => {
    const result = parseCatalogQuery(new URLSearchParams(qs), access, {
      shopSchema: true
    });
    if (result.ok !== true)
      throw new Error(`expected ok, got ${JSON.stringify(result)}`);
    return result.value;
  };

  it('sorts `price` by the cheapest variant', () => {
    expect(shop('sort=price').sort).toEqual(['priceMin']);
    expect(shop('sort=-priceMax,name').sort).toEqual(['-priceMax', 'name']);
  });

  it('reads a price filter as a range overlap, with a branch for legacy rows', () => {
    const query = shop('minPrice=100&maxPrice=300');
    const json = JSON.stringify(query.callerFilters);
    expect(json).toContain('priceMax');
    expect(json).toContain('priceMin');
    // The row that predates the backfill still answers from its own `price`.
    expect(json).toContain('"null":true');
  });

  it('asks the hasVariants question of the column', () => {
    expect(JSON.stringify(shop('hasVariants=true').callerFilters)).toContain(
      '"hasVariants"'
    );
    expect(shop('hasVariants=true').matchesNothing).toBe(false);
  });

  it('composes option pairs into one relation filter with the normalized key', () => {
    const query = shop('option.size=m&option.color=red');
    const filter = JSON.stringify(query.callerFilters);
    expect(filter).toContain('|size:m|');
    expect(filter).toContain('|color:red|');
    // One filter node, so "M **and** red" cannot be read as two products.
    expect(query.callerFilters.filter((f) => 'variants' in f)).toHaveLength(1);
  });

  it('reads `available` from the product stock total', () => {
    const json = JSON.stringify(shop('available=true').callerFilters);
    expect(json).toContain('stockTotal');
    expect(json).toContain('-1');
  });
});
