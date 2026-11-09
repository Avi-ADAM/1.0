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
import type { BomStoredLine, BomTerm } from './bomEditor';

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
  /** Recipe lines on the table. */
  bom?: BomTerm[];
  /** Who has signed the version on the table. */
  signedIds?: string[];
  /** Detail terms on the table (null = not moved); the description only says that it moves. */
  details?: {
    name: string | null;
    kindOf: string | null;
    descrip: boolean;
    startDate: string | null;
    endDate: string | null;
  };
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
  /** The description as stored (`Matanot.desc`, rich-text HTML). */
  descrip: string;
  /** How the price is counted: once, per month, per year… (Enum_Matanot_Kindof). */
  kindOf: ProductKind;
  /** The period of a monthly/yearly product (`startDate` / `finnishDate`), ISO. */
  startDate: string | null;
  endDate: string | null;
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
  /** Nothing to count on the product itself (`$lib/shop/stock.ts`). */
  unlimited: boolean;
  oneForeProject: boolean;
  /** The margin an older product was saved with; the form never adds one. */
  marginPct: number;
  location: EditorLocation | null;
  /** The product's missions and resources. */
  recipe: EditorRecipeLine[];
  /** The recipe could not be read, so it is not one to rewrite. */
  recipeLocked: boolean;
  /** A wish product: a version that asks for more waits for its customer's signature. */
  recipeIsDeal: boolean;
}

/** One mission or resource of the product, as the price section lists it. */
export interface EditorRecipeLine extends BomStoredLine {
  /** What the line adds to one unit, in the rikma's currency. */
  cost: number;
  /** Nobody holds it yet. */
  open: boolean;
  /** The running mission or the pmash the line stands for, so it is not offered twice. */
  linkedId: string | null;
}

/** The price is the sum of the lines: the mode whose recipe can be edited. */
export const isCostPriced = (p: Pick<EditorProduct, 'pricingMode' | 'recipe'>): boolean =>
  p.pricingMode === 'estimated' || (p.pricingMode === 'quote' && p.recipe.length > 0);

export const LOCATION_MODES = ['online', 'onsite', 'hybrid', 'unspecified'] as const;
export type LocationMode = (typeof LOCATION_MODES)[number];

export interface EditorLocation {
  location_mode: LocationMode;
  lat: number | null;
  lng: number | null;
  radius: number | null;
  location_hint: string | null;
}

/**
 * A location from anywhere — the stored component, or what the picker sends —
 * rebuilt field by field. Nothing set at all reads as `null`.
 */
export function locationOf(raw: unknown): EditorLocation | null {
  const l = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const mode = (LOCATION_MODES as readonly unknown[]).includes(l.location_mode) ? (l.location_mode as LocationMode) : 'unspecified';
  const lat = num(l.lat);
  const lng = num(l.lng);
  const hasPoint = lat !== null && lng !== null;
  const radius = num(l.radius);
  const hint = str(l.location_hint);
  if (mode === 'unspecified' && !hasPoint && !hint) return null;
  return {
    location_mode: mode,
    lat: hasPoint ? lat : null,
    lng: hasPoint ? lng : null,
    radius: hasPoint && radius !== null ? Math.round(radius) : null,
    location_hint: hint ? hint.slice(0, 200) : null
  };
}

/** The two say the same place. */
export function sameLocation(a: unknown, b: unknown): boolean {
  return JSON.stringify(locationOf(a)) === JSON.stringify(locationOf(b));
}

/** The product's bill of materials, for the price section. An archived resource is not part of it. */
export function recipeOfNode(node: any): EditorRecipeLine[] {
  const a = node?.attributes ?? {};
  const nameOf = (...rels: any[]) => rels.map((r) => str(r?.data?.attributes?.name)).find(Boolean) ?? '';
  const missions = (a.matanot_recipe_missions?.data ?? []).map((m: any): EditorRecipeLine => {
    const x = m?.attributes ?? {};
    const amount = num(x.hoursPerUnit) ?? 0;
    const units = num(x.unitsPerProduct) ?? 1;
    const unit = num(x.ratePerHour) ?? 0;
    return {
      id: `m${m?.id}`,
      kind: 'mission',
      name: nameOf(x.mesimabetahalich, x.pendm),
      amount,
      units,
      unit,
      cost: amount * units * unit,
      open: !x.assignedMember?.data?.id && !x.mesimabetahalich?.data?.id,
      linkedId: x.mesimabetahalich?.data?.id != null ? String(x.mesimabetahalich.data.id) : null
    };
  });
  const resources = (a.matanot_recipe_resources?.data ?? [])
    .filter((r: any) => r?.attributes?.archived !== true)
    .map((r: any): EditorRecipeLine => {
      const x = r?.attributes ?? {};
      const amount = num(x.quantityPerUnit) ?? 0;
      const unit = num(x.pricePerUnit) ?? 0;
      return {
        id: `r${r?.id}`,
        kind: 'resource',
        name: nameOf(x.mashabetahalich, x.pmash),
        amount,
        units: 1,
        unit,
        cost: amount * unit,
        open: !x.assignedMember?.data?.id && !x.mashabetahalich?.data?.id,
        linkedId: x.pmash?.data?.id != null ? String(x.pmash.data.id) : null
      };
    });
  return [...missions, ...resources];
}

/** Unread extras: a recipe nobody could read is not one to rewrite. */
export const isRecipeLocked = (recipeNode: any): boolean => !recipeNode;

/** A wish product's lines are what its customer is billed by (`loadDealDue`). */
export function isRecipeDeal(origin: string | null | undefined, recipeNode: any): boolean {
  return origin === 'wish' || recipeNode?.attributes?.ratson?.data?.id != null;
}

export const PRODUCT_KINDS = ['total', 'monthly', 'yearly', 'unlimited'] as const;
export type ProductKind = (typeof PRODUCT_KINDS)[number] | 'daily';

/** A stored kindOf the editor understands; anything else reads as a one-off price. */
export function kindOfNode(v: unknown): ProductKind {
  return v === 'daily' || (PRODUCT_KINDS as readonly unknown[]).includes(v) ? (v as ProductKind) : 'total';
}

/** What the editor's "details" card sends (dates as `YYYY-MM-DD`, or empty). */
export interface DetailsDraft {
  name?: string;
  descrip?: string;
  kindOf?: string;
  startDate?: string | null;
  endDate?: string | null;
}

/** The changed details, in a `proposeObjectEdit` round's own field names. */
export interface DetailTerms {
  name?: string;
  descrip?: string;
  kindOf?: ProductKind;
  sqadualed?: string | null;
  sqadualedf?: string | null;
}

/**
 * The words of a rich-text description. The editor re-serialises the HTML it
 * was given (`''` comes back as `<p></p>`), so markup alone is not an edit.
 */
const textOf = (html: string): string =>
  html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const dayOf = (v: unknown): string | null => {
  if (typeof v !== 'string' || !v.trim()) return null;
  const d = new Date(v.trim());
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};

/**
 * Only what the seller actually moved. A blank name is not a change (a product
 * keeps its name), and a period only means something on a monthly/yearly product.
 */
export function detailChanges(
  raw: unknown,
  product: Pick<EditorProduct, 'name' | 'descrip' | 'kindOf' | 'startDate' | 'endDate'>
): DetailTerms {
  const d = (raw && typeof raw === 'object' ? raw : {}) as DetailsDraft;
  const out: DetailTerms = {};
  const name = typeof d.name === 'string' ? d.name.trim().slice(0, 120) : '';
  if (name && name !== product.name) out.name = name;
  if (typeof d.descrip === 'string' && textOf(d.descrip) !== textOf(product.descrip)) out.descrip = d.descrip.slice(0, 20000);
  const kind = d.kindOf === undefined ? product.kindOf : kindOfNode(d.kindOf);
  if (kind !== product.kindOf) out.kindOf = kind;
  if (kind === 'monthly' || kind === 'yearly') {
    for (const [from, was, key] of [
      [d.startDate, product.startDate, 'sqadualed'],
      [d.endDate, product.endDate, 'sqadualedf']
    ] as const) {
      if (from === undefined) continue;
      const day = dayOf(from);
      if (day !== dayOf(was)) out[key] = day ? new Date(day).toISOString() : null;
    }
  }
  return out;
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
  extras: { lowStockAt?: number | null; pending?: PendingEdit | null; recipeNode?: any } = {}
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
    descrip: typeof a.desc === 'string' ? a.desc : '',
    kindOf: kindOfNode(a.kindOf),
    startDate: str(a.startDate),
    endDate: str(a.finnishDate),
    origin,
    sovereign: origin === 'personal' || members <= 1,
    members,
    archived: a.archived === true || a.lifecycle === 'archived',
    gallery: galleryOfNode(a.pic, a.pics),
    axes: productAxesOf(axesOfNodes(a.options?.data ?? []), rows),
    variants: rows,
    lowStockAt: extras.lowStockAt ?? null,
    openDecisionId: decisions.length ? String(decisions[0].id) : null,
    pending: extras.pending ?? null,
    unlimited: isUnlimited({ quant: a.quant, unlimited: typeof a.unlimited === 'boolean' ? a.unlimited : null }),
    oneForeProject: a.oneForeProject === true,
    marginPct: num(extras.recipeNode?.attributes?.marginPct) ?? 0,
    location: locationOf(extras.recipeNode?.attributes?.location),
    recipe: recipeOfNode(extras.recipeNode),
    recipeLocked: isRecipeLocked(extras.recipeNode),
    recipeIsDeal: isRecipeDeal(origin, extras.recipeNode)
  };
}
