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

/** Sort keys the public catalog accepts, `-` = descending. */
export const SORT_KEYS = ['price', 'createdAt', 'updatedAt', 'name'] as const;

/** Today `expand=rikma` is the only switch that adds anything: `seller`, `geo`,
 *  `images`, `dates` and `categories` are always inline, because a shop needs
 *  them and they are small (§5.4). Anything else is a 400 — a no-op parameter
 *  would let a client believe it asked for something it did not get. */
export const EXPAND_KEYS = ['rikma'] as const;

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
  access: ApiAccess
): QueryResult {
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
      sort.push(`${desc ? '-' : ''}${key}`);
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
  if (minPrice !== null && minPrice.trim() !== '')
    and.push({ price: { gte: Number(minPrice) } });
  if (maxPrice !== null && maxPrice.trim() !== '')
    and.push({ price: { lte: Number(maxPrice) } });

  const currency = params.get('currency');
  if (currency !== null && currency.trim() !== '') {
    // The same rule the Sales API uses (`normalizeCode`): three upper-case
    // letters — the rates table decides whether it converts.
    const code = normalizeCode(currency);
    if (!code) return bad('currency must be an ISO-4217 code, e.g. "ILS"');
    and.push({ currency: { code: { eq: code } } });
  }

  const available = params.get('available');
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
    and.push({ or: [{ quant: { gt: 0 } }, { quant: { eq: -1 } }] });
  }
  if (available === 'false') {
    and.push({ or: [{ quant: { eq: 0 } }, { quant: { null: true } }] });
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
      explicitStatus
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
