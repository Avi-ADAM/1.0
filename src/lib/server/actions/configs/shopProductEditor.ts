import type { ActionConfig, ActionExecutionHandler, ActionContext } from '../types.js';
import { ActionError } from '../errors.js';
import { scope, scopeList } from '$lib/realtime/scopes.js';
import { execFromContext } from '$lib/server/archive/exec.js';
import { refreshDerived, variantTermsLive } from '$lib/server/archive/variantTerms.js';
import { toEditorProduct, type EditorProduct } from '$lib/shop/productEditor.js';
import { readStockFlags, withFlag, writeStock } from '$lib/server/shop/stockFlags.js';
import {
  axisKeyOf,
  galleryIds,
  labelOf,
  normaliseAxes,
  planVariantSave,
  slugOf,
  validateVariants,
  type EditorAxis,
  type EditorVariant,
  type OptionPair
} from '$lib/shop/variantEditor.js';

/**
 * The seller's product editor (PLAN_SHOP_CUSTOMER_EXPERIENCE §7 S4, canvas
 * "DesktopProduct"): gallery, axes, variants.
 *
 * One save, two speeds (§4 principle 6, decided in `$lib/shop/variantEditor`):
 *   - **operational, at once** — pictures, the cover, stock, SKU, the order in
 *     the picker, a variant switched off, the low-stock level, the axes
 *     themselves (an axis value nobody sells yet changes nothing anyone agreed to);
 *   - **terms, through the partners** — a new variant, or a price that moves (the
 *     product's or a variant's). On a product of the rikma this opens the same
 *     `editObject` the product's price always went through, with the variant
 *     terms on its round (`negoarch.variants`). A personal product, or a rikma
 *     of one, is sovereign and applies everything.
 *
 * Nothing is deleted: a variant the axes no longer produce is switched off and
 * kept, because old orders point at it (§4 principle 3).
 *
 * Every read is fenced to the rikma in the query (`shopEditorProduct` filters
 * by `projectcreates`), so a product id from another rikma is "not found".
 */

type Run = (qid: string, vars: Record<string, unknown>) => Promise<any>;

const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const samePrice = (a: number | null, b: number | null) =>
  a === b || (a !== null && b !== null && Math.abs(a - b) < 0.005);

async function loadProduct(run: Run, projectId: string, productId: string): Promise<EditorProduct> {
  const res = await run('shopEditorProduct', { pid: projectId, id: productId });
  const node = res?.data?.matanots?.data?.[0];
  // Each variant's `unlimited` flag beside its count, once deployed (stockFlags.ts).
  const rows: any[] = node?.attributes?.variants?.data ?? [];
  const flags = rows.length ? await readStockFlags(run, { variantIds: rows.map((v) => String(v.id)) }).catch(() => null) : null;
  if (flags?.live) for (const v of rows) v.attributes = withFlag(v.attributes, flags.variants.get(String(v.id)));
  const product = toEditorProduct(node);
  if (!product) throw new ActionError('PRODUCT_NOT_FOUND', 'No such product in this rikma');
  if (product.archived) throw new ActionError('PRODUCT_ARCHIVED', 'This product is archived');
  return product;
}

function axesFrom(raw: unknown): EditorAxis[] {
  const { axes, errors } = normaliseAxes(Array.isArray(raw) ? raw : []);
  if (errors.length) throw new ActionError('INVALID_OPTIONS', `The options are not valid: ${errors.join(', ')}`, { errors });
  return axes;
}

/**
 * The rikma's axes, written so this product's are in it (§6.1: an axis is the
 * rikma's, not the product's). An existing axis keeps every value it had —
 * another product may be selling it — and gains the new ones. Returns the
 * option ids in the axes' order.
 */
export async function upsertRikmaOptions(run: Run, projectId: string, axes: EditorAxis[]): Promise<string[]> {
  if (!axes.length) return [];
  const res = await run('shopEditorRikmaOptions', { pid: projectId });
  const rows: any[] = res?.data?.productOptions?.data ?? [];
  const byKey = new Map(rows.map((r) => [slugOf(r?.attributes?.key), r]));
  const ids: string[] = [];
  for (const axis of axes) {
    const row = byKey.get(axis.key);
    if (row) {
      const had: any[] = row.attributes?.values ?? [];
      const values = had.map((v: any, i: number) => {
        const mine = axis.values.find((x) => x.value === slugOf(v?.value));
        return {
          value: slugOf(v?.value),
          label: mine?.label ?? v?.label ?? null,
          hex: mine?.hex ?? v?.hex ?? null,
          position: num(v?.position) ?? i
        };
      });
      for (const v of axis.values) {
        if (!values.some((x) => x.value === v.value)) values.push({ value: v.value, label: v.label, hex: v.hex, position: values.length });
      }
      const changed =
        axis.name !== row.attributes?.name ||
        row.attributes?.active === false ||
        values.length !== had.length ||
        values.some((v, i) => v.label !== (had[i]?.label ?? null) || v.hex !== (had[i]?.hex ?? null));
      if (changed) {
        await run('shopOptionUpdate', { id: String(row.id), data: { name: axis.name, active: true, values } });
      }
      ids.push(String(row.id));
    } else {
      // Default locale only — never `locale:` (Strapi i18n: a relation sees the master row).
      const created = await run('shopOptionCreate', {
        data: {
          key: axis.key,
          name: axis.name,
          project: projectId,
          active: true,
          position: rows.length + ids.length,
          values: axis.values.map((v, i) => ({ value: v.value, label: v.label, hex: v.hex, position: i }))
        }
      });
      const id = created?.data?.createProductOption?.data?.id;
      if (!id) throw new ActionError('OPTION_NOT_SAVED', `Option "${axis.name}" was not saved`);
      ids.push(String(id));
      byKey.set(axis.key, { id, attributes: { key: axis.key, name: axis.name, values: axis.values } });
    }
  }
  return ids;
}

/** One row of the editor's table, rebuilt field by field against the product and its axes. */
function variantFrom(raw: any, axes: EditorAxis[], product: EditorProduct): EditorVariant {
  const id = raw?.id != null && raw.id !== '' ? String(raw.id) : null;
  if (id && !product.variants.some((v) => v.id === id)) {
    throw new ActionError('VARIANT_NOT_FOUND', 'No such variant of this product');
  }
  const pairs: OptionPair[] = (Array.isArray(raw?.optionValues) ? raw.optionValues : []).map((p: any) => {
    const key = slugOf(p?.key);
    const value = slugOf(p?.value);
    const axis = axes.find((a) => a.key === key);
    const known = axis?.values.find((v) => v.value === value);
    if (!axis || !known) throw new ActionError('INVALID_OPTIONS', `"${key}:${value}" is not one of this product's options`);
    return { key, value, label: known.label };
  });
  // In the axes' order, so "M / אדום" always reads size first.
  pairs.sort((a, b) => axes.findIndex((x) => x.key === a.key) - axes.findIndex((x) => x.key === b.key));
  const quant = num(raw?.quant);
  const unlimited = raw?.unlimited === true;
  return {
    id,
    axisKey: axisKeyOf(pairs),
    optionValues: pairs,
    name: typeof raw?.name === 'string' && raw.name.trim() ? raw.name.trim().slice(0, 120) : labelOf(pairs),
    sku: String(raw?.sku ?? '').trim().slice(0, 60),
    price: num(raw?.price),
    compareAtPrice: num(raw?.compareAtPrice),
    unlimited,
    quant: unlimited ? 0 : (quant ?? 0),
    active: raw?.active !== false,
    position: num(raw?.position) ?? 0,
    picIds: galleryIds(Array.isArray(raw?.picIds) ? raw.picIds : [])
  };
}

function variantData(v: Partial<EditorVariant>): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  if (v.sku !== undefined) data.sku = v.sku;
  if (v.name !== undefined) data.name = v.name;
  if (v.axisKey !== undefined) data.axisKey = v.axisKey;
  if (v.optionValues !== undefined) data.optionValues = v.optionValues;
  if (v.price !== undefined) data.price = v.price;
  if (v.compareAtPrice !== undefined) data.compareAtPrice = v.compareAtPrice;
  if (v.active !== undefined) data.active = v.active;
  if (v.position !== undefined) data.position = v.position;
  if (v.picIds !== undefined) data.pics = v.picIds;
  return data;
}

const saveVariantsHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const projectId = String(params.projectId);
  const productId = String(params.productId);
  const run: Run = (qid, vars) => strapi.execute(qid, vars, context.jwt, context.fetch);

  const product = await loadProduct(run, projectId, productId);
  const axes = axesFrom(params.axes ?? product.axes);

  // The table as the seller left it; a row the request did not mention stays as it is.
  const incoming = (Array.isArray(params.variants) ? params.variants : []).map((r: any) => variantFrom(r, axes, product));
  const mentioned = new Set(incoming.map((v) => v.id).filter(Boolean));
  const desired = [...incoming, ...product.variants.filter((v) => !mentioned.has(v.id))];

  const skusRes = await run('shopEditorRikmaSkus', { pid: projectId });
  const takenSkus = (skusRes?.data?.productVariants?.data ?? [])
    .filter((v: any) => String(v?.attributes?.matanot?.data?.id ?? '') !== productId)
    .map((v: any) => String(v?.attributes?.sku ?? ''));
  const stored = new Map(product.variants.filter((v) => v.id && !v.unlimited).map((v) => [v.id as string, v.quant]));
  const issues = validateVariants(desired, takenSkus, stored);
  if (issues.length) {
    const code = issues.some((i) => i.code === 'variantDuplicate')
      ? 'DUPLICATE_VARIANT'
      : issues.some((i) => i.code === 'skuDuplicate' || i.code === 'skuTaken')
        ? 'DUPLICATE_SKU'
        : 'INVALID_VARIANTS';
    throw new ActionError(code, 'Some variants cannot be saved', { issues });
  }

  const plan = planVariantSave({
    existing: product.variants,
    desired,
    productPrice: product.price,
    sovereign: product.sovereign
  });

  // The product's own price is a term too (it always went through `editObject`).
  const basePrice = params.basePrice === undefined ? undefined : num(params.basePrice);
  if (basePrice !== undefined && basePrice !== null && basePrice < 0) {
    throw new ActionError('INVALID_PRICE', 'A price is 0 or more');
  }
  const priceMoves = basePrice !== undefined && basePrice !== null && !samePrice(basePrice, product.price);
  const proposeBase = priceMoves && !product.sovereign;
  const needsProposal = plan.terms.length > 0 || proposeBase;

  // What stops the terms from going to the rikma never stops the rest: stock
  // and pictures are saved either way, and the result says why the terms wait.
  let blocked: 'OPEN_PROPOSAL' | 'VARIANT_TERMS_NOT_READY' | null = null;
  if (needsProposal) {
    if (product.openDecisionId) blocked = 'OPEN_PROPOSAL';
    else if (plan.terms.length && !(await variantTermsLive(execFromContext(context)))) blocked = 'VARIANT_TERMS_NOT_READY';
  }

  // ── operational, now ──────────────────────────────────────────────────
  const optionIds = await upsertRikmaOptions(run, projectId, axes);
  const productData: Record<string, unknown> = { options: optionIds };
  if (Array.isArray(params.gallery)) {
    const gallery = galleryIds(params.gallery);
    productData.pic = gallery[0] ?? null;
    productData.pics = gallery;
  }
  if (priceMoves && product.sovereign) productData.price = basePrice;
  await run('shopProductUpdate', { id: productId, data: productData });

  const created: string[] = [];
  for (const v of plan.creates) {
    const res = await run('shopVariantCreate', {
      // A new row is 0 or more, or unlimited (-1): both read right with or without the flag column.
      data: { ...variantData(v), quant: v.unlimited ? -1 : v.quant, matanot: productId, project: projectId }
    });
    const id = res?.data?.createProductVariant?.data?.id;
    if (id) created.push(String(id));
  }
  const updated: string[] = [];
  for (const u of plan.updates) {
    const { stock, ...rest } = u.patch;
    if (Object.keys(rest).length) await run('shopVariantUpdate', { id: u.id, data: variantData(rest) });
    // Stock goes with its flag, so a count of -1 is never written as "unlimited".
    if (stock) await writeStock(run, { variantId: u.id }, stock);
    updated.push(u.id);
  }

  let lowStockSaved: boolean | null = null;
  if (params.lowStockAt !== undefined) {
    const lowStockAt = num(params.lowStockAt);
    try {
      await run('shopProductLowStock', { id: productId, lowStockAt: lowStockAt !== null && lowStockAt >= 0 ? lowStockAt : null });
      lowStockSaved = true;
    } catch (e) {
      console.warn('[saveProductVariants] lowStockAt not saved (not deployed yet?):', (e as Error)?.message ?? e);
      lowStockSaved = false;
    }
  }

  await refreshDerived(execFromContext(context), productId).catch((e) =>
    console.warn('[saveProductVariants] derived fields not refreshed (the lifecycle will):', (e as Error)?.message ?? e)
  );

  // ── terms, through the partners ───────────────────────────────────────
  let proposal: { decisionId: string | null; deadline: string | null; immediate: boolean } | null = null;
  if (needsProposal && !blocked) {
    const { actionService } = await import('$lib/server/actions/index.js');
    const res = await actionService.executeAction(
      'proposeObjectEdit',
      {
        targetKind: 'matanot',
        targetId: productId,
        why: typeof params.why === 'string' ? params.why.trim().slice(0, 500) : '',
        newValues: { ...(proposeBase ? { price: basePrice } : {}), ...(plan.terms.length ? { variants: plan.terms } : {}) }
      },
      context as ActionContext
    );
    if (!res.success) {
      // The operational part is saved; say so, and say why the rest is not on the table.
      throw new ActionError(res.error?.code ?? 'PROPOSAL_FAILED', res.error?.message ?? 'The change could not be proposed', {
        saved: { created, updated }
      });
    }
    proposal = {
      decisionId: res.data?.decisionId ?? null,
      deadline: res.data?.deadline ?? null,
      immediate: res.data?.immediate === true
    };
  }

  return {
    productId,
    created,
    updated,
    proposed: blocked ? 0 : plan.terms.length + (proposeBase ? 1 : 0),
    proposal,
    /** Why the terms did not go to the rikma (the rest is saved). */
    blocked,
    openDecisionId: blocked === 'OPEN_PROPOSAL' ? product.openDecisionId : null,
    lowStockSaved
  };
};

export const saveProductVariantsConfig: ActionConfig = {
  key: 'saveProductVariants',
  description:
    "Save a product from the seller's editor: gallery, options, variants (any rikma member). Stock, pictures, SKU, order and visibility apply at once; a new variant or a moved price goes to the rikma as an editObject proposal unless the product is personal or the rikma has one member.",
  graphqlOperation: saveVariantsHandler,
  paramSchema: {
    projectId: { type: 'string', required: true },
    productId: { type: 'string', required: true },
    axes: { type: 'array', required: false, description: '[{ optionId?, key?, name, values: [{ value?, label, hex? }] }] — default: the product’s own' },
    variants: { type: 'array', required: false, description: '[{ id?, optionValues: [{key,value}], name?, sku, price, compareAtPrice, quant, active, position, picIds }]' },
    gallery: { type: 'array', required: false, description: 'Upload ids in order; the first is the cover. Omit to leave the pictures as they are' },
    basePrice: { type: 'number', required: false, description: 'The product’s own price' },
    lowStockAt: { type: 'number', required: false, description: '“Low stock” below this, per variant; null = no mark' },
    why: { type: 'string', required: false, description: 'The reason, when something goes to the rikma' }
  },
  authRules: [
    { type: 'jwt', errorMessage: 'Must be authenticated to edit a product' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Only rikma members can edit its products'
    }
  ],
  realtime: {
    scopes: (p: Record<string, any>) => scopeList([scope('project', p.projectId), scope('product', p.productId)])
  }
};

const saveOptionsHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const projectId = String(params.projectId);
  const run: Run = (qid, vars) => strapi.execute(qid, vars, context.jwt, context.fetch);
  const axes = axesFrom(params.axes);
  const optionIds = await upsertRikmaOptions(run, projectId, axes);
  return { optionIds };
};

export const saveProductOptionsConfig: ActionConfig = {
  key: 'saveProductOptions',
  description:
    "Add or rename the rikma's product options (size, colour…) and their values (any rikma member). Values are only ever added — another product may be selling one.",
  graphqlOperation: saveOptionsHandler,
  paramSchema: {
    projectId: { type: 'string', required: true },
    axes: { type: 'array', required: true, description: '[{ key?, name, values: [{ value?, label, hex? }] }]' }
  },
  authRules: [
    { type: 'jwt', errorMessage: 'Must be authenticated to edit options' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Only rikma members can edit its options'
    }
  ],
  realtime: {
    scopes: (p: Record<string, any>) => scopeList([scope('project', p.projectId)])
  }
};
