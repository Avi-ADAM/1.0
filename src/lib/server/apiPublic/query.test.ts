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

const anon: ApiAccess = { level: 'anonymous', exposed: false };
const keyed: ApiAccess = { level: 'key', exposed: false };
const drafted: ApiAccess = { level: 'draft', exposed: false };

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
    expect(fail('status=hidden').status).toBe(403);
    expect(fail('status=archived').status).toBe(403);
    expect(fail('draft=true').status).toBe(403);
  });

  it('lets a products:read key ask for published or hidden, not drafts', () => {
    expect(ok('status=hidden', keyed).statuses).toEqual(['hidden']);
    expect(ok('status=published,hidden', keyed).statuses).toEqual([
      'published',
      'hidden'
    ]);
    expect(fail('status=draft', keyed).status).toBe(403);
    expect(fail('draft=true', keyed).code).toBe('SCOPE_MISSING');
  });

  it('lets a products:read:draft key see drafts', () => {
    expect(ok('status=draft', drafted).statuses).toEqual(['draft']);
    expect(ok('draft=true', drafted).statuses).toContain('draft');
    expect(ok('', drafted).statuses).toEqual(['published', 'hidden', 'draft']);
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
    expect(JSON.stringify(filters.and[1])).toContain('appruved');
    expect(filters.and.length).toBe(4);
  });

  it('answers null when the caller may see no status at all', () => {
    expect(buildCatalogFilters('57', [], [])).toBeNull();
  });
});
