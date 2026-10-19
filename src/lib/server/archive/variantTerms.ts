/**
 * A product's variant terms on an `editObject` round
 * (PLAN_SHOP_CUSTOMER_EXPERIENCE §4 principle 6, S4).
 *
 * A new variant, or a variant whose price moves, is a change to the terms of a
 * rikma's product — the same as moving the product's own price, which this
 * Decision already carried. So it rides the same round: `negoarch.variants`,
 * a JSON list of `VariantTerm`s next to `price`. No second voting model; the
 * counter, the silence clock and the lev card are the ones that exist.
 *
 * `negoarch.variants` deploys with `1.0b` on its own day. Until it does, every
 * Decision read must keep working, so the field is only selected once a probe
 * has seen it (`variantTermsLive`) — and the editor refuses to open a price
 * proposal for a variant rather than open one that would silently drop it.
 */

import { deriveProductFields } from '$lib/shop/derived.js';
import { parseVariantTerms, type VariantTerm } from '$lib/shop/variantEditor.js';
import { fields, gqlStr, jsonField, jsonLiteral, numField, run, strField, type Exec } from './gql.js';
import type { ArchiveTarget } from './targets.js';

// ─── is the field there? ────────────────────────────────────────────────────

let live: { at: number; value: boolean } | null = null;
const TTL_MS = 10 * 60 * 1000;

/**
 * Does `negoarch.variants` exist in this Strapi? A GraphQL validation error
 * naming the field is "no" (cached); a transport failure is not an answer and
 * is thrown, so a flaky network can never make a counter rewrite the rounds
 * without the variants they carry.
 */
export async function variantTermsLive(exec: Exec): Promise<boolean> {
  if (live?.value) return true;
  if (live && Date.now() - live.at < TTL_MS) return live.value;
  const res = await exec(
    `{ decisions(pagination: { limit: 1 }, filters: { kind: { eq: "editObject" } }) { data { id attributes { negoarch { variants } } } } }`
  );
  const errors = res?.errors ?? [];
  const value = !errors.length;
  if (!value && !JSON.stringify(errors).includes('variants')) {
    throw new Error(`[archive:variantTermsLive] ${JSON.stringify(errors)}`);
  }
  live = { at: Date.now(), value };
  return value;
}

/** Test seam. */
export function resetVariantTermsProbe(value: boolean | null = null): void {
  live = value === null ? null : { at: Date.now(), value };
}

export { parseVariantTerms };

/** The round fragment's field (`./decision.ts`). */
export function variantsField(terms: VariantTerm[] | null | undefined): string | null {
  return jsonField('variants', terms && terms.length ? terms : null);
}

// ─── the words on the vote ──────────────────────────────────────────────────

const amount = (n: number | null) => (n === null ? '—' : String(Math.round(n * 100) / 100));

/**
 * One line per term, for the proposal's reason and its notification — the lev
 * card shows `why`, and a partner asked to approve a price has to see it.
 */
export function variantTermsSummary(terms: VariantTerm[], lang: 'he' | 'en'): string {
  return terms
    .map((t) =>
      t.kind === 'price'
        ? lang === 'he'
          ? `מחיר ${t.name}: ${amount(t.from)} ← ${amount(t.to)}`
          : `${t.name} price: ${amount(t.from)} → ${amount(t.to)}`
        : lang === 'he'
          ? `וריאציה חדשה: ${t.name}${t.price !== null ? ` · ${amount(t.price)}` : ''}`
          : `New variant: ${t.name}${t.price !== null ? ` · ${amount(t.price)}` : ''}`
    )
    .join('\n');
}

// ─── applying them ──────────────────────────────────────────────────────────

export interface VariantTermsResult {
  created: string[];
  priced: string[];
  skipped: number;
}

const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/**
 * Write the agreed terms. Re-checked against the product *now*, because time
 * passed since the proposal: a combination that meanwhile exists gets the
 * agreed price instead of a twin, a SKU someone else took meanwhile gets a
 * suffix, and a price for a variant that is not this product's is dropped.
 */
export async function applyVariantTerms(
  exec: Exec,
  target: Pick<ArchiveTarget, 'id' | 'projectId'>,
  terms: VariantTerm[]
): Promise<VariantTermsResult> {
  const result: VariantTermsResult = { created: [], priced: [], skipped: 0 };
  if (!terms.length) return result;

  const read = async () =>
    run(
      exec,
      `{ matanot(id: ${gqlStr(target.id)}) { data { id attributes {
        price quant
        options(pagination: { limit: 10 }) { data { attributes { key name position } } }
        variants(pagination: { limit: 100 }) { data { id attributes { sku axisKey price quant active position optionValues } } }
      } } } }`,
      'variants:read'
    );
  const data = await read();
  const a = data?.matanot?.data?.attributes;
  if (!a) throw new Error(`matanot ${target.id} not found`);
  const rows: any[] = a.variants?.data ?? [];
  const byKey = new Map(rows.map((r) => [String(r.attributes?.axisKey ?? ''), String(r.id)]));
  const mine = new Set(rows.map((r) => String(r.id)));

  const taken = new Set<string>();
  if (target.projectId) {
    const skus = await run(
      exec,
      `{ productVariants(filters: { project: { id: { eq: ${gqlStr(target.projectId)} } } }, pagination: { limit: 1000 }) { data { attributes { sku } } } }`,
      'variants:skus'
    ).catch(() => null);
    for (const r of skus?.productVariants?.data ?? []) taken.add(String(r.attributes?.sku ?? '').toLowerCase());
  }
  const freeSku = (sku: string) => {
    let candidate = sku;
    for (let i = 2; taken.has(candidate.toLowerCase()); i++) candidate = `${sku}-${i}`;
    taken.add(candidate.toLowerCase());
    return candidate;
  };

  const setPrice = async (id: string, price: number | null) => {
    if (price === null) return false;
    await run(
      exec,
      `mutation { updateProductVariant(id: ${gqlStr(id)}, data: { price: ${price} }) { data { id } } }`,
      'variants:price'
    );
    return true;
  };

  for (const t of terms) {
    if (t.kind === 'price') {
      if (!mine.has(t.id) || !(await setPrice(t.id, t.to))) result.skipped += 1;
      else result.priced.push(t.id);
      continue;
    }
    const existing = byKey.get(t.axisKey);
    if (existing) {
      if (t.price !== null && (await setPrice(existing, t.price))) result.priced.push(existing);
      else result.skipped += 1;
      continue;
    }
    if (!target.projectId) {
      result.skipped += 1;
      continue;
    }
    const created = await run(
      exec,
      `mutation { createProductVariant(data: { ${fields(
        strField('matanot', target.id),
        strField('project', target.projectId),
        strField('sku', freeSku(t.sku)),
        strField('name', t.name),
        strField('axisKey', t.axisKey),
        `optionValues: ${jsonLiteral(t.optionValues)}`,
        numField('price', t.price),
        numField('compareAtPrice', t.compareAtPrice),
        numField('quant', t.quant),
        'active: true',
        numField('position', t.position)
      )} }) { data { id } } }`,
      'variants:create'
    );
    const id = created?.createProductVariant?.data?.id;
    if (id) {
      result.created.push(String(id));
      byKey.set(t.axisKey, String(id));
    }
  }

  await refreshDerived(exec, target.id).catch((e) =>
    console.warn('[archive] variant terms applied, derived fields not refreshed (the lifecycle will):', e)
  );
  return result;
}

/**
 * Write the product's derived fields from its variants. Strapi's lifecycle
 * does this on every variant write (§2.4); doing it here too means a
 * deployment without the lifecycle still knows the product is sold by
 * variant — `createSale` refuses a sale without one only when `hasVariants`.
 */
export async function refreshDerived(exec: Exec, productId: string): Promise<void> {
  const data = await run(
    exec,
    `{ matanot(id: ${gqlStr(productId)}) { data { id attributes {
      price quant
      options(pagination: { limit: 10 }) { data { attributes { key name position } } }
      variants(pagination: { limit: 100 }) { data { id attributes { price quant active position optionValues } } }
    } } } }`,
    'derived:read'
  );
  const a = data?.matanot?.data?.attributes;
  if (!a) return;
  const rows: any[] = a.variants?.data ?? [];

  // The `unlimited` flag beside each count once it is deployed — otherwise a
  // counted -1 (one unit waiting) would add up as "unlimited" ($lib/shop/stock.ts).
  // Imported here, not at the top: the actions module imports this one.
  const { strapiClient } = await import('$lib/server/actions/index.js');
  const { readStockFlags, withFlag } = await import('$lib/server/shop/stockFlags.js');
  const flags = await readStockFlags((qid, vars) => strapiClient.execute(qid, vars), {
    variantIds: rows.map((v) => String(v.id)),
    productIds: [productId]
  }).catch(() => null);
  const live = flags?.live === true;

  const d = deriveProductFields(
    live ? withFlag({ price: a.price, quant: a.quant }, flags!.products.get(String(productId))) : { price: a.price, quant: a.quant },
    rows.map((v) => (live ? withFlag(v.attributes, flags!.variants.get(String(v.id))) : (v.attributes ?? {}))),
    (a.options?.data ?? []).map((o: any) => o.attributes ?? {})
  );
  await run(
    exec,
    `mutation { updateMatanot(id: ${gqlStr(productId)}, data: { ${fields(
      `hasVariants: ${d.hasVariants}`,
      d.priceMin === null ? 'priceMin: null' : numField('priceMin', num(d.priceMin)),
      d.priceMax === null ? 'priceMax: null' : numField('priceMax', num(d.priceMax)),
      numField('stockTotal', d.stockTotal),
      live ? `stockUnlimited: ${d.stockUnlimited}` : null,
      `variantAxes: ${jsonLiteral(d.variantAxes)}`
    )} }) { data { id } } }`,
    'derived:write'
  );
}
