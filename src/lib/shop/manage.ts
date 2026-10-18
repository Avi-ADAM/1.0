/**
 * The seller's side of the shop — what the "manage sales" screens decide
 * (PLAN_SHOP_CUSTOMER_EXPERIENCE §7.3, UX_COPY_SHOP_SALES §3–§6, S5).
 *
 * Pure and client-safe: the moach loaders (`$lib/server/shop/moachShop.ts`)
 * turn Strapi rows into the shapes below, and every screen decision — which
 * tab an order sits in, what its one button does, how short it is, what a CSV
 * row says — is made here, once, with a test.
 *
 * The rule the whole screen follows (UX_COPY §0): an order is listed by what
 * is **left to do** with it, not by its status. A seller does not think "paid";
 * they think "to pack".
 */

/** Stock `-1` is "unlimited", everywhere in the platform. */
export const UNLIMITED = -1;

export type OrderStatus = 'paid' | 'shipped' | 'fulfilled' | 'cancelled';
export type DeliveryPreference = 'pickup' | 'delivery' | 'digital' | 'contact';

/** What is left to do — the seller's word for an order (UX_COPY §3.3). */
export type OrderTask = 'toShip' | 'toHandOver' | 'shipped' | 'done' | 'cancelled';

export interface ShopOrderLine {
  productId: string | null;
  variantId: string | null;
  name: string;
  optionLabel: string | null;
  sku: string | null;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number | null;
  lineTotal: number | null;
}

export interface ShopOrderSale {
  id: string;
  holderId: string | null;
  holderStatus: string | null;
  inSplit: boolean;
  amount: number | null;
}

export interface ShopAddress {
  city: string | null;
  street: string | null;
  zip: string | null;
  notes: string | null;
}

export interface ShopOrder {
  id: string;
  ref: string;
  /** What people say out loud: the site's number, else our id. Never the ref. */
  number: string;
  status: OrderStatus;
  oversold: boolean;
  total: number | null;
  currency: string | null;
  source: 'api' | 'ui';
  paidAt: string | null;
  shippedAt: string | null;
  fulfilledAt: string | null;
  createdAt: string | null;
  buyer: { name: string | null; email: string | null; phone: string | null };
  delivery: { preference: DeliveryPreference; address: ShopAddress | null };
  note: string | null;
  paymentRef: string | null;
  paymentMethod: string | null;
  holderId: string | null;
  holderName: string | null;
  lines: ShopOrderLine[];
  sales: ShopOrderSale[];
  /** Units the stock still does not cover *now* — 0 once it was restocked. */
  shortUnits: number;
}

// ─── small readers ──────────────────────────────────────────────────────────

const STATUSES: OrderStatus[] = ['paid', 'shipped', 'fulfilled', 'cancelled'];
const PREFERENCES: DeliveryPreference[] = ['pickup', 'delivery', 'digital', 'contact'];

export function statusOf(value: unknown): OrderStatus {
  return STATUSES.includes(value as OrderStatus) ? (value as OrderStatus) : 'paid';
}

export function preferenceOf(value: unknown): DeliveryPreference {
  return PREFERENCES.includes(value as DeliveryPreference) ? (value as DeliveryPreference) : 'contact';
}

/** A delivery address as the API stored it (`{city, street, zip, notes}`), or null. */
export function addressOf(value: unknown): ShopAddress | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  const s = (k: string) => (typeof v[k] === 'string' && (v[k] as string).trim() ? (v[k] as string).trim() : null);
  const a = { city: s('city'), street: s('street'), zip: s('zip'), notes: s('notes') };
  return a.city || a.street || a.zip || a.notes ? a : null;
}

/** One line for copying or printing: "הרצל 1, נתניה 4250000". */
export function addressLine(a: ShopAddress | null): string {
  if (!a) return '';
  const place = [a.city, a.zip].filter(Boolean).join(' ');
  return [a.street, place].filter(Boolean).join(', ');
}

// ─── the order's task, and its one button ───────────────────────────────────

/** Parcels go out; pickup, digital and "we'll be in touch" are handed over. */
export function shipsByPost(pref: DeliveryPreference): boolean {
  return pref === 'delivery';
}

export function orderTaskOf(order: Pick<ShopOrder, 'status' | 'delivery'>): OrderTask {
  switch (order.status) {
    case 'paid':
      return shipsByPost(order.delivery.preference) ? 'toShip' : 'toHandOver';
    case 'shipped':
      return 'shipped';
    case 'fulfilled':
      return 'done';
    case 'cancelled':
      return 'cancelled';
  }
}

/** Is this order waiting for the seller (the count on the tab and the banner)? */
export function isWaiting(order: Pick<ShopOrder, 'status' | 'delivery'>): boolean {
  const t = orderTaskOf(order);
  return t === 'toShip' || t === 'toHandOver';
}

export type OrderActionKey = 'markOrderShipped' | 'markOrderFulfilled';

export interface PrimaryAction {
  action: OrderActionKey;
  /** `shop.action.<label>` */
  label: 'markShipped' | 'markDelivered' | 'markPickedUp';
  /** What the order becomes — shown at once, while the undo window runs. */
  next: Extract<OrderStatus, 'shipped' | 'fulfilled'>;
}

/**
 * The one thing the sticky bar offers (UX_COPY §3.5). A parcel is shipped and
 * then delivered; a pickup is picked up; digital or "in touch" is delivered.
 * A finished or cancelled order offers nothing — the bar is not drawn.
 */
export function primaryActionOf(order: Pick<ShopOrder, 'status' | 'delivery'>): PrimaryAction | null {
  const pref = order.delivery.preference;
  if (order.status === 'paid') {
    if (pref === 'delivery') return { action: 'markOrderShipped', label: 'markShipped', next: 'shipped' };
    if (pref === 'pickup') return { action: 'markOrderFulfilled', label: 'markPickedUp', next: 'fulfilled' };
    return { action: 'markOrderFulfilled', label: 'markDelivered', next: 'fulfilled' };
  }
  if (order.status === 'shipped') {
    return { action: 'markOrderFulfilled', label: 'markDelivered', next: 'fulfilled' };
  }
  return null;
}

/**
 * "2 items" counts units, not lines (UX_COPY §3.3). A product sold by the
 * kilo makes the units meaningless — then it counts lines, as the order
 * notification does (§10.1).
 */
export function itemCountOf(lines: Pick<ShopOrderLine, 'quantity'>[]): number {
  const whole = lines.every((l) => Number.isInteger(l.quantity));
  return whole ? lines.reduce((s, l) => s + (l.quantity > 0 ? l.quantity : 0), 0) : lines.length;
}

/**
 * How many units the stock does not cover right now. `stock` is the current
 * quantity of each variant (`v:<id>`) and product (`p:<id>`). Below zero is
 * the production queue (§2.5) — `-1` itself is "unlimited", never a shortfall.
 * An order that is not oversold, or no longer waiting, is never short.
 */
export function shortUnitsOf(
  order: Pick<ShopOrder, 'oversold' | 'status' | 'lines'>,
  stock: ReadonlyMap<string, number>
): number {
  if (!order.oversold || (order.status !== 'paid' && order.status !== 'shipped')) return 0;
  let short = 0;
  for (const line of order.lines) {
    const key = line.variantId ? `v:${line.variantId}` : line.productId ? `p:${line.productId}` : null;
    const q = key ? stock.get(key) : undefined;
    if (q === undefined || q === UNLIMITED || q >= 0) continue;
    short += Math.min(line.quantity, -q);
  }
  return short;
}

// ─── the order list ─────────────────────────────────────────────────────────

export type OrderFilter = 'toShip' | 'toHandOver' | 'shipped' | 'done' | 'cancelled' | 'all';
export const ORDER_FILTERS: OrderFilter[] = ['toShip', 'toHandOver', 'shipped', 'done', 'cancelled', 'all'];

export function orderFilterOf(value: unknown): OrderFilter | null {
  return ORDER_FILTERS.includes(value as OrderFilter) ? (value as OrderFilter) : null;
}

export function orderCounts(orders: Pick<ShopOrder, 'status' | 'delivery'>[]): Record<OrderFilter, number> {
  const c: Record<OrderFilter, number> = { toShip: 0, toHandOver: 0, shipped: 0, done: 0, cancelled: 0, all: 0 };
  for (const o of orders) {
    c[orderTaskOf(o)]++;
    c.all++;
  }
  return c;
}

/** "לשליחה" when anything is there, then "למסירה", else everything (UX_COPY §3.2). */
export function defaultOrderFilter(counts: Record<OrderFilter, number>): OrderFilter {
  if (counts.toShip > 0) return 'toShip';
  if (counts.toHandOver > 0) return 'toHandOver';
  return 'all';
}

/** Digits only — "050-123 4567" and "0501234567" are the same phone. */
const digits = (s: string) => s.replace(/\D+/g, '');

/** Search by buyer name, phone or order number (UX_COPY §3.2). */
export function matchesOrder(order: ShopOrder, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const qd = digits(q);
  if (order.number.toLowerCase().includes(q)) return true;
  if (order.buyer.name && order.buyer.name.toLowerCase().includes(q)) return true;
  if (order.buyer.email && order.buyer.email.toLowerCase().includes(q)) return true;
  if (qd.length >= 3 && order.buyer.phone && digits(order.buyer.phone).includes(qd)) return true;
  return order.lines.some((l) => l.name.toLowerCase().includes(q) || (l.sku ?? '').toLowerCase().includes(q));
}

export function filterOrders(orders: ShopOrder[], filter: OrderFilter, query = ''): ShopOrder[] {
  return orders.filter((o) => (filter === 'all' || orderTaskOf(o) === filter) && matchesOrder(o, query));
}

/**
 * Waiting orders oldest first — the parcel that waited longest goes out
 * first. Everything else newest first, the way a history reads.
 */
export function sortOrders(orders: ShopOrder[], filter: OrderFilter): ShopOrder[] {
  const at = (o: ShopOrder) => Date.parse(o.paidAt ?? o.createdAt ?? '') || 0;
  const oldestFirst = filter === 'toShip' || filter === 'toHandOver';
  return [...orders].sort((a, b) => (oldestFirst ? at(a) - at(b) : at(b) - at(a)));
}

/** The banner on the plain sales page (UX_COPY §2): short wins over waiting. */
export function bannerOf(
  orders: Pick<ShopOrder, 'status' | 'delivery' | 'shortUnits'>[]
): { kind: 'short' | 'toShip'; count: number } | null {
  const short = orders.filter((o) => o.shortUnits > 0).length;
  if (short > 0) return { kind: 'short', count: short };
  const waiting = orders.filter(isWaiting).length;
  return waiting > 0 ? { kind: 'toShip', count: waiting } : null;
}

// ─── cancel (holder only — orderLifecycle.ts) ───────────────────────────────

/** Sales of this order already in a split: they will not change on cancel. */
export function salesInSplit(order: Pick<ShopOrder, 'sales'>): number {
  return order.sales.filter((s) => s.inSplit && (s.amount ?? 0) !== 0).length;
}

export function mayCancel(order: Pick<ShopOrder, 'status' | 'holderId'>, uid: string | null): boolean {
  return order.status !== 'cancelled' && !!uid && order.holderId === String(uid);
}

// ─── stock ──────────────────────────────────────────────────────────────────

export type StockState = 'unlimited' | 'short' | 'out' | 'low' | 'ok';

/**
 * One stock number, as the seller should read it. `lowAt` is the product's
 * own threshold (`matanot.lowStockAt`) — empty means "never low": a level
 * nobody chose is not a level (UX_COPY §5).
 */
export function stockStateOf(quant: number | null, lowAt: number | null = null): StockState {
  if (quant === null || quant === UNLIMITED) return 'unlimited';
  if (quant < 0) return 'short';
  if (quant === 0) return 'out';
  if (lowAt !== null && lowAt > 0 && quant <= lowAt) return 'low';
  return 'ok';
}

export type StockMode = 'set' | 'add';

/**
 * The stock after an update: "in stock now" replaces the number, "add" adds a
 * delivery that came in (UX_COPY §5 — two questions, two modes). Adding to a
 * production queue (below zero) fills it first. Unlimited stays unlimited on
 * an add: there is nothing to count. `null` = not a valid update.
 */
export function nextStock(before: number | null, mode: StockMode, value: number, unlimited = false): number | null {
  if (unlimited) return UNLIMITED;
  if (!Number.isFinite(value)) return null;
  if (mode === 'set') return value >= 0 ? value : null;
  if (value <= 0) return null;
  if (before === null || before === UNLIMITED) return null;
  return before + value;
}

export interface ShopVariantRow {
  id: string;
  sku: string | null;
  label: string;
  price: number | null;
  quant: number | null;
  active: boolean;
}

export interface ShopProductRow {
  id: string;
  name: string;
  imageUrl: string | null;
  price: number | null;
  pricingMode: string | null;
  /** `published` / `draft` / `archived`, as the public API reads it. */
  status: 'published' | 'draft' | 'archived';
  kindOf: string | null;
  quant: number | null;
  lowStockAt: number | null;
  variants: ShopVariantRow[];
}

/** One row of the stock tab: a variant, or a product sold without variants. */
export interface StockRow {
  key: string;
  productId: string;
  variantId: string | null;
  name: string;
  label: string | null;
  sku: string | null;
  imageUrl: string | null;
  quant: number | null;
  state: StockState;
}

export function stockRowsOf(products: ShopProductRow[]): StockRow[] {
  const rows: StockRow[] = [];
  for (const p of products) {
    if (p.status === 'archived') continue;
    const active = p.variants.filter((v) => v.active);
    if (active.length) {
      for (const v of active) {
        rows.push({
          key: `v:${v.id}`,
          productId: p.id,
          variantId: v.id,
          name: p.name,
          label: v.label,
          sku: v.sku,
          imageUrl: p.imageUrl,
          quant: v.quant,
          state: stockStateOf(v.quant, p.lowStockAt)
        });
      }
    } else {
      // A subscription or "unlimited" kind has nothing on a shelf to count.
      const counted = p.kindOf !== 'unlimited';
      const quant = counted ? p.quant : UNLIMITED;
      rows.push({
        key: `p:${p.id}`,
        productId: p.id,
        variantId: null,
        name: p.name,
        label: null,
        sku: null,
        imageUrl: p.imageUrl,
        quant,
        state: stockStateOf(quant, p.lowStockAt)
      });
    }
  }
  return rows;
}

export type StockFilter = 'attention' | 'low' | 'out' | 'short' | 'all';

/** "What needs me" first: short, then sold out, then low (UX_COPY §5). */
export function filterStock(rows: StockRow[], filter: StockFilter, query = ''): StockRow[] {
  const q = query.trim().toLowerCase();
  const rank: Record<StockState, number> = { short: 0, out: 1, low: 2, ok: 3, unlimited: 4 };
  return rows
    .filter((r) => {
      if (filter === 'attention' && !(r.state === 'short' || r.state === 'out' || r.state === 'low')) return false;
      if (filter !== 'attention' && filter !== 'all' && r.state !== filter) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        (r.label ?? '').toLowerCase().includes(q) ||
        (r.sku ?? '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => rank[a.state] - rank[b.state] || a.name.localeCompare(b.name));
}

export function stockCounts(rows: StockRow[]): Record<StockFilter, number> {
  const c: Record<StockFilter, number> = { attention: 0, low: 0, out: 0, short: 0, all: rows.length };
  for (const r of rows) {
    if (r.state === 'low' || r.state === 'out' || r.state === 'short') {
      c[r.state]++;
      c.attention++;
    }
  }
  return c;
}

// ─── products ───────────────────────────────────────────────────────────────

/** The prices the shop shows — a range when variants differ. */
export function priceRangeOfRow(p: Pick<ShopProductRow, 'price' | 'variants'>): { min: number; max: number } | null {
  const prices = p.variants
    .filter((v) => v.active)
    .map((v) => v.price ?? p.price)
    .filter((x): x is number => x !== null && Number.isFinite(x));
  if (!prices.length) return p.price === null ? null : { min: p.price, max: p.price };
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

/** Σ of the active variants' stock (`-1` if any is unlimited), else the product's own. */
export function stockTotalOfRow(p: Pick<ShopProductRow, 'quant' | 'variants' | 'kindOf'>): number | null {
  const active = p.variants.filter((v) => v.active);
  if (!active.length) return p.kindOf === 'unlimited' ? UNLIMITED : p.quant;
  if (active.some((v) => v.quant === UNLIMITED)) return UNLIMITED;
  return active.reduce((s, v) => s + Math.max(0, v.quant ?? 0), 0);
}

export function matchesProduct(p: ShopProductRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return p.name.toLowerCase().includes(q) || p.variants.some((v) => (v.sku ?? '').toLowerCase().includes(q));
}

// ─── sales ──────────────────────────────────────────────────────────────────

export type SplitState = 'waiting' | 'inSplit' | 'claimOpen' | 'split';

export interface ShopSaleRow {
  id: string;
  date: string | null;
  amount: number;
  units: number | null;
  productId: string | null;
  productName: string | null;
  variantLabel: string | null;
  orderId: string | null;
  source: 'api' | 'ui';
  holderId: string | null;
  holderName: string | null;
  holderStatus: string | null;
  splited: boolean;
  inSplit: boolean;
}

/** Where a sale stands with the split (UX_COPY §6). */
export function splitStateOf(s: Pick<ShopSaleRow, 'holderStatus' | 'splited' | 'inSplit'>): SplitState {
  if (s.holderStatus === 'open') return 'claimOpen';
  if (s.splited) return 'split';
  if (s.inSplit) return 'inSplit';
  return 'waiting';
}

export type SalesRange = '7' | '30' | '90' | 'year' | 'all';
export const SALES_RANGES: SalesRange[] = ['7', '30', '90', 'year', 'all'];

/** The first instant inside a range, or null for "all". `now` is passed in (tests). */
export function rangeStart(range: SalesRange, now: number): number | null {
  if (range === 'all') return null;
  if (range === 'year') {
    const d = new Date(now);
    return new Date(d.getFullYear(), 0, 1).getTime();
  }
  return now - Number(range) * 86_400_000;
}

export type SourceFilter = 'all' | 'api' | 'ui';

export function filterSales(
  sales: ShopSaleRow[],
  opts: { range: SalesRange; source: SourceFilter; query?: string; now: number }
): ShopSaleRow[] {
  const from = rangeStart(opts.range, opts.now);
  const q = (opts.query ?? '').trim().toLowerCase();
  return sales
    .filter((s) => {
      if (from !== null && (Date.parse(s.date ?? '') || 0) < from) return false;
      if (opts.source !== 'all' && s.source !== opts.source) return false;
      if (!q) return true;
      return (
        (s.productName ?? '').toLowerCase().includes(q) ||
        (s.variantLabel ?? '').toLowerCase().includes(q) ||
        (s.holderName ?? '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => (Date.parse(b.date ?? '') || 0) - (Date.parse(a.date ?? '') || 0));
}

/**
 * The KPI strip (canvas "DesktopOrders"): what waits to be split, and the
 * last 30 days. "Waiting" is a sale counted in balances (not an open claim)
 * that no split has taken yet — the same money the plain page's headline shows.
 */
export function salesSummary(
  sales: Pick<ShopSaleRow, 'amount' | 'date' | 'source' | 'holderStatus' | 'splited' | 'inSplit'>[],
  now: number
): { awaiting: number; awaitingCount: number; recent: number; recentCount: number; siteShare: number } {
  const from = now - 30 * 86_400_000;
  let awaiting = 0;
  let awaitingCount = 0;
  let recent = 0;
  let recentCount = 0;
  let recentSite = 0;
  for (const s of sales) {
    const amount = Number.isFinite(s.amount) ? s.amount : 0;
    if (splitStateOf(s) === 'waiting' && amount !== 0) {
      awaiting += amount;
      awaitingCount++;
    }
    const at = Date.parse(s.date ?? '') || 0;
    if (at >= from && amount !== 0) {
      recent += amount;
      recentCount++;
      if (s.source === 'api') recentSite++;
    }
  }
  const round = (n: number) => Math.round(n * 100) / 100;
  return {
    awaiting: round(awaiting),
    awaitingCount,
    recent: round(recent),
    recentCount,
    siteShare: recentCount ? Math.round((recentSite / recentCount) * 100) : 0
  };
}

export function salesTotal(sales: Pick<ShopSaleRow, 'amount'>[]): number {
  return Math.round(sales.reduce((s, x) => s + (Number.isFinite(x.amount) ? x.amount : 0), 0) * 100) / 100;
}

// ─── CSV ────────────────────────────────────────────────────────────────────

/**
 * One CSV cell. Quotes when needed, and defuses a leading `= + - @` so a
 * product named "=HYPERLINK(…)" stays text when the file opens in Excel.
 */
export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** BOM + CRLF: what Excel needs to open Hebrew as Hebrew. */
export function toCsv(rows: unknown[][]): string {
  return '﻿' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

/** "סדנת קרמיקה" → "סדנת-קרמיקה-1842": unique, readable, never empty. */
export function handleOf(name: string, id: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return slug ? `${slug}-${id}` : `product-${id}`;
}

/**
 * Products in Shopify's import format (PLAN §7.3 — "fits any sales system").
 * One row per variant; the product's own columns only on its first row, which
 * is how Shopify groups variants under one `Handle`. Up to three options, as
 * Shopify allows. Unlimited stock is an empty quantity with tracking off.
 */
export function shopifyCsvRows(
  products: (ShopProductRow & { options?: { name: string; values: string[] }[] })[]
): unknown[][] {
  const header = [
    'Handle', 'Title', 'Status',
    'Option1 Name', 'Option1 Value', 'Option2 Name', 'Option2 Value', 'Option3 Name', 'Option3 Value',
    'Variant SKU', 'Variant Price', 'Variant Inventory Tracker', 'Variant Inventory Qty', 'Image Src'
  ];
  const rows: unknown[][] = [header];
  for (const p of products) {
    if (p.status === 'archived') continue;
    const handle = handleOf(p.name, p.id);
    const status = p.status === 'published' ? 'active' : 'draft';
    const variants = p.variants.filter((v) => v.active);
    const names = (p.options ?? []).slice(0, 3).map((o) => o.name);
    const qty = (q: number | null) => (q === null || q === UNLIMITED ? '' : Math.max(0, q));
    const tracker = (q: number | null) => (q === null || q === UNLIMITED ? '' : 'shopify');
    if (!variants.length) {
      const q = p.kindOf === 'unlimited' ? UNLIMITED : p.quant;
      rows.push([handle, p.name, status, 'Title', 'Default Title', '', '', '', '', '', p.price ?? '', tracker(q), qty(q), p.imageUrl ?? '']);
      continue;
    }
    variants.forEach((v, i) => {
      const values = v.label.split(' / ').map((x) => x.trim());
      const opt = (n: number) => [i === 0 ? (names[n] ?? (values[n] !== undefined ? `Option ${n + 1}` : '')) : '', values[n] ?? ''];
      rows.push([
        handle,
        i === 0 ? p.name : '',
        i === 0 ? status : '',
        ...opt(0), ...opt(1), ...opt(2),
        v.sku ?? '',
        v.price ?? p.price ?? '',
        tracker(v.quant),
        qty(v.quant),
        i === 0 ? (p.imageUrl ?? '') : ''
      ]);
    });
  }
  return rows;
}
