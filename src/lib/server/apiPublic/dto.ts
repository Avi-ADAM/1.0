/**
 * The public projection of a rikma's catalog — PLAN_HEADLESS_PRODUCTS_API §5.3.
 *
 * This module is the only place that decides what leaves the server through the
 * read API. Two rules hold it together:
 *
 *   1. **Whitelist, not blacklist.** Every field below is *built* from the raw
 *      Strapi node — nothing is ever spread. A field added to `Matanot` in
 *      Strapi therefore stays internal until somebody adds it here on purpose.
 *      That matters because the row carries the rikma's real costs: the recipe
 *      (`matanot_recipe_missions` / `matanot_recipe_resources`: hours × rate,
 *      `stepCapacity`, `assignedMember`), `marginPct`, `estimatedPrice`,
 *      `entryRate`, `maxsaleyear*`. `dto.test.ts` walks a maximally-populated
 *      node through the projector and fails if any of them appears — the
 *      tripwire §6.1 asks for.
 *
 *   2. **`status` is derived, never stored** (§4.3). Five flags exist —
 *      `appruved`, `archived`, `lifecycle`, `hideFromDiscovery`,
 *      `status_of_voting` — and a key holder cannot be asked to combine them.
 *      One vocabulary comes out: `draft | published | archived`, derived from
 *      `status_of_voting`/`lifecycle`/`archived` (never `appruved` — see
 *      `productStatusOf`).
 *      The flags themselves never leave (a raw flag in the payload is exactly
 *      the leak that makes people hide products from us).
 *
 * The price is deliberately *not* final and the DTO says so:
 * `pricingMode: 'quote'` ⇒ `price: null`, `'estimated'` ⇒ price is an ask
 * (§11.א). A consumer must read `pricingMode` before presenting a price as
 * final, and no consumer may push this field into a checkout as-is.
 */

import { mediaUrl } from '$lib/utils/processLifecycle.js';
import { resolveLocation } from '$lib/server/map/normalizeMapItems.js';
import { excerptOf } from '$lib/server/discovery/normalizeCards.js';
import { SITE_ORIGIN, rikmaPath } from '$lib/rikmaAddress/rikmaUrl.js';
import { parseLook } from '$lib/rikmaLook/look.js';
import { apiRikmaPath } from './rikmaPath.js';
import { sanitizeDescriptionHtml } from './html.js';

// ─── status ─────────────────────────────────────────────────────────────────

export type ApiProductStatus = 'draft' | 'published' | 'archived';

export const API_STATUSES: readonly ApiProductStatus[] = [
  'draft',
  'published',
  'archived'
];

export function isApiStatus(value: unknown): value is ApiProductStatus {
  return (
    typeof value === 'string' &&
    (API_STATUSES as readonly string[]).includes(value)
  );
}

/** `lifecycle` values that end an object — `released` is as final as `archived`. */
const ENDED_LIFECYCLES = ['archived', 'released'];
/** `status_of_voting` values of a product the rikma has not opened for sale yet. */
const DRAFT_VOTING = ['draft', 'voting'];

/**
 * The derived status of a product row (PLAN §4.3, corrected — §12 #1).
 *
 * The signal is `status_of_voting`, not `appruved`. Creation writes only
 * `status_of_voting` (`'active'`, or `'voting'` for a complex product in a
 * multi-member rikma — `createComplexMatanot`); `appruved` is written only by
 * `approveMatanot`, which no screen calls, and Strapi defaults it to `false`.
 * Reading `appruved` would turn every real product into a draft.
 *
 * `archived` wins over everything: an archived product is gone from the shop.
 * `lifecycle` arrived with the archival flow, so legacy rows carry NULL — read
 * as "active", the same reasoning as `NOT_ARCHIVED` in qids.js. `released` is
 * terminal (as in `archive/membership.ts`); `archiveProposed` is a proposal,
 * not an archive, and stays published until the decision matures.
 *
 * `hideFromDiscovery` is **not** a status. It takes a product out of the
 * platform-wide directory (`/gift`) only — the product stays on its own page
 * and on the rikma's page — so the rikma's shop lists it like any other.
 */
export function productStatusOf(
  attrs: Record<string, any> | null | undefined
): ApiProductStatus {
  const a = attrs ?? {};
  if (
    a.archived === true ||
    ENDED_LIFECYCLES.includes(a.lifecycle) ||
    a.status_of_voting === 'archived'
  )
    return 'archived';
  if (DRAFT_VOTING.includes(a.status_of_voting)) return 'draft';
  return 'published';
}

/** Who is asking. */
export interface ApiAccess {
  /** `anonymous` — no key; `key` — `products:read`; `draft` — also `products:read:draft`. */
  level: 'anonymous' | 'key' | 'draft';
}

/**
 * Every status this caller may ever see.
 *
 * The anonymous shop is what the rikma's public page already shows: its
 * published products, `hideFromDiscovery` included (§4.3). A key may also ask
 * for `archived` explicitly; only `products:read:draft` adds drafts.
 */
export function visibleStatusesFor(access: ApiAccess): ApiProductStatus[] {
  const statuses: ApiProductStatus[] = ['published'];
  if (access.level !== 'anonymous') statuses.push('archived');
  if (access.level === 'draft') statuses.push('draft');
  return statuses;
}

/** Statuses a plain (unfiltered) list may return — `archived` is never listed. */
export function defaultListStatuses(access: ApiAccess): ApiProductStatus[] {
  return visibleStatusesFor(access).filter((s) => s !== 'archived');
}

export function canSeeStatus(
  access: ApiAccess,
  status: ApiProductStatus
): boolean {
  return visibleStatusesFor(access).includes(status);
}

// ─── status → Strapi filter fragments ───────────────────────────────────────

/**
 * The `null` branches are not decoration. `archived`, `lifecycle` and
 * `status_of_voting` are nullable on rows written before each flag existed,
 * and in SQL `field <> x` / `NOT IN` is NULL for those rows — the filter would
 * silently drop every legacy product. Same idiom as `NOT_ARCHIVED` in qids.js.
 */
const ARCHIVED_TRUE = {
  or: [
    { archived: { eq: true } },
    { lifecycle: { in: ENDED_LIFECYCLES } },
    { status_of_voting: { eq: 'archived' } }
  ]
};
const NOT_ARCHIVED = {
  and: [
    { or: [{ archived: { eq: false } }, { archived: { null: true } }] },
    {
      or: [
        { lifecycle: { null: true } },
        { lifecycle: { notIn: ENDED_LIFECYCLES } }
      ]
    },
    {
      or: [
        { status_of_voting: { null: true } },
        { status_of_voting: { ne: 'archived' } }
      ]
    }
  ]
};
const IS_DRAFT = { status_of_voting: { in: DRAFT_VOTING } };
const NOT_DRAFT = {
  or: [
    { status_of_voting: { null: true } },
    { status_of_voting: { notIn: DRAFT_VOTING } }
  ]
};

/** One branch of the status filter, as GraphQL input. */
function statusBranch(status: ApiProductStatus): Record<string, unknown> {
  switch (status) {
    case 'archived':
      return ARCHIVED_TRUE;
    case 'draft':
      return { and: [NOT_ARCHIVED, IS_DRAFT] };
    case 'published':
    default:
      return { and: [NOT_ARCHIVED, NOT_DRAFT] };
  }
}

/**
 * A `MatanotFiltersInput` that keeps exactly the given statuses. `null` means
 * "this caller may see nothing" — the caller answers with an empty list rather
 * than asking Strapi a question whose answer is already known.
 */
export function statusFilterFor(
  statuses: ApiProductStatus[]
): Record<string, unknown> | null {
  const branches = statuses.map(statusBranch);
  if (branches.length === 0) return null;
  return branches.length === 1 ? branches[0] : { or: branches };
}

// ─── the DTO ────────────────────────────────────────────────────────────────

export interface ApiImage {
  url: string;
  width: number | null;
  height: number | null;
  alt: string | null;
}

export interface ApiSeller {
  type: 'person' | 'rikma';
  id: string | null;
  name: string | null;
  /** The seller's public page — `/r/<slug>` or `/project/<id>` for a rikma. */
  url: string | null;
  picUrl: string | null;
}

export interface ApiGeo {
  lat: number | null;
  lng: number | null;
  radius: number | null;
  hint: string | null;
  isOnline: boolean;
}

export interface ApiAvailability {
  unlimited: boolean;
  /** `null` iff `unlimited` — so a consumer cannot print "0 in stock" by accident. */
  quantity: number | null;
}

export interface ApiProduct {
  id: string;
  name: string;
  descriptionHtml: string | null;
  descriptionText: string | null;
  status: ApiProductStatus;
  price: number | null;
  currency: string | null;
  pricingMode: 'fixed' | 'estimated' | 'quote';
  availability: ApiAvailability;
  kindOf: string | null;
  categories: Array<{ id: string; name: string }>;
  images: ApiImage[];
  seller: ApiSeller;
  geo: ApiGeo;
  dates: { startDate: string | null; finnishDate: string | null };
  locale: string | null;
  /** True only when the strings really were translated (P1 — see catalog.ts). */
  translated: boolean;
  origin: string | null;
  updatedAt: string | null;
  /** The platform's public product page. */
  url: string;
  /** Where a buyer acts (request/checkout). Null when nothing can be bought. */
  buyUrl: string | null;
}

export interface ApiRikmaRef {
  id: string;
  slug: string | null;
  name: string | null;
  /** `/api/v1/r/<slug-or-id>` — the address every other endpoint hangs off. */
  canonicalPath: string;
}

export interface ApiRikma extends ApiRikmaRef {
  about: string | null;
  /** The rikma's public page. */
  url: string;
  city: string | null;
  location: ApiGeo | null;
  look: Record<string, any> | null;
  supportPage: string | null;
  currency: string | null;
  productsCount: number | null;
}

export interface ApiCategory {
  id: string;
  name: string | null;
  productsCount: number | null;
}

function num(v: unknown): number | null {
  const n = typeof v === 'string' ? Number(v) : (v as number);
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
}

function str(v: unknown): string | null {
  return typeof v === 'string' && v.length ? v : null;
}

/** Join the platform origin with a path — `/gift/1842` ⇒ absolute. */
function abs(path: string): string {
  return path.startsWith('http') ? path : `${SITE_ORIGIN}${path}`;
}

/**
 * One product photo, at the size the rest of the platform uses
 * (`picUrlOf` prefers `small`). A real media pipeline — several sizes, focal
 * point, CDN — is P1 (§4.10); until then one image per product, and the URL is
 * absolute because the consumer is another origin.
 */
export function imageOf(pic: any): ApiImage | null {
  const a = pic?.data?.attributes;
  if (!a) return null;
  const size =
    a.formats?.small || a.formats?.medium || a.formats?.thumbnail || a;
  const url = str(size.url) || str(a.url);
  if (!url) return null;
  return {
    url: mediaUrl(url),
    width: num(size.width),
    height: num(size.height),
    alt: str(a.alternativeText) || str(a.caption)
  };
}

/** A seller's own picture — the personal-seller path passes `owner_user.picUrl`. */
function sellerPicOf(pic: any): string | null {
  const a = pic?.data?.attributes;
  if (!a) return null;
  const url = a.formats?.small?.url || a.formats?.thumbnail?.url || a.url;
  return url ? mediaUrl(url) : null;
}

/** `projectcreates` → the rikma that sells this product, whoever asks. */
export function sellerOf(
  attrs: Record<string, any>,
  fallbackRikma: ApiRikmaRef
): ApiSeller {
  if (attrs?.origin === 'personal') {
    const owner = attrs?.owner_user?.data;
    const ownerId = owner?.id != null ? String(owner.id) : null;
    return {
      type: 'person',
      id: ownerId,
      name: str(owner?.attributes?.username),
      // A person has no storefront of their own yet (`UserStorefront` is P2):
      // the product page is the only place they can be seen.
      url: null,
      picUrl: sellerPicOf(owner?.attributes?.profilePic)
    };
  }
  const project = attrs?.projectcreates?.data?.[0];
  const projectId = project?.id != null ? String(project.id) : null;
  const slug = str(project?.attributes?.slug);
  return {
    type: 'rikma',
    id: projectId ?? fallbackRikma.id,
    name: str(project?.attributes?.projectName) ?? fallbackRikma.name,
    url:
      slug || projectId
        ? rikmaPath({ id: projectId ?? fallbackRikma.id, slug })
        : null,
    picUrl: sellerPicOf(project?.attributes?.profilePic)
  };
}

/**
 * `quant` semantics come from the sale path, not from a guess: `-1` is
 * "unlimited" (`createSale` skips the decrement for it, `hamatanot.svelte`
 * prints "ללא הגבלה"), every other value is a count, and a missing value reads
 * as 0 — which is what `/gift/[id]` does (`data.alld?.quant || 0`).
 */
export function availabilityOf(attrs: Record<string, any>): ApiAvailability {
  const quant = num(attrs?.quant);
  if (quant === -1) return { unlimited: true, quantity: null };
  return { unlimited: false, quantity: quant === null ? 0 : quant };
}

function pricingModeOf(
  attrs: Record<string, any>
): 'fixed' | 'estimated' | 'quote' {
  const mode = attrs?.pricingMode;
  return mode === 'quote' || mode === 'estimated' ? mode : 'fixed';
}

/**
 * Raw Strapi node → the public DTO.
 *
 * `rikma` is the rikma the *request* is scoped to (path + key), which is what a
 * product without a readable `projectcreates` falls back to — never a global
 * list of projects.
 */
export function toApiProduct(
  node: { id: string | number; attributes?: Record<string, any> | null },
  rikma: ApiRikmaRef
): ApiProduct | null {
  const a = node?.attributes;
  if (!a || !str(a.name)) return null;

  const pricingMode = pricingModeOf(a);
  const price = pricingMode === 'quote' ? null : num(a.price);
  const loc = resolveLocation(a.location, {
    lat: a.lat,
    lng: a.lng,
    radius: a.radius
  });
  const image = imageOf(a.pic);
  const id = String(node.id);

  // Text comes from the sanitized HTML too, so a `<script>` body never
  // surfaces as words in the plain-text field.
  const descriptionHtml = sanitizeDescriptionHtml(a.desc);
  return {
    id,
    name: a.name,
    descriptionHtml,
    descriptionText: excerptOf(descriptionHtml),
    status: productStatusOf(a),
    price,
    currency: str(a.currency?.data?.attributes?.code),
    pricingMode,
    availability: availabilityOf(a),
    kindOf: str(a.kindOf),
    categories: (a.categories?.data ?? [])
      .map((c: any) => ({ id: String(c.id), name: str(c?.attributes?.name) }))
      .filter((c: any) => c.name),
    images: image ? [image] : [],
    seller: sellerOf(a, rikma),
    geo: {
      lat: loc.lat,
      lng: loc.lng,
      radius: loc.radius,
      hint: loc.hint,
      isOnline: a.location?.location_mode === 'online'
    },
    dates: { startDate: str(a.startDate), finnishDate: str(a.finnishDate) },
    locale: str(a.locale),
    // Nothing is machine-translated on this path yet (PLAN_UGC_TRANSLATION is
    // wired to the HTML surfaces). Saying `false` is the honest answer — §9.5
    // forbids pretending a translation exists.
    translated: false,
    origin: str(a.origin),
    updatedAt: str(a.updatedAt),
    url: abs(`/gift/${id}`),
    buyUrl: abs(`/gift/${id}`)
  };
}

/** The rikma as the top of every response: once, not per row (§5.4). */
export function toApiRikmaRef(rikma: {
  id: string | number;
  slug?: string | null;
  name?: string | null;
}): ApiRikmaRef {
  const id = String(rikma.id);
  const slug = str(rikma.slug);
  return {
    id,
    slug,
    name: str(rikma.name),
    // The prefix is spelled once, in rikmaPath: a DTO that built its own copy
    // would be a second answer to "what is this rikma's address".
    canonicalPath: apiRikmaPath(slug ?? id)
  };
}

/** `GET /api/v1/r/{rikma}` — the profile, including the look (§5.3). */
export function toApiRikma(
  attrs: Record<string, any> | null | undefined,
  rikma: { id: string | number; slug?: string | null },
  extras: {
    productsCount?: number | null;
    look?: Record<string, any> | null;
  } = {}
): ApiRikma {
  const a = attrs ?? {};
  const ref = toApiRikmaRef({
    id: rikma.id,
    slug: rikma.slug,
    name: a.projectName
  });
  const loc = a.location ? resolveLocation(a.location) : null;
  const supportPage = str(a.supportPage);
  return {
    ...ref,
    about: excerptOf(a.publicDescription, 600) ?? str(a.descripFor),
    url: abs(rikmaPath({ id: rikma.id, slug: rikma.slug })),
    city: str(a.city),
    location: loc
      ? {
          lat: loc.lat,
          lng: loc.lng,
          radius: loc.radius,
          hint: loc.hint,
          isOnline: a.location?.location_mode === 'online'
        }
      : null,
    // The look is what the rikma's public page already renders (`RikmaSkin`),
    // and §5.3 puts it on the profile only — never on every row. It goes
    // through `parseLook` even on the way out: the stored JSON was validated
    // when it was written, and a reader that trusts stored JSON is one bad
    // write away from forwarding whatever somebody put there.
    look: extras.look ?? parseLook(a.look),
    supportPage,
    currency: str(a.currencyCode),
    productsCount: extras.productsCount ?? null
  };
}

export function toApiCategory(
  node: { id: string | number; attributes?: Record<string, any> | null },
  productsCount: number | null = null
): ApiCategory {
  return {
    id: String(node.id),
    name: str(node?.attributes?.name),
    productsCount
  };
}

// ─── sparse fieldsets ───────────────────────────────────────────────────────

/** Every field `Product` can carry — the whitelist `?fields=` may select from. */
export const API_PRODUCT_FIELDS: readonly string[] = [
  'id',
  'name',
  'descriptionHtml',
  'descriptionText',
  'status',
  'price',
  'currency',
  'pricingMode',
  'availability',
  'kindOf',
  'categories',
  'images',
  'seller',
  'geo',
  'dates',
  'locale',
  'translated',
  'origin',
  'updatedAt',
  'url',
  'buyUrl'
];

/**
 * `?fields=id,name,price` — and dotted paths one level deep
 * (`?fields=id,name,seller.name`), because "give me the shop's name column"
 * usually means one sub-field of `seller`, not the whole block.
 *
 * `id` is always kept: a row a consumer cannot key on is not a row.
 * Unknown names are refused by the caller (400), never ignored — silently
 * returning the whole object would look like it worked.
 */
export function projectFields<T extends Record<string, any>>(
  dto: T,
  fields: string[]
): Record<string, any> {
  if (!fields.length) return dto;
  const out: Record<string, any> = { id: dto.id };
  for (const field of fields) {
    if (field === 'id') continue;
    const [head, tail] = field.split('.');
    if (!(head in dto)) continue;
    if (tail !== undefined) {
      const block = dto[head];
      if (!block || typeof block !== 'object' || Array.isArray(block)) continue;
      if (!(tail in block)) continue;
      out[head] = { ...(out[head] ?? {}), [tail]: block[tail] };
    } else {
      out[head] = dto[head];
    }
  }
  return out;
}

/** The field names a caller may ask for, as a `Set` for cheap validation. */
export const API_PRODUCT_FIELD_SET = new Set<string>([
  ...API_PRODUCT_FIELDS,
  ...['availability', 'categories', 'images', 'seller', 'geo', 'dates'].flatMap(
    (block) =>
      // The dotted forms a client may ask for. Kept explicit rather than derived:
      // an accidental `geo.isOnline` typo should be a 400, not an empty object.
      ({
        availability: ['quantity', 'unlimited'],
        categories: [],
        images: [],
        seller: ['type', 'id', 'name', 'url', 'picUrl'],
        geo: ['lat', 'lng', 'radius', 'hint', 'isOnline'],
        dates: ['startDate', 'finnishDate']
      })[block].map((sub) => `${block}.${sub}` as string)
  )
]);

// ─── the tripwire list ──────────────────────────────────────────────────────

/**
 * Keys that must never appear anywhere in a projected DTO (§5.3, §6.1).
 *
 * This is the list `dto.test.ts` asserts against — the cost sheet, the
 * governance flags, the internal relations, the raw flags the derived `status`
 * replaced. Adding a field to the DTO and forgetting that it is internal fails
 * the test, which is the point.
 */
export const FORBIDDEN_DTO_KEYS: readonly string[] = [
  // internal economics
  'marginPct',
  'estimatedPrice',
  'entryCurrency',
  'entryRate',
  'maxsaleyearone',
  'maxsaleyearsec',
  'minsaleyearone',
  'minsaleyearsec',
  'matanot_recipe_missions',
  'matanot_recipe_resources',
  'hoursPerUnit',
  'ratePerHour',
  'costShape',
  'stepCapacity',
  'pricePerUnit',
  'unitsPerProduct',
  // money rails / consent
  'tosplits',
  'holderStatus',
  'sale',
  'sales',
  'monter',
  'saleClaim',
  'sheiruts',
  'sheirutpends',
  'sheirut_fulfillments',
  // governance & internal relations
  'ratson',
  'ratsons',
  'nego',
  'negos',
  'matanotpend',
  'decision',
  'archive_decisions',
  'timegrama',
  'oneForeProject',
  'process',
  'partofs',
  'sp',
  'discoveryKeywords',
  // the raw flags the derived `status` replaced
  'hideFromDiscovery',
  'appruved',
  'status_of_voting',
  'archived',
  'lifecycle',
  // internal identifiers & people data
  'owner_user',
  'users_permissions_user',
  'formerSlugs',
  'email',
  'phoneNumber'
];
