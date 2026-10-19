/**
 * Shipping — a rikma's delivery zones, their rates, its pickup points, and
 * the one function that prices a cart's delivery from them
 * (docs/inprogress/PLAN_SHOP_SHIPPING.md).
 *
 * Pure and client-safe: the server quotes with it (`/api/v1/r/{rikma}/shipping/quote`,
 * and again when an order is reported), and the shipping tab previews an
 * address with the very same function, so what a member sees while editing is
 * what a buyer is charged.
 *
 * The model is the one the big platforms converged on (Shopify zones + rates,
 * WooCommerce zone order + free-over + per-item cost), with the local parts an
 * Israeli shop needs: a zone by נפה or by יישוב, delivery days per zone, and
 * pickup points with hours.
 *
 * - **Zones are ordered; the first that matches the address wins.** A narrow
 *   zone ("Tel Aviv") above a wide one ("the rest of Israel").
 * - **A zone offers methods** ("courier to the door", "registered post"), each
 *   with a base fee, a cost per extra unit, a cost per kg, optional tiers by
 *   cart value or weight, a free-over threshold, a minimum order, a weight cap,
 *   an ETA and the weekdays it goes out.
 * - **Pickup points are the rikma's, not a zone's** — they need no address.
 * - **A product may narrow the ways** (pickup only, digital) and add a
 *   per-unit surcharge (a bulky item) — `products[]` here, or the product's
 *   own `deliveryOptions` kinds.
 * - Fees are in the rikma's currency.
 */

export const SHIPPING_VERSION = 1;

export type ProductDeliveryKind = 'delivery' | 'pickup' | 'digital';
export type TierBasis = 'none' | 'subtotal' | 'weight';

export interface RateTier {
  /** Inclusive lower bound — of the cart value, or of the weight in kg. */
  from: number;
  fee: number;
}

export interface ShippingMethod {
  id: string;
  name: string;
  fee: number;
  /** Added for every unit after the first. */
  perItem: number;
  /** Added per started kilogram of the cart's weight. */
  perKg: number;
  tiersBy: TierBasis;
  /** When `tiersBy` is set: the tier with the highest `from` ≤ the measure replaces `fee`. */
  tiers: RateTier[];
  /** Cart value at or above which the method's fee is 0 (surcharges stay). */
  freeOver: number | null;
  /** Below this cart value the method is not offered. */
  minSubtotal: number | null;
  /** Above this weight (kg) the method is not offered. */
  maxWeightKg: number | null;
  etaMinDays: number | null;
  etaMaxDays: number | null;
  /** Weekdays it goes out, 0 = Sunday. Empty = any day. */
  days: number[];
  note: string | null;
}

export interface ShippingZone {
  id: string;
  name: string;
  /** Every address — "the rest". Usually the last zone. */
  everywhere: boolean;
  /** ISO 3166-1 alpha-2. Empty = any country (the local lists then decide). */
  countries: string[];
  /** Israeli districts (נפה) by their CBS name — "חיפה", "השרון". */
  districts: string[];
  /** Localities by their CBS name — "תל אביב - יפו". */
  cities: string[];
  /** Postal code prefixes — "61", "4250". */
  postalPrefixes: string[];
  methods: ShippingMethod[];
}

export interface PickupPoint {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
  /** Free text — "א׳–ה׳ 10:00–18:00". */
  hours: string | null;
  note: string | null;
  fee: number;
}

export interface ProductShipping {
  productId: string;
  /** The ways this product may reach a buyer; null = the product's own setting. */
  kinds: ProductDeliveryKind[] | null;
  /** Added to a delivery method's fee for every unit of this product. */
  surcharge: number;
  /** For products without variants (a variant carries its own weight). */
  weightGrams: number | null;
}

export interface ShippingConfig {
  version: number;
  /** Off ⇒ the storefront falls back to each product's own delivery options. */
  enabled: boolean;
  /** Working days between the order and the parcel leaving. */
  handlingDays: number | null;
  zones: ShippingZone[];
  pickupPoints: PickupPoint[];
  products: ProductShipping[];
  /** No zone covers the address ⇒ offer "we will be in touch" instead of nothing. */
  contactFallback: boolean;
  updatedAt: string | null;
  updatedBy: string | null;
}

// ─── reading a stored config (never trust its shape) ────────────────────────

const LIMITS = { zones: 30, methods: 10, tiers: 12, points: 20, products: 500, list: 400 };

const str = (v: unknown, max = 120): string | null =>
  typeof v === 'string' && v.trim() ? v.trim().replace(/\s+/g, ' ').slice(0, max) : null;

const money = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0;
};

const optMoney = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
};

const optInt = (v: unknown, max: number): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= 0 ? Math.min(n, max) : null;
};

function arr(v: unknown): unknown[] {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string' && v.trim().startsWith('[')) {
    try {
      const p = JSON.parse(v);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }
  return [];
}

function strings(v: unknown, max = 80): string[] {
  const out: string[] = [];
  for (const x of arr(v)) {
    const s = str(x, max);
    if (s && !out.includes(s)) out.push(s);
    if (out.length >= LIMITS.list) break;
  }
  return out;
}

/** A short stable id — kept when the stored one is sane, so links to it survive edits. */
export function idOf(v: unknown, prefix: string, i: number): string {
  const s = typeof v === 'string' ? v.trim() : '';
  return /^[a-z0-9_-]{1,40}$/i.test(s) ? s : `${prefix}${i + 1}`;
}

function methodOf(raw: any, i: number): ShippingMethod {
  const tiersBy: TierBasis = raw?.tiersBy === 'subtotal' || raw?.tiersBy === 'weight' ? raw.tiersBy : 'none';
  const tiers = arr(raw?.tiers)
    .map((t: any) => ({ from: optMoney(t?.from) ?? 0, fee: money(t?.fee) }))
    .sort((a, b) => a.from - b.from)
    .filter((t, j, all) => j === 0 || t.from !== all[j - 1].from)
    .slice(0, LIMITS.tiers);
  let etaMin = optInt(raw?.etaMinDays, 90);
  let etaMax = optInt(raw?.etaMaxDays, 90);
  if (etaMin !== null && etaMax !== null && etaMax < etaMin) [etaMin, etaMax] = [etaMax, etaMin];
  return {
    id: idOf(raw?.id, 'm', i),
    name: str(raw?.name, 80) ?? '',
    fee: money(raw?.fee),
    perItem: money(raw?.perItem),
    perKg: money(raw?.perKg),
    tiersBy: tiers.length ? tiersBy : 'none',
    tiers: tiersBy === 'none' ? [] : tiers,
    freeOver: optMoney(raw?.freeOver) || null,
    minSubtotal: optMoney(raw?.minSubtotal) || null,
    maxWeightKg: optMoney(raw?.maxWeightKg) || null,
    etaMinDays: etaMin,
    etaMaxDays: etaMax,
    days: [...new Set(arr(raw?.days).map(Number).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))].sort(),
    note: str(raw?.note, 200)
  };
}

function zoneOf(raw: any, i: number): ShippingZone {
  return {
    id: idOf(raw?.id, 'z', i),
    name: str(raw?.name, 80) ?? '',
    everywhere: raw?.everywhere === true,
    // Validated before any truncation: "Israel" cut to two letters is Iceland.
    countries: strings(raw?.countries, 8)
      .map((c) => c.toUpperCase())
      .filter((c) => /^[A-Z]{2}$/.test(c)),
    districts: strings(raw?.districts),
    cities: strings(raw?.cities),
    postalPrefixes: strings(raw?.postalPrefixes, 10).filter((p) => /^[0-9A-Z -]{1,10}$/i.test(p)),
    methods: uniqueIds(arr(raw?.methods).slice(0, LIMITS.methods).map(methodOf), 'm')
  };
}

function pointOf(raw: any, i: number): PickupPoint {
  return {
    id: idOf(raw?.id, 'p', i),
    name: str(raw?.name, 80) ?? '',
    city: str(raw?.city, 80),
    address: str(raw?.address, 160),
    hours: str(raw?.hours, 160),
    note: str(raw?.note, 200),
    fee: money(raw?.fee)
  };
}

const KINDS: ProductDeliveryKind[] = ['delivery', 'pickup', 'digital'];

function productOf(raw: any): ProductShipping | null {
  const productId = String(raw?.productId ?? '');
  if (!/^\d{1,12}$/.test(productId)) return null;
  const kinds = raw?.kinds == null ? null : KINDS.filter((k) => arr(raw.kinds).includes(k));
  return {
    productId,
    kinds: kinds && kinds.length ? kinds : null,
    surcharge: money(raw?.surcharge),
    weightGrams: optInt(raw?.weightGrams, 10_000_000) || null
  };
}

function uniqueIds<T extends { id: string }>(list: T[], prefix: string): T[] {
  const seen = new Set<string>();
  return list.map((x, i) => {
    let id = x.id;
    for (let n = i + 1; seen.has(id); n++) id = `${prefix}${n}`;
    seen.add(id);
    return id === x.id ? x : { ...x, id };
  });
}

export function emptyShippingConfig(): ShippingConfig {
  return {
    version: SHIPPING_VERSION,
    enabled: false,
    handlingDays: null,
    zones: [],
    pickupPoints: [],
    products: [],
    contactFallback: true,
    updatedAt: null,
    updatedBy: null
  };
}

/** Whatever is stored (or posted) → a config every other function may trust. */
export function normalizeShippingConfig(raw: unknown): ShippingConfig {
  let v: any = raw;
  if (typeof raw === 'string') {
    try {
      v = JSON.parse(raw);
    } catch {
      v = null;
    }
  }
  if (!v || typeof v !== 'object' || Array.isArray(v)) return emptyShippingConfig();
  const products = new Map<string, ProductShipping>();
  for (const p of arr(v.products).slice(0, LIMITS.products)) {
    const row = productOf(p);
    if (row && (row.kinds || row.surcharge || row.weightGrams)) products.set(row.productId, row);
  }
  return {
    version: SHIPPING_VERSION,
    enabled: v.enabled === true,
    handlingDays: optInt(v.handlingDays, 60),
    zones: uniqueIds(arr(v.zones).slice(0, LIMITS.zones).map(zoneOf), 'z'),
    pickupPoints: uniqueIds(arr(v.pickupPoints).slice(0, LIMITS.points).map(pointOf), 'p'),
    products: [...products.values()],
    contactFallback: v.contactFallback !== false,
    updatedAt: str(v.updatedAt, 40),
    updatedBy: str(v.updatedBy, 20)
  };
}

/** What a member must fix before saving — empty when the config is usable. */
export type ConfigProblem =
  | { kind: 'zoneName'; zoneId: string }
  | { kind: 'zoneEmpty'; zoneId: string }
  | { kind: 'zoneNoMethods'; zoneId: string }
  | { kind: 'methodName'; zoneId: string; methodId: string }
  | { kind: 'pointName'; pointId: string }
  | { kind: 'nothingOffered' };

export function configProblems(c: ShippingConfig): ConfigProblem[] {
  const out: ConfigProblem[] = [];
  for (const z of c.zones) {
    if (!z.name) out.push({ kind: 'zoneName', zoneId: z.id });
    const covers = z.everywhere || z.countries.length || z.districts.length || z.cities.length || z.postalPrefixes.length;
    if (!covers) out.push({ kind: 'zoneEmpty', zoneId: z.id });
    if (!z.methods.length) out.push({ kind: 'zoneNoMethods', zoneId: z.id });
    for (const m of z.methods) if (!m.name) out.push({ kind: 'methodName', zoneId: z.id, methodId: m.id });
  }
  for (const p of c.pickupPoints) if (!p.name) out.push({ kind: 'pointName', pointId: p.id });
  if (c.enabled && !c.zones.length && !c.pickupPoints.length) out.push({ kind: 'nothingOffered' });
  return out;
}

// ─── matching an address to a zone ──────────────────────────────────────────

export interface ShippingAddress {
  /** ISO alpha-2; absent = Israel. */
  country?: string | null;
  city?: string | null;
  /** Resolved by the server from the city (CBS list) — never trusted from a buyer. */
  district?: string | null;
  zip?: string | null;
}

/**
 * Hebrew place names arrive spelled many ways: "תל-אביב יפו", "תל אביב - יפו",
 * "ת״א". Compare on letters and single spaces only, with geresh/gershayim and
 * quotes gone.
 */
export function placeKey(s: string | null | undefined): string {
  return (s ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/["'`׳״’”()]/g, '')
    .replace(/[-–—_.,/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** "תל אביב - יפו" is also "תל אביב": the part before a dash is the name people use. */
export function placeKeys(s: string | null | undefined): string[] {
  const full = placeKey(s);
  if (!full) return [];
  const head = placeKey((s ?? '').split(/\s[-–—]\s|\(/)[0]);
  return head && head !== full ? [full, head] : [full];
}

export function zoneMatches(zone: ShippingZone, address: ShippingAddress | null): boolean {
  if (zone.everywhere) return true;
  if (!address) return false;
  const country = (address.country ?? 'IL').toUpperCase();
  if (zone.countries.length && !zone.countries.includes(country)) return false;
  const hasLocal = zone.districts.length + zone.cities.length + zone.postalPrefixes.length > 0;
  if (!hasLocal) return zone.countries.length > 0;
  const cityKeys = placeKeys(address.city);
  if (cityKeys.length && zone.cities.some((c) => placeKeys(c).some((k) => cityKeys.includes(k)))) return true;
  const district = placeKey(address.district);
  if (district && zone.districts.some((d) => placeKey(d) === district)) return true;
  const zip = (address.zip ?? '').replace(/\s+/g, '').toUpperCase();
  if (zip && zone.postalPrefixes.some((p) => zip.startsWith(p.replace(/\s+/g, '').toUpperCase()))) return true;
  return false;
}

export function zoneFor(config: ShippingConfig, address: ShippingAddress | null): ShippingZone | null {
  return config.zones.find((z) => zoneMatches(z, address)) ?? null;
}

// ─── quoting a cart ─────────────────────────────────────────────────────────

export interface QuoteItem {
  productId: string;
  variantId: string | null;
  quantity: number;
  unitPrice: number;
  /** The variant's weight, else the product's; null = not known. */
  weightGrams: number | null;
  /** The kinds the product's own `deliveryOptions` name ([] = says nothing). */
  productKinds: string[];
}

export type OptionKind = 'delivery' | 'pickup' | 'digital' | 'contact';

export interface ShippingOption {
  /** `m:<zone>:<method>` · `p:<point>` · `digital` · `contact` — what the order reports back. */
  id: string;
  kind: OptionKind;
  name: string;
  fee: number;
  /** The method's own fee was waived by its free-over threshold. */
  free: boolean;
  /** How much more would make it free, when that is close enough to say. */
  freeOverRemaining: number | null;
  etaMinDays: number | null;
  etaMaxDays: number | null;
  /** The next day it goes out (YYYY-MM-DD) when the method has fixed days. */
  nextDispatch: string | null;
  note: string | null;
  zone: { id: string; name: string } | null;
  pickupPoint: PickupPoint | null;
}

export interface ShippingQuote {
  options: ShippingOption[];
  zone: { id: string; name: string } | null;
  /** A delivery method could apply, but there is no address to place it yet. */
  needsAddress: boolean;
  /** An address was given and no zone covers it. */
  outsideZones: boolean;
  /** Products that cannot be delivered (pickup/digital only) — why there is no delivery. */
  noDeliveryProducts: string[];
  /** Some units have no weight, and a method prices by weight. */
  weightUnknown: boolean;
  weightKg: number;
  subtotal: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** The kinds a product allows: the shipping tab's override, else its own options, else all. */
export function kindsOf(item: QuoteItem, override: ProductShipping | undefined): ProductDeliveryKind[] {
  if (override?.kinds) return override.kinds;
  const own = KINDS.filter((k) => item.productKinds.includes(k));
  // `contact` alone says nothing about how it travels.
  return own.length ? own : ['delivery', 'pickup'];
}

/** The price of one method for this cart, or null when it is not offered. */
export function methodFee(
  m: ShippingMethod,
  cart: { subtotal: number; units: number; weightKg: number; surcharge: number }
): { fee: number; free: boolean } | null {
  if (m.minSubtotal !== null && cart.subtotal < m.minSubtotal) return null;
  if (m.maxWeightKg !== null && cart.weightKg > m.maxWeightKg) return null;
  let base = m.fee;
  if (m.tiersBy !== 'none' && m.tiers.length) {
    const measure = m.tiersBy === 'subtotal' ? cart.subtotal : cart.weightKg;
    const tier = [...m.tiers].reverse().find((t) => measure >= t.from);
    if (tier) base = tier.fee;
  }
  base += m.perItem * Math.max(0, cart.units - 1);
  base += m.perKg * Math.ceil(cart.weightKg - 1e-9);
  const free = m.freeOver !== null && cart.subtotal >= m.freeOver;
  return { fee: round2((free ? 0 : base) + cart.surcharge), free };
}

/** YYYY-MM-DD of the first allowed weekday on or after `handlingDays` working days. */
export function nextDispatchOf(
  days: number[],
  handlingDays: number | null,
  now: Date,
  timeZone = 'Asia/Jerusalem'
): string | null {
  if (!days.length) return null;
  // "Today" is the shop's, not the server's: 01:00 in Israel is still yesterday in UTC.
  let today: string;
  try {
    today = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  } catch {
    today = now.toISOString().slice(0, 10);
  }
  const d = new Date(`${today}T00:00:00Z`);
  // Working days: Sunday–Thursday, as an Israeli shop counts them.
  let left = handlingDays ?? 0;
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    if (d.getUTCDay() <= 4) left--;
  }
  for (let i = 0; i < 14; i++) {
    if (days.includes(d.getUTCDay())) return d.toISOString().slice(0, 10);
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return null;
}

/**
 * Every way this cart can reach this address, priced. The order is the
 * buyer's menu: delivery methods (cheapest first), then pickup points, then
 * digital, then "we will be in touch" when nothing else is possible.
 */
export function quoteShipping(
  config: ShippingConfig,
  items: QuoteItem[],
  address: ShippingAddress | null,
  now: Date = new Date()
): ShippingQuote {
  const overrides = new Map(config.products.map((p) => [p.productId, p]));
  const subtotal = round2(items.reduce((s, i) => s + i.unitPrice * i.quantity, 0));
  const units = items.reduce((s, i) => s + i.quantity, 0);
  let grams = 0;
  let unknown = false;
  let surcharge = 0;
  const allowed = { delivery: true, pickup: true, digital: true };
  const noDelivery: string[] = [];
  let allDigital = items.length > 0;
  for (const item of items) {
    const o = overrides.get(item.productId);
    const kinds = kindsOf(item, o);
    if (!kinds.includes('delivery')) {
      allowed.delivery = false;
      if (!noDelivery.includes(item.productId)) noDelivery.push(item.productId);
    }
    if (!kinds.includes('pickup')) allowed.pickup = false;
    if (!kinds.includes('digital')) allowed.digital = false;
    if (!(kinds.length === 1 && kinds[0] === 'digital')) allDigital = false;
    const w = item.weightGrams ?? o?.weightGrams ?? null;
    if (w === null) unknown = true;
    else grams += w * item.quantity;
    surcharge += (o?.surcharge ?? 0) * item.quantity;
  }
  const weightKg = round2(grams / 1000);

  const options: ShippingOption[] = [];
  let zoneRef: ShippingQuote['zone'] = null;
  let outsideZones = false;
  let needsAddress = false;
  let weightPriced = false;

  if (allDigital || (allowed.digital && !allowed.delivery && !allowed.pickup)) {
    options.push(plain('digital'));
  } else {
    if (allowed.delivery && config.zones.length) {
      const zone = zoneFor(config, address);
      const hasCity = !!(address && (address.city || address.zip || address.country));
      if (!zone) {
        if (hasCity) outsideZones = true;
        else needsAddress = true;
      } else {
        zoneRef = { id: zone.id, name: zone.name };
        const priced: ShippingOption[] = [];
        for (const m of zone.methods) {
          const r = methodFee(m, { subtotal, units, weightKg, surcharge: round2(surcharge) });
          if (!r) continue;
          if (m.perKg > 0 || m.tiersBy === 'weight' || m.maxWeightKg !== null) weightPriced = true;
          const remaining = !r.free && m.freeOver !== null ? round2(m.freeOver - subtotal) : null;
          priced.push({
            id: `m:${zone.id}:${m.id}`,
            kind: 'delivery',
            name: m.name,
            fee: r.fee,
            free: r.free,
            freeOverRemaining: remaining !== null && remaining > 0 ? remaining : null,
            etaMinDays: m.etaMinDays,
            etaMaxDays: m.etaMaxDays,
            nextDispatch: nextDispatchOf(m.days, config.handlingDays, now),
            note: m.note,
            zone: zoneRef,
            pickupPoint: null
          });
        }
        priced.sort((a, b) => a.fee - b.fee);
        options.push(...priced);
      }
    }
    if (allowed.pickup) {
      for (const p of config.pickupPoints) {
        options.push({
          ...plain('pickup'),
          id: `p:${p.id}`,
          name: p.name,
          fee: p.fee,
          note: p.note,
          pickupPoint: p
        });
      }
    }
    if (!options.length && !needsAddress && config.contactFallback) options.push(plain('contact'));
  }

  return {
    options,
    zone: zoneRef,
    needsAddress,
    outsideZones,
    noDeliveryProducts: noDelivery,
    weightUnknown: unknown && weightPriced,
    weightKg,
    subtotal
  };
}

function plain(kind: OptionKind): ShippingOption {
  return {
    id: kind,
    kind,
    name: '',
    fee: 0,
    free: false,
    freeOverRemaining: null,
    etaMinDays: null,
    etaMaxDays: null,
    nextDispatch: null,
    note: null,
    zone: null,
    pickupPoint: null
  };
}

/** The lowest free-over among every zone's methods — "free shipping over ₪300" on a product page. */
export function lowestFreeOver(config: ShippingConfig): number | null {
  let best: number | null = null;
  for (const z of config.zones)
    for (const m of z.methods) if (m.freeOver !== null && (best === null || m.freeOver < best)) best = m.freeOver;
  return best;
}

/** What an order stores about how it travels (`Order.shipping`). */
export interface OrderShipping {
  optionId: string;
  kind: OptionKind;
  name: string | null;
  zoneId: string | null;
  zoneName: string | null;
  pickupPointId: string | null;
  pickupPointName: string | null;
  pickupAddress: string | null;
  /** What the storefront charged for delivery. */
  fee: number | null;
  /** What 1lev1 prices the same option at now — differs ⇒ the order's note says so. */
  quotedFee: number | null;
  etaMinDays: number | null;
  etaMaxDays: number | null;
  nextDispatch: string | null;
}

export function orderShippingOf(option: ShippingOption | null, optionId: string, fee: number | null): OrderShipping {
  return {
    optionId,
    kind: option?.kind ?? 'contact',
    name: option?.name || null,
    zoneId: option?.zone?.id ?? null,
    zoneName: option?.zone?.name ?? null,
    pickupPointId: option?.pickupPoint?.id ?? null,
    pickupPointName: option?.pickupPoint?.name ?? null,
    pickupAddress: option?.pickupPoint
      ? [option.pickupPoint.address, option.pickupPoint.city].filter(Boolean).join(', ') || null
      : null,
    fee,
    quotedFee: option ? option.fee : null,
    etaMinDays: option?.etaMinDays ?? null,
    etaMaxDays: option?.etaMaxDays ?? null,
    nextDispatch: option?.nextDispatch ?? null
  };
}

/** A stored `Order.shipping` → the shape above, or null. */
export function readOrderShipping(raw: unknown): OrderShipping | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const v = raw as Record<string, unknown>;
  const optionId = str(v.optionId, 100);
  if (!optionId) return null;
  const kind = (['delivery', 'pickup', 'digital', 'contact'] as const).find((k) => k === v.kind) ?? 'contact';
  return {
    optionId,
    kind,
    name: str(v.name, 80),
    zoneId: str(v.zoneId, 40),
    zoneName: str(v.zoneName, 80),
    pickupPointId: str(v.pickupPointId, 40),
    pickupPointName: str(v.pickupPointName, 80),
    pickupAddress: str(v.pickupAddress, 200),
    fee: optMoney(v.fee),
    quotedFee: optMoney(v.quotedFee),
    etaMinDays: optInt(v.etaMinDays, 90),
    etaMaxDays: optInt(v.etaMaxDays, 90),
    nextDispatch: str(v.nextDispatch, 10)
  };
}
