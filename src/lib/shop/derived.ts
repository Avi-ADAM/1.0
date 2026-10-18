/**
 * A product's derived shop fields, from its variants (PLAN_SHOP_CUSTOMER_EXPERIENCE §2.4).
 *
 * The authoritative writer is Strapi — the lifecycles in `1.0b`
 * (`src/api/product-variant/content-types/product-variant/derive.js`), because
 * `quant` and `price` are written from too many paths for the app to keep
 * them straight. This is the same function for the two places the app needs
 * the answer before Strapi gives it: the editor's preview, and the save that
 * writes them once more so a deployment without the lifecycle is not left
 * with a product that sells without its variant. `derived.test.ts` loads the
 * Strapi copy when the sibling repo is checked out and holds the two equal.
 */

export const UNLIMITED = -1;

export interface DerivedAxis {
  key: string;
  name: string;
  values: { value: string; label: string }[];
}

export interface DerivedFields {
  hasVariants: boolean;
  priceMin: number | null;
  priceMax: number | null;
  /** `-1` = unlimited. */
  stockTotal: number;
  variantAxes: DerivedAxis[] | null;
}

export interface DeriveVariant {
  price?: unknown;
  quant?: unknown;
  active?: unknown;
  position?: unknown;
  optionValues?: unknown;
}

const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const text = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);

function optionValuesOf(raw: unknown): any[] {
  let list: unknown = raw;
  if (typeof raw === 'string') {
    try {
      list = JSON.parse(raw);
    } catch {
      list = [];
    }
  }
  return Array.isArray(list) ? list : [];
}

export function deriveProductFields(
  product: { price?: unknown; quant?: unknown },
  variants: DeriveVariant[] | null | undefined,
  options?: Array<{ key?: unknown; name?: unknown; position?: unknown }> | null
): DerivedFields {
  const rows = Array.isArray(variants) ? variants : [];
  const basePrice = num(product?.price);

  if (!rows.length) {
    const q = num(product?.quant);
    return {
      hasVariants: false,
      priceMin: basePrice,
      priceMax: basePrice,
      stockTotal: q === null ? UNLIMITED : q,
      variantAxes: null
    };
  }

  // Variant rows ⇒ sold by variant, even with every one switched off: the
  // product's own stock must never become sellable again under them.
  const active = rows.filter((v) => v && v.active !== false);
  const prices = active
    .map((v) => num(v.price) ?? basePrice)
    .filter((p): p is number => p !== null);

  let stockTotal = 0;
  for (const v of active) {
    const q = num(v.quant);
    if (q === UNLIMITED) {
      stockTotal = UNLIMITED;
      break;
    }
    stockTotal += q ?? 0;
  }

  const names = new Map<string, string>();
  const order = new Map<string, number>();
  (Array.isArray(options) ? options : []).forEach((o, i) => {
    const key = String(o?.key ?? '').trim().toLowerCase();
    if (!key) return;
    const name = text(o?.name);
    if (name) names.set(key, name);
    order.set(key, num(o?.position) ?? i);
  });
  const sorted = [...active].sort((a, b) => (num(a.position) ?? 0) - (num(b.position) ?? 0));
  const axes = new Map<string, DerivedAxis>();
  for (const v of sorted) {
    for (const pair of optionValuesOf(v.optionValues)) {
      const key = String(pair?.key ?? '').trim().toLowerCase();
      const value = String(pair?.value ?? '').trim().toLowerCase();
      if (!key || !value) continue;
      if (!axes.has(key)) axes.set(key, { key, name: names.get(key) ?? key, values: [] });
      const axis = axes.get(key)!;
      if (!axis.values.some((x) => x.value === value)) axis.values.push({ value, label: text(pair?.label) ?? value });
    }
  }
  const variantAxes = [...axes.values()].sort((a, b) => (order.get(a.key) ?? 999) - (order.get(b.key) ?? 999));

  return {
    hasVariants: true,
    priceMin: prices.length ? Math.min(...prices) : null,
    priceMax: prices.length ? Math.max(...prices) : null,
    stockTotal: active.length ? stockTotal : 0,
    variantAxes: variantAxes.length ? variantAxes : null
  };
}
