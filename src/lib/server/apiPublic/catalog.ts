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
import { optionAxesOf, optionValuesOf } from './shop.js';
import { errorText, schemaProbe } from './schemaProbe.js';
import { readStockFlags } from '$lib/server/shop/stockFlags.js';

export type ApiRun = (
  qid: string,
  vars: Record<string, unknown>
) => Promise<any>;

/** The real runner: the shared Strapi client, with this request's `fetch`. */
export function strapiRun(fetchFn?: typeof fetch): ApiRun {
  return (qid, vars) =>
    strapiClient.execute(qid, vars, undefined, fetchFn).catch((e) => {
      // One place to say which query failed; the route turns it into a 502.
      // The schema probes are the exception: until `1.0b` deploys the
      // shop columns it is *expected* to fail on every pass, and `shopSchemaLive`
      // is the one that decides whether that failure is worth a word (§6.8).
      if (qid !== 'rikmaApiShopSchema' && qid !== 'stockFlagsSchema')
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

// ─── the shop schema ────────────────────────────────────────────────────────
//
// Variants, galleries and the denormalized aggregates are new columns in
// Strapi (PLAN_SHOP_CUSTOMER_EXPERIENCE §6). Until they are deployed, asking
// for them fails the *whole* GraphQL query — a field that does not exist is a
// validation error, not an empty list. So the catalog asks a smaller question
// first: "is the shop schema there?" — and answers every request in the
// meantime with exactly the payload it served before variants were designed.
//
// The verdict is process state, deliberately: one tiny query per ten minutes,
// and a deployment that adds the columns starts serving them without a restart
// (the shorter retry on "not there yet").

const shopSchema = schemaProbe({
  qid: 'rikmaApiShopSchema',
  isLive: (res) => {
    const attrs = res?.data?.matanots?.data?.[0]?.attributes;
    // The field being *present* is the test — not its value: `false` on every
    // row is a perfectly live schema.
    return !!attrs && Object.prototype.hasOwnProperty.call(attrs, 'hasVariants');
  },
  meanwhile: 'products answer without variants'
});

// The order fields added after the first shop deployment (`displayNumber`,
// UX_COPY_SHOP_SALES §10). An empty `orders` table proves nothing by its rows,
// so here the probe *answering* is the test: a field that is not there fails
// validation whatever the rows are.
const ordersSchema = schemaProbe({
  qid: 'rikmaApiOrdersSchema',
  isLive: (res) => Array.isArray(res?.data?.orders?.data),
  meanwhile: 'orders answer 503 SHOP_NOT_READY'
});

/** Test seam — every verdict is process state tests must not inherit. */
export function resetShopSchemaVerdict(): void {
  shopSchema.reset();
  ordersSchema.reset();
}

/** Is the shop schema (variants / gallery / denormalized aggregates) readable? */
export function shopSchemaLive(run: ApiRun): Promise<boolean> {
  return shopSchema.live(run);
}

/** Can an order be written and read with every field the orders API uses? */
export function ordersSchemaLive(run: ApiRun): Promise<boolean> {
  return ordersSchema.live(run);
}

/**
 * The optional shop row of the products in this page: gallery, aggregates,
 * options, unit, delivery. Keyed by product id.
 *
 * It is a *separate* query on purpose — the catalog query must keep working
 * when these columns do not exist yet, and it must not grow a dependency on a
 * schema that is deployed on a different day than the code.
 */
export async function fetchShopRows(
  run: ApiRun,
  args: { projectId: string; productIds: string[] }
): Promise<Map<string, Record<string, any>>> {
  if (!args.productIds.length) return new Map();
  if (!(await shopSchemaLive(run))) return new Map();
  try {
    const res = await cachedRun(run, 'rikmaApiShopAttrs', {
      pid: String(args.projectId),
      ids: args.productIds
    });
    const rows: any[] = res?.data?.matanots?.data ?? [];
    return new Map(
      rows.map((row) => [
        String(row.id),
        (row.attributes ?? {}) as Record<string, any>
      ])
    );
  } catch (e) {
    console.warn(
      '[apiPublic] shop attrs could not be read — falling back to the product row:',
      errorText(e)
    );
    return new Map();
  }
}

/**
 * The variant rows of the products in this page, grouped by product id.
 *
 * Fetched only when the caller asked for them (`?expand=variants` on a list,
 * always on the detail): a shop that renders cards does not need twelve rows
 * of SKUs per card, and the aggregates it *does* need come from
 * `fetchShopRows`.
 */
export async function fetchVariantRows(
  run: ApiRun,
  args: { projectId: string; productIds: string[] }
): Promise<Map<string, any[]>> {
  if (!args.productIds.length) return new Map();
  if (!(await shopSchemaLive(run))) return new Map();
  try {
    const res = await cachedRun(run, 'rikmaApiShopVariants', {
      pid: String(args.projectId),
      ids: args.productIds
    });
    const rows: any[] = res?.data?.productVariants?.data ?? [];
    const byProduct = new Map<string, any[]>();
    for (const row of rows) {
      // The relation is what groups them: a variant that cannot say which
      // product it belongs to is dropped rather than guessed onto a row.
      const pid = String(row?.attributes?.matanot?.data?.id ?? '');
      if (!pid) continue;
      const list = byProduct.get(pid) ?? [];
      list.push(row);
      byProduct.set(pid, list);
    }
    return byProduct;
  } catch (e) {
    console.warn(
      '[apiPublic] variants could not be read — products answer without them:',
      errorText(e)
    );
    return new Map();
  }
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
 * The `unlimited` stock flag, merged into the rows the catalog already read
 * (PLAN_SHOP_CUSTOMER_EXPERIENCE §2.5). Its own small queries behind
 * `stockFlagsLive`, so the catalog queries never name a column that may not be
 * deployed; until it is, the rows come back untouched and `-1` reads as
 * "unlimited" the old way. New objects — the cached responses stay as they were.
 */
async function withStockFlags(
  run: ApiRun,
  nodes: any[],
  shopRows: Map<string, Record<string, any>>,
  variantRows: Map<string, any[]> | null
): Promise<{ nodes: any[]; shopRows: Map<string, Record<string, any>>; variantRows: Map<string, any[]> | null }> {
  const productIds = nodes.map((n) => String(n.id));
  const variantIds = variantRows ? [...variantRows.values()].flat().map((v) => String(v?.id)) : [];
  const flags = await readStockFlags(run, { productIds, variantIds });
  if (!flags.live || (!flags.products.size && !flags.variants.size)) return { nodes, shopRows, variantRows };

  const flagged = (row: any, unlimited: boolean | null | undefined) =>
    unlimited === undefined ? row : { ...row, attributes: { ...(row?.attributes ?? {}), unlimited } };
  return {
    nodes: nodes.map((n) => flagged(n, flags.products.get(String(n.id))?.unlimited)),
    // Only a row the shop layer returned gets the derived flag: a product with
    // no shop row must keep answering "no shop layer" (`attrs: null`).
    shopRows: new Map(
      [...shopRows].map(([id, extra]) => {
        const stockUnlimited = flags.products.get(id)?.stockUnlimited;
        return [id, stockUnlimited === undefined ? extra : { ...extra, stockUnlimited }];
      })
    ),
    variantRows: variantRows
      ? new Map(
          [...variantRows].map(([pid, list]) => [
            pid,
            list.map((v) => flagged(v, flags.variants.get(String(v?.id))?.unlimited))
          ])
        )
      : null
  };
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
  // Nothing this deployment could match (`?hasVariants=true` with no shop
  // schema): the empty answer is known before any query is sent (§5.5).
  if (query.matchesNothing) return { data: [], total: 0, pages: 0 };

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
  const productIds = rows.map((node) => String(node.id));

  // Two optional queries, both of which degrade to "no shop layer" rather than
  // to an error: the aggregates/gallery block (always, when the schema exists)
  // and the variant rows (only when they were asked for).
  const wantVariants = query.expand.includes('variants');
  const flagged = await withStockFlags(
    run,
    rows,
    await fetchShopRows(run, { projectId, productIds }),
    wantVariants ? await fetchVariantRows(run, { projectId, productIds }) : null
  );
  const { shopRows, variantRows } = flagged;

  const data = flagged.nodes
    .map((node) => {
      const id = String(node.id);
      return toApiProduct(node, rikma, {
        attrs: shopRows.get(id) ?? null,
        variants: variantRows ? (variantRows.get(id) ?? []) : undefined
      });
    })
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

  // The detail call is where variants are always worth loading: it is the page
  // a buyer chooses on, and the price/stock of the chosen combination has to be
  // in the same response (§5.1).
  const productIds = [String(node.id)];
  const flagged = await withStockFlags(
    run,
    [node],
    await fetchShopRows(run, { projectId: String(args.projectId), productIds }),
    await fetchVariantRows(run, { projectId: String(args.projectId), productIds })
  );

  return toApiProduct(flagged.nodes[0], args.rikma, {
    attrs: flagged.shopRows.get(productIds[0]) ?? null,
    variants: flagged.variantRows?.get(productIds[0]) ?? []
  });
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
      explicitStatus: false,
      matchesNothing: false
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

// ─── options ────────────────────────────────────────────────────────────────

export interface OptionAxis {
  key: string;
  name: string | null;
  values: Array<{ value: string; label: string | null; products: number }>;
}

/**
 * The rikma's option axes with a count of visible products per value
 * (`GET /options`, §5.3) — what a storefront renders as its filter bar.
 *
 * Two queries, and the second one is the interesting one: the counts come from
 * the **variant rows themselves**, not from the denormalized `variantAxes`,
 * because the value a shopper clicks must lead to the same set the
 * `?option.<key>=<value>` filter returns. A count and a filter that disagree
 * are worse than no count.
 *
 * Visibility is the catalog's own rule, twice: `buildCatalogFilters` in SQL and
 * `canSeeStatus` in JS after it — a count is a leak if it is counted from a row
 * the filter should have dropped (same reasoning as `fetchCategories`).
 *
 * No shop schema ⇒ no axes. An empty filter bar is the honest answer for a
 * deployment that cannot answer the filter behind it.
 */
export async function fetchOptions(
  run: ApiRun,
  args: { projectId: string; access: ApiAccess }
): Promise<OptionAxis[]> {
  if (!(await shopSchemaLive(run))) return [];

  const filters = buildCatalogFilters(
    args.projectId,
    defaultListStatuses(args.access),
    []
  );
  if (!filters) return [];

  const [axesRes, productsRes] = await Promise.all([
    cachedRun(run, 'rikmaApiOptions', { pid: String(args.projectId) }),
    cachedRun(run, 'rikmaApiShopAxes', { filters })
  ]);

  const products: Array<{
    optionValues: Array<{ key: string; value: string }>;
  }> = [];
  for (const node of productsRes?.data?.matanots?.data ?? []) {
    if (!canSeeStatus(args.access, productStatusOf(node?.attributes))) continue;
    for (const variant of node?.attributes?.variants?.data ?? []) {
      const optionValues = optionValuesOf(variant?.attributes);
      if (optionValues.length) products.push({ optionValues });
    }
  }

  return optionAxesOf(axesRes?.data?.productOptions?.data ?? [], products);
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
