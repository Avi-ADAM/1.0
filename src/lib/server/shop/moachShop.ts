/**
 * What the moach's sales screens read (PLAN_SHOP_CUSTOMER_EXPERIENCE §7.3 — S5).
 *
 * Every caller is a `sales/*` loader that has already passed the moach
 * layout's membership check (`await parent()`), so these read with the
 * service token. The rows carry the buyer's name, phone and address: they
 * leave the server only inside a members-only page payload — never a public
 * DTO, a webhook or `GET /orders/{ref}` (§5.6).
 *
 * Strapi rows become the plain shapes of `$lib/shop/manage.ts` here, so the
 * screens never read `attributes.x.data.attributes` — and stock arrives with
 * one meaning (a number is a count, `null` is unlimited), read off `quant` and
 * the `unlimited` flag through `$lib/shop/stock.ts`.
 */
import { strapiClient } from '$lib/server/actions';
import { ordersSchemaLive, strapiRun } from '$lib/server/apiPublic/catalog.js';
import { productStatusOf } from '$lib/server/apiPublic/dto.js';
import { imageOf } from '$lib/server/apiPublic/shop.js';
import { orderNumberOf } from '$lib/server/ordersApi.js';
import {
  addressOf,
  preferenceOf,
  shortUnitsOf,
  statusOf,
  type ShopOrder,
  type ShopProductRow,
  type ShopSaleRow
} from '$lib/shop/manage.js';
import { countOf, LEGACY_UNLIMITED } from '$lib/shop/stock.js';
import { readStockFlags } from '$lib/server/shop/stockFlags.js';

type FetchFn = typeof fetch;

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);
const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const idOf = (rel: any): string | null => (rel?.data?.id != null ? String(rel.data.id) : null);

/** "M / אדום" from a variant's stored name, else from its option values. */
export function variantLabelOf(name: unknown, optionValues: unknown): string {
  const own = str(name);
  if (own) return own;
  if (!Array.isArray(optionValues)) return '';
  return optionValues
    .map((o: any) => str(o?.label) ?? str(o?.value))
    .filter(Boolean)
    .join(' / ');
}

// ─── orders ─────────────────────────────────────────────────────────────────

export function toShopOrder(node: any): ShopOrder | null {
  const a = node?.attributes;
  if (!a || node?.id == null) return null;
  const lines = [...(a.lines?.data ?? [])]
    .map((row: any) => row?.attributes ?? {})
    .sort((x: any, y: any) => (num(x.position) ?? 0) - (num(y.position) ?? 0))
    .map((l: any) => {
      const quantity = num(l.quantity) ?? 0;
      const unitPrice = num(l.unitPrice);
      return {
        productId: idOf(l.matanot),
        variantId: idOf(l.variant),
        name: str(l.nameSnapshot) ?? '',
        optionLabel: str(l.optionLabelSnapshot),
        sku: str(l.skuSnapshot),
        imageUrl: str(l.imageUrlSnapshot),
        quantity,
        unitPrice,
        lineTotal: num(l.lineTotal) ?? (unitPrice === null ? null : Math.round(unitPrice * quantity * 100) / 100)
      };
    });
  return {
    id: String(node.id),
    ref: String(a.ref ?? ''),
    number: orderNumberOf(a.displayNumber, node.id),
    status: statusOf(a.status),
    oversold: a.oversold === true,
    total: num(a.total),
    currency: str(a.currencyCode),
    source: a.source === 'ui' ? 'ui' : 'api',
    paidAt: str(a.paidAt),
    shippedAt: str(a.shippedAt),
    fulfilledAt: str(a.fulfilledAt),
    expiresAt: str(a.expiresAt),
    createdAt: str(a.createdAt),
    buyer: { name: str(a.buyerName), email: str(a.buyerEmail), phone: str(a.buyerPhone) },
    delivery: { preference: preferenceOf(a.deliveryPreference), address: addressOf(a.deliveryAddress) },
    note: str(a.note),
    paymentRef: str(a.paymentRef),
    paymentMethod: str(a.paymentMethod),
    holderId: idOf(a.holder),
    holderName: str(a.holder?.data?.attributes?.username),
    lines,
    sales: (a.sales?.data ?? []).map((s: any) => ({
      id: String(s.id),
      holderId: idOf(s.attributes?.users_permissions_user),
      holderStatus: str(s.attributes?.holderStatus),
      inSplit: s.attributes?.splited === true || (s.attributes?.tosplits?.data ?? []).length > 0,
      amount: num(s.attributes?.in)
    })),
    shortUnits: 0
  };
}

export interface ShopOrdersResult {
  /** False until the order columns are deployed — the screen says so instead of an error. */
  ready: boolean;
  orders: ShopOrder[];
  /** The query failed for another reason; the screen offers a refresh. */
  failed?: boolean;
}

/**
 * The rikma's orders. An oversold order is measured against the stock as it
 * is *now* — once the seller restocks, the "short" tag goes away by itself.
 */
export async function loadShopOrders(projectId: string, fetchFn?: FetchFn): Promise<ShopOrdersResult> {
  const run = strapiRun(fetchFn);
  if (!(await ordersSchemaLive(run))) return { ready: false, orders: [] };
  let nodes: any[];
  try {
    const res = await run('moachShopOrders', { pid: projectId });
    nodes = res?.data?.orders?.data ?? [];
  } catch {
    return { ready: true, orders: [], failed: true };
  }
  const orders = nodes.map(toShopOrder).filter((o): o is ShopOrder => !!o);

  const open = orders.filter((o) => o.oversold && (o.status === 'paid' || o.status === 'shipped'));
  if (open.length) {
    const variantIds = [...new Set(open.flatMap((o) => o.lines.map((l) => l.variantId).filter(Boolean)))] as string[];
    const productIds = [
      ...new Set(open.flatMap((o) => o.lines.filter((l) => !l.variantId).map((l) => l.productId).filter(Boolean)))
    ] as string[];
    // Only counted rows go in the map: an unlimited one is never short, and a
    // count of -1 is one unit short, not "unlimited" (§2.5).
    const stock = new Map<string, number>();
    try {
      const [vRes, pRes, flags] = await Promise.all([
        variantIds.length ? run('ordersApiVariants', { pid: projectId, ids: variantIds }) : null,
        productIds.length ? run('ordersApiProducts', { pid: projectId, ids: productIds }) : null,
        readStockFlags(run, { variantIds, productIds })
      ]);
      for (const v of vRes?.data?.productVariants?.data ?? []) {
        const q = countOf({ quant: v?.attributes?.quant, unlimited: flags.variants.get(String(v.id))?.unlimited });
        if (q !== null) stock.set(`v:${v.id}`, q);
      }
      for (const p of pRes?.data?.matanots?.data ?? []) {
        const q = countOf({ quant: p?.attributes?.quant, unlimited: flags.products.get(String(p.id))?.unlimited });
        if (q !== null) stock.set(`p:${p.id}`, q);
      }
    } catch {
      /* without the stock an oversold order still shows its tag, just without the count */
    }
    for (const o of open) o.shortUnits = stock.size ? shortUnitsOf(o, stock) : 1;
  }
  return { ready: true, orders };
}

// ─── products ───────────────────────────────────────────────────────────────

export interface ShopProductsResult {
  products: (ShopProductRow & { options: { name: string; values: string[] }[] })[];
  failed?: boolean;
}

export async function loadShopProducts(projectId: string, fetchFn?: FetchFn): Promise<ShopProductsResult> {
  const run = (qid: string, vars: Record<string, unknown>) => strapiClient.execute(qid, vars, undefined, fetchFn);
  let nodes: any[];
  try {
    const res = await run('moachShopProducts', { pid: projectId });
    nodes = res?.data?.matanots?.data ?? [];
  } catch (e) {
    console.error('[moachShop] products failed:', (e as any)?.getMessages?.() ?? e);
    return { products: [], failed: true };
  }

  const lowAt = new Map<string, number>();
  try {
    const res = await run('moachShopLowStock', { pid: projectId });
    for (const p of res?.data?.matanots?.data ?? []) {
      const q = num(p?.attributes?.lowStockAt);
      if (q !== null) lowAt.set(String(p.id), q);
    }
  } catch {
    /* `lowStockAt` is not deployed yet — nothing reads "low" until it is */
  }

  // The `unlimited` flag of each product and variant. Until it is deployed
  // this fails and every row reads the old way (`-1` = unlimited).
  const flagOf = new Map<string, boolean>();
  try {
    const res = await run('moachShopStockFlags', { pid: projectId });
    for (const p of res?.data?.matanots?.data ?? []) {
      if (typeof p?.attributes?.unlimited === 'boolean') flagOf.set(`p:${p.id}`, p.attributes.unlimited);
      for (const v of p?.attributes?.variants?.data ?? []) {
        if (typeof v?.attributes?.unlimited === 'boolean') flagOf.set(`v:${v.id}`, v.attributes.unlimited);
      }
    }
  } catch {
    /* the column is not deployed yet */
  }

  const products = nodes.map((n: any) => {
    const a = n.attributes ?? {};
    const variants = [...(a.variants?.data ?? [])]
      .sort((x: any, y: any) => (num(x.attributes?.position) ?? 0) - (num(y.attributes?.position) ?? 0))
      .map((v: any) => ({
        id: String(v.id),
        sku: str(v.attributes?.sku),
        label: variantLabelOf(v.attributes?.name, v.attributes?.optionValues),
        price: num(v.attributes?.price),
        // A variant with no number has 0 on the shelf.
        quant: countOf({ quant: v.attributes?.quant ?? 0, unlimited: flagOf.get(`v:${v.id}`) ?? null }),
        active: v.attributes?.active !== false
      }));
    // The axes in the order the variants spell them ("M / אדום" = size, colour).
    const options = [...(a.options?.data ?? [])]
      .sort((x: any, y: any) => (num(x.attributes?.position) ?? 0) - (num(y.attributes?.position) ?? 0))
      .map((o: any) => ({ name: str(o.attributes?.name) ?? str(o.attributes?.key) ?? '', values: [] as string[] }));
    return {
      id: String(n.id),
      name: str(a.name) ?? '',
      imageUrl: imageOf(a.pic)?.url ?? null,
      price: num(a.price),
      pricingMode: str(a.pricingMode),
      status: productStatusOf(a),
      kindOf: str(a.kindOf),
      // A legacy product with no number is unlimited, as it always read.
      quant: countOf({
        quant: a.quant ?? (flagOf.get(`p:${n.id}`) === false ? 0 : LEGACY_UNLIMITED),
        unlimited: flagOf.get(`p:${n.id}`) ?? null
      }),
      lowStockAt: lowAt.get(String(n.id)) ?? null,
      variants,
      options
    };
  });
  return { products };
}

// ─── sales ──────────────────────────────────────────────────────────────────

export async function loadShopSales(
  projectId: string,
  fetchFn?: FetchFn
): Promise<{ sales: ShopSaleRow[]; failed?: boolean }> {
  try {
    const res = await strapiClient.execute('moachShopSales', { pid: projectId }, undefined, fetchFn);
    const sales = (res?.data?.sales?.data ?? []).map((s: any): ShopSaleRow => {
      const a = s.attributes ?? {};
      const v = a.product_variant?.data?.attributes;
      return {
        id: String(s.id),
        date: str(a.date) ?? str(a.createdAt),
        amount: num(a.in) ?? 0,
        units: num(a.unit),
        productId: idOf(a.matanot),
        productName: str(a.matanot?.data?.attributes?.name),
        variantLabel: v ? variantLabelOf(v.name, v.optionValues) || null : null,
        orderId: idOf(a.order),
        source: a.source === 'api' ? 'api' : 'ui',
        holderId: idOf(a.users_permissions_user),
        holderName: str(a.users_permissions_user?.data?.attributes?.username),
        holderStatus: str(a.holderStatus),
        splited: a.splited === true,
        inSplit: (a.tosplits?.data ?? []).length > 0
      };
    });
    return { sales };
  } catch (e) {
    console.error('[moachShop] sales failed:', (e as any)?.getMessages?.() ?? e);
    return { sales: [], failed: true };
  }
}
