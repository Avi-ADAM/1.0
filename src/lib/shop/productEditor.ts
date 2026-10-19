/**
 * The product editor's page model (PLAN_SHOP_CUSTOMER_EXPERIENCE §7 S4) — the
 * Strapi row turned into what the screen draws, once, with a test. Pure and
 * client-safe; the loader is `$lib/server/shop/productEditor.ts`.
 */
import {
  axisKeyOf,
  labelOf,
  slugOf,
  type AxisValue,
  type EditorAxis,
  type EditorVariant,
  type OptionPair,
  type VariantTerm
} from './variantEditor';
import { countOf, isUnlimited } from './stock';

export interface EditorPicture {
  id: string;
  url: string;
  thumb: string;
  width: number | null;
  height: number | null;
  alt: string | null;
}

export interface EditorRow extends EditorVariant {
  pictures: EditorPicture[];
}

/** An open edit proposal on the product — what the side panel says (canvas "DesktopProduct"). */
export interface PendingEdit {
  decisionId: string;
  /** null when the proposal does not move the base price. */
  basePrice: number | null;
  terms: VariantTerm[];
  deadline: string | null;
  signed: number;
  members: number;
}

export interface EditorProduct {
  id: string;
  name: string;
  price: number | null;
  pricingMode: string | null;
  quant: number | null;
  origin: 'project' | 'personal' | 'wish';
  /** Personal product, or a rikma of one: nothing waits for anyone (§4 principle 6). */
  sovereign: boolean;
  members: number;
  archived: boolean;
  gallery: EditorPicture[];
  axes: EditorAxis[];
  variants: EditorRow[];
  lowStockAt: number | null;
  /** An archive/edit proposal already open — a second one is refused until it is answered. */
  openDecisionId: string | null;
  pending: PendingEdit | null;
}

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);
const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export function pictureOf(node: any): EditorPicture | null {
  const a = node?.attributes;
  const url = str(a?.url);
  if (node?.id == null || !url) return null;
  const f = a?.formats ?? {};
  const thumb = str(f.small?.url) ?? str(f.thumbnail?.url) ?? url;
  return { id: String(node.id), url, thumb, width: num(a?.width), height: num(a?.height), alt: str(a?.alternativeText) };
}

/** Cover first (`pic`), then the gallery (`pics`), each picture once. */
export function galleryOfNode(pic: any, pics: any): EditorPicture[] {
  const out: EditorPicture[] = [];
  for (const node of [pic?.data, ...(pics?.data ?? [])]) {
    const p = pictureOf(node);
    if (p && !out.some((x) => x.id === p.id)) out.push(p);
  }
  return out.slice(0, 12);
}

function pairsOf(raw: unknown): OptionPair[] {
  let list: unknown = raw;
  if (typeof raw === 'string') {
    try {
      list = JSON.parse(raw);
    } catch {
      list = [];
    }
  }
  if (!Array.isArray(list)) return [];
  return list
    .map((p: any) => ({ key: slugOf(p?.key), value: slugOf(p?.value), label: str(p?.label) ?? slugOf(p?.value) }))
    .filter((p) => p.key && p.value);
}

export function axesOfNodes(nodes: any[]): EditorAxis[] {
  return [...(nodes ?? [])]
    .sort((x, y) => (num(x?.attributes?.position) ?? 0) - (num(y?.attributes?.position) ?? 0))
    .map((o: any) => {
      const a = o?.attributes ?? {};
      const values: AxisValue[] = [...(a.values ?? [])]
        .sort((x: any, y: any) => (num(x?.position) ?? 0) - (num(y?.position) ?? 0))
        .map((v: any) => ({ value: slugOf(v?.value), label: str(v?.label) ?? slugOf(v?.value), hex: str(v?.hex) }))
        .filter((v) => v.value);
      return { optionId: o?.id != null ? String(o.id) : null, key: slugOf(a.key), name: str(a.name) ?? slugOf(a.key), values };
    })
    .filter((a) => a.key);
}

/**
 * The axes a product's variants actually use, in the product's axis order —
 * an axis linked to the product but carrying a value no variant uses still
 * shows that value (the seller added it and has not generated yet).
 */
export function productAxesOf(linked: EditorAxis[], rows: EditorVariant[]): EditorAxis[] {
  const axes = linked.map((a) => ({ ...a, values: [...a.values] }));
  for (const v of rows) {
    for (const p of v.optionValues) {
      let axis = axes.find((a) => a.key === p.key);
      if (!axis) {
        axis = { optionId: null, key: p.key, name: p.key, values: [] };
        axes.push(axis);
      }
      if (!axis.values.some((x) => x.value === p.value)) axis.values.push({ value: p.value, label: p.label, hex: null });
    }
  }
  return axes;
}

export function rowOfNode(node: any): EditorRow | null {
  const a = node?.attributes;
  if (!a || node?.id == null) return null;
  const optionValues = pairsOf(a.optionValues);
  const pictures = (a.pics?.data ?? []).map(pictureOf).filter((p: EditorPicture | null): p is EditorPicture => !!p);
  // The flag when the loader merged it in (`withFlag`), the legacy `-1` when not.
  const stock = { quant: a.quant ?? 0, unlimited: typeof a.unlimited === 'boolean' ? a.unlimited : null };
  const unlimited = isUnlimited(stock);
  return {
    id: String(node.id),
    axisKey: str(a.axisKey) ?? axisKeyOf(optionValues),
    optionValues,
    name: str(a.name) ?? labelOf(optionValues),
    sku: str(a.sku) ?? '',
    price: num(a.price),
    compareAtPrice: num(a.compareAtPrice),
    unlimited,
    quant: unlimited ? 0 : (countOf(stock) ?? 0),
    active: a.active !== false,
    position: num(a.position) ?? 0,
    picIds: pictures.map((p: EditorPicture) => p.id),
    pictures
  };
}

export function toEditorProduct(
  node: any,
  extras: { lowStockAt?: number | null; pending?: PendingEdit | null } = {}
): EditorProduct | null {
  const a = node?.attributes;
  if (!a || node?.id == null) return null;
  const project = a.projectcreates?.data?.[0];
  const members = (project?.attributes?.user_1s?.data ?? []).length;
  const origin = a.origin === 'personal' || a.origin === 'wish' ? a.origin : 'project';
  const rows = (a.variants?.data ?? [])
    .map(rowOfNode)
    .filter((r: EditorRow | null): r is EditorRow => !!r)
    .sort((x: EditorRow, y: EditorRow) => x.position - y.position);
  const decisions = a.archive_decisions?.data ?? [];
  return {
    id: String(node.id),
    name: str(a.name) ?? '',
    price: num(a.price),
    pricingMode: str(a.pricingMode),
    quant: num(a.quant),
    origin,
    sovereign: origin === 'personal' || members <= 1,
    members,
    archived: a.archived === true || a.lifecycle === 'archived',
    gallery: galleryOfNode(a.pic, a.pics),
    axes: productAxesOf(axesOfNodes(a.options?.data ?? []), rows),
    variants: rows,
    lowStockAt: extras.lowStockAt ?? null,
    openDecisionId: decisions.length ? String(decisions[0].id) : null,
    pending: extras.pending ?? null
  };
}
