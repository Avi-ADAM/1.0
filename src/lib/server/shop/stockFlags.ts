/**
 * The `unlimited` flag on the server — read beside the stock rows a caller
 * already has, and written with every stock write (PLAN_SHOP_CUSTOMER_EXPERIENCE
 * §2.5; the meaning itself is `$lib/shop/stock.ts`).
 *
 * The flag is a column in `1.0b` (`product-variant.unlimited`,
 * `matanot.unlimited`, `matanot.stockUnlimited`) that deploys on its own day.
 * Until it does, asking for it fails the whole query — so nothing here adds it
 * to an existing query. The flag is read by its own small queries, behind
 * `stockFlagsLive`, and merged into the rows; and a write goes through the
 * flagged mutation only once the probe says the column is there. Meanwhile
 * every path behaves exactly as before: `-1` is "unlimited", and a count that
 * lands on `-1` still reads as one (the bug this flag exists to fix).
 */

import { schemaProbe, type ProbeRun } from '$lib/server/apiPublic/schemaProbe.js';
import type { StockFields, StockWrite } from '$lib/shop/stock.js';

const probe = schemaProbe({
  qid: 'stockFlagsSchema',
  // Answering is the test: a missing field fails validation, an empty table answers `[]`.
  isLive: (res) =>
    Array.isArray(res?.data?.productVariants?.data) && Array.isArray(res?.data?.matanots?.data),
  meanwhile: 'stock reads -1 as unlimited'
});

/** Are the `unlimited` columns deployed? */
export function stockFlagsLive(run: ProbeRun): Promise<boolean> {
  return probe.live(run);
}

/** Test seam — the verdict is process state tests must not inherit. */
export function resetStockFlagsVerdict(): void {
  probe.reset();
}

export interface StockRowFlags {
  quant: number | null;
  unlimited: boolean | null;
  /** A product's derived "any active variant is unlimited" (beside `stockTotal`). */
  stockUnlimited?: boolean | null;
}

export interface StockFlags {
  live: boolean;
  variants: Map<string, StockRowFlags>;
  products: Map<string, StockRowFlags>;
}

function rowFlags(attrs: any): StockRowFlags {
  const q = attrs?.quant;
  const n = q === null || q === undefined ? null : Number(q);
  const out: StockRowFlags = {
    quant: n !== null && Number.isFinite(n) ? n : null,
    unlimited: typeof attrs?.unlimited === 'boolean' ? attrs.unlimited : null
  };
  if (attrs && 'stockUnlimited' in attrs)
    out.stockUnlimited = typeof attrs.stockUnlimited === 'boolean' ? attrs.stockUnlimited : null;
  return out;
}

/**
 * The stock and flag of these rows, read fresh. Empty maps (and `live: false`)
 * until the columns are deployed; empty maps with `live: true` when the read
 * itself failed — either way a caller falls back to the rows it has, read the
 * legacy way.
 */
export async function readStockFlags(
  run: ProbeRun,
  ids: { variantIds?: string[]; productIds?: string[] }
): Promise<StockFlags> {
  const out: StockFlags = { live: false, variants: new Map(), products: new Map() };
  const variantIds = [...new Set((ids.variantIds ?? []).map(String))];
  const productIds = [...new Set((ids.productIds ?? []).map(String))];
  if (!(await stockFlagsLive(run))) return out;
  out.live = true;
  if (!variantIds.length && !productIds.length) return out;
  try {
    const [vRes, pRes] = await Promise.all([
      variantIds.length ? run('stockFlagsVariants', { ids: variantIds }) : null,
      productIds.length ? run('stockFlagsMatanots', { ids: productIds }) : null
    ]);
    for (const v of vRes?.data?.productVariants?.data ?? []) out.variants.set(String(v.id), rowFlags(v.attributes));
    for (const p of pRes?.data?.matanots?.data ?? []) out.products.set(String(p.id), rowFlags(p.attributes));
  } catch (err) {
    console.warn('[stockFlags] flags could not be read — reading -1 the legacy way:', err);
  }
  return out;
}

/** A row's attributes with the flag beside them, for the pure readers. */
export function withFlag<T extends Record<string, any>>(
  attrs: T | null | undefined,
  flags: StockRowFlags | undefined
): T & StockFields {
  return { ...(attrs ?? ({} as T)), unlimited: flags ? flags.unlimited : (attrs?.unlimited ?? null) };
}

/**
 * Write a stock. With the columns deployed the flag goes with the count, so a
 * count of `-1` is written as a count; before that the legacy mutation writes
 * the number alone. Returns the stock as Strapi stored it.
 */
export async function writeStock(
  run: ProbeRun,
  target: { variantId: string } | { productId: string },
  write: StockWrite
): Promise<StockWrite> {
  const live = await stockFlagsLive(run);
  const isVariant = 'variantId' in target;
  const id = isVariant ? target.variantId : target.productId;
  if (!live && !write.unlimited && write.quant === -1) {
    console.warn(
      `[stockFlags] ${isVariant ? 'variant' : 'product'} ${id}: a count of -1 written before the unlimited column is deployed — it reads as unlimited until then`
    );
  }
  const qid = live
    ? isVariant ? 'stockWriteVariant' : 'stockWriteMatanot'
    : isVariant ? 'rikmaApiVariantQuant' : 'updateMatanotQuant';
  const vars = live ? { id, quant: write.quant, unlimited: write.unlimited } : { id, quant: write.quant };
  const res = await run(qid, vars);
  const attrs = isVariant
    ? res?.data?.updateProductVariant?.data?.attributes
    : res?.data?.updateMatanot?.data?.attributes;
  const stored = rowFlags(attrs);
  return {
    quant: stored.quant ?? write.quant,
    unlimited: live ? (stored.unlimited ?? write.unlimited) : write.unlimited
  };
}
