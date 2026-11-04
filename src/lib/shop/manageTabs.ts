/**
 * The tabs of "manage sales", read along the path of a sale
 * (docs/inprogress/PLAN_LEADS.md §4.0): before the sale · fulfilment ·
 * money · products · connections. "In progress" (the pipeline, §4.1) opens
 * the row: every open deal before money.
 *
 * Tabs follow what the rikma has, not a mode it chose: a rikma that sells a
 * service sees sales · products · connect; the moment it adds a product that
 * ships, shipping appears. (A service rikma: in progress · sales · products · connect.) Nothing to remember to switch on — and the tab a
 * member is on never disappears from under them.
 */

import { isWaiting, type ShopOrder } from './manage';

export const MANAGE_TABS = [
  'pipeline',
  'orders',
  'stock',
  'shipping',
  'fulfillment',
  'promotions',
  'products',
  'sales',
  'customers',
  'connect'
] as const;
export type ManageTab = (typeof MANAGE_TABS)[number];

export interface ManageFacts {
  /** Products this rikma sells (any state). */
  products: number;
  /** Some product can be delivered (its `deliveryOptions` name `delivery`). */
  ships: boolean;
  /** The rikma has shipping settings. */
  shippingSet: boolean;
  /** Orders it has ever had. */
  orders: number;
}

/** Shown no matter what: the ways to start (add a product, connect a site) and the money. */
// Customers (L6) is a view over leads and orders — there from the start, empty until the first payment.
const ALWAYS: ReadonlySet<ManageTab> = new Set(['pipeline', 'products', 'sales', 'customers', 'connect']);

/** `facts` null (could not be read) ⇒ every tab, rather than hide one wrongly. */
export function visibleTabs(facts: ManageFacts | null, active?: string | null): ManageTab[] {
  if (!facts) return [...MANAGE_TABS];
  const has = facts.products > 0;
  const show: Record<ManageTab, boolean> = {
    pipeline: true,
    orders: has || facts.orders > 0,
    stock: has,
    shipping: facts.ships || facts.shippingSet,
    // Fulfilment steps are set up from their own tab, so it shows with the
    // first product — waiting for a step to exist would hide the way to add one.
    fulfillment: has,
    promotions: has,
    products: true,
    sales: true,
    customers: true,
    connect: true
  };
  return MANAGE_TABS.filter((tab) => show[tab] || ALWAYS.has(tab) || tab === active);
}

/**
 * Where `/sales/manage` lands: the first tab with something waiting. A paid
 * order that still has to go out is the most urgent thing on the screen.
 * Otherwise "in progress" — the deals on their way to money.
 */
export function landingTab(orders: Array<Pick<ShopOrder, 'status' | 'delivery'>>, facts: ManageFacts | null): ManageTab {
  if (orders.some(isWaiting)) return 'orders';
  return 'pipeline';
}

/**
 * Does a product's `deliveryOptions` name home delivery? It is a json array of
 * `{ kind, note, fee }` — sometimes stored as its string — as `deliveryOf`
 * (apiPublic/shop.ts) reads it.
 */
export function productShips(deliveryOptions: unknown): boolean {
  let list: unknown = deliveryOptions;
  if (typeof list === 'string') {
    try {
      list = JSON.parse(list);
    } catch {
      return false;
    }
  }
  return Array.isArray(list) && list.some((d) => (d as { kind?: unknown } | null)?.kind === 'delivery');
}
