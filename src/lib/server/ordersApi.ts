// src/lib/server/ordersApi.ts
//
// Pure, side-effect-free helpers for `POST /api/v1/r/{rikma}/orders` — the
// paid order a storefront's *server* reports after its payment provider
// confirmed the charge (PLAN_SHOP_CUSTOMER_EXPERIENCE §3.3, §5.4).
//
// Same split as salesApi.ts / tasksApi.ts: everything that decides something
// lives here and is unit-tested without Strapi; the endpoint (writeApi.ts) and
// the action (createPaidOrder.ts) only read rows and write rows.
//
// Two rules shape almost every function below:
//
//   1. **A paid order is never refused for stock.** The buyer has already been
//      charged. Short stock, a switched-off variant, a quantity outside
//      minOrder/maxOrder — all of these are *recorded* (`oversold`, a note) and
//      the rikma is told. What *is* refused is an order that names something
//      the rikma does not sell at a fixed price: a foreign or draft product, a
//      `quote` product, a variant product without a variant.
//   2. **Nothing is written until every line has passed.** Strapi has no
//      transaction over GraphQL, so "atomic" here means: decide everything
//      first (`planOrder`), then write. A write that dies half way is finished
//      by the payment provider's retry — the action resumes by `ref` (§5.4).

import { normalizeCode } from '$lib/money/currencies.js';
import { productStatusOf, pricingModeOf } from './apiPublic/dto.js';
import { checkoutOf, imageOf, num, str } from './apiPublic/shop.js';
import { countOf, LEGACY_UNLIMITED } from '$lib/shop/stock.js';

export const ORDERS_CREATE_SCOPE = 'orders:create';
export const ORDERS_READ_SCOPE = 'orders:read';
export const ORDER_SOURCE = 'api';

/** A cart bigger than this is a bug or an attack, not a shop. */
export const MAX_ORDER_LINES = 50;

const MAX_EXTERNAL_ID = 120;
/** The storefront's own order number, as its buyer sees it (). */
const MAX_DISPLAY_NUMBER = 40;
const MAX_NOTE = 2000;
const MAX_SHORT = 200;
const MAX_ADDRESS_FIELDS = 12;

export const DELIVERY_PREFERENCES = ['pickup', 'delivery', 'digital', 'contact'] as const;
export type DeliveryPreference = (typeof DELIVERY_PREFERENCES)[number];

/**
 * How the buyer pays (PLAN_SHOP_OPERATIONS §5). `paid` — the storefront's
 * payment provider already charged them (the original S3 flow). `arranged` —
 * nothing was charged: the buyer left a phone, someone in the rikma calls,
 * and the money moves by bit / transfer / cash. Such an order waits in
 * `pendingPayment` until the member who got the money says so.
 */
export const ORDER_PAYMENTS = ['paid', 'arranged'] as const;
export type OrderPayment = (typeof ORDER_PAYMENTS)[number];

/** How long an arranged order waits for its payment before it lapses (§5.2, rule 1). */
export const ARRANGED_EXPIRY_HOURS = 72;
const MAX_EXPIRY_HOURS = 24 * 30;

export interface OrderLineInput {
  productId: string;
  variantId: string | null;
  quantity: number;
  unitPrice: number;
  note: string | null;
}

export interface OrderPayload {
  externalId: string;
  /** `paid` unless the storefront said `arranged` (§5). */
  payment: OrderPayment;
  /** An arranged order lapses after this many hours unless paid; null = the default. */
  expiresInHours: number | null;
  /** The number the buyer got from the storefront — what people say on the phone. */
  displayNumber: string | null;
  paymentRef: string | null;
  paymentMethod: string | null;
  /** The total the provider charged, when the caller sends it. */
  amount: number | null;
  /** ISO-4217; null = the rikma's own currency. */
  currency: string | null;
  buyer: { name: string | null; email: string | null; phone: string | null };
  delivery: {
    preference: DeliveryPreference | null;
    address: Record<string, string> | null;
    fee: number | null;
    /** The shipping option the buyer chose (`m:<zone>:<method>`, `p:<point>`, …) — PLAN_SHOP_SHIPPING. */
    optionId: string | null;
  };
  note: string | null;
  locale: string | null;
  lines: OrderLineInput[];
}

export interface FieldProblem {
  field: string;
  message: string;
  /** Index into `lines`, when the problem is in one line. */
  line?: number;
}

export type OrderValidation =
  | { ok: true; value: OrderPayload }
  | { ok: false; message: string; problems: FieldProblem[] };

// Strapi's `email` attribute rejects a malformed address with a validation
// error *after* the order row was half-built; refusing it here keeps the 400
// where the caller can read it.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(v: unknown, max: number): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v !== 'string' && typeof v !== 'number') return null;
  const s = String(v).trim();
  return s ? s.slice(0, max) : null;
}

function idOf(v: unknown): string {
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  if (typeof v === 'string') return v.trim();
  return '';
}

/** An address is a flat bag of short strings — never nested, never HTML. */
function addressOf(v: unknown): Record<string, string> | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const out: Record<string, string> = {};
  for (const [k, raw] of Object.entries(v)) {
    if (Object.keys(out).length >= MAX_ADDRESS_FIELDS) break;
    const key = k.trim().slice(0, 40);
    const value = text(raw, MAX_SHORT);
    if (key && value && !value.includes('<')) out[key] = value;
  }
  return Object.keys(out).length ? out : null;
}

/**
 * The raw body → an `OrderPayload`, or every problem found at once.
 *
 * Every problem, not the first one: an integration fixing its request one
 * 400 at a time is an integration that ships late. Never throws.
 */
export function validateOrderPayload(body: any): OrderValidation {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return {
      ok: false,
      message: 'Invalid JSON body',
      problems: [{ field: 'body', message: 'must be a JSON object' }]
    };
  }
  const problems: FieldProblem[] = [];

  const externalId = text(body.externalId, MAX_EXTERNAL_ID + 1);
  if (!externalId) {
    problems.push({
      field: 'externalId',
      message: "is required — the payment provider's id for this charge"
    });
  } else if (externalId.length > MAX_EXTERNAL_ID) {
    problems.push({
      field: 'externalId',
      message: `must be at most ${MAX_EXTERNAL_ID} characters`
    });
  }

  let displayNumber: string | null = null;
  if (body.displayNumber != null && body.displayNumber !== '') {
    if (typeof body.displayNumber !== 'string' && typeof body.displayNumber !== 'number') {
      problems.push({ field: 'displayNumber', message: 'must be a string' });
    } else {
      displayNumber = text(body.displayNumber, MAX_DISPLAY_NUMBER + 1);
      if (displayNumber && displayNumber.length > MAX_DISPLAY_NUMBER) {
        problems.push({
          field: 'displayNumber',
          message: `must be at most ${MAX_DISPLAY_NUMBER} characters`
        });
      } else if (displayNumber && /[<>\n\r]/.test(displayNumber)) {
        problems.push({ field: 'displayNumber', message: 'must be a single line of plain text' });
      }
    }
  }

  let currency: string | null = null;
  if (body.currency != null && body.currency !== '') {
    currency = normalizeCode(body.currency);
    if (!currency)
      problems.push({
        field: 'currency',
        message: 'must be an ISO-4217 code, e.g. "ILS"'
      });
  }

  let amount: number | null = null;
  if (body.amount != null) {
    amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount < 0) {
      problems.push({ field: 'amount', message: 'must be a number ≥ 0' });
      amount = null;
    }
  }

  const rawLines = body.lines;
  const lines: OrderLineInput[] = [];
  if (!Array.isArray(rawLines) || rawLines.length === 0) {
    problems.push({ field: 'lines', message: 'must be a non-empty array' });
  } else if (rawLines.length > MAX_ORDER_LINES) {
    problems.push({
      field: 'lines',
      message: `must have at most ${MAX_ORDER_LINES} lines`
    });
  } else {
    rawLines.forEach((raw: any, line: number) => {
      if (!raw || typeof raw !== 'object') {
        problems.push({ field: 'lines', line, message: 'must be an object' });
        return;
      }
      const productId = idOf(raw.productId);
      const variantId = raw.variantId == null ? '' : idOf(raw.variantId);
      const quantity = Number(raw.quantity);
      const unitPrice = Number(raw.unitPrice);
      if (!productId)
        problems.push({ field: 'productId', line, message: 'is required' });
      if (raw.variantId != null && !variantId)
        problems.push({
          field: 'variantId',
          line,
          message: 'must be an id when present'
        });
      if (!Number.isFinite(quantity) || quantity <= 0)
        problems.push({
          field: 'quantity',
          line,
          message: 'must be a number > 0'
        });
      if (raw.unitPrice == null || !Number.isFinite(unitPrice) || unitPrice < 0)
        problems.push({
          field: 'unitPrice',
          line,
          message: 'is required — what was charged per unit, ≥ 0'
        });
      lines.push({
        productId,
        variantId: variantId || null,
        quantity,
        unitPrice,
        note: text(raw.note, MAX_SHORT)
      });
    });
  }

  const rawBuyer = body.buyer && typeof body.buyer === 'object' ? body.buyer : {};
  const buyer = {
    name: text(rawBuyer.name, MAX_SHORT),
    email: text(rawBuyer.email, MAX_SHORT),
    phone: text(rawBuyer.phone, 40)
  };
  if (buyer.email && !EMAIL_RE.test(buyer.email))
    problems.push({ field: 'buyer.email', message: 'is not an email address' });

  const rawDelivery =
    body.delivery && typeof body.delivery === 'object' ? body.delivery : {};
  let preference: DeliveryPreference | null = null;
  if (rawDelivery.preference != null) {
    if (DELIVERY_PREFERENCES.includes(rawDelivery.preference)) {
      preference = rawDelivery.preference;
    } else {
      problems.push({
        field: 'delivery.preference',
        message: `must be one of ${DELIVERY_PREFERENCES.join(', ')}`
      });
    }
  }
  let fee: number | null = null;
  if (rawDelivery.fee != null) {
    fee = Number(rawDelivery.fee);
    if (!Number.isFinite(fee) || fee < 0) {
      problems.push({ field: 'delivery.fee', message: 'must be a number ≥ 0' });
      fee = null;
    }
  }
  let optionId: string | null = null;
  if (rawDelivery.optionId != null && rawDelivery.optionId !== '') {
    const id = String(rawDelivery.optionId);
    if (/^(m:[a-z0-9_-]{1,40}:[a-z0-9_-]{1,40}|p:[a-z0-9_-]{1,40}|digital|contact)$/i.test(id)) optionId = id;
    else problems.push({ field: 'delivery.optionId', message: 'is not a shipping option id' });
  }
  // Somebody has to be reachable about a parcel. Pickup and digital orders
  // are settled by the storefront itself, so they may stay anonymous.
  if (preference === 'delivery' && !buyer.email && !buyer.phone) {
    problems.push({
      field: 'buyer',
      message: 'a delivery order needs buyer.email or buyer.phone'
    });
  }

  let payment: OrderPayment = 'paid';
  if (body.payment != null && body.payment !== '') {
    if (ORDER_PAYMENTS.includes(body.payment)) {
      payment = body.payment;
    } else {
      problems.push({ field: 'payment', message: `must be one of ${ORDER_PAYMENTS.join(', ')}` });
    }
  }
  let expiresInHours: number | null = null;
  if (body.expiresInHours != null && body.expiresInHours !== '') {
    const h = Number(body.expiresInHours);
    if (!Number.isFinite(h) || h < 1 || h > MAX_EXPIRY_HOURS) {
      problems.push({ field: 'expiresInHours', message: `must be a number of hours between 1 and ${MAX_EXPIRY_HOURS}` });
    } else {
      expiresInHours = h;
    }
  }
  if (payment === 'arranged') {
    // Arranging a payment is a phone call — nobody can call a name alone.
    if (!buyer.name) problems.push({ field: 'buyer.name', message: 'is required when payment is "arranged"' });
    if (!buyer.phone) problems.push({ field: 'buyer.phone', message: 'is required when payment is "arranged"' });
    // `amount` is what a provider charged; here nothing was charged yet.
    if (body.amount != null) {
      problems.push({
        field: 'amount',
        message: 'must be absent when payment is "arranged" — nothing was charged; the member who gets the money records what arrived'
      });
    }
  } else if (expiresInHours !== null) {
    problems.push({ field: 'expiresInHours', message: 'applies only when payment is "arranged"' });
  }

  if (problems.length) {
    return { ok: false, message: problems.map(describeProblem).join('; '), problems };
  }

  return {
    ok: true,
    value: {
      externalId: externalId!,
      payment,
      expiresInHours,
      displayNumber,
      paymentRef: text(body.paymentRef, MAX_SHORT),
      paymentMethod: text(body.paymentMethod, 40),
      amount,
      currency,
      buyer,
      delivery: { preference, address: addressOf(rawDelivery.address), fee, optionId },
      note: text(body.note, MAX_NOTE),
      locale: text(body.locale, 10),
      lines
    }
  };
}

function describeProblem(p: FieldProblem): string {
  return p.line === undefined
    ? `${p.field} ${p.message}`
    : `lines[${p.line}].${p.field} ${p.message}`;
}

// ─── addresses of an order ──────────────────────────────────────────────────

/**
 * `57:pi_3Q8x` — the order's public handle, and its idempotency key.
 *
 * The rikma is part of it because `externalId` is the *provider's* id: two
 * rikmot on the same provider account could each see `pi_1`. `order.ref` is
 * unique in Strapi, so this is also the constraint that stops a race between
 * two retries from writing two orders.
 */
export function orderRefOf(projectId: string, externalId: string): string {
  return `${projectId}:${externalId}`;
}

/**
 * The number people say out loud: the storefront's own (`1042`, what the buyer
 * got in the confirmation email), else our row id. Never the `ref` — that is a
 * key, not something anyone reads to a buyer on the phone.
 */
export function orderNumberOf(
  displayNumber: string | null | undefined,
  orderId: string | number | null | undefined
): string {
  const own = typeof displayNumber === 'string' ? displayNumber.trim() : '';
  if (own) return own;
  return orderId == null ? '' : String(orderId);
}

/** The sale for line `index` (0-based) — `pi_3Q8x:1`, `pi_3Q8x:2`… */
export function lineSaleExternalId(externalId: string, index: number): string {
  return `${externalId}:${index + 1}`;
}

/**
 * Does a stored order describe the same charge as this request?
 *
 * "Same" is what money and stock depend on: the lines (product, variant,
 * quantity, unit price, in order) and the currency when the caller named one.
 * A retry that corrected the buyer's phone number is the same order; a retry
 * that changed a quantity is a different charge under a reused id, and that
 * is `409 EXTERNAL_ID_CONFLICT`, never a silent overwrite.
 */
export function sameOrder(
  payload: Pick<OrderPayload, 'lines' | 'currency'>,
  stored: {
    currency: string | null;
    lines: Array<{
      productId: string | null;
      variantId: string | null;
      quantity: number | null;
      unitPrice: number | null;
      position?: number | null;
    }>;
  }
): boolean {
  if (
    payload.currency &&
    stored.currency &&
    normalizeCode(payload.currency) !== normalizeCode(stored.currency)
  )
    return false;
  const storedLines = [...stored.lines].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0)
  );
  if (storedLines.length !== payload.lines.length) return false;
  return payload.lines.every((line, i) => {
    const s = storedLines[i];
    return (
      String(s.productId ?? '') === line.productId &&
      String(s.variantId ?? '') === String(line.variantId ?? '') &&
      Number(s.quantity) === line.quantity &&
      Number(s.unitPrice) === line.unitPrice
    );
  });
}

/**
 * May a half-written order be resumed by this request?
 *
 * Only if it is the same charge so far: every line already stored equals this
 * request's line *at its position*, the currency agrees, and the total the
 * first attempt recorded (written before any line) is this request's total —
 * which is what catches a retry that *added* a line to a reused id.
 */
export function canResume(
  payload: Pick<OrderPayload, 'lines' | 'currency'>,
  stored: {
    currency: string | null;
    total: number | null;
    lines: Array<{
      productId: string | null;
      variantId: string | null;
      quantity: number | null;
      unitPrice: number | null;
      position?: number | null;
    }>;
  },
  plannedTotal: number
): boolean {
  if (
    payload.currency &&
    stored.currency &&
    normalizeCode(payload.currency) !== normalizeCode(stored.currency)
  )
    return false;
  if (stored.total !== null && Number.isFinite(stored.total) && stored.total !== plannedTotal)
    return false;
  return stored.lines.every((s) => {
    const line = payload.lines[Number(s.position ?? -1)];
    return (
      !!line &&
      String(s.productId ?? '') === line.productId &&
      String(s.variantId ?? '') === String(line.variantId ?? '') &&
      Number(s.quantity) === line.quantity &&
      Number(s.unitPrice) === line.unitPrice
    );
  });
}

// ─── the plan: every decision, before any write ─────────────────────────────

export type OrderRefusalCode =
  | 'PRODUCT_NOT_FOUND'
  | 'VARIANT_NOT_FOUND'
  | 'NOT_CHECKOUTABLE'
  | 'VARIANT_REQUIRED';

export interface OrderRefusal {
  ok: false;
  status: 404 | 409;
  code: OrderRefusalCode;
  message: string;
  line: number;
}

export interface PlannedLine {
  position: number;
  productId: string;
  variantId: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  kindOf: string;
  nameSnapshot: string;
  optionLabelSnapshot: string | null;
  skuSnapshot: string | null;
  imageUrlSnapshot: string | null;
  note: string | null;
  /** This line's quantity was more than was left (after earlier lines). */
  oversold: boolean;
  /** How many units of this line the stock did not cover; 0 when it did. */
  shortBy: number;
}

export interface OrderPlan {
  ok: true;
  lines: PlannedLine[];
  subtotal: number;
  /** subtotal + delivery fee. */
  computedTotal: number;
  /** What the order records as charged: `amount` when sent, else computed. */
  total: number;
  oversold: boolean;
  /** Human-readable facts for the order's note — never reasons to refuse. */
  notes: string[];
}


/** Money is stored to the agora; float noise must not open a gap note. */
const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Decide the whole order against the rows the rikma actually has.
 *
 * `products` are raw `matanot` nodes **of this rikma** (the query filters by
 * `projectcreates`, so a foreign id is simply absent); `variants` are raw
 * `product-variant` nodes of this rikma, keyed by id.
 *
 * "Unlimited" is the row's `unlimited` flag — the caller merges it into the
 * attributes when it is deployed (`withFlag`), and a row without it reads the
 * old `-1` (`$lib/shop/stock.ts`). A counted `-1` is a queue of one.
 *
 * Stock is accounted in a running map, so two lines on the same variant (or
 * product) see each other: the second one is oversold if together they ask
 * for more than there was. A product on pre-order (`leadTimeHours > 0`) is
 * never oversold — stock below zero is its production queue (§2.5).
 */
export function planOrder(args: {
  payload: OrderPayload;
  products: Map<string, { id: string | number; attributes?: Record<string, any> | null }>;
  variants: Map<string, { id: string | number; attributes?: Record<string, any> | null }>;
}): OrderPlan | OrderRefusal {
  const { payload, products, variants } = args;
  // The running count of each counted row; `null` = unlimited.
  const remaining = new Map<string, number | null>();
  const notes: string[] = [];
  const lines: PlannedLine[] = [];

  for (let i = 0; i < payload.lines.length; i++) {
    const input = payload.lines[i];
    const node = products.get(input.productId);
    const a = node?.attributes;
    if (!a || productStatusOf(a) !== 'published') {
      return refuse(404, 'PRODUCT_NOT_FOUND', `Product ${input.productId} is not sold by this rikma`, i);
    }
    const pricingMode = pricingModeOf(a);
    const price = pricingMode === 'quote' ? null : num(a.price);
    if (!checkoutOf({ status: 'published', pricingMode, price })) {
      return refuse(
        409,
        'NOT_CHECKOUTABLE',
        `Product ${input.productId} has no fixed price — it cannot be sold in a till (send the buyer to its buyUrl)`,
        i
      );
    }

    let variantNode: { id: string | number; attributes?: Record<string, any> | null } | undefined;
    if (input.variantId) {
      variantNode = variants.get(input.variantId);
      const owner = variantNode?.attributes?.matanot?.data?.id;
      if (!variantNode || String(owner ?? '') !== input.productId) {
        return refuse(
          404,
          'VARIANT_NOT_FOUND',
          `Variant ${input.variantId} is not a variant of product ${input.productId}`,
          i
        );
      }
    } else if (a.hasVariants === true) {
      return refuse(
        409,
        'VARIANT_REQUIRED',
        `Product ${input.productId} is sold by variant — the line needs a variantId`,
        i
      );
    }

    const v = variantNode?.attributes ?? null;
    const name = str(a.name) ?? `#${input.productId}`;
    const n = i + 1;

    if (v && v.active === false) notes.push(`שורה ${n}: הווריאנט כבוי (active=false)`);
    const minOrder = num(a.minOrder);
    const maxOrder = num(a.maxOrder);
    if (minOrder !== null && input.quantity < minOrder)
      notes.push(`שורה ${n}: כמות ${input.quantity} מתחת למינימום ${minOrder}`);
    if (maxOrder !== null && input.quantity > maxOrder)
      notes.push(`שורה ${n}: כמות ${input.quantity} מעל המקסימום ${maxOrder}`);

    // Running stock — a variant's own when the line has one, else the product's.
    const stockKey = v ? `v:${input.variantId}` : `p:${input.productId}`;
    if (!remaining.has(stockKey)) {
      // A variant with no number has 0; a legacy product with none is unlimited.
      const row = v ?? a;
      const quant = num(row.quant) ?? (v || row.unlimited === false ? 0 : LEGACY_UNLIMITED);
      remaining.set(stockKey, countOf({ quant, unlimited: row.unlimited ?? null }));
    }
    const before = remaining.get(stockKey)!;
    const preorder = (num(a.leadTimeHours) ?? 0) > 0;
    let oversold = false;
    let shortBy = 0;
    if (before !== null) {
      oversold = !preorder && input.quantity > before;
      if (oversold) shortBy = input.quantity - Math.max(before, 0);
      remaining.set(stockKey, before - input.quantity);
    }
    if (oversold) notes.push(`שורה ${n}: מכירת-יתר — נותרו ${Math.max(before, 0)}, הוזמנו ${input.quantity}`);

    const optionLabel = v
      ? (str(v.name) ??
        (Array.isArray(v.optionValues)
          ? v.optionValues
              .map((o: any) => str(o?.label) ?? str(o?.value))
              .filter(Boolean)
              .join(' / ') || null
          : null))
      : null;
    const variantPic = v?.pics?.data?.[0] ? { data: v.pics.data[0] } : null;
    const image = imageOf(variantPic) ?? imageOf(a.pic);

    lines.push({
      position: i,
      productId: input.productId,
      variantId: input.variantId,
      quantity: input.quantity,
      unitPrice: input.unitPrice,
      lineTotal: round2(input.unitPrice * input.quantity),
      kindOf: str(a.kindOf) ?? 'total',
      nameSnapshot: name,
      optionLabelSnapshot: optionLabel,
      skuSnapshot: v ? str(v.sku) : null,
      imageUrlSnapshot: image?.url ?? null,
      note: input.note,
      oversold,
      shortBy
    });
  }

  const subtotal = round2(lines.reduce((s, l) => s + l.lineTotal, 0));
  const computedTotal = round2(subtotal + (payload.delivery.fee ?? 0));
  const total = payload.amount ?? computedTotal;
  if (payload.amount !== null && round2(payload.amount) !== computedTotal) {
    notes.push(
      `הסכום שנגבה (${round2(payload.amount)}) שונה מסכום השורות והמשלוח (${computedTotal})`
    );
  }

  return {
    ok: true,
    lines,
    subtotal,
    computedTotal,
    total,
    oversold: lines.some((l) => l.oversold),
    notes
  };
}

function refuse(
  status: 404 | 409,
  code: OrderRefusalCode,
  message: string,
  line: number
): OrderRefusal {
  return { ok: false, status, code, message: `lines[${line}]: ${message}`, line };
}

/** The order's `note`: what the caller wrote, then what the plan noticed. */
export function orderNoteOf(callerNote: string | null, planNotes: string[]): string | null {
  const parts = [callerNote, ...planNotes].filter((p): p is string => !!p && !!p.trim());
  return parts.length ? parts.join('\n').slice(0, MAX_NOTE * 2) : null;
}

// ─── what the storefront reads back ─────────────────────────────────────────

export type OrderStatus = 'pendingPayment' | 'paid' | 'shipped' | 'fulfilled' | 'cancelled';

export interface OrderLineView {
  productId: string | null;
  variantId: string | null;
  quantity: number | null;
  name: string | null;
  optionLabel: string | null;
  unitPrice: number | null;
  saleId: string | null;
}

export interface OrderView {
  orderRef: string;
  /** Our row id — the order number when the storefront sent none. */
  orderId: string | null;
  /** The storefront's own number, as sent in `POST /orders`; null if none. */
  displayNumber: string | null;
  externalId: string | null;
  status: string;
  oversold: boolean;
  total: number | null;
  currency: string | null;
  paidAt: string | null;
  shippedAt: string | null;
  fulfilledAt: string | null;
  /** An arranged order still waiting for its payment lapses then (§5.2). */
  expiresAt: string | null;
  lines: OrderLineView[];
  updatedAt: string | null;
}

/**
 * A raw `order` node (with `lines` and `sales`) → what `GET /orders/{ref}`
 * answers. **No buyer fields** — not the name, phone, email or address: the
 * storefront already has them, and on our side they are for the rikma's
 * members only (§5.6). The function does not read them, so a future field
 * cannot leak by being forgotten in a delete list.
 */
export function toOrderView(node: { id?: string | number; attributes?: Record<string, any> | null }): OrderView | null {
  const a = node?.attributes;
  if (!a || !str(a.ref)) return null;
  const externalId = str(a.externalId);
  const saleByExternalId = new Map<string, string>();
  for (const s of a.sales?.data ?? []) {
    const ext = str(s?.attributes?.externalId);
    if (ext && s?.id != null) saleByExternalId.set(ext, String(s.id));
  }
  const lines = [...(a.lines?.data ?? [])]
    .map((row: any) => row?.attributes ?? {})
    .sort((x: any, y: any) => (num(x.position) ?? 0) - (num(y.position) ?? 0))
    .map((l: any) => {
      const position = num(l.position) ?? 0;
      return {
        productId: l.matanot?.data?.id != null ? String(l.matanot.data.id) : null,
        variantId: l.variant?.data?.id != null ? String(l.variant.data.id) : null,
        quantity: num(l.quantity),
        name: str(l.nameSnapshot),
        optionLabel: str(l.optionLabelSnapshot),
        unitPrice: num(l.unitPrice),
        saleId: externalId
          ? (saleByExternalId.get(lineSaleExternalId(externalId, position)) ?? null)
          : null
      };
    });
  return {
    orderRef: a.ref,
    orderId: node.id != null ? String(node.id) : null,
    displayNumber: str(a.displayNumber),
    externalId,
    status: str(a.status) ?? 'paid',
    oversold: a.oversold === true,
    total: num(a.total),
    currency: str(a.currencyCode),
    paidAt: str(a.paidAt),
    shippedAt: str(a.shippedAt),
    fulfilledAt: str(a.fulfilledAt),
    expiresAt: a.status === 'pendingPayment' ? str(a.expiresAt) : null,
    lines,
    updatedAt: str(a.updatedAt)
  };
}

/** Stored lines in the shape `sameOrder` compares. */
export function storedLinesOf(node: { attributes?: Record<string, any> | null }) {
  return (node?.attributes?.lines?.data ?? []).map((row: any) => {
    const l = row?.attributes ?? {};
    return {
      productId: l.matanot?.data?.id != null ? String(l.matanot.data.id) : null,
      variantId: l.variant?.data?.id != null ? String(l.variant.data.id) : null,
      quantity: num(l.quantity),
      unitPrice: num(l.unitPrice),
      position: num(l.position)
    };
  });
}

/** Has every line of a stored order got its sale? (Else a retry resumes it.) */
export function orderIsComplete(
  node: { attributes?: Record<string, any> | null },
  lineCount: number
): boolean {
  const view = toOrderView(node as any);
  if (!view || view.lines.length < lineCount) return false;
  return view.lines.every((l) => !!l.saleId);
}

// ─── after the order: shipped, fulfilled, cancelled (§3.4) ──────────────────

export type OrderTransition =
  | { kind: 'move'; from: OrderStatus; to: OrderStatus }
  | { kind: 'same'; status: OrderStatus }
  | { kind: 'refused'; code: 'ORDER_CANCELLED' | 'INVALID_TRANSITION' | 'PAYMENT_PENDING'; message: string };

const FORWARD: Record<string, OrderStatus[]> = {
  // An arranged order: the money arrives (`confirmOrderPayment`), or it never
  // does and the order is cancelled / lapses. Nothing ships before it is paid.
  pendingPayment: ['paid', 'cancelled'],
  paid: ['shipped', 'fulfilled', 'cancelled'],
  // A parcel that was sent can still come back as a refund.
  shipped: ['fulfilled', 'cancelled'],
  // A refund after delivery is real life (a return, a fault) — and it is the
  // holder's own money, so it is not refused; the sales say what happened.
  fulfilled: ['cancelled'],
  cancelled: []
};

/**
 * May an order move from `current` to `target`?
 *
 * Asking for the status it already has is `same`, not an error — a storefront
 * that retries "cancel", or two members ticking "shipped" at once, both get
 * the order as it is. Going backwards (fulfilled → shipped) is refused: the
 * timestamps would lie. A cancelled order stays cancelled; a second sale is a
 * second order.
 */
export function transitionOf(current: string | null | undefined, target: OrderStatus): OrderTransition {
  const from = (current ?? 'paid') as OrderStatus;
  if (from === target) return { kind: 'same', status: from };
  if (from === 'cancelled') {
    return {
      kind: 'refused',
      code: 'ORDER_CANCELLED',
      message: 'This order was cancelled — it cannot change any more'
    };
  }
  if (from === 'pendingPayment' && (target === 'shipped' || target === 'fulfilled')) {
    return {
      kind: 'refused',
      code: 'PAYMENT_PENDING',
      message: 'This order is still waiting for its payment — record the payment first'
    };
  }
  if (!(FORWARD[from] ?? []).includes(target)) {
    return {
      kind: 'refused',
      code: 'INVALID_TRANSITION',
      message: `An order that is ${from} cannot become ${target}`
    };
  }
  return { kind: 'move', from, to: target };
}

/** The sale fields a refund decision reads. */
export interface OrderSaleRow {
  id: string;
  externalId: string | null;
  in: number | null;
  unit: number | null;
  note: string | null;
  holderStatus: string | null;
  holderId: string | null;
  splited: boolean;
  inSplit: boolean;
}

export function orderSalesOf(node: { attributes?: Record<string, any> | null }): OrderSaleRow[] {
  return (node?.attributes?.sales?.data ?? []).map((s: any) => {
    const a = s?.attributes ?? {};
    return {
      id: String(s.id),
      externalId: str(a.externalId),
      in: num(a.in),
      unit: num(a.unit),
      note: str(a.note),
      holderStatus: str(a.holderStatus),
      holderId: a.users_permissions_user?.data?.id != null ? String(a.users_permissions_user.data.id) : null,
      splited: a.splited === true,
      inSplit: (a.tosplits?.data ?? []).length > 0
    };
  });
}

/**
 * What a refund does to one of the order's sales.
 *
 * - `reset` — the holder's own self-report, not yet in any split: the holder
 *   corrects it to 0 themself. Reporting "the money is with me" needed nobody's
 *   consent (`holderStatus:'self'`), so reporting "it went back to the buyer"
 *   needs none either. The row stays — amount and units 0, the original in the
 *   note — because history is never deleted.
 * - `afterSplit` — the sale is already part of a split (proposed or approved).
 *   Its amount is what the members are voting on, or already divided, so it is
 *   **not** changed silently: the rikma is told, and settles it the way it
 *   settles anything (§5.4).
 * - `notMine` — someone else's money (`open`/`confirmed`, or another holder).
 *   Correcting it is a claim about their financial state, which only their
 *   consent can make; the rikma is told instead.
 * - `already` — already reset (0/0): a retried cancel does nothing twice.
 */
export type RefundDecision = 'reset' | 'afterSplit' | 'notMine' | 'already';

export function refundDecisionOf(sale: OrderSaleRow, actorId: string): RefundDecision {
  if ((sale.in ?? 0) === 0 && (sale.unit ?? 0) === 0) return 'already';
  if (sale.splited || sale.inSplit) return 'afterSplit';
  if (sale.holderStatus !== 'self' || sale.holderId !== String(actorId)) return 'notMine';
  return 'reset';
}

/** The note a reset sale carries — the amount it had, and why it is 0 now. */
export function refundNoteOf(sale: OrderSaleRow, orderNumber: string, reason: string | null): string {
  const was = `היה ${sale.in ?? 0} עבור ${sale.unit ?? 0}`;
  const why = reason ? ` — ${reason}` : '';
  const prior = sale.note ? `${sale.note}\n` : '';
  return `${prior}בוטל והוחזר לקונה (הזמנה ${orderNumber}; ${was})${why}`.slice(0, 2000);
}

// ─── payment by arrangement (PLAN_SHOP_OPERATIONS §5) ───────────────────────

/** How the money reached the member — what the "payment received" sheet offers. */
export const ARRANGED_METHODS = ['bit', 'paybox', 'transfer', 'cash', 'other'] as const;
export type ArrangedMethod = (typeof ARRANGED_METHODS)[number];

export function arrangedMethodOf(value: unknown): ArrangedMethod | null {
  return ARRANGED_METHODS.includes(value as ArrangedMethod) ? (value as ArrangedMethod) : null;
}

/** When an arranged order created at `fromMs` lapses. */
export function expiresAtOf(fromMs: number, hours: number | null): string {
  const h = hours ?? ARRANGED_EXPIRY_HOURS;
  return new Date(fromMs + h * 3_600_000).toISOString();
}

/**
 * Has a waiting order lapsed? An order with no `expiresAt` never lapses on its
 * own — it waits for a member to confirm or cancel it.
 */
export function hasLapsed(expiresAt: string | null | undefined, nowMs: number): boolean {
  if (!expiresAt) return false;
  const at = Date.parse(expiresAt);
  return Number.isFinite(at) && at <= nowMs;
}

export interface ReceivedSplit {
  /** What each line's sale records, in line order. */
  amounts: number[];
  /** Lines + delivery, at the catalog's prices — what the buyer was asked for. */
  catalogTotal: number;
  received: number;
  /** Less arrived than was asked: a discount given on the phone (H8). */
  under: boolean;
}

/**
 * The money that arrived, spread over the order's lines (§5.2, rule 3).
 *
 * What arrived is what is recorded. At or above the asked total each line
 * keeps its own price — the delivery fee is not a sale, exactly as in a paid
 * order. Below it, the discount is shared by every line *and* the fee in
 * proportion, and the last line takes the agorot rounding left over, so the
 * sales add up to exactly the lines' share of what arrived.
 */
export function splitReceived(received: number, lineTotals: number[], fee: number): ReceivedSplit {
  const subtotal = round2(lineTotals.reduce((s, n) => s + n, 0));
  const catalogTotal = round2(subtotal + Math.max(fee, 0));
  const got = round2(Math.max(received, 0));
  if (got >= catalogTotal || catalogTotal === 0) {
    return { amounts: lineTotals.map(round2), catalogTotal, received: got, under: false };
  }
  const factor = got / catalogTotal;
  const amounts = lineTotals.map((n) => round2(n * factor));
  const target = round2(subtotal * factor);
  const gap = round2(target - amounts.reduce((s, n) => s + n, 0));
  if (gap !== 0 && amounts.length) {
    let i = amounts.length - 1;
    while (i > 0 && amounts[i] === 0) i--;
    amounts[i] = round2(amounts[i] + gap);
  }
  return { amounts, catalogTotal, received: got, under: true };
}

/** The line an order's note gets when its arranged payment is recorded. */
export function arrangedNoteOf(split: ReceivedSplit, method: ArrangedMethod, note: string | null): string {
  const under = split.under ? ` — מתחת למחיר הקטלוג (${split.catalogTotal})` : '';
  const own = note ? `: ${note}` : '';
  return `שולם בתיאום — ${split.received} (${method})${under}${own}`;
}

// ─── webhooks (§5.6) ────────────────────────────────────────────────────────

export const ORDER_WEBHOOK_EVENTS = [
  'order.pendingPayment',
  'order.paid',
  'order.statusChanged',
  'order.oversold',
  'variant.stockChanged'
] as const;
export type OrderWebhookEvent = (typeof ORDER_WEBHOOK_EVENTS)[number];

function flatScopes(scopes: unknown): string[] {
  return Array.isArray(scopes) ? scopes.map((s) => String(s)) : [];
}

/**
 * Who may hear about an order. An empty `webhook_events` list means "every
 * event" — and keys like that already exist for tasks. Order events go only to
 * a key that may read orders anyway (`orders:*`), so a task desk's receiver
 * neither breaks on a new payload nor learns the rikma's sales.
 * `variant.stockChanged` also goes to a catalog key (`products:read`): stock is
 * public on the product, and that is the key a storefront's cache runs on.
 */
export function mayReceive(scopes: unknown, event: OrderWebhookEvent): boolean {
  const s = flatScopes(scopes);
  const orders = s.includes(ORDERS_READ_SCOPE) || s.includes(ORDERS_CREATE_SCOPE);
  if (event === 'variant.stockChanged') return orders || s.includes('products:read');
  return orders;
}

export interface StockChange {
  productId: string;
  variantId: string | null;
  /** The count — below zero is units waiting; `-1` beside `unlimited: true` only. */
  quant: number;
  /** Nothing to count (§2.5). A webhook consumer reads this, never `quant === -1`. */
  unlimited: boolean;
}

/** An order event's body — the public order view, never the buyer. */
export function orderWebhookBody(
  event: OrderWebhookEvent,
  projectId: string,
  view: OrderView,
  at = new Date().toISOString()
): string {
  return JSON.stringify({ event, at, projectId, data: view });
}

export function stockWebhookBody(
  projectId: string,
  change: StockChange,
  at = new Date().toISOString()
): string {
  return JSON.stringify({
    event: 'variant.stockChanged',
    at,
    projectId,
    data: { ...change, changed: ['quant'] }
  });
}
