/**
 * The seller's variant editor — what it decides (PLAN_SHOP_CUSTOMER_EXPERIENCE
 * §2, §4 principle 6, §7 S4).
 *
 * Pure and client-safe: the editor page previews with it and
 * `saveProductVariants` decides with it, so the screen and the server can never
 * disagree about which change waits for the rikma.
 *
 * The one rule the whole module is built around (§4 principle 6): **a price is
 * a term of the product, stock is not.** Counting the shelf, a picture, the
 * order in the picker, hiding a variant — operational, applied at once. A new
 * variant, or a variant whose price moves — a term, and on a product of the
 * rikma it goes to the partners through `editObject`. A personal product, or a
 * rikma of one, is sovereign: everything applies at once.
 *
 * Nothing here deletes. A variant that no combination produces any more is
 * switched off and stays — old orders point at it (§4 principle 3).
 */

export const UNLIMITED = -1;
/** Shopify's limits, and ours: three axes, a hundred variants (the qid's page). */
export const MAX_AXES = 3;
export const MAX_VALUES = 30;
export const MAX_VARIANTS = 100;
export const GALLERY_LIMIT = 12;

export interface AxisValue {
  value: string;
  label: string;
  hex: string | null;
}

export interface EditorAxis {
  /** The rikma's `product-option` row, when the axis already exists. */
  optionId: string | null;
  key: string;
  name: string;
  values: AxisValue[];
}

export interface OptionPair {
  key: string;
  value: string;
  label: string;
}

export interface EditorVariant {
  /** null = not written yet. */
  id: string | null;
  axisKey: string;
  optionValues: OptionPair[];
  name: string;
  sku: string;
  /** null = the product's price. */
  price: number | null;
  compareAtPrice: number | null;
  /** -1 = unlimited. */
  quant: number;
  active: boolean;
  position: number;
  picIds: string[];
}

// ─── identifiers ────────────────────────────────────────────────────────────

/**
 * A key or a value as it is stored and filtered on (`?option.size=m`, the
 * `axisKey`): lower case, letters and digits of any alphabet, `-` between
 * words. `|`, `:` and `=` can never survive — they are the axisKey's syntax.
 */
export function slugOf(text: unknown): string {
  return String(text ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

/** `|color:red|size:m|` — keyed, sorted, with `|` at both ends (§6.2). The twin of `apiPublic/shop.ts`. */
export function axisKeyOf(pairs: Array<{ key: string; value: string }>): string {
  const clean = pairs
    .map((p) => ({
      key: String(p?.key ?? '').trim().toLowerCase(),
      value: String(p?.value ?? '')
        .trim()
        .toLowerCase()
        .replace(/\|/g, '')
        .replace(/:/g, '')
    }))
    .filter((p) => p.key && p.value)
    .sort((a, b) => a.key.localeCompare(b.key));
  if (!clean.length) return '';
  return `|${clean.map((p) => `${p.key}:${p.value}`).join('|')}|`;
}

/** "M / אדום" — the labels, in the axes' order. */
export function labelOf(pairs: OptionPair[]): string {
  return pairs.map((p) => p.label || p.value).filter(Boolean).join(' / ');
}

/** A starting SKU the seller can overwrite: `P1842-M-RED`. */
export function suggestSku(productId: string | null, pairs: OptionPair[]): string {
  const tail = pairs.map((p) => p.value.toUpperCase()).join('-');
  return `${productId ? `P${productId}` : 'NEW'}${tail ? `-${tail}` : ''}`.slice(0, 60);
}

// ─── axes ───────────────────────────────────────────────────────────────────

export type AxisError = 'axisName' | 'axisDuplicate' | 'axisNoValues' | 'tooManyAxes' | 'tooManyValues';

/**
 * Clean what the seller typed: names trimmed, keys derived when missing,
 * duplicate values merged (`M` and `m` are one choice for a shopper), empty
 * values dropped. Errors are the ones a save must refuse.
 */
export function normaliseAxes(input: Array<Partial<EditorAxis>>): { axes: EditorAxis[]; errors: AxisError[] } {
  const errors = new Set<AxisError>();
  const axes: EditorAxis[] = [];
  const keys = new Set<string>();
  for (const raw of input ?? []) {
    const name = String(raw?.name ?? '').trim();
    const key = slugOf(raw?.key || name);
    if (!name || !key) {
      errors.add('axisName');
      continue;
    }
    if (keys.has(key)) {
      errors.add('axisDuplicate');
      continue;
    }
    keys.add(key);
    const seen = new Set<string>();
    const values: AxisValue[] = [];
    for (const v of raw?.values ?? []) {
      const label = String(v?.label ?? v?.value ?? '').trim();
      const value = slugOf(v?.value || label);
      if (!value || seen.has(value)) continue;
      seen.add(value);
      const hex = typeof v?.hex === 'string' && /^#[0-9a-f]{3,8}$/i.test(v.hex.trim()) ? v.hex.trim() : null;
      values.push({ value, label: label || value, hex });
    }
    if (!values.length) errors.add('axisNoValues');
    if (values.length > MAX_VALUES) errors.add('tooManyValues');
    axes.push({ optionId: raw?.optionId ? String(raw.optionId) : null, key, name, values });
  }
  if (axes.length > MAX_AXES) errors.add('tooManyAxes');
  return { axes, errors: [...errors] };
}

/** Every combination of the axes' values, in the axes' order. No axes ⇒ none. */
export function combinationsOf(axes: EditorAxis[]): OptionPair[][] {
  const usable = axes.filter((a) => a.values.length);
  if (!usable.length) return [];
  return usable.reduce<OptionPair[][]>(
    (acc, axis) =>
      acc.flatMap((combo) => axis.values.map((v) => [...combo, { key: axis.key, value: v.value, label: v.label }])),
    [[]]
  );
}

// ─── the matrix ─────────────────────────────────────────────────────────────

export interface MatrixResult {
  variants: EditorVariant[];
  /** How many rows the axes add (the "create N variants" button). */
  added: number;
  /** Existing rows no combination produces any more — kept, switched off. */
  retired: number;
  tooMany: boolean;
}

/**
 * The variant table for a set of axes. An existing row whose combination is
 * still produced keeps everything the seller set (price, stock, SKU,
 * pictures) and only picks up renamed labels; a new combination gets a row
 * with the product's price, no stock, and a suggested SKU.
 */
export function buildMatrix(args: {
  axes: EditorAxis[];
  existing: EditorVariant[];
  productId: string | null;
}): MatrixResult {
  const combos = combinationsOf(args.axes);
  const byKey = new Map(args.existing.map((v) => [v.axisKey, v]));
  const produced = new Set<string>();
  let added = 0;
  const variants: EditorVariant[] = combos.map((pairs, i) => {
    const axisKey = axisKeyOf(pairs);
    produced.add(axisKey);
    const old = byKey.get(axisKey);
    if (old) {
      const autoName = !old.name || old.name === labelOf(old.optionValues);
      return { ...old, optionValues: pairs, name: autoName ? labelOf(pairs) : old.name, position: i };
    }
    added += 1;
    return {
      id: null,
      axisKey,
      optionValues: pairs,
      name: labelOf(pairs),
      sku: suggestSku(args.productId, pairs),
      price: null,
      compareAtPrice: null,
      quant: 0,
      active: true,
      position: i,
      picIds: []
    };
  });
  let retired = 0;
  for (const old of args.existing) {
    if (produced.has(old.axisKey)) continue;
    if (old.active) retired += 1;
    variants.push({ ...old, active: false, position: variants.length });
  }
  return { variants, added, retired, tooMany: variants.length > MAX_VARIANTS };
}

// ─── validation ─────────────────────────────────────────────────────────────

export type VariantError =
  | 'skuMissing'
  | 'skuDuplicate'
  | 'skuTaken'
  | 'variantDuplicate'
  | 'priceInvalid'
  | 'stockInvalid'
  | 'tooManyVariants';

export interface VariantIssue {
  index: number;
  code: VariantError;
}

export const validPrice = (p: number | null): boolean => p === null || (Number.isFinite(p) && p >= 0);
/** A count of units, or -1 for unlimited. */
export const validStock = (q: number): boolean => Number.isFinite(q) && (q === UNLIMITED || q >= 0);

/**
 * What a save refuses (§5.7): the same combination twice (`DUPLICATE_VARIANT`),
 * the same SKU twice in the rikma (`DUPLICATE_SKU` — `takenSkus` is every SKU of
 * the rikma's *other* products), a negative price or stock.
 */
export function validateVariants(rows: EditorVariant[], takenSkus: Iterable<string> = []): VariantIssue[] {
  const issues: VariantIssue[] = [];
  const taken = new Set([...takenSkus].map((s) => s.trim().toLowerCase()));
  const skus = new Map<string, number>();
  const keys = new Map<string, number>();
  if (rows.length > MAX_VARIANTS) issues.push({ index: -1, code: 'tooManyVariants' });
  rows.forEach((v, index) => {
    const sku = v.sku.trim().toLowerCase();
    if (!sku) issues.push({ index, code: 'skuMissing' });
    else if (skus.has(sku)) issues.push({ index, code: 'skuDuplicate' });
    else if (taken.has(sku)) issues.push({ index, code: 'skuTaken' });
    if (sku) skus.set(sku, index);
    if (v.axisKey) {
      if (keys.has(v.axisKey)) issues.push({ index, code: 'variantDuplicate' });
      keys.set(v.axisKey, index);
    }
    if (!validPrice(v.price) || !validPrice(v.compareAtPrice)) issues.push({ index, code: 'priceInvalid' });
    if (!validStock(v.quant)) issues.push({ index, code: 'stockInvalid' });
  });
  return issues;
}

// ─── the save plan ──────────────────────────────────────────────────────────

/** A change that waits for the rikma: it rides the `editObject` round (`negoarch.variants`). */
export type VariantTerm =
  | {
      kind: 'create';
      axisKey: string;
      optionValues: OptionPair[];
      name: string;
      sku: string;
      price: number | null;
      compareAtPrice: number | null;
      quant: number;
      position: number;
    }
  | { kind: 'price'; id: string; name: string; from: number | null; to: number | null };

export interface VariantPatch {
  id: string;
  patch: Partial<Pick<EditorVariant, 'sku' | 'name' | 'quant' | 'active' | 'position' | 'compareAtPrice' | 'picIds' | 'optionValues' | 'price'>>;
}

export interface SavePlan {
  /** Written now. */
  creates: EditorVariant[];
  updates: VariantPatch[];
  /** Waiting for the partners. Empty when sovereign. */
  terms: VariantTerm[];
}

const samePrice = (a: number | null, b: number | null) =>
  a === b || (a !== null && b !== null && Math.abs(a - b) < 0.005);
const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);
const samePairs = (a: OptionPair[], b: OptionPair[]) =>
  a.length === b.length && a.every((p, i) => p.key === b[i].key && p.value === b[i].value && p.label === b[i].label);

/**
 * Split the editor's table into what applies now and what waits.
 *
 * `productPrice` decides whether a moved price is a change at all: a variant
 * going from "the product's price" (null) to the same number spelled out
 * changes nothing a buyer pays, so it is written straight through.
 */
export function planVariantSave(args: {
  existing: EditorVariant[];
  desired: EditorVariant[];
  productPrice: number | null;
  sovereign: boolean;
}): SavePlan {
  const byId = new Map(args.existing.filter((v) => v.id).map((v) => [v.id as string, v]));
  const plan: SavePlan = { creates: [], updates: [], terms: [] };

  for (const v of args.desired) {
    const old = v.id ? byId.get(v.id) : undefined;
    if (!old) {
      if (args.sovereign) plan.creates.push({ ...v, id: null });
      else
        plan.terms.push({
          kind: 'create',
          axisKey: v.axisKey,
          optionValues: v.optionValues,
          name: v.name,
          sku: v.sku.trim(),
          price: v.price,
          compareAtPrice: v.compareAtPrice,
          quant: v.quant,
          position: v.position
        });
      continue;
    }

    const patch: VariantPatch['patch'] = {};
    if (v.sku.trim() !== old.sku) patch.sku = v.sku.trim();
    if (v.name !== old.name) patch.name = v.name;
    if (v.quant !== old.quant) patch.quant = v.quant;
    if (v.active !== old.active) patch.active = v.active;
    if (v.position !== old.position) patch.position = v.position;
    if (!samePrice(v.compareAtPrice, old.compareAtPrice)) patch.compareAtPrice = v.compareAtPrice;
    if (!sameList(v.picIds, old.picIds)) patch.picIds = v.picIds;
    if (!samePairs(v.optionValues, old.optionValues)) patch.optionValues = v.optionValues;

    if (!samePrice(v.price, old.price)) {
      const before = old.price ?? args.productPrice;
      const after = v.price ?? args.productPrice;
      if (args.sovereign || samePrice(before, after)) patch.price = v.price;
      else plan.terms.push({ kind: 'price', id: old.id as string, name: v.name || old.name, from: before, to: after });
    }

    if (Object.keys(patch).length) plan.updates.push({ id: old.id as string, patch });
  }
  return plan;
}

// ─── the round's payload ────────────────────────────────────────────────────

const numOrNull = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const s = (v: unknown, max = 120): string => String(v ?? '').trim().slice(0, max);

/**
 * `negoarch.variants` as read back from Strapi — JSON somebody else may have
 * written, so every entry is rebuilt field by field and anything malformed is
 * dropped rather than applied.
 */
export function parseVariantTerms(raw: unknown): VariantTerm[] {
  let list: unknown = raw;
  if (typeof raw === 'string') {
    try {
      list = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(list)) return [];
  const out: VariantTerm[] = [];
  for (const t of list) {
    if (t?.kind === 'price' && t.id != null) {
      const to = numOrNull(t.to);
      if (to !== null && to < 0) continue;
      out.push({ kind: 'price', id: String(t.id), name: s(t.name), from: numOrNull(t.from), to });
    } else if (t?.kind === 'create') {
      const optionValues: OptionPair[] = (Array.isArray(t.optionValues) ? t.optionValues : [])
        .map((p: any) => ({ key: slugOf(p?.key), value: slugOf(p?.value), label: s(p?.label) || slugOf(p?.value) }))
        .filter((p: OptionPair) => p.key && p.value);
      const axisKey = axisKeyOf(optionValues);
      const sku = s(t.sku, 60);
      const price = numOrNull(t.price);
      const quant = numOrNull(t.quant) ?? 0;
      if (!axisKey || !sku || !validPrice(price) || !validStock(quant)) continue;
      out.push({
        kind: 'create',
        axisKey,
        optionValues,
        name: s(t.name) || labelOf(optionValues),
        sku,
        price,
        compareAtPrice: numOrNull(t.compareAtPrice),
        quant,
        position: numOrNull(t.position) ?? 0
      });
    }
  }
  return out;
}

/**
 * The terms the editor still shows as "waiting": a price waiting on a variant
 * the seller sees, a new variant drawn in the table as a pending row.
 */
export function pendingByVariant(terms: VariantTerm[]): {
  prices: Map<string, number | null>;
  creates: Extract<VariantTerm, { kind: 'create' }>[];
} {
  const prices = new Map<string, number | null>();
  const creates: Extract<VariantTerm, { kind: 'create' }>[] = [];
  for (const t of terms) {
    if (t.kind === 'price') prices.set(t.id, t.to);
    else creates.push(t);
  }
  return { prices, creates };
}

// ─── gallery ────────────────────────────────────────────────────────────────

/** Ids in the seller's order, no repeats, at most twelve; the first is the cover. */
export function galleryIds(ids: Array<string | number | null | undefined>): string[] {
  const out: string[] = [];
  for (const id of ids) {
    const v = id == null ? '' : String(id).trim();
    if (!v || out.includes(v)) continue;
    out.push(v);
    if (out.length === GALLERY_LIMIT) break;
  }
  return out;
}

/** Move one picture to a new place (drag, or "make cover" = index 0). */
export function movePicture<T>(list: T[], from: number, to: number): T[] {
  if (from < 0 || from >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(Math.max(0, Math.min(to, next.length)), 0, item);
  return next;
}
