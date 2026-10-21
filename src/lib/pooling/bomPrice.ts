/**
 * One rule for every place that prices a BOM resource row
 * (docs/inprogress/PLAN_SHOP_OPERATIONS.md §2.4, A3).
 *
 * `priceMode: 'none'` is the "essence only" row: it links a product to the
 * resource it consumes (a jar, 2 m of fabric for size L) so the order engine
 * can take it off the shelf — and says nothing about the price. A fixed-price
 * product keeps its own price; a complex product prices only its other rows.
 * So every reader that turns BOM rows into money skips it, through here, and
 * `bomPrice.test.ts` walks all of them.
 */

export const ESSENCE_ONLY = 'none';

/** Does this row only say what a product is made of? */
export function isEssenceOnly(row: { priceMode?: unknown } | null | undefined): boolean {
  return row?.priceMode === ESSENCE_ONLY;
}

const num = (v: unknown, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

/**
 * The money of one product unit's worth of a resource row: quantity × price,
 * and 0 for an essence-only row. `quantityDefault` is what a missing quantity
 * reads as — readers differ (1 for a deal line, 0 for the curve) and keep doing so.
 */
export function resourceRowPrice(
  row: { quantityPerUnit?: unknown; pricePerUnit?: unknown; priceMode?: unknown } | null | undefined,
  quantityDefault = 0
): number {
  if (!row || isEssenceOnly(row)) return 0;
  const q = row.quantityPerUnit == null || row.quantityPerUnit === '' ? quantityDefault : num(row.quantityPerUnit, quantityDefault);
  return q * num(row.pricePerUnit);
}

/** The rows that carry a price. */
export function pricedResourceRows<T extends { priceMode?: unknown } | { attributes?: { priceMode?: unknown } }>(rows: T[]): T[] {
  return rows.filter((r) => !isEssenceOnly(((r as any)?.attributes ?? r) as { priceMode?: unknown }));
}
