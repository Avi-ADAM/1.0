/**
 * Running a rikma's storefront from a chat (the MCP tools in
 * `src/mastra/tools/shopCatalogTools.ts`): edit, pictures, options, variants,
 * categories, single and batch creation.
 *
 * No new write path. Every write is one of the actions the seller's own
 * screens use, so the house rules hold by construction:
 *   - `saveProductVariants` (`shopProductEditor.ts`) decides what is a term and
 *     what is operational. Name, description, the product's price, a moved
 *     variant price and a **new** variant on a rikma product go to the
 *     partners as one `editObject` proposal (silence approves it at the
 *     rikma's restime); pictures, stock, SKU, order, a variant switched off and
 *     categories apply at once. A personal product, or a rikma of one, is
 *     sovereign and applies everything.
 *   - `saveProductOptions` writes the rikma's option axes (values are only
 *     ever added — another product may be selling one).
 *   - `createPersonalMatanot` creates the product, as the existing create tool did.
 * Nothing here approves anything; a proposal is returned with its vote link.
 *
 * `StorefrontDeps` is the seam the tests mock: a qid runner and an action
 * runner, both already bound to the caller.
 */

import { axesOfNodes, toEditorProduct, type EditorProduct } from '$lib/shop/productEditor.js';
import type { EditorAxis } from '$lib/shop/variantEditor.js';
import {
  axisDraftsOf,
  buildVariantRows,
  type OptionAxisInput,
  type VariantInput
} from '$lib/shop/mcpProductInput.js';

export const SITE = 'https://www.1lev1.com';

export interface ActOutcome {
  ok: boolean;
  data?: any;
  code?: string;
  message?: string;
}

export interface StorefrontDeps {
  /** A qid on the service token; resolves to the GraphQL `data`, throws on failure. */
  run: (qid: string, vars: Record<string, unknown>) => Promise<any>;
  /** An action as the caller. */
  act: (key: string, params: Record<string, unknown>) => Promise<ActOutcome>;
}

export const voteUrl = (pid: string, decisionId: string) => `${SITE}/moach/${pid}/votes/decision/${decisionId}`;
export const manageUrl = (pid: string) => `${SITE}/moach/${pid}/sales/manage`;
export const editorUrl = (pid: string, productId: string) => `${SITE}/moach/${pid}/sales/manage/products/${productId}`;

/** What one call to `saveProductVariants` came to, in the tools' answer shape. */
export interface SaveOutcome {
  success: boolean;
  message: string;
  /** direct = everything applied; proposal = terms wait for the partners; mixed = the operational part applied, terms wait. */
  applied?: 'direct' | 'proposal' | 'none';
  proposalId?: string | null;
  silenceApprovesAt?: string | null;
  voteUrl?: string | null;
  blocked?: string | null;
  createdVariantIds?: string[];
  updatedVariantIds?: string[];
  code?: string;
  [k: string]: unknown;
}

// ── reads ───────────────────────────────────────────────────────────────────

export async function loadEditorProduct(deps: StorefrontDeps, pid: string, productId: string): Promise<EditorProduct | null> {
  const data = await deps.run('shopEditorProduct', { pid, id: productId });
  return toEditorProduct(data?.matanots?.data?.[0]);
}

export async function loadRikmaAxes(deps: StorefrontDeps, pid: string): Promise<EditorAxis[]> {
  const data = await deps.run('shopEditorRikmaOptions', { pid });
  const rows = (data?.productOptions?.data ?? []).filter((r: any) => r?.attributes?.archived !== true);
  return axesOfNodes(rows);
}

export interface CategoryRow {
  id: string;
  name: string;
  slug: string | null;
  parentId: string | null;
  scope: 'rikma' | 'platform';
}

export async function listCategories(deps: StorefrontDeps, pid: string): Promise<CategoryRow[]> {
  const data = await deps.run('shopRikmaCategories', { pid });
  return (data?.categories?.data ?? [])
    .filter((r: any) => r?.attributes?.active !== false)
    .map((r: any) => ({
      id: String(r.id),
      name: String(r.attributes?.name ?? ''),
      slug: r.attributes?.slug ?? null,
      parentId: r.attributes?.parent?.data?.id != null ? String(r.attributes.parent.data.id) : null,
      scope: r.attributes?.project?.data?.id != null ? 'rikma' : 'platform'
    }));
}

/** The ids that are not stored images — attaching a PDF as a product photo is refused here. */
export async function notImages(deps: StorefrontDeps, ids: string[]): Promise<string[]> {
  if (!ids.length) return [];
  const data = await deps.run('mediaUploadsByIds', { ids });
  const ok = new Set(
    (data?.uploadFiles?.data ?? [])
      .filter((r: any) => /^image\/(jpeg|png|webp)$/i.test(String(r?.attributes?.mime ?? '')))
      .map((r: any) => String(r.id))
  );
  return ids.filter((id) => !ok.has(id));
}

// ── the one write ───────────────────────────────────────────────────────────

const BLOCKED_TEXT: Record<string, string> = {
  OPEN_PROPOSAL:
    'There is already an open proposal on this product, so the new terms were not proposed. Answer that proposal first (vote link), then propose again.',
  VARIANT_TERMS_NOT_READY: 'Variant prices cannot be proposed on this deployment yet; only the operational part was saved.'
};

/**
 * Run `saveProductVariants` and say what happened in words an agent can pass
 * on: what applied now, what went to the partners and when silence approves it.
 */
export async function saveProduct(
  deps: StorefrontDeps,
  pid: string,
  product: EditorProduct,
  params: Record<string, unknown>
): Promise<SaveOutcome> {
  const out = await deps.act('saveProductVariants', { projectId: pid, productId: product.id, ...params });
  if (!out.ok) {
    return { success: false, code: out.code, message: failureText(out, pid, product.id) };
  }
  const d = out.data ?? {};
  const proposal = d.proposal as { decisionId: string | null; deadline: string | null; immediate: boolean } | null;
  const created: string[] = d.created ?? [];
  const updated: string[] = d.updated ?? [];
  const blocked: string | null = d.blocked ?? null;

  if (proposal && !proposal.immediate && proposal.decisionId) {
    return {
      success: true,
      applied: 'proposal',
      proposalId: proposal.decisionId,
      silenceApprovesAt: proposal.deadline,
      voteUrl: voteUrl(pid, proposal.decisionId),
      createdVariantIds: created,
      updatedVariantIds: updated,
      message:
        `Proposed to the rikma's partners (${d.proposed ?? 1} term${(d.proposed ?? 1) === 1 ? '' : 's'}). ` +
        (proposal.deadline ? `If nobody answers, silence approves it at ${proposal.deadline}. ` : '') +
        'You did not approve it on anyone’s behalf: the user can vote, discuss or counter at the vote link. ' +
        'Operational changes in the same call (pictures, stock, SKU, active, categories) are already applied.'
    };
  }
  if (blocked) {
    return {
      success: true,
      applied: created.length || updated.length ? 'direct' : 'none',
      blocked,
      proposalId: null,
      voteUrl: d.openDecisionId ? voteUrl(pid, String(d.openDecisionId)) : null,
      createdVariantIds: created,
      updatedVariantIds: updated,
      message: BLOCKED_TEXT[blocked] ?? `The terms were not proposed (${blocked}).`
    };
  }
  return {
    success: true,
    applied: 'direct',
    proposalId: null,
    createdVariantIds: created,
    updatedVariantIds: updated,
    message: product.sovereign
      ? 'Applied at once — this product is personal (or the rikma has one member), so nothing waits for anyone.'
      : proposal?.immediate
        ? 'Applied at once — the rikma has no other member to ask.'
        : 'Applied at once (operational change).'
  };
}

function failureText(out: ActOutcome, pid: string, productId: string): string {
  switch (out.code) {
    case 'PRODUCT_NOT_FOUND':
      return `Product ${productId} is not a product of rikma ${pid}. listRikmaProducts shows the ids.`;
    case 'PRODUCT_ARCHIVED':
      return 'This product is archived; bring it back in the moach products tab before editing it.';
    case 'DUPLICATE_SKU':
      return `${out.message ?? 'A SKU is already used in this rikma.'} SKUs are unique per rikma — pick another, or omit sku to get a suggested one.`;
    case 'DUPLICATE_VARIANT':
      return `${out.message ?? 'Two variants have the same options.'} Each combination of options is one variant.`;
    case 'PRICING_MODE_IS_TERM':
    case 'INVALID_CATEGORIES':
    case 'INVALID_OPTIONS':
    case 'INVALID_PRICE':
      return out.message ?? 'The values were refused.';
    default:
      return `${out.message ?? 'The change could not be saved.'} You can also make it in the product editor: ${editorUrl(pid, productId)}`;
  }
}

// ── edit (name, description, price, pricing mode, categories) ───────────────

export interface ProductEditInput {
  productId: string;
  name?: string;
  descrip?: string;
  price?: number;
  pricingMode?: 'fixed' | 'estimated' | 'quote';
  categories?: string[];
  reason?: string;
}

export async function proposeProductEdit(deps: StorefrontDeps, pid: string, input: ProductEditInput): Promise<SaveOutcome & { productId: string }> {
  const productId = String(input.productId);
  const fail = (message: string, code?: string) => ({ success: false, productId, message, code });
  if ([input.name, input.descrip, input.price, input.pricingMode, input.categories].every((v) => v === undefined)) {
    return fail('Nothing to change: pass at least one of name, descrip, price, pricingMode, categories.');
  }
  if (input.price !== undefined && !(Number(input.price) >= 0)) return fail('price is 0 or more.');
  const product = await loadEditorProduct(deps, pid, productId);
  if (!product) return fail(`Product ${productId} is not a product of rikma ${pid}. listRikmaProducts shows the ids.`, 'PRODUCT_NOT_FOUND');

  const details: Record<string, unknown> = {};
  if (input.name !== undefined) details.name = input.name;
  if (input.descrip !== undefined) details.descrip = input.descrip;
  const params: Record<string, unknown> = { why: input.reason ?? '' };
  if (Object.keys(details).length) params.details = details;
  if (input.price !== undefined) params.basePrice = Number(input.price);
  if (input.pricingMode !== undefined) params.pricingMode = input.pricingMode;
  if (input.categories !== undefined) params.categories = input.categories;

  const res = await saveProduct(deps, pid, product, params);
  return { ...res, productId, mode: product.sovereign ? 'direct' : 'consent', editorUrl: editorUrl(pid, productId) };
}

// ── pictures ────────────────────────────────────────────────────────────────

export interface ProductImagesInput {
  productId: string;
  coverId?: string | null;
  galleryIds?: string[];
  variants?: Array<{ variantId: string; imageIds: string[] }>;
}

export async function setProductImages(deps: StorefrontDeps, pid: string, input: ProductImagesInput): Promise<SaveOutcome & { productId: string }> {
  const productId = String(input.productId);
  const product = await loadEditorProduct(deps, pid, productId);
  if (!product) return { success: false, productId, message: `Product ${productId} is not a product of rikma ${pid}.`, code: 'PRODUCT_NOT_FOUND' };

  const params: Record<string, unknown> = {};
  const touchesGallery = input.coverId !== undefined || input.galleryIds !== undefined;
  if (touchesGallery) {
    const cover = input.coverId ? String(input.coverId) : product.gallery[0]?.id ?? null;
    const rest = (input.galleryIds ?? product.gallery.slice(1).map((p) => p.id)).map(String).filter((id) => id !== cover);
    params.gallery = [...(cover ? [cover] : []), ...rest];
  }
  if (input.variants?.length) {
    const built = buildVariantRows({
      product,
      rikmaAxes: [],
      inputs: input.variants.map((v) => ({ variantId: v.variantId, imageIds: v.imageIds }))
    });
    if (built.errors.length) return { success: false, productId, message: built.errors.map((e) => e.message).join(' ') };
    params.variants = built.rows;
  }
  const all = [...((params.gallery as string[]) ?? []), ...(input.variants ?? []).flatMap((v) => v.imageIds.map(String))];
  if (!all.length && !touchesGallery) return { success: false, productId, message: 'Pass coverId, galleryIds or variants[].imageIds.' };
  const bad = await notImages(deps, [...new Set(all)]);
  if (bad.length) {
    return {
      success: false,
      productId,
      message: `These ids are not JPG/PNG/WebP pictures in the media library: ${bad.join(', ')}. Upload them first (createUploadSession or uploadMediaFromUrl).`
    };
  }
  if (((params.gallery as string[]) ?? []).length > 12) {
    return { success: false, productId, message: 'A product shows at most 12 pictures (cover included).' };
  }
  const res = await saveProduct(deps, pid, product, params);
  return { ...res, productId, gallery: params.gallery ?? null };
}

// ── options & variants ──────────────────────────────────────────────────────

export async function upsertProductOptions(deps: StorefrontDeps, pid: string, options: OptionAxisInput[]) {
  const out = await deps.act('saveProductOptions', { projectId: pid, axes: axisDraftsOf(options) });
  if (!out.ok) {
    return {
      success: false,
      code: out.code,
      message: `${out.message ?? 'The options were not saved.'} Each option needs a name and at least one value; up to 3 options of up to 30 values.`
    };
  }
  const axes = await loadRikmaAxes(deps, pid);
  return {
    success: true,
    optionIds: out.data?.optionIds ?? [],
    options: axes.map((a) => ({ optionId: a.optionId, key: a.key, name: a.name, values: a.values })),
    message: 'Options saved at once (operational): values are only ever added, never removed — another product may sell them.'
  };
}

export async function upsertProductVariants(
  deps: StorefrontDeps,
  pid: string,
  productId: string,
  variants: VariantInput[],
  extra: Record<string, unknown> = {}
): Promise<SaveOutcome & { productId: string }> {
  const product = await loadEditorProduct(deps, pid, productId);
  if (!product) return { success: false, productId, message: `Product ${productId} is not a product of rikma ${pid}.`, code: 'PRODUCT_NOT_FOUND' };
  const rikmaAxes = await loadRikmaAxes(deps, pid);
  const built = buildVariantRows({ product, rikmaAxes, inputs: variants });
  if (built.errors.length) {
    return {
      success: false,
      productId,
      message: built.errors.map((e) => `variants[${e.index}]: ${e.message}`).join(' '),
      errors: built.errors
    };
  }
  const res = await saveProduct(deps, pid, product, { axes: built.axes, variants: built.rows, ...extra });
  return { ...res, productId };
}

// ── creation ────────────────────────────────────────────────────────────────

export interface CreateProductInput {
  name: string;
  descrip?: string;
  price: number;
  quant?: number;
  kindOf?: string;
  pricingMode?: string;
  picId?: string;
  galleryIds?: string[];
  categories?: string[];
  options?: OptionAxisInput[];
  variants?: VariantInput[];
  location?: unknown;
}

export async function createProduct(deps: StorefrontDeps, pid: string, input: CreateProductInput) {
  const created = await deps.act('createPersonalMatanot', {
    name: String(input.name ?? '').trim(),
    descrip: input.descrip ?? '',
    price: input.price,
    quant: input.quant ?? null,
    kindOf: input.kindOf ?? 'total',
    pricingMode: input.pricingMode ?? 'fixed',
    picId: input.picId ?? input.galleryIds?.[0] ?? null,
    location: input.location ?? null,
    projectId: pid
  });
  if (!created.ok) return { success: false, code: created.code, message: created.message ?? 'The product was not created.' };
  const productId = String(created.data?.matanotId ?? '');
  const base = {
    productId,
    projectId: pid,
    name: String(input.name).trim(),
    url: `${SITE}/gift/${productId}`,
    editorUrl: editorUrl(pid, productId)
  };

  // Everything past the bare row is a second step on the product that now exists;
  // if it fails, the product stays and the answer says what is missing.
  const follow: Record<string, unknown> = {};
  if (input.options?.length) {
    const opt = await upsertProductOptions(deps, pid, input.options);
    if (!opt.success) return { success: true, partial: true, ...base, message: `Product created, but its options were not saved: ${opt.message}` };
    follow.optionIds = (opt as any).optionIds;
  }
  const gallery = [...new Set([input.picId, ...(input.galleryIds ?? [])].filter(Boolean).map(String))];
  const needsSave = gallery.length > 1 || (input.categories?.length ?? 0) > 0 || (input.variants?.length ?? 0) > 0;
  if (!needsSave) return { success: true, ...base, ...follow, message: 'Product created.' };

  if (gallery.length) {
    const bad = await notImages(deps, gallery);
    if (bad.length) {
      return { success: true, partial: true, ...base, message: `Product created without its gallery: ${bad.join(', ')} are not JPG/PNG/WebP pictures.` };
    }
  }
  const extra: Record<string, unknown> = {};
  if (gallery.length > 1) extra.gallery = gallery.slice(0, 12);
  if (input.categories?.length) extra.categories = input.categories;
  const res = input.variants?.length
    ? await upsertProductVariants(deps, pid, productId, input.variants, extra)
    : await (async () => {
        const product = await loadEditorProduct(deps, pid, productId);
        return product ? { ...(await saveProduct(deps, pid, product, extra)), productId } : { success: false, productId, message: 'The new product could not be read back.' };
      })();
  if (!res.success) return { success: true, partial: true, ...base, ...follow, message: `Product created, but: ${res.message}` };
  return {
    success: true,
    ...base,
    ...follow,
    applied: res.applied,
    proposalId: res.proposalId ?? null,
    silenceApprovesAt: res.silenceApprovesAt ?? null,
    voteUrl: res.voteUrl ?? null,
    createdVariantIds: res.createdVariantIds ?? [],
    message:
      res.applied === 'proposal'
        ? `Product created with its pictures and categories. Its variants are new terms of a rikma product, so they went to the partners: ${res.message}`
        : `Product created. ${res.message}`
  };
}

/** Run items one by one; one failure never stops the rest. */
export async function eachItem<T, R extends { success: boolean }>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>
): Promise<{ results: Array<R & { index: number }>; succeeded: number; failed: number }> {
  const results: Array<R & { index: number }> = [];
  for (let i = 0; i < items.length; i++) {
    let r: R;
    try {
      r = await fn(items[i], i);
    } catch (e: any) {
      console.error('[storefrontAgent] batch item failed:', e);
      r = { success: false, message: e?.message ?? 'This item failed.' } as unknown as R;
    }
    results.push({ ...r, index: i });
  }
  const succeeded = results.filter((r) => r.success).length;
  return { results, succeeded, failed: results.length - succeeded };
}
