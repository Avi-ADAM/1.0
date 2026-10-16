/**
 * Reading one rikma's catalog, projected, cached and paginated.
 *
 * The routes stay thin on purpose: everything between "here is a rikma, a
 * caller and a validated query" and "here is the JSON body" lives here, so the
 * four read endpoints cannot drift in the two things that must never drift —
 * what the projector emits, and which rows the tenant rule lets through.
 *
 * Every function takes a `run` (qid + vars → response) rather than importing
 * the Strapi client, because that seam is what makes the whole layer testable
 * without a backend.
 */

import { strapiClient } from '$lib/server/actions/index.js';
import { cachedQuery, queryCacheKey } from './cache.js';
import { buildCatalogFilters, type CatalogQuery } from './query.js';
import {
  canSeeStatus,
  defaultListStatuses,
  productStatusOf,
  toApiCategory,
  toApiProduct,
  toApiRikma,
  type ApiAccess,
  type ApiCategory,
  type ApiProduct,
  type ApiRikma,
  type ApiRikmaRef
} from './dto.js';
import { apiRikmaPath } from './rikmaPath.js';

export type ApiRun = (
  qid: string,
  vars: Record<string, unknown>
) => Promise<any>;

/** The real runner: the shared Strapi client, with this request's `fetch`. */
export function strapiRun(fetchFn?: typeof fetch): ApiRun {
  return (qid, vars) =>
    strapiClient.execute(qid, vars, undefined, fetchFn).catch((e) => {
      // One place to say which query failed; the route turns it into a 502.
      console.error(
        `[apiPublic] ${qid} failed:`,
        e?.getMessages ? e.getMessages() : e
      );
      throw e;
    });
}

/** The cached variant of a query — same key, same answer for 45 seconds. */
function cachedRun(
  run: ApiRun,
  qid: string,
  vars: Record<string, unknown>
): Promise<any> {
  return cachedQuery(queryCacheKey(qid, vars), () => run(qid, vars));
}

// ─── the rikma itself ───────────────────────────────────────────────────────

export interface RikmaRefRow {
  id: string;
  slug: string | null;
  name: string | null;
}

/**
 * The rikma's identity as every response's header line. Also the existence
 * check: a numeric path reaches this query without any prior lookup, so "is
 * there such a rikma at all" is answered here — `null` ⇒ the route's 404.
 */
export async function fetchRikmaRef(
  run: ApiRun,
  projectId: string
): Promise<RikmaRefRow | null> {
  const res = await cachedRun(run, 'rikmaApiRef', { pid: String(projectId) });
  const row = res?.data?.project?.data;
  if (!row?.id) return null;
  return {
    id: String(row.id),
    slug:
      typeof row.attributes?.slug === 'string' && row.attributes.slug
        ? row.attributes.slug
        : null,
    name: row.attributes?.projectName ?? null
  };
}

/** The rikma as a DTO ref: once at the top of a response, not in every row. */
export function refOf(rikma: RikmaRefRow): ApiRikmaRef {
  return {
    id: rikma.id,
    slug: rikma.slug,
    name: rikma.name,
    canonicalPath: apiRikmaPath(rikma.slug ?? rikma.id)
  };
}

/**
 * The key owner's display name, for `GET /api/v1/me`.
 *
 * Degrades to `null` on any failure: a nicety must never take down the one
 * endpoint an integration starts with (the api-key query in apiKeys.ts fails
 * closed for the opposite reason — there, the failure decides scope).
 */
export async function fetchUserName(
  run: ApiRun,
  userId: string
): Promise<string | null> {
  try {
    const res = await cachedRun(run, 'rikmaApiUserName', {
      uid: String(userId)
    });
    return res?.data?.usersPermissionsUser?.data?.attributes?.username ?? null;
  } catch (e) {
    console.warn(
      '[apiPublic] username lookup failed:',
      e?.getMessages ? e.getMessages() : e
    );
    return null;
  }
}

/**
 * `GET /api/v1/r/{rikma}` — the profile. `look` comes from the same row
 * (§5.3 keeps it off the list responses, where it would repeat per line).
 */
export async function fetchRikmaProfile(
  run: ApiRun,
  projectId: string
): Promise<Record<string, any> | null> {
  const res = await cachedRun(run, 'rikmaApiProject', {
    pid: String(projectId)
  });
  return res?.data?.project?.data?.attributes ?? null;
}

// ─── products ───────────────────────────────────────────────────────────────

export interface ProductPage {
  data: ApiProduct[];
  total: number | null;
  pages: number | null;
}

function paginationOf(
  res: any,
  requestedLimit: number,
  rowCount: number
): { total: number | null; pages: number | null } {
  const p = res?.data?.matanots?.meta?.pagination;
  if (p && Number.isFinite(Number(p.total))) {
    return {
      total: Number(p.total),
      pages: Number(p.pageCount ?? Math.ceil(Number(p.total) / requestedLimit))
    };
  }
  // Strapi without `meta` (an older gateway, a mocked backend): report what we
  // can honestly claim. `total: null` says "unknown", it does not say "zero".
  if (rowCount < requestedLimit) return { total: rowCount, pages: 1 };
  return { total: null, pages: null };
}

/**
 * One page of the catalog. The filters carry the rikma and the visibility rule
 * (`buildCatalogFilters`); the JS pass below re-checks each row's derived
 * status, because a filter that is subtly wrong on a NULL column must not
 * become a privacy incident — it must become an empty slot.
 */
export async function fetchProductPage(
  run: ApiRun,
  args: {
    projectId: string;
    rikma: ApiRikmaRef;
    access: ApiAccess;
    query: CatalogQuery;
  }
): Promise<ProductPage> {
  const { projectId, rikma, access, query } = args;
  const filters = buildCatalogFilters(
    projectId,
    query.statuses,
    query.callerFilters
  );
  if (!filters) return { data: [], total: 0, pages: 0 };

  const res = await cachedRun(run, 'rikmaApiProducts', {
    filters,
    sort: query.sort,
    page: query.page,
    pageSize: query.limit
  });

  const rows: any[] = res?.data?.matanots?.data ?? [];
  const data = rows
    .map((node) => toApiProduct(node, rikma))
    .filter((p): p is ApiProduct => p !== null)
    .filter((p) => canSeeStatus(access, p.status));

  const { total, pages } = paginationOf(res, query.limit, rows.length);
  return { data, total, pages };
}

/** `GET /api/v1/r/{rikma}/products/{productId}` — scoped to the rikma. */
export async function fetchProduct(
  run: ApiRun,
  args: { projectId: string; productId: string; rikma: ApiRikmaRef }
): Promise<ApiProduct | null> {
  const res = await cachedRun(run, 'rikmaApiProduct', {
    pid: String(args.projectId),
    productId: String(args.productId)
  });
  const node = res?.data?.matanots?.data?.[0];
  if (!node) return null;
  return toApiProduct(node, args.rikma);
}

/** Counts of the visible products, for the profile's `productsCount`. */
export async function fetchVisibleProductCount(
  run: ApiRun,
  args: {
    projectId: string;
    rikma: ApiRikmaRef;
    access: ApiAccess;
    statuses: CatalogQuery['statuses'];
  }
): Promise<number | null> {
  const page = await fetchProductPage(run, {
    projectId: args.projectId,
    rikma: args.rikma,
    access: args.access,
    query: {
      page: 1,
      limit: 1,
      sort: ['-updatedAt'],
      callerFilters: [],
      statuses: args.statuses,
      fields: [],
      expand: [],
      locale: null,
      updatedSince: null,
      explicitStatus: false
    }
  });
  return page.total;
}

// ─── categories ─────────────────────────────────────────────────────────────

/**
 * The categories that actually have visible products here, with their counts
 * (§5.2). Built from one walk over those products rather than a
 * `categories` query plus a count per category: the products already carry
 * their categories, and a rikma's catalog is small enough that one id-only pass
 * is cheaper than twenty round trips. Facets over a big shop are P1 (§4.10).
 *
 * The rows are re-checked in JS (`canSeeStatus`), exactly like the list: the
 * GraphQL filter is the first line, and a category counted from a row the
 * filter should have dropped would tell an anonymous visitor that a draft
 * exists — the number is the leak, not the product.
 */
export async function fetchCategories(
  run: ApiRun,
  args: {
    projectId: string;
    access: ApiAccess;
    callerFilters?: Record<string, unknown>[];
  }
): Promise<ApiCategory[]> {
  const filters = buildCatalogFilters(
    args.projectId,
    defaultListStatuses(args.access),
    args.callerFilters ?? []
  );
  if (!filters) return [];

  const res = await cachedRun(run, 'rikmaApiCategories', { filters });
  const rows: any[] = res?.data?.matanots?.data ?? [];

  const seen = new Map<string, { name: string | null; count: number }>();
  for (const node of rows) {
    if (!canSeeStatus(args.access, productStatusOf(node?.attributes))) continue;
    for (const category of node?.attributes?.categories?.data ?? []) {
      const id = String(category.id);
      const current = seen.get(id) ?? {
        name: category?.attributes?.name ?? null,
        count: 0
      };
      current.count += 1;
      if (!current.name && category?.attributes?.name)
        current.name = category.attributes.name;
      seen.set(id, current);
    }
  }

  return [...seen.entries()]
    .map(([id, { name, count }]) =>
      toApiCategory({ id, attributes: { name } }, count)
    )
    .filter((c) => c.name)
    .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'he'));
}

// ─── response bodies ────────────────────────────────────────────────────────

export interface ListBody {
  rikma: ApiRikmaRef;
  data: ApiProduct[];
  meta: {
    pagination: {
      page: number;
      limit: number;
      total: number | null;
      pages: number | null;
    };
    locale: string | null;
    generatedAt: string;
  };
  links: { self: string; next: string | null; prev: string | null };
}

/**
 * The list body, including the `self`/`next`/`prev` links of §5.4. Built from
 * the canonical path and the caller's own parameters, so a client that follows
 * `next` keeps every filter it sent.
 */
export function buildListBody(args: {
  rikma: ApiRikmaRef;
  page: ProductPage;
  query: CatalogQuery;
  search: URLSearchParams;
}): ListBody {
  const self = new URLSearchParams(args.search);
  const link = (page: number | null): string | null => {
    if (page === null) return null;
    const params = new URLSearchParams(self);
    if (page <= 1) params.delete('page');
    else params.set('page', String(page));
    const qs = params.toString();
    return `${args.rikma.canonicalPath}/products${qs ? `?${qs}` : ''}`;
  };

  const { page, limit, total, pages } = {
    page: args.query.page,
    limit: args.query.limit,
    total: args.page.total,
    pages: args.page.pages
  };
  const hasNext =
    pages !== null ? page < pages : args.page.data.length === limit;

  return {
    rikma: args.rikma,
    data: args.page.data,
    meta: {
      pagination: { page, limit, total, pages },
      locale: args.query.locale,
      generatedAt: new Date().toISOString()
    },
    links: {
      self: link(page) ?? `${args.rikma.canonicalPath}/products`,
      next: hasNext ? link(page + 1) : null,
      prev: page > 1 ? link(page - 1) : null
    }
  };
}

/** The profile body of `GET /api/v1/r/{rikma}`. */
export function buildRikmaBody(args: {
  attrs: Record<string, any> | null;
  rikma: RikmaRefRow;
  productsCount: number | null;
  look: Record<string, any> | null;
}): { data: ApiRikma } {
  return {
    data: toApiRikma(
      args.attrs,
      { id: args.rikma.id, slug: args.rikma.slug },
      {
        productsCount: args.productsCount,
        look: args.look
      }
    )
  };
}
