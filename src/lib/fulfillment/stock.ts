/**
 * Stock that comes from a resource (docs/inprogress/PLAN_SHOP_OPERATIONS.md §2.4, A3).
 *
 * A product says what it is made of through the BOM row the rikma already has
 * — `matanot-recipe-resource` — with `priceMode: 'none'` ("essence only": it
 * says what a unit consumes, never what it costs) and an optional
 * `product_variant` (size L takes 2 m, M takes 1.5). The resource is a
 * `Mashabetahalich` the rikma owns: `onHand = quantityDelivered −
 * quantityConsumed`.
 *
 * Pure — the engine (plan.ts) plans what an order consumes, apply writes it,
 * and the order keeps a ledger of what it took (`Order.stockMoves`) so a retry
 * consumes nothing twice and a cancel before shipping gives back exactly what
 * was taken, even if the recipe changed in between.
 */
import type { OrderFacts, PlannedConsumption } from './plan';

/** An essence-only BOM row, as the engine needs it. */
export interface RecipeRow {
  id: string;
  productId: string;
  /** Absent = every variant of the product. */
  variantId: string | null;
  resourceId: string;
  quantityPerUnit: number;
}

/** A resource with a shelf. */
export interface StockResource {
  id: string;
  name: string;
  quantityDelivered: number;
  quantityConsumed: number;
  lowStockAt: number | null;
  accounting: 'owned' | 'perUse';
  pricePerUnit: number | null;
  /** The giver — who a receipt is credited to and who is told when it runs low. */
  responsibleId: string | null;
  projectId: string | null;
}

/** One line of an order's ledger. */
export interface StockMove {
  key: string;
  resourceId: string;
  quantity: number;
  at: string;
  lineId?: string | null;
  /** Set when a cancel gave it back. */
  restoredAt?: string | null;
}

const num = (v: unknown, d = 0): number => {
  const x = Number(v);
  return Number.isFinite(x) ? x : d;
};
const round3 = (n: number) => Math.round(n * 1000) / 1000;
const idOf = (rel: any): string | null => (rel?.data?.id != null ? String(rel.data.id) : null);

/** `order:<ref>:consume:<recipe row>:line:<position>` — principle 6. */
export function consumptionKey(orderRef: string, recipeId: string, linePosition: number): string {
  return `order:${orderRef}:consume:${recipeId}:line:${linePosition}`;
}

/**
 * What each line of the order takes off a shelf. A row with a variant counts
 * only for lines of that variant; a row without one counts for every line of
 * its product — a label every size carries beside the fabric that differs.
 */
export function planConsumption(order: Pick<OrderFacts, 'ref' | 'lines'>, recipes: RecipeRow[]): PlannedConsumption[] {
  const out: PlannedConsumption[] = [];
  for (const line of order.lines) {
    if (!line.productId || !(line.quantity > 0)) continue;
    for (const r of recipes) {
      if (r.productId !== line.productId) continue;
      if (r.variantId != null && r.variantId !== line.variantId) continue;
      const quantity = round3(num(r.quantityPerUnit) * line.quantity);
      if (!(quantity > 0)) continue;
      out.push({
        externalId: consumptionKey(order.ref, r.id, line.position),
        resourceId: r.resourceId,
        quantity,
        lineId: line.id,
        recipeId: r.id
      });
    }
  }
  return out;
}

/** What is on the shelf. Never below zero on screen; the ledger keeps the truth. */
export function onHandOf(r: Pick<StockResource, 'quantityDelivered' | 'quantityConsumed'>): number {
  return round3(num(r.quantityDelivered) - num(r.quantityConsumed));
}

export function isLowStock(r: Pick<StockResource, 'quantityDelivered' | 'quantityConsumed' | 'lowStockAt'>): boolean {
  return r.lowStockAt != null && onHandOf(r) <= r.lowStockAt;
}

/** The stock state the screen shows. */
export function stockStateOf(r: Pick<StockResource, 'quantityDelivered' | 'quantityConsumed' | 'lowStockAt'>): 'out' | 'low' | 'ok' {
  const onHand = onHandOf(r);
  if (onHand <= 0) return 'out';
  return isLowStock(r) ? 'low' : 'ok';
}

/** A stored ledger, read defensively — a hand-edited JSON never breaks a cancel. */
export function readStockMoves(raw: unknown): StockMove[] {
  if (!Array.isArray(raw)) return [];
  const out: StockMove[] = [];
  for (const m of raw) {
    if (!m || typeof m !== 'object') continue;
    const v = m as Record<string, unknown>;
    const key = typeof v.key === 'string' ? v.key.slice(0, 200) : null;
    const resourceId = v.resourceId != null ? String(v.resourceId) : null;
    const quantity = num(v.quantity, NaN);
    if (!key || !resourceId || !Number.isFinite(quantity)) continue;
    out.push({
      key,
      resourceId,
      quantity,
      at: typeof v.at === 'string' ? v.at : '',
      ...(v.lineId != null ? { lineId: String(v.lineId) } : {}),
      ...(typeof v.restoredAt === 'string' && v.restoredAt ? { restoredAt: v.restoredAt } : {})
    });
  }
  return out;
}

/** The planned consumptions the ledger does not have yet — a retry's work. */
export function movesToApply(planned: PlannedConsumption[], ledger: StockMove[]): PlannedConsumption[] {
  const have = new Set(ledger.map((m) => m.key));
  return planned.filter((p) => !have.has(p.externalId));
}

/** What a cancel gives back: every move not given back yet. */
export function movesToRestore(ledger: StockMove[]): StockMove[] {
  return ledger.filter((m) => !m.restoredAt && m.quantity > 0);
}

/** Total per resource. */
export function totalsByResource(moves: { resourceId: string; quantity: number }[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const m of moves) out.set(m.resourceId, round3((out.get(m.resourceId) ?? 0) + m.quantity));
  return out;
}

/** Strapi row → RecipeRow, or null for a row that is not an essence-only link to a resource. */
export function recipeRowOf(node: any): RecipeRow | null {
  const a = node?.attributes;
  if (!a || node?.id == null || a.priceMode !== 'none') return null;
  const productId = idOf(a.matanot);
  const resourceId = idOf(a.mashabetahalich);
  const quantityPerUnit = num(a.quantityPerUnit);
  if (!productId || !resourceId || !(quantityPerUnit > 0)) return null;
  return { id: String(node.id), productId, variantId: idOf(a.product_variant), resourceId, quantityPerUnit };
}

/** Strapi Mashabetahalich → StockResource. */
export function stockResourceOf(node: any): StockResource | null {
  const a = node?.attributes;
  if (!a || node?.id == null) return null;
  const low = a.lowStockAt == null || a.lowStockAt === '' ? null : num(a.lowStockAt, NaN);
  return {
    id: String(node.id),
    name: typeof a.name === 'string' ? a.name : '',
    quantityDelivered: num(a.quantityDelivered),
    quantityConsumed: num(a.quantityConsumed),
    lowStockAt: low != null && Number.isFinite(low) ? low : null,
    accounting: a.accounting === 'perUse' ? 'perUse' : 'owned',
    pricePerUnit: a.pricePerUnit == null ? null : num(a.pricePerUnit),
    responsibleId: idOf(a.users_permissions_user),
    projectId: idOf(a.project)
  };
}

/**
 * The money value of a supply portion (`receiveStock`): units × the price the
 * receipt names, else the resource's own price. A receipt keeps quantity and
 * value apart — a recurring month's "spend" is both at once, a box of jars is not.
 */
export function receiptValue(quantity: number, unitPrice: number | null | undefined, fallbackPrice: number | null | undefined): number {
  const price = unitPrice != null && Number.isFinite(Number(unitPrice)) ? Number(unitPrice) : num(fallbackPrice);
  return Math.round(num(quantity) * price * 100) / 100;
}

const numText = (n: number) => String(Math.round(num(n) * 1000) / 1000);

/**
 * A supply portion's name: "צנצנות · +50 × 4" (price 0, an opening count:
 * "צנצנות · +100"). The heart's receipt card reads the price back from it with
 * `receiptPriceOf` — `Maap.unitPrice` is a new column, and the heart's query
 * must not ask for a column that a not-yet-deployed backend lacks.
 */
export function receiptName(resourceName: string, quantity: number, unitPrice: number): string {
  const price = num(unitPrice);
  return `${resourceName} · +${numText(quantity)}${price > 0 ? ` × ${numText(price)}` : ''}`.slice(0, 250);
}

const RECEIPT_PRICE = / · \+\d+(?:\.\d+)? × (\d+(?:\.\d+)?)$/;

/** The unit price written into a receipt's name; 0 when it names none (an opening count). */
export function receiptPriceOf(name: unknown): number {
  const m = typeof name === 'string' ? RECEIPT_PRICE.exec(name) : null;
  return m ? Number(m[1]) : 0;
}

/**
 * Is this cycle Maap a supply portion rather than a recurring month? A receipt
 * is counted in units and has no cycle window; a month always has one.
 */
export function isStockReceiptMaap(a: { unit?: unknown; cycleStart?: unknown } | null | undefined, linkedToResource: boolean): boolean {
  return linkedToResource && a?.unit === 'unit' && !a?.cycleStart;
}
