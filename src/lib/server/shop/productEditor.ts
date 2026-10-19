/**
 * What the product editor reads (PLAN_SHOP_CUSTOMER_EXPERIENCE §7 S4).
 *
 * Called from the editor's loader after the moach layout's membership check,
 * so the product, the rikma's axes and SKUs read with the service token, each
 * fenced to the rikma in the query. The open edit proposal is read with the
 * member's own JWT through the archive module — the same reader the vote and
 * the silence clock use, so the panel shows exactly the version on the table.
 */
import { strapiClient } from '$lib/server/actions';
import { execFromContext } from '$lib/server/archive/exec.js';
import { fetchObjectChangeDecision, signersOf, standingOrder, standingRound } from '$lib/server/archive/read.js';
import { axesOfNodes, toEditorProduct, type EditorProduct, type PendingEdit } from '$lib/shop/productEditor.js';
import type { EditorAxis } from '$lib/shop/variantEditor.js';
import { readStockFlags, withFlag } from './stockFlags.js';

type FetchFn = typeof fetch;

export interface ProductEditorResult {
  product: EditorProduct | null;
  /** The rikma's axes, offered back when the seller adds one. */
  rikmaAxes: EditorAxis[];
  /** SKUs of the rikma's *other* products — a SKU is unique per rikma. */
  takenSkus: string[];
  failed?: boolean;
}

const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** The open `editObject` on this product, as the side panel tells it. */
async function pendingEdit(decisionId: string, jwt: string | undefined, fetchFn?: FetchFn): Promise<PendingEdit | null> {
  try {
    const exec = execFromContext({ jwt, fetch: fetchFn });
    const decision = await fetchObjectChangeDecision(exec, decisionId);
    if (!decision || decision.archived || decision.kind !== 'editObject') return null;
    const round = standingRound(decision);
    return {
      decisionId: decision.id,
      basePrice: round.price ?? null,
      terms: round.variants ?? [],
      deadline: decision.timegramaDate,
      signed: signersOf(decision, standingOrder(decision)).length,
      members: decision.memberIds.length
    };
  } catch (e) {
    console.warn('[productEditor] the open proposal could not be read:', (e as Error)?.message ?? e);
    return null;
  }
}

export async function loadProductEditor(
  projectId: string,
  productId: string,
  opts: { jwt?: string; fetch?: FetchFn } = {}
): Promise<ProductEditorResult> {
  const run = (qid: string, vars: Record<string, unknown>) => strapiClient.execute(qid, vars, undefined, opts.fetch);
  let node: any;
  try {
    const res = await run('shopEditorProduct', { pid: projectId, id: productId });
    node = res?.data?.matanots?.data?.[0] ?? null;
  } catch (e) {
    console.error('[productEditor] product failed:', (e as any)?.getMessages?.() ?? e);
    return { product: null, rikmaAxes: [], takenSkus: [], failed: true };
  }
  if (!node) return { product: null, rikmaAxes: [], takenSkus: [] };

  const [optionsRes, skusRes, lowRes] = await Promise.all([
    run('shopEditorRikmaOptions', { pid: projectId }).catch(() => null),
    run('shopEditorRikmaSkus', { pid: projectId }).catch(() => null),
    // `lowStockAt` deploys on its own day; until it does nothing reads "low".
    run('moachShopLowStock', { pid: projectId }).catch(() => null)
  ]);

  const low = (lowRes?.data?.matanots?.data ?? []).find((p: any) => String(p.id) === String(productId));

  // The `unlimited` flag rides beside each variant once it is deployed
  // ($lib/server/shop/stockFlags.ts); until then `-1` reads the legacy way.
  const variantIds = (node.attributes?.variants?.data ?? []).map((v: any) => String(v.id));
  const flags = await readStockFlags(run, { variantIds }).catch(() => null);
  if (flags?.live) {
    for (const v of node.attributes?.variants?.data ?? []) v.attributes = withFlag(v.attributes, flags.variants.get(String(v.id)));
  }
  const decisionId = node.attributes?.archive_decisions?.data?.[0]?.id;
  const pending = decisionId ? await pendingEdit(String(decisionId), opts.jwt, opts.fetch) : null;

  const product = toEditorProduct(node, { lowStockAt: num(low?.attributes?.lowStockAt), pending });
  const rikmaAxes = axesOfNodes(
    (optionsRes?.data?.productOptions?.data ?? []).filter(
      (o: any) => o?.attributes?.active !== false && o?.attributes?.archived !== true
    )
  );
  const takenSkus = (skusRes?.data?.productVariants?.data ?? [])
    .filter((v: any) => String(v?.attributes?.matanot?.data?.id ?? '') !== String(productId))
    .map((v: any) => String(v?.attributes?.sku ?? ''))
    .filter(Boolean);

  return { product, rikmaAxes, takenSkus };
}
