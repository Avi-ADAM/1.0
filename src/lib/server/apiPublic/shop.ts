/**
 * The shop layer of the public catalog — variants, gallery, availability,
 * units and delivery (docs/inprogress/PLAN_SHOP_CUSTOMER_EXPERIENCE.md §5.1).
 *
 * Three rules hold this module together:
 *
 *   1. **A variant is what the buyer chooses; the recipe is what it costs.**
 *      A variant carries `price`, `quant`, `pics` and `sku` — and nothing that
 *      belongs to the rikma's cost sheet (`hoursPerUnit`, `ratePerHour`,
 *      `assignedMember`, `costShape`). Those stay on the product, and the
 *      projector's whitelist is what keeps them there (§2.3, §4.1).
 *
 *   2. **Degrade, never break.** Every function here tolerates the shop schema
 *      not existing yet: no `pics`, no `variants`, no `stockTotal` ⇒ the DTO
 *      looks exactly like it did before variants were designed. The schema
 *      lands in `1.0b` first (the plan's deploy rule); this module is what the
 *      front does in the meantime.
 *
 *   3. **Availability falls back in a documented order** — variants when they
 *      were loaded, then the denormalized `stockTotal`, then `quant`. A number
 *      is never invented: `null` quantity means "unlimited", never "zero".
 *
 * It is pure on purpose: the price range, the summed stock and the `axisKey`
 * of a combination are the calculations a merchant screen, an import script
 * and the API all have to agree on. One implementation, one test file.
 */

import { mediaUrl } from '$lib/utils/processLifecycle.js';

// ─── primitives ─────────────────────────────────────────────────────────────
//
// These used to live in `dto.ts`. They moved here so the dependency runs one
// way — `dto` imports `shop`, never the other way around — and `dto` re-exports
// them so no existing import breaks.

export function num(v: unknown): number | null {
  const n = typeof v === 'string' ? Number(v) : (v as number);
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
}

export function str(v: unknown): string | null {
  return typeof v === 'string' && v.length ? v : null;
}

/**
 * A user-facing string that came from Strapi and goes to a client's page.
 *
 * `<` is refused rather than escaped: none of the fields this is used for
 * (`unit`, a delivery note, an attribute value) is rich text, so a `<` is
 * either a mistake or an attempt. Truncation keeps one bad row from becoming a
 * one-megabyte response.
 */
export function shopText(v: unknown, maxLength = 160): string | null {
  const s = str(v)?.trim();
  if (!s || s.includes('<')) return null;
  return s.length > maxLength ? s.slice(0, maxLength) : s;
}

// ─── media ──────────────────────────────────────────────────────────────────

export interface ApiImage {
  url: string;
  width: number | null;
  height: number | null;
  alt: string | null;
}

/** The sizes a shop should render from, best first (Strapi's own formats). */
const IMAGE_SIZES = ['hero', 'large', 'card', 'medium', 'small', 'thumbnail'];

function uploadOf(v: any): Record<string, any> | null {
  const a = v?.data?.attributes ?? v?.attributes;
  return a && typeof a === 'object' ? a : null;
}

function urlOfSize(a: Record<string, any>, preferred: string[]): any {
  for (const size of preferred) {
    const f = a.formats?.[size];
    if (f?.url) return f;
  }
  return a;
}

/**
 * One product photo, at the size the rest of the platform uses
 * (`picUrlOf` prefers `small`). A real media pipeline — several sizes, focal
 * point, CDN — is P1 (§4.10); until then one image per product, and the URL is
 * absolute because the consumer is another origin.
 */
export function imageOf(pic: any): ApiImage | null {
  const a = uploadOf(pic);
  if (!a) return null;
  const size = urlOfSize(a, ['small', 'medium', 'thumbnail']);
  const url = str(size.url) || str(a.url);
  if (!url) return null;
  return {
    url: mediaUrl(url),
    width: num(size.width),
    height: num(size.height),
    alt: str(a.alternativeText) || str(a.caption)
  };
}

/** A gallery item at the size a product page actually renders. */
function galleryImageOf(upload: any): ApiImage | null {
  const a = uploadOf(upload);
  if (!a) return null;
  const size = urlOfSize(a, IMAGE_SIZES);
  const url = str(size.url) || str(a.url);
  if (!url) return null;
  return {
    url: mediaUrl(url),
    width: num(size.width),
    height: num(size.height),
    alt: str(a.alternativeText) || str(a.caption)
  };
}

/** How many photos a product may expose. Beyond this it is a stock photo dump. */
export const GALLERY_LIMIT = 12;

function uploadsOf(raw: any): any[] {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (raw?.data) return [raw.data];
  return [];
}

/**
 * The gallery: the cover first, then `pics` in the order the merchant set,
 * de-duplicated by URL (the cover is usually also the first gallery image, and
 * a shop should not render it twice) and capped.
 *
 * With no `pics` at all — today's data — this is the single-image array the
 * DTO already returned, byte for byte.
 */
export function galleryOf(pic: any, pics: any): ApiImage[] {
  const out: ApiImage[] = [];
  const seen = new Set<string>();
  const push = (image: ApiImage | null) => {
    if (!image || seen.has(image.url)) return;
    seen.add(image.url);
    out.push(image);
  };
  push(imageOf(pic));
  for (const upload of uploadsOf(pics)) push(galleryImageOf(upload));
  return out.slice(0, GALLERY_LIMIT);
}

// ─── availability ───────────────────────────────────────────────────────────

export interface ApiAvailability {
  unlimited: boolean;
  /** `null` iff `unlimited` — so a consumer cannot print "0 in stock" by accident. */
  quantity: number | null;
}

/**
 * `quant` semantics come from the sale path, not from a guess: `-1` is
 * "unlimited" (`createSale` skips the decrement for it, `hamatanot.svelte`
 * prints "ללא הגבלה"), every other value is a count, and a missing value reads
 * as 0 — which is what `/gift/[id]` does (`data.alld?.quant || 0`).
 */
export function availabilityOf(attrs: Record<string, any>): ApiAvailability {
  return availabilityFromQuant(attrs?.quant);
}

function availabilityFromQuant(quant: unknown): ApiAvailability {
  const q = num(quant);
  if (q === -1) return { unlimited: true, quantity: null };
  return { unlimited: false, quantity: q === null ? 0 : q };
}

/**
 * Availability from an explicit list of variant rows.
 *
 * A variant with `active: false` is off the shelf — it is in the payload (a
 * merchant preview needs to see it) but it never counts towards stock, price or
 * the "is it available" answer.
 *
 * `-1` is contagious: one unlimited variant makes the product unlimited, and a
 * finite sum next to it would be a number the buyer could not act on.
 */
export function variantsAvailabilityOf(
  variants: ApiVariant[]
): ApiAvailability {
  const active = variants.filter((v) => v.active);
  if (!active.length) return { unlimited: false, quantity: 0 };
  if (active.some((v) => v.availability.unlimited))
    return { unlimited: true, quantity: null };
  return {
    unlimited: false,
    quantity: active.reduce((sum, v) => sum + (v.availability.quantity ?? 0), 0)
  };
}

/** The denormalized product-level total, written by the merchant save (§2.4). */
export function stockTotalOf(
  attrs: Record<string, any>
): ApiAvailability | null {
  if (attrs?.stockTotal === undefined || attrs?.stockTotal === null)
    return null;
  return availabilityFromQuant(attrs.stockTotal);
}

// ─── options and variants ───────────────────────────────────────────────────

export interface ApiOptionValue {
  value: string;
  label: string | null;
  hex: string | null;
  image: ApiImage | null;
}

export interface ApiOption {
  key: string;
  name: string | null;
  values: ApiOptionValue[];
}

export interface ApiVariantOption {
  key: string;
  value: string;
  label: string | null;
}

export interface ApiVariant {
  id: string;
  sku: string | null;
  name: string | null;
  optionValues: ApiVariantOption[];
  /** Absolute, ready to print: the variant's own price, or the product's. */
  price: number | null;
  compareAtPrice: number | null;
  availability: ApiAvailability;
  images: ApiImage[];
  active: boolean;
  externalKey: string | null;
}

export interface ApiPriceRange {
  min: number;
  max: number;
  currency: string | null;
}

export interface ApiDeliveryOption {
  kind: string;
  note: string | null;
  fee: number | null;
  currency: string | null;
}

/** The `kind` values a delivery option may use — unknown kinds are dropped. */
export const DELIVERY_KINDS = ['pickup', 'delivery', 'digital', 'contact'];

/** Keys of `Matanot.attributes` we are willing to echo (§4.9). */
const ATTRIBUTE_KEY = /^[a-z][a-z0-9_]{0,31}$/;
const MAX_ATTRIBUTES = 20;

function parseJsonArray(raw: any): any[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string' && raw.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * The normalized key of an option combination: `|size:m|color:red|`.
 *
 * Why a string and not a JSON blob: this is what `?option.size=m` filters on
 * (`variants: { axisKey: { contains: '|size:m|' } }`), and `contains` needs
 * delimiters — without them `size=m` also matches `size=medium`, which is the
 * kind of bug that ships silently. Keys are sorted so the same combination
 * always yields the same string, on every path that writes it.
 *
 * Empty when there is no usable pair — a variant with no axis is not "the
 * variant of nothing", it is a data error the caller reports (`400`).
 */
export function axisKeyOf(
  pairs: Array<{ key: string; value: string }>
): string {
  const clean = pairs
    .map((p) => ({
      key: String(p?.key ?? '')
        .trim()
        .toLowerCase(),
      value: String(p?.value ?? '')
        .trim()
        .toLowerCase()
        .replace(/\|/g, '')
        .replace(/:/g, '')
    }))
    .filter((p) => p.key && p.value)
    .sort((a, b) => a.key.localeCompare(b.key));
  if (!clean.length) return '';
  return `|${clean.map((p) => `${p.key}:${p.value}`).join('|')}|`;
}

/** The option combination of a variant row, in display order. */
export function optionValuesOf(attrs: Record<string, any>): ApiVariantOption[] {
  return parseJsonArray(attrs?.optionValues)
    .map((v: any) => ({
      key: str(v?.key) ?? '',
      value: str(v?.value) ?? '',
      label: shopText(v?.label, 60)
    }))
    .filter((v) => v.key && v.value);
}

/** `|size:m|color:red|` or the values themselves — whichever the row carries. */
export function axisKeyOfVariant(attrs: Record<string, any>): string {
  const stored = str(attrs?.axisKey);
  if (stored) return stored;
  return axisKeyOf(optionValuesOf(attrs));
}

/**
 * The rikma's option vocabulary with the number of *visible* products behind
 * each value (`GET /options`, §5.3).
 *
 * Two sources, one answer: `axes` is what the merchant declared
 * (`product-option` — names, order, colours), `products` is what actually
 * exists (`[{ variants: [{ optionValues }] }]` of the rows the caller may see).
 * A value with no product behind it is dropped for the same reason a category
 * with no product is: a filter that leads to an empty shop is a broken filter.
 *
 * An axis the merchant declared but never used is dropped too — that is the
 * same statement one level up.
 */
export function optionAxesOf(
  axes: any,
  products: Array<{ optionValues?: Array<{ key: string; value: string }> }>
): Array<{
  key: string;
  name: string | null;
  values: Array<{ value: string; label: string | null; products: number }>;
}> {
  // key=value → how many distinct products carry it. Normalized on both sides
  // (`m` and `M` are the same shopper choice, and the save writes lower case).
  const norm = (v: unknown) =>
    String(v ?? '')
      .trim()
      .toLowerCase();
  const counts = new Map<string, number>();
  for (const product of products) {
    const seen = new Set<string>();
    for (const pair of product.optionValues ?? []) {
      const key = norm(pair?.key);
      const value = norm(pair?.value);
      if (!key || !value) continue;
      const id = `${key}=${value}`;
      if (seen.has(id)) continue;
      seen.add(id);
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }

  return optionsOf(axes)
    .map((axis) => {
      const declared = axis.values
        .map((value) => ({
          value: norm(value.value),
          label: value.label,
          products: counts.get(`${axis.key}=${norm(value.value)}`) ?? 0
        }))
        .filter((value) => value.value && value.products > 0);

      // A value that exists in the data but was never declared: the shopper can
      // filter on it, so hiding it would make the shop disagree with its own
      // filter. It travels without a merchant label (the value is the label).
      const extra: typeof declared = [];
      for (const [id, count] of counts) {
        const [key, value] = id.split('=');
        if (key !== axis.key) continue;
        if (declared.some((v) => v.value === value)) continue;
        if (extra.some((v) => v.value === value)) continue;
        extra.push({ value, label: null, products: count });
      }

      return {
        key: axis.key,
        name: axis.name,
        values: [...declared, ...extra]
      };
    })
    .filter((axis) => axis.values.length);
}

/** Variant rows, from either `{ data: [...] }` or a bare array. */
export function variantNodesOf(raw: any): any[] {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  return [];
}

export function optionsOf(raw: any): ApiOption[] {
  const rows = Array.isArray(raw?.data)
    ? raw.data
    : Array.isArray(raw)
      ? raw
      : [];
  return rows
    .map((row: any) => {
      const a = row?.attributes ?? {};
      const values: ApiOptionValue[] = parseJsonArray(a.values)
        .map((v: any) => ({
          value: shopText(v?.value, 60) ?? '',
          label: shopText(v?.label, 60) ?? shopText(v?.value, 60),
          hex: /^#[0-9a-fA-F]{3,8}$/.test(String(v?.hex ?? ''))
            ? String(v.hex)
            : null,
          image: galleryImageOf(v?.image),
          // The merchant's order is the order a buyer sees; ties keep the
          // order the rows arrived in.
          position: num(v?.position) ?? 0
        }))
        .filter((v: any) => v.value)
        .sort((a: any, b: any) => a.position - b.position)
        .map(({ position, ...value }: any) => value);
      return {
        key: shopText(a.key, 32) ?? '',
        name: shopText(a.name, 60),
        values,
        position: num(a.position) ?? 0
      };
    })
    .filter((o) => o.key && o.values.length)
    .sort((a, b) => a.position - b.position)
    .map(({ position, ...option }: any) => option);
}

/**
 * Variant rows → the public variants.
 *
 * `price` is resolved here and not by the consumer: a variant with no price of
 * its own costs what the product costs, and every shop would otherwise have to
 * re-implement that fallback (and one of them would get it wrong in a sale).
 * The product being `quote`-priced wins over everything — `price: null` means
 * "ask us", and a variant inventing a number would break §11.א.
 */
export function variantsOf(
  raw: any,
  opts: { price: number | null; currency: string | null }
): ApiVariant[] {
  return variantNodesOf(raw)
    .map((row: any) => {
      const a = row?.attributes ?? {};
      const own = num(a.price);
      const optionValues = optionValuesOf(a);
      return {
        id: String(row?.id ?? a.id ?? ''),
        sku: shopText(a.sku, 64),
        name:
          shopText(a.name, 120) ??
          (optionValues.length
            ? optionValues.map((v) => v.label ?? v.value).join(' / ')
            : null),
        optionValues,
        price: opts.price === null ? null : (own ?? opts.price),
        compareAtPrice: num(a.compareAtPrice),
        availability: availabilityFromQuant(a.quant),
        images: uploadsOf(a.pics)
          .map(galleryImageOf)
          .filter((i): i is ApiImage => i !== null)
          .slice(0, GALLERY_LIMIT),
        active: a.active !== false,
        externalKey: shopText(a.externalKey, 80),
        position: num(a.position) ?? 0
      };
    })
    .filter((v: ApiVariant) => v.id)
    .sort((a: any, b: any) => a.position - b.position)
    .map(({ position, ...variant }: any) => variant);
}

/**
 * The price range a shop prints as "from ₪280".
 *
 * Four sources, in this order, and the order is the whole point:
 *
 *   1. the variant rows, when they were loaded — the truth;
 *   2. the denormalized `priceMin`/`priceMax`, which the merchant save writes
 *      (§2.4) — the same truth, kept for the list query;
 *   3. a product that is *known* to have variants whose prices nobody loaded:
 *      `null`, because `{min: price}` would quietly understate the cheapest
 *      variant, and a storefront that shows the wrong "from" price is worse
 *      than one that shows `price` and the "from" only after the detail call;
 *   4. no variants at all — `{min: price, max: price}`, one field to render.
 *
 * `null` also covers a `quote` product: it has no price, and `{min: 0}` would
 * be a lie a client cannot detect.
 */
export function priceRangeOf(args: {
  price: number | null;
  currency: string | null;
  variants: ApiVariant[];
  variantsLoaded: boolean;
  hasVariants?: boolean;
  priceMin?: number | null;
  priceMax?: number | null;
}): ApiPriceRange | null {
  const prices = args.variants
    .filter((v) => v.active)
    .map((v) => v.price)
    .filter((p): p is number => p !== null);
  if (args.variantsLoaded && prices.length) {
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
      currency: args.currency
    };
  }
  if (args.priceMin !== null && args.priceMin !== undefined) {
    const max = args.priceMax ?? args.priceMin;
    return { min: args.priceMin, max, currency: args.currency };
  }
  if (args.hasVariants && !prices.length) return null;
  if (args.price === null) return null;
  return { min: args.price, max: args.price, currency: args.currency };
}

// ─── product-level shop fields ──────────────────────────────────────────────

/**
 * `attributes` — the controlled extras a rikma adds (§4.9).
 *
 * Scalars only, lower-case keys, values without `<`, capped in both count and
 * length. This is *not* a place to smuggle HTML or a nested object into a
 * client's page: whatever a client renders from here it renders as text.
 */
export function attributesOf(
  attrs: Record<string, any>
): Record<string, string | number | boolean> | null {
  const raw = attrs?.attributes;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (Object.keys(out).length >= MAX_ATTRIBUTES) break;
    const k = String(key).trim().toLowerCase();
    if (!ATTRIBUTE_KEY.test(k)) continue;
    if (typeof value === 'number' && Number.isFinite(value)) out[k] = value;
    else if (typeof value === 'boolean') out[k] = value;
    else if (typeof value === 'string') {
      const text = shopText(value, 120);
      if (text) out[k] = text;
    }
  }
  return Object.keys(out).length ? out : null;
}

export function deliveryOf(attrs: Record<string, any>): ApiDeliveryOption[] {
  return parseJsonArray(attrs?.deliveryOptions)
    .map((d: any) => ({
      kind: str(d?.kind) ?? '',
      note: shopText(d?.note, 160),
      fee: num(d?.fee),
      currency: (str(d?.currency) ?? '').toUpperCase().slice(0, 3) || null
    }))
    .filter((d) => DELIVERY_KINDS.includes(d.kind))
    .slice(0, 8);
}

/** `unit`, `minOrder`, `maxOrder`, `leadTimeHours` — the "how do I buy it" block. */
export function buyingUnitOf(attrs: Record<string, any>): {
  unit: string | null;
  minOrder: number | null;
  maxOrder: number | null;
  leadTimeHours: number | null;
} {
  const maxOrder = num(attrs?.maxOrder);
  const minOrder = num(attrs?.minOrder);
  return {
    unit: shopText(attrs?.unit, 24),
    minOrder,
    // A maximum below the minimum is a data error; dropping it keeps the
    // storefront from refusing every quantity.
    maxOrder:
      maxOrder !== null && minOrder !== null && maxOrder < minOrder
        ? null
        : maxOrder,
    leadTimeHours: num(attrs?.leadTimeHours)
  };
}

// ─── the block the projector embeds ─────────────────────────────────────────

export interface ApiShop {
  images: ApiImage[];
  hasVariants: boolean;
  priceRange: ApiPriceRange | null;
  options: ApiOption[];
  variants: ApiVariant[];
  availability: ApiAvailability;
  unit: string | null;
  minOrder: number | null;
  maxOrder: number | null;
  leadTimeHours: number | null;
  attributes: Record<string, string | number | boolean> | null;
  delivery: ApiDeliveryOption[];
  externalKey: string | null;
}

/** A shop field, preferring the optional shop row over the base product row. */
function pick(
  base: Record<string, any>,
  extra: Record<string, any> | null,
  key: string
): any {
  const v = extra?.[key];
  return v === undefined || v === null ? base?.[key] : v;
}

/**
 * Base product row (+ the optional shop row, + variant rows when they were
 * loaded) → everything the shop layer adds to a product DTO.
 *
 * `variantsLoaded` is the difference between "no variants" and "nobody asked":
 * when variants were not loaded, aggregates come from the denormalized fields,
 * and `variants` is an empty array that the caller must not read as a fact.
 */
export function toApiShop(
  base: Record<string, any>,
  opts: {
    extra?: Record<string, any> | null;
    variants?: any[] | null;
    price: number | null;
    currency: string | null;
  }
): ApiShop {
  const extra = opts.extra ?? null;
  const loaded = opts.variants !== null && opts.variants !== undefined;
  const variants = loaded ? variantsOf(opts.variants, opts) : [];
  const buying = buyingUnitOf({
    unit: pick(base, extra, 'unit'),
    minOrder: pick(base, extra, 'minOrder'),
    maxOrder: pick(base, extra, 'maxOrder'),
    leadTimeHours: pick(base, extra, 'leadTimeHours')
  });
  const hasVariants =
    loaded && variants.length
      ? true
      : pick(base, extra, 'hasVariants') === true;

  // Availability, in the documented order (§2.5): the variants themselves when
  // they were loaded, then the denormalized total, then the product's `quant`.
  const availability =
    loaded && variants.length
      ? variantsAvailabilityOf(variants)
      : (stockTotalOf({ stockTotal: pick(base, extra, 'stockTotal') }) ??
        availabilityOf(base));

  return {
    images: galleryOf(pick(base, extra, 'pic'), pick(base, extra, 'pics')),
    hasVariants,
    priceRange: priceRangeOf({
      price: opts.price,
      currency: opts.currency,
      variants,
      variantsLoaded: loaded,
      hasVariants,
      priceMin: num(pick(base, extra, 'priceMin')),
      priceMax: num(pick(base, extra, 'priceMax'))
    }),
    options: optionsOf(pick(base, extra, 'options')),
    variants,
    availability,
    ...buying,
    attributes: attributesOf({
      attributes: pick(base, extra, 'attributes')
    }),
    delivery: deliveryOf({
      deliveryOptions: pick(base, extra, 'deliveryOptions')
    }),
    externalKey: shopText(pick(base, extra, 'externalKey'), 80)
  };
}
