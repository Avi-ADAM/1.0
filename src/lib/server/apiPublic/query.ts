/**
 * The query surface of the rikma catalog API — PLAN_HEADLESS_PRODUCTS_API §5.5.
 *
 * Everything here is pure: URL search params + who is asking in ⇒ a validated
 * query and the exact `MatanotFiltersInput` Strapi will be asked. Kept apart
 * from the route so the parameter rules (§5.5) and the spelling of each filter
 * can be tested without a request, a key, or a Strapi.
 *
 * Two things are deliberate:
 *
 *   - **The rikma is not a parameter.** It comes from the path (§5.0) and is
 *     added to the filter here, so no caller can widen the collection by
 *     dropping an argument.
 *   - **Invalid input is refused, never ignored.** `?sort=cheap`, `?fields=secret`
 *     and `?status=whatever` are 400s. A parameter that silently does nothing
 *     is how an integration ships believing it filters.
 */

import { LOCALES } from '$lib/translations/routes.js';
import { normalizeCode } from '$lib/money/currencies.js';
import { availableFilter, unavailableFilter } from '$lib/shop/stock.js';
import {
  API_PRODUCT_FIELD_SET,
  canSeeStatus,
  defaultListStatuses,
  isApiStatus,
  statusFilterFor,
  visibleStatusesFor,
  type ApiAccess,
  type ApiProductStatus
} from './dto.js';

/**
 * Sort keys the public catalog accepts, `-` = descending.
 *
 * `priceMax` is the "most expensive variant" column — the one a shop sorts by
 * when it shows a range. Without the shop schema deployed it degrades to
 * `price` (see `QueryCapabilities`), never to an error: a sort that used to
 * work must not start answering 400 because a column is missing.
 */
export const SORT_KEYS = [
  'price',
  'priceMax',
  'createdAt',
  'updatedAt',
  'name'
] as const;

/** The logical sort key → the Strapi column it reads, per schema state. */
export function sortColumnOf(key: string, shopSchema: boolean): string {
  if (!shopSchema) return key === 'priceMax' ? 'price' : key;
  if (key === 'price') return 'priceMin';
  return key;
}

/**
 * What the deployment can actually answer.
 *
 * `shopSchema` is true only once the shop collections/fields exist in Strapi
 * (PLAN_SHOP_CUSTOMER_EXPERIENCE §6). While it is false, parameters that
 * describe variants are answered honestly instead of being quietly ignored:
 * `?hasVariants=true` matches nothing (there are no variants to match), price
 * filters keep reading `price`, and `sort=price` keeps reading `price`.
 */
export interface QueryCapabilities {
  shopSchema?: boolean;
  /**
   * The `unlimited` stock flag is deployed (`stockFlagsLive`, §2.5). Until it
   * is, `?available=` reads `-1` as "unlimited" the old way — a variant
   * oversold to exactly -1 still lists as available.
   */
  stockFlags?: boolean;
}

/** An option key/value that may travel as `?option.<key>=<value>`. */
const OPTION_KEY = /^[a-z][a-z0-9_-]{0,31}$/;
const OPTION_VALUE = /^[a-z0-9][a-z0-9._-]{0,59}$/;

/** `seller`, `geo`, `images`, `dates` and `categories` are always inline,
 *  because a shop needs them and they are small (§5.4). `expand=rikma` adds the
 *  rikma block, and `expand=variants` adds the variant rows — the one piece of
 *  the payload that is big enough to be opt-in
 *  (PLAN_SHOP_CUSTOMER_EXPERIENCE §4.2). Anything else is a 400 — a no-op
 *  parameter would let a client believe it asked for something it did not get. */
export const EXPAND_KEYS = ['rikma', 'variants'] as const;

const KINDS = ['daily', 'monthly', 'yearly', 'total', 'unlimited'] as const;

export const MIN_LIMIT = 1;
export const MAX_LIMIT = 100;
export const DEFAULT_LIMIT = 20;

/** A coarse geo box, not a distance: ±`radius` metres in each direction. */
export const DEFAULT_GEO_RADIUS_M = 25000;
const METERS_PER_DEGREE = 111_320;

export interface CatalogQuery {
  page: number;
  limit: number;
  /** Strapi `sort` array, e.g. `['-updatedAt']`. */
  sort: string[];
  /** The caller's own filters (search, seller, price…), before tenant/status. */
  callerFilters: Record<string, unknown>[];
  /** Requested derived statuses (after the caller's permissions were applied). */
  statuses: ApiProductStatus[];
  fields: string[];
  expand: string[];
  locale: string | null;
  updatedSince: string | null;
  /** True when the caller explicitly asked for a status set (cache key + links). */
  explicitStatus: boolean;
  /**
   * The caller asked for something this deployment cannot have
   * (`?hasVariants=true` before the shop schema exists). The honest answer is
   * an empty list, and the caller answers it without asking Strapi a question
   * whose answer is already known — the same idiom as `statusFilterFor()`
   * returning `null`.
   */
  matchesNothing: boolean;
}

export type QueryError = {
  ok: false;
  status: number;
  code: string;
  message: string;
};
export type QueryResult = { ok: true; value: CatalogQuery } | QueryError;

const bad = (message: string, code = 'VALIDATION'): QueryError => ({
  ok: false,
  status: 400,
  code,
  message
});

function listOf(params: URLSearchParams, name: string): string[] {
  return params
    .getAll(name)
    .flatMap((v) => v.split(','))
    .map((v) => v.trim())
    .filter(Boolean);
}

function intOf(raw: string | null): number | null {
  if (raw === null || raw.trim() === '') return null;
  const n = Number(raw);
  return Number.isInteger(n) ? n : null;
}

function isoOf(raw: string | null): string | null | false {
  if (raw === null || raw.trim() === '') return null;
  const t = Date.parse(raw);
  return Number.isNaN(t) ? false : new Date(t).toISOString();
}

/**
 * Parse + validate the catalog parameters.
 *
 * `access` is already resolved (anonymous / key / draft) — this function is
 * where permission-shaped *parameters* meet it: `?status=draft` and
 * `?draft=true` need the draft scope, `?updatedSince=` needs a key at all.
 */
export function parseCatalogQuery(
  params: URLSearchParams,
  access: ApiAccess,
  caps: QueryCapabilities = {}
): QueryResult {
  const shopSchema = caps.shopSchema === true;
  const stockFlags = caps.stockFlags === true;
  // ── pagination ────────────────────────────────────────────────────────────
  const rawLimit = intOf(params.get('limit'));
  if (
    params.get('limit') !== null &&
    (rawLimit === null || rawLimit < MIN_LIMIT || rawLimit > MAX_LIMIT)
  ) {
    return bad(
      `limit must be an integer between ${MIN_LIMIT} and ${MAX_LIMIT}`
    );
  }
  const rawPage = intOf(params.get('page'));
  if (params.get('page') !== null && (rawPage === null || rawPage < 1)) {
    return bad('page must be an integer >= 1');
  }
  const limit = rawLimit ?? DEFAULT_LIMIT;
  const page = rawPage ?? 1;

  // ── sort ──────────────────────────────────────────────────────────────────
  const sortParam = params.get('sort');
  const sort: string[] = [];
  if (sortParam !== null && sortParam.trim() !== '') {
    for (const raw of sortParam
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)) {
      const desc = raw.startsWith('-');
      const key = desc ? raw.slice(1) : raw;
      if (!(SORT_KEYS as readonly string[]).includes(key)) {
        return bad(
          `sort must be one of ${SORT_KEYS.join(', ')} (prefix with "-" for descending)`
        );
      }
      // Spell the column once, here: `price` means "the cheapest way in", and
      // whether that lives on the product row or on a variant is a deployment
      // fact, not a caller's problem.
      sort.push(`${desc ? '-' : ''}${sortColumnOf(key, shopSchema)}`);
    }
  }
  if (!sort.length) sort.push('-updatedAt');

  // ── fields / expand ───────────────────────────────────────────────────────
  const fields = listOf(params, 'fields');
  const unknownField = fields.find((f) => !API_PRODUCT_FIELD_SET.has(f));
  if (unknownField) return bad(`Unknown field "${unknownField}" in fields`);

  const expand = listOf(params, 'expand');
  const unknownExpand = expand.find(
    (e) => !(EXPAND_KEYS as readonly string[]).includes(e)
  );
  if (unknownExpand)
    return bad(
      `Unknown expand "${unknownExpand}" (today only: ${EXPAND_KEYS.join(', ')})`
    );

  // ── locale ────────────────────────────────────────────────────────────────
  const locale = params.get('locale');
  if (locale !== null && locale !== '' && !LOCALES.includes(locale)) {
    return bad(`locale must be one of ${LOCALES.join(', ')}`);
  }

  // ── status / draft ────────────────────────────────────────────────────────
  const draftFlag = params.get('draft');
  if (
    draftFlag !== null &&
    draftFlag !== '' &&
    draftFlag !== 'true' &&
    draftFlag !== 'false'
  ) {
    return bad('draft must be true or false');
  }
  if (draftFlag === 'true' && access.level !== 'draft') {
    return {
      ok: false,
      status: 403,
      code: 'SCOPE_MISSING',
      message: 'draft requires an API key with the "products:read:draft" scope'
    };
  }

  const requested = listOf(params, 'status');
  const explicitStatus = requested.length > 0;
  let statuses: ApiProductStatus[];
  if (explicitStatus) {
    const unknown = requested.find((s) => !isApiStatus(s));
    if (unknown)
      return bad(
        `status must be one of ${visibleStatusesFor(access).join(', ')}`
      );
    const notAllowed = (requested as ApiProductStatus[]).find(
      (s) => !canSeeStatus(access, s)
    );
    if (notAllowed) {
      return {
        ok: false,
        status: 403,
        code: 'SCOPE_MISSING',
        message:
          notAllowed === 'draft'
            ? 'status=draft requires an API key with the "products:read:draft" scope'
            : `status=${notAllowed} is not available to this caller`
      };
    }
    statuses = [...new Set(requested as ApiProductStatus[])];
  } else {
    statuses = defaultListStatuses(access);
    // `?draft=true` is the shorthand for "include drafts in the list".
    if (draftFlag === 'true') statuses = [...statuses, 'draft'];
  }

  // ── updatedSince ──────────────────────────────────────────────────────────
  const updatedSince = isoOf(params.get('updatedSince'));
  if (updatedSince === false)
    return bad('updatedSince must be an ISO date-time');
  if (updatedSince && access.level === 'anonymous') {
    return {
      ok: false,
      status: 401,
      code: 'KEY_REQUIRED',
      message:
        'updatedSince requires an API key (incremental sync is a keyed feature)'
    };
  }

  // ── the caller's filters ──────────────────────────────────────────────────
  const and: Record<string, unknown>[] = [];

  const q = params.get('q');
  if (q !== null && q.trim() !== '') {
    if (q.length > 100) return bad('q must be at most 100 characters');
    // Name, the keywords the composer wrote for discovery, and the category —
    // the same three the in-app search leans on.
    and.push({
      or: [
        { name: { containsi: q } },
        { discoveryKeywords: { containsi: q } },
        { categories: { name: { containsi: q } } }
      ]
    });
  }

  const seller = params.get('seller');
  if (seller !== null && seller.trim() !== '') {
    const [kind, id] = seller.split(':');
    if (!id || !/^\d+$/.test(id) || (kind !== 'person' && kind !== 'rikma')) {
      return bad('seller must look like "person:88" or "rikma:57"');
    }
    and.push(
      kind === 'person'
        ? { owner_user: { id: { eq: id } } }
        : // "the products this rikma creates" — the same relation the seller
          // block is built from, so the filter and the field cannot disagree.
          { projectcreates: { id: { eq: id } } }
    );
  }

  const categories = listOf(params, 'category');
  if (categories.length) {
    const ids = categories.filter((c) => /^\d+$/.test(c));
    const names = categories.filter((c) => !/^\d+$/.test(c));
    const branches: Record<string, unknown>[] = [];
    if (ids.length) branches.push({ categories: { id: { in: ids } } });
    for (const name of names)
      branches.push({ categories: { name: { containsi: name } } });
    and.push(branches.length === 1 ? branches[0] : { or: branches });
  }

  const minPrice = params.get('minPrice');
  const maxPrice = params.get('maxPrice');
  for (const [label, raw] of [
    ['minPrice', minPrice],
    ['maxPrice', maxPrice]
  ] as const) {
    if (raw !== null && raw.trim() !== '' && !Number.isFinite(Number(raw))) {
      return bad(`${label} must be a number`);
    }
  }
  // A `quote` product has no price at all, so any price filter excludes it —
  // correct, and worth knowing: `?minPrice=0` is not "everything".
  //
  // With the shop schema, a price filter is a **range overlap**: a product
  // whose variants span 280–420 is in `?maxPrice=300`, because a buyer can buy
  // it for 280 (PLAN_SHOP_CUSTOMER_EXPERIENCE §5.2). The `null` branch keeps
  // rows written before the shop columns existed from vanishing — the same
  // idiom, and the same reason, as `NOT_ARCHIVED` in dto.ts.
  // A row that predates the backfill has both derived columns empty, so the
  // filter falls back to its own `price` for exactly those rows.
  const legacyPriceBranch = (op: 'gte' | 'lte', value: number) => ({
    and: [
      { priceMin: { null: true } },
      { priceMax: { null: true } },
      { price: { [op]: value } }
    ]
  });
  if (minPrice !== null && minPrice.trim() !== '') {
    const value = Number(minPrice);
    and.push(
      shopSchema
        ? {
            or: [{ priceMax: { gte: value } }, legacyPriceBranch('gte', value)]
          }
        : { price: { gte: value } }
    );
  }
  if (maxPrice !== null && maxPrice.trim() !== '') {
    const value = Number(maxPrice);
    and.push(
      shopSchema
        ? {
            or: [{ priceMin: { lte: value } }, legacyPriceBranch('lte', value)]
          }
        : { price: { lte: value } }
    );
  }

  const currency = params.get('currency');
  if (currency !== null && currency.trim() !== '') {
    // The same rule the Sales API uses (`normalizeCode`): three upper-case
    // letters — the rates table decides whether it converts.
    const code = normalizeCode(currency);
    if (!code) return bad('currency must be an ISO-4217 code, e.g. "ILS"');
    and.push({ currency: { code: { eq: code } } });
  }

  const available = params.get('available') ?? params.get('inStock');
  if (
    available !== null &&
    available !== '' &&
    available !== 'true' &&
    available !== 'false'
  ) {
    return bad('available must be true or false');
  }
  if (available === 'true') {
    // -1 = unlimited; `null` reads as 0 (out of stock) exactly as `/gift/[id]`
    // reads it, so it is not "available".
    //
    // With the shop schema the question is about the product's total stock
    // (`stockTotal`, summed over variants when there are any) — and a row that
    // predates the backfill still answers from its own `quant`.
    //
    // With the `unlimited` flag deployed, "unlimited" is the flag and `-1` is
    // a count (a queue of one) — except on a row that predates the flag
    // (`$lib/shop/stock.ts` builds those filters, and its test runs them).
    and.push(
      stockFlags && shopSchema
        ? {
            or: [
              availableFilter('stockTotal', 'stockUnlimited'),
              { and: [{ stockTotal: { null: true } }, availableFilter()] }
            ]
          }
        : stockFlags
          ? availableFilter()
          : shopSchema
        ? {
            or: [
              { stockTotal: { gt: 0 } },
              { stockTotal: { eq: -1 } },
              {
                and: [
                  { stockTotal: { null: true } },
                  { or: [{ quant: { gt: 0 } }, { quant: { eq: -1 } }] }
                ]
              }
            ]
          }
        : { or: [{ quant: { gt: 0 } }, { quant: { eq: -1 } }] }
    );
  }
  if (available === 'false') {
    and.push(
      stockFlags && shopSchema
        ? {
            or: [
              { and: [{ stockTotal: { notNull: true } }, unavailableFilter('stockTotal', 'stockUnlimited')] },
              { and: [{ stockTotal: { null: true } }, unavailableFilter()] }
            ]
          }
        : stockFlags
          ? unavailableFilter()
          : shopSchema
        ? {
            or: [
              { stockTotal: { eq: 0 } },
              { stockTotal: { null: true }, quant: { eq: 0 } },
              { stockTotal: { null: true }, quant: { null: true } }
            ]
          }
        : { or: [{ quant: { eq: 0 } }, { quant: { null: true } }] }
    );
  }

  const hasVariants = params.get('hasVariants');
  if (
    hasVariants !== null &&
    hasVariants !== '' &&
    hasVariants !== 'true' &&
    hasVariants !== 'false'
  ) {
    return bad('hasVariants must be true or false');
  }
  let matchesNothing = false;
  if (hasVariants === 'true') {
    // Asking for variants on a deployment that has none is not an error — the
    // truthful answer is "no products match", and this says so without a query.
    if (shopSchema) and.push({ hasVariants: { eq: true } });
    else matchesNothing = true;
  }
  if (hasVariants === 'false' && shopSchema) {
    and.push({
      or: [{ hasVariants: { eq: false } }, { hasVariants: { null: true } }]
    });
  }

  // `?option.size=m` — the axis a buyer picks in the storefront (§5.2).
  //
  // Case is forgiven (`?option.Size=M` works: the value is normalized the same
  // way the save normalizes it), but the character set is not: the filter is
  // compared against the `axisKey` string, so a value that could carry the `|`
  // or `:` delimiters is refused with a 400 rather than searched for.
  const optionPairs: Array<{ key: string; value: string }> = [];
  for (const [name, value] of params.entries()) {
    if (!name.startsWith('option.')) continue;
    const key = name.slice('option.'.length).trim().toLowerCase();
    const val = value.trim().toLowerCase();
    if (!OPTION_KEY.test(key) || !OPTION_VALUE.test(val)) {
      return bad(
        `option.${key} must be a key of a-z, digits, "_" or "-" and a value of a-z, digits, ".", "_" or "-", e.g. ?option.size=m`
      );
    }
    optionPairs.push({ key, value: val });
  }
  if (optionPairs.length) {
    if (!shopSchema) {
      matchesNothing = true;
    } else {
      // One relation filter holding every requested pair, so "size M **and**
      // colour red" means one variant carrying both — not one variant carrying
      // each. `axisKey` is written as `|size:m|color:red|` exactly for this
      // (`shop.ts` `axisKeyOf`).
      and.push({
        variants: {
          and: [
            ...optionPairs.map((p) => ({
              axisKey: { contains: `|${p.key}:${p.value}|` }
            })),
            { active: { eq: true } }
          ]
        }
      });
    }
  }

  const sku = params.get('sku');
  if (sku !== null && sku.trim() !== '') {
    const value = sku.trim();
    if (value.length > 64) return bad('sku must be at most 64 characters');
    if (shopSchema) and.push({ variants: { sku: { eq: value } } });
    else matchesNothing = true;
  }

  const kindOf = params.get('kindOf');
  if (kindOf !== null && kindOf.trim() !== '') {
    if (!(KINDS as readonly string[]).includes(kindOf))
      return bad(`kindOf must be one of ${KINDS.join(', ')}`);
    and.push({ kindOf: { eq: kindOf } });
  }

  const lat = params.get('lat');
  const lng = params.get('lng');
  const radius = params.get('radius');
  if (lat !== null || lng !== null) {
    if (lat === null || lng === null)
      return bad('lat and lng must be given together');
    const latN = Number(lat);
    const lngN = Number(lng);
    if (!Number.isFinite(latN) || latN < -90 || latN > 90)
      return bad('lat must be between -90 and 90');
    if (!Number.isFinite(lngN) || lngN < -180 || lngN > 180)
      return bad('lng must be between -180 and 180');
    const radiusN =
      radius === null || radius.trim() === ''
        ? DEFAULT_GEO_RADIUS_M
        : Number(radius);
    if (!Number.isFinite(radiusN) || radiusN <= 0)
      return bad('radius must be a positive number of metres');
    // A box, not a circle: Strapi cannot compute distance, and pretending it
    // did would be worse than saying so. The DTO's `geo` carries each product's
    // own radius, so a client that needs the real thing can finish the job.
    const dLat = radiusN / METERS_PER_DEGREE;
    const dLng = dLat / Math.max(Math.cos((latN * Math.PI) / 180), 0.01);
    and.push(
      { lat: { between: [latN - dLat, latN + dLat] } },
      { lng: { between: [lngN - dLng, lngN + dLng] } }
    );
  }

  if (updatedSince) and.push({ updatedAt: { gt: updatedSince } });

  return {
    ok: true,
    value: {
      page,
      limit,
      sort,
      callerFilters: and,
      statuses,
      fields,
      expand,
      locale: locale || null,
      updatedSince,
      explicitStatus,
      matchesNothing
    }
  };
}

/**
 * The final `MatanotFiltersInput`: the rikma of the path, the statuses this
 * caller may see, then whatever they asked for. Composed here (and only here)
 * so the tenant and the visibility rule cannot be forgotten by a handler —
 * and so `statusFilterFor` returning `null` (nothing visible) is handled once.
 *
 * `null` means "no row can match": the caller answers an empty list without
 * asking Strapi a question whose answer is already known.
 */
export function buildCatalogFilters(
  projectId: string,
  statuses: ApiProductStatus[],
  callerFilters: Record<string, unknown>[]
): Record<string, unknown> | null {
  const statusFilter = statusFilterFor(statuses);
  if (!statusFilter) return null;
  return {
    and: [
      { projectcreates: { id: { eq: String(projectId) } } },
      statusFilter,
      ...callerFilters
    ]
  };
}
