/**
 * What an outside agent sends about options and variants, turned into what
 * the seller's editor action (`saveProductVariants`) takes.
 *
 * The editor's action wants the whole row: a variant sent without its option
 * values would be saved as a variant of nothing. An agent, though, says
 * "M / red, 4 in stock" or "variant 812: unlimited". So this module:
 *   - reads option values the way people write them — `{ size: "M" }` or
 *     `[{ key: "size", value: "m" }]`, by key or by the axis name, by value or
 *     by its label;
 *   - finds the row it means (by variantId, else by the same options — an
 *     upsert) and starts from the stored row, so only what the agent named
 *     moves;
 *   - passes the rikma's whole axis for every axis it touches, so writing the
 *     axis back (upsertRikmaOptions) never drops a value another product sells.
 *
 * Pure — no Strapi, no zod. The decision of what is a term and what applies
 * at once stays where it was made (`planVariantSave`), never here.
 */

import { slugOf, suggestSku, type EditorAxis } from './variantEditor.js';
import type { EditorProduct } from './productEditor.js';

export type OptionValuesInput = Record<string, string> | Array<{ key: string; value: string }>;

export interface VariantInput {
  variantId?: string | null;
  sku?: string | null;
  optionValues?: OptionValuesInput;
  name?: string | null;
  /** null = the product's price. */
  price?: number | null;
  compareAtPrice?: number | null;
  /** -1 = unlimited. */
  quant?: number | null;
  active?: boolean;
  position?: number;
  imageIds?: string[];
}

export interface OptionAxisInput {
  name: string;
  key?: string;
  values: Array<string | { label: string; value?: string; hex?: string | null }>;
}

/** The editor action's row (`saveProductVariants` → `variantFrom`). */
export interface VariantRowOut {
  id: string | null;
  optionValues: Array<{ key: string; value: string }>;
  name?: string;
  sku: string;
  price: number | null;
  compareAtPrice: number | null;
  quant: number;
  unlimited: boolean;
  active: boolean;
  position: number;
  picIds: string[];
}

const lower = (s: unknown) => String(s ?? '').trim().toLowerCase();

/** `upsertProductOptions` input → the editor's axis draft (normaliseAxes cleans the rest). */
export function axisDraftsOf(options: OptionAxisInput[]): Array<{ key?: string; name: string; values: Array<{ value?: string; label: string; hex: string | null }> }> {
  return (options ?? []).map((o) => ({
    key: o.key ? slugOf(o.key) : undefined,
    name: String(o.name ?? '').trim(),
    values: (o.values ?? []).map((v) =>
      typeof v === 'string'
        ? { label: v.trim(), value: undefined, hex: null }
        : { label: String(v.label ?? v.value ?? '').trim(), value: v.value ? slugOf(v.value) : undefined, hex: v.hex ?? null }
    )
  }));
}

function findAxis(axes: EditorAxis[], key: string): EditorAxis | undefined {
  const k = slugOf(key);
  return axes.find((a) => a.key === k) ?? axes.find((a) => lower(a.name) === lower(key));
}

/**
 * `{ size: "M" }` → `[{ key: "size", value: "m" }]` against the rikma's axes;
 * or a sentence saying which axis/value does not exist.
 */
export function resolveOptionValues(
  input: OptionValuesInput | undefined,
  axes: EditorAxis[]
): { pairs: Array<{ key: string; value: string }>; error: string | null } {
  const entries: Array<[string, string]> = Array.isArray(input)
    ? input.map((p) => [String(p?.key ?? ''), String(p?.value ?? '')])
    : Object.entries(input ?? {}).map(([k, v]) => [k, String(v ?? '')]);
  const pairs: Array<{ key: string; value: string }> = [];
  for (const [key, raw] of entries) {
    const axis = findAxis(axes, key);
    if (!axis) {
      return { pairs: [], error: `The rikma has no option "${key}". Add it with upsertProductOptions first (known: ${axes.map((a) => a.key).join(', ') || 'none'}).` };
    }
    const v = slugOf(raw);
    const hit = axis.values.find((x) => x.value === v) ?? axis.values.find((x) => lower(x.label) === lower(raw));
    if (!hit) {
      return {
        pairs: [],
        error: `"${raw}" is not a value of "${axis.name}". Add it with upsertProductOptions first (values: ${axis.values.map((x) => x.label || x.value).join(', ')}).`
      };
    }
    if (pairs.some((p) => p.key === axis.key)) return { pairs: [], error: `"${axis.name}" is given twice for one variant.` };
    pairs.push({ key: axis.key, value: hit.value });
  }
  return { pairs, error: null };
}

const keyOfPairs = (pairs: Array<{ key: string; value: string }>) =>
  [...pairs]
    .map((p) => `${p.key}:${p.value}`)
    .sort()
    .join('|');

export interface BuiltVariants {
  /** Every axis to pass as `axes` — the product's, plus any the variants use, each whole. */
  axes: EditorAxis[];
  rows: VariantRowOut[];
  /** Per input index: the stored row it updates, or null for a new one. */
  matched: Array<string | null>;
  errors: Array<{ index: number; message: string }>;
}

export function buildVariantRows(args: {
  product: Pick<EditorProduct, 'id' | 'axes' | 'variants'>;
  rikmaAxes: EditorAxis[];
  inputs: VariantInput[];
}): BuiltVariants {
  const { product, rikmaAxes, inputs } = args;
  // The rikma's whole axis wins over the product's subset of it.
  const axisPool: EditorAxis[] = [...rikmaAxes];
  for (const a of product.axes) if (!axisPool.some((x) => x.key === a.key)) axisPool.push(a);

  const usedKeys = new Set(product.axes.map((a) => a.key));
  const rows: VariantRowOut[] = [];
  const matched: Array<string | null> = [];
  const errors: Array<{ index: number; message: string }> = [];
  const seen = new Set<string>();
  let nextPosition = product.variants.reduce((m, v) => Math.max(m, v.position + 1), 0);

  inputs.forEach((input, index) => {
    let stored = input.variantId ? product.variants.find((v) => v.id === String(input.variantId)) : undefined;
    if (input.variantId && !stored) {
      errors.push({ index, message: `Variant ${input.variantId} is not a variant of product ${product.id}.` });
      return;
    }
    let pairs: Array<{ key: string; value: string }>;
    if (input.optionValues !== undefined) {
      const r = resolveOptionValues(input.optionValues, axisPool);
      if (r.error) {
        errors.push({ index, message: r.error });
        return;
      }
      pairs = r.pairs;
    } else if (stored) {
      pairs = stored.optionValues.map((p) => ({ key: p.key, value: p.value }));
    } else {
      errors.push({ index, message: 'A new variant needs optionValues (e.g. { "size": "M", "color": "red" }) or a variantId.' });
      return;
    }
    if (!stored) stored = product.variants.find((v) => keyOfPairs(v.optionValues) === keyOfPairs(pairs));
    const id = stored?.id ?? null;
    const dupKey = id ? `id:${id}` : `opt:${keyOfPairs(pairs)}`;
    if (seen.has(dupKey)) {
      errors.push({ index, message: 'The same variant appears twice in this call.' });
      return;
    }
    seen.add(dupKey);
    for (const p of pairs) usedKeys.add(p.key);

    const unlimited = input.quant === -1 ? true : input.quant != null ? false : (stored?.unlimited ?? false);
    const quant = input.quant != null && input.quant !== -1 ? Math.trunc(Number(input.quant)) : stored && !stored.unlimited ? stored.quant : 0;
    const labels = pairs.map((p) => {
      const axis = axisPool.find((a) => a.key === p.key);
      return { key: p.key, value: p.value, label: axis?.values.find((v) => v.value === p.value)?.label ?? p.value };
    });
    rows.push({
      id,
      optionValues: pairs,
      ...(input.name ? { name: String(input.name) } : stored ? { name: stored.name } : {}),
      sku: input.sku != null && String(input.sku).trim() ? String(input.sku).trim() : (stored?.sku ?? suggestSku(product.id, labels)),
      price: input.price !== undefined ? input.price : (stored?.price ?? null),
      compareAtPrice: input.compareAtPrice !== undefined ? input.compareAtPrice : (stored?.compareAtPrice ?? null),
      quant,
      unlimited,
      active: input.active ?? stored?.active ?? true,
      position: input.position ?? stored?.position ?? nextPosition++,
      picIds: input.imageIds ? input.imageIds.map(String) : (stored?.picIds ?? [])
    });
    matched.push(id);
  });

  const axes = [...usedKeys].map((k) => axisPool.find((a) => a.key === k)).filter((a): a is EditorAxis => !!a);
  return { axes, rows, matched, errors };
}
