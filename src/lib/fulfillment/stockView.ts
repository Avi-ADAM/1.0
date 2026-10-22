/**
 * The stock screen's view of the rikma's resources (PLAN_SHOP_OPERATIONS §2.4, A3):
 * what is on each shelf, what it is linked to, and which receipts still wait.
 *
 * Pure and defensive — a missing relation reads as "none" — so the loader and
 * its test see one meaning. A recurring resource (rent, a server) settles month
 * by month and has no shelf, so it is not here.
 */
import { onHandOf, receiptPriceOf, stockResourceOf, stockStateOf, type StockResource } from './stock';

export interface ResourceLinkView {
  recipeId: string;
  productId: string | null;
  productName: string;
  variantId: string | null;
  variantName: string | null;
  quantityPerUnit: number;
}

export interface PendingReceiptView {
  maapId: string;
  quantity: number;
  /** As written on the receipt; 0 = an opening count. */
  unitPrice: number;
  /** When silence makes it count, if the clock is running. */
  deadline: string | null;
}

export interface ResourceStockView {
  id: string;
  name: string;
  giverId: string | null;
  giverName: string | null;
  pricePerUnit: number | null;
  accounting: StockResource['accounting'];
  lowStockAt: number | null;
  delivered: number;
  consumed: number;
  onHand: number;
  state: 'out' | 'low' | 'ok';
  /**
   * Has the shelf started — anything received, consumed, linked or a threshold
   * set? A resource the rikma never counted is not "out of stock", it is not
   * tracked yet, and the screen says so instead of painting it red.
   */
  tracked: boolean;
  links: ResourceLinkView[];
  pending: PendingReceiptView[];
}

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);
const idOf = (rel: any): string | null => (rel?.data?.id != null ? String(rel.data.id) : null);
const num = (v: unknown): number => (Number.isFinite(Number(v)) ? Number(v) : 0);

export function resourceStockViewOf(node: any): ResourceStockView | null {
  const a = node?.attributes;
  if (!a || a.recurring === true) return null;
  const r = stockResourceOf(node);
  if (!r) return null;
  const links: ResourceLinkView[] = (a.matanot_recipe_resources?.data ?? [])
    .filter((row: any) => row?.id != null && Number(row.attributes?.quantityPerUnit) > 0)
    .map((row: any) => {
      const ra = row.attributes ?? {};
      const variant = ra.product_variant?.data;
      return {
        recipeId: String(row.id),
        productId: idOf(ra.matanot),
        productName: str(ra.matanot?.data?.attributes?.name) ?? '',
        variantId: variant?.id != null ? String(variant.id) : null,
        variantName: str(variant?.attributes?.name) ?? str(variant?.attributes?.sku),
        quantityPerUnit: num(ra.quantityPerUnit)
      };
    });
  // Only supply portions wait here — a receipt is counted in units and has no cycle window.
  const pending: PendingReceiptView[] = (a.maaps?.data ?? [])
    .filter((m: any) => m?.id != null && m.attributes?.unit === 'unit' && !m.attributes?.cycleStart)
    .map((m: any) => {
      const ma = m.attributes ?? {};
      const tg = ma.timegrama?.data?.attributes;
      return {
        maapId: String(m.id),
        quantity: num(ma.quantityDelivered),
        unitPrice: ma.unitPrice != null && Number.isFinite(Number(ma.unitPrice)) ? Number(ma.unitPrice) : receiptPriceOf(ma.name),
        deadline: tg && !tg.done ? (str(tg.date) ?? null) : null
      };
    });
  return {
    id: r.id,
    name: r.name,
    giverId: r.responsibleId,
    giverName: str(a.users_permissions_user?.data?.attributes?.username),
    pricePerUnit: r.pricePerUnit,
    accounting: r.accounting,
    lowStockAt: r.lowStockAt,
    delivered: r.quantityDelivered,
    consumed: r.quantityConsumed,
    onHand: onHandOf(r),
    state: stockStateOf(r),
    tracked: r.quantityDelivered > 0 || r.quantityConsumed > 0 || links.length > 0 || r.lowStockAt != null || pending.length > 0,
    links,
    pending
  };
}

/** What needs someone first: empty shelves, then low ones, then the rest; untracked last. */
export function resourceStockViews(nodes: any[]): ResourceStockView[] {
  const rank = (v: ResourceStockView) => (!v.tracked ? 3 : { out: 0, low: 1, ok: 2 }[v.state]);
  return (nodes ?? [])
    .map(resourceStockViewOf)
    .filter((v): v is ResourceStockView => !!v)
    .sort((x, y) => rank(x) - rank(y) || x.name.localeCompare(y.name, 'he'));
}

/** How many units of a linked product the shelf still covers. */
export function unitsCovered(onHand: number, quantityPerUnit: number): number {
  if (!(quantityPerUnit > 0) || !(onHand > 0)) return 0;
  // Rounding first, so 0.3 / 0.1 is 3 and not 2.9999.
  return Math.floor(Math.round((onHand / quantityPerUnit) * 1e6) / 1e6);
}
