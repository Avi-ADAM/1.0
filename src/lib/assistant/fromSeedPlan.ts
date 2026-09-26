/**
 * The site's own draft → a rikma blueprint (docs/inprogress/PLAN_AI_SIGNUP_CONCIERGE.md §4.3.2).
 *
 * `/api/analyze-business` reads a business's site (or its owner's paragraph)
 * into the rikma fields and a few starter planning boards. Until now those
 * boards were parked in sessionStorage and each row was opened in its own form
 * after the rikma existed. Converted here into the same blueprint an agent
 * sends, the whole draft lands on the one review screen instead: products,
 * missions and resources ticked, created in one click.
 *
 * Pure and dependency-free apart from the blueprint schema, so the endpoint
 * (VPS) builds it and the tests pin it.
 *
 * `act` and `note` rows have no place in a blueprint — an act needs a running
 * mission to hang on, and a note creates nothing. They are left out.
 */

import {
  BlueprintInputSchema,
  PRODUCT_KINDOF,
  RESOURCE_KINDOF,
  type BlueprintInput
} from './blueprint.js';
import type { AssistantItem, AssistantState } from './types.js';

/** The fields of a seed-plan row this needs (`PlannedRow` in planning/expandAgent.ts). */
export interface SeedRowLike {
  kind: string;
  name: string;
  descrip?: string;
  rationale?: string;
  skills?: string[];
  roles?: string[];
  workways?: string[];
  nhours?: number | null;
  valph?: number | null;
  kindOf?: string | null;
  price?: number | null;
  quantity?: number | null;
  keywords?: string[];
  categories?: string[];
}

export interface SeedBoardLike {
  title?: string;
  items: SeedRowLike[];
}

export interface ExtractedBusinessLike {
  name: string;
  desc?: string;
  vals?: string[];
}

const positive = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : undefined;

const oneOf = <T extends string>(list: readonly T[], v: unknown): T | undefined =>
  typeof v === 'string' && (list as readonly string[]).includes(v) ? (v as T) : undefined;

const clip = (v: unknown, max: number): string | undefined => {
  const s = typeof v === 'string' ? v.trim() : '';
  return s ? s.slice(0, max) : undefined;
};

const words = (v: unknown, maxItems: number): string[] | undefined => {
  if (!Array.isArray(v)) return undefined;
  const out = v
    .filter((x): x is string => typeof x === 'string' && !!x.trim())
    .map((x) => x.trim().slice(0, 60))
    .slice(0, maxItems);
  return out.length ? out : undefined;
};

/** An address the schema will accept, or nothing — a bad link must not sink the whole draft. */
function websiteOf(raw: unknown): string | undefined {
  const s = clip(raw, 500);
  if (!s || !/^https?:\/\//i.test(s)) return undefined;
  try {
    new URL(s);
    return s;
  } catch {
    return undefined;
  }
}


type Holder = 'me' | 'open';

/** Blueprint rows by group, each with the tag of the source row it came from. */
interface Collected<T> {
  products: Record<string, unknown>[];
  missions: Record<string, unknown>[];
  resources: Record<string, unknown>[];
  tags: { products: T[]; missions: T[]; resources: T[] };
}

/**
 * Seed / board rows → blueprint rows. Deduplicated by kind + name, capped at
 * the schema's limits, `act` and `note` left out. `tag` travels alongside so a
 * caller can tell which source row each blueprint row is.
 */
function collectRows<T>(rows: readonly { row: SeedRowLike; tag: T }[], holder: Holder): Collected<T> {
  const out: Collected<T> = { products: [], missions: [], resources: [], tags: { products: [], missions: [], resources: [] } };
  const seen = new Set<string>();

  for (const { row, tag } of rows) {
    const label = clip(row?.name, 200);
    if (!label) continue;
    const dedupe = `${row.kind}:${label.toLowerCase()}`;
    if (seen.has(dedupe)) continue;
    const why = clip(row.rationale, 300);

    if (row.kind === 'product' && out.products.length < 30) {
      const price = positive(row.price);
      const quant = positive(row.quantity);
      out.products.push({
        name: label,
        desc: clip(row.descrip, 2000),
        ...(price !== undefined ? { price, pricingMode: 'fixed' } : { pricingMode: 'quote' }),
        kindOf: oneOf(PRODUCT_KINDOF, row.kindOf),
        ...(quant !== undefined && Number.isInteger(quant) ? { quant } : {}),
        keywords: words(row.keywords, 15),
        categories: words(row.categories, 3)?.map((c) => c.slice(0, 40)),
        why
      });
      out.tags.products.push(tag);
    } else if (row.kind === 'mission' && out.missions.length < 30) {
      out.missions.push({
        name: label,
        descrip: clip(row.descrip, 2000),
        skills: words(row.skills, 10),
        roles: words(row.roles, 6),
        workways: words(row.workways, 6),
        hours: positive(row.nhours),
        ratePerHour: positive(row.valph),
        holder,
        why
      });
      out.tags.missions.push(tag);
    } else if (row.kind === 'resource' && out.resources.length < 20) {
      out.resources.push({
        name: label,
        descrip: clip(row.descrip, 2000),
        kindOf: oneOf(RESOURCE_KINDOF, row.kindOf),
        price: positive(row.price),
        quantity: positive(row.quantity),
        holder,
        why
      });
      out.tags.resources.push(tag);
    } else {
      continue;
    }
    seen.add(dedupe);
  }
  return out;
}

/**
 * Build the blueprint, or `null` when there is nothing to review (no name, or
 * no product / mission / resource row) — the caller then keeps the old
 * prefill-the-form path.
 *
 * Holders default to `me`: this track is an existing business importing
 * itself, so the work and the equipment it describes are already the owner's.
 * An `open` row would email every matching member on creation; the review
 * screen lets the owner flip a row to "looking for someone" deliberately.
 */
export function seedPlanToBlueprint(
  extracted: ExtractedBusinessLike,
  boards: readonly SeedBoardLike[],
  options: { sourceUrl?: string | null } = {}
): BlueprintInput | null {
  const name = clip(extracted?.name, 120);
  if (!name) return null;

  const rows = (boards ?? []).flatMap((b) => (b?.items ?? []).map((row) => ({ row, tag: null })));
  const { products, missions, resources } = collectRows(rows, 'me');
  if (!products.length && !missions.length && !resources.length) return null;

  const parsed = BlueprintInputSchema.safeParse({
    fields: {
      track: 'business',
      name,
      publicDescription: clip(extracted.desc, 2000),
      ...(websiteOf(options.sourceUrl) ? { linkToWebsite: websiteOf(options.sourceUrl) } : {}),
      vals: words(extracted.vals, 8)
    },
    products,
    missions,
    resources,
    partners: []
  });
  return parsed.success ? parsed.data : null;
}

/** A planning-board row as `286getPlanBoard` returns it. */
export interface BoardItemLike {
  id: string | number;
  attributes?: {
    kind?: string;
    name?: string;
    descrip?: string;
    status?: string;
    spec?: Record<string, unknown> | null;
  };
}

/** Rows a board may still hand to the review screen: not created, not set aside. */
export const BOARD_IMPORTABLE_STATUSES = ['proposed', 'accepted'];

/**
 * An existing rikma's planning-board rows → a blueprint to review on the import
 * screen ("create all the ticked rows", §4.5). `planItemIds` lists, per group
 * and in the blueprint's order, the board row each blueprint row came from, so
 * the caller can mark those rows `created` afterwards.
 *
 * Holders stay `open` here: in a rikma with members, assigning work is a
 * choice the review screen asks for, not a default.
 */
export function boardItemsToBlueprint(
  items: readonly BoardItemLike[],
  rikma: { name: string; track?: 'business' | 'partnership' | 'idea' }
): { blueprint: BlueprintInput; planItemIds: { products: string[]; missions: string[]; resources: string[] } } | null {
  const rows = (items ?? [])
    .filter((it) => BOARD_IMPORTABLE_STATUSES.includes(String(it?.attributes?.status ?? 'proposed')))
    .map((it) => {
      const a = it.attributes ?? {};
      const s = (a.spec ?? {}) as Record<string, any>;
      const row: SeedRowLike = {
        kind: String(a.kind ?? ''),
        name: String(a.name ?? ''),
        descrip: a.descrip,
        rationale: s.rationale,
        skills: s.skills,
        roles: s.roles,
        workways: s.workways,
        nhours: s.nhours,
        valph: s.valph,
        kindOf: s.kindOf,
        price: s.price,
        quantity: s.quantity,
        keywords: s.keywords,
        categories: s.categories
      };
      return { row, tag: String(it.id) };
    });

  const c = collectRows(rows, 'open');
  if (!c.products.length && !c.missions.length && !c.resources.length) return null;

  const parsed = BlueprintInputSchema.safeParse({
    fields: { track: rikma.track ?? 'business', name: clip(rikma.name, 120) || '—' },
    products: c.products,
    missions: c.missions,
    resources: c.resources,
    partners: []
  });
  return parsed.success ? { blueprint: parsed.data, planItemIds: c.tags } : null;
}

/**
 * Stamp each item of a board import with the board row it came from
 * (`spec.planItem`). `blueprintToState` keeps each group in blueprint order,
 * so the n-th product item is the n-th product id.
 *
 * The stamp does two things downstream: materialize marks that board row
 * `created` once the item exists, and an unticked item is not copied onto a
 * new "more from the import" board — it is still on its own board.
 */
export function stampPlanItems(
  state: AssistantState,
  planItemIds: { products: string[]; missions: string[]; resources: string[] },
  boardId: string
): AssistantState {
  const next = { products: 0, rikmaMissions: 0, rikmaResources: 0 } as Record<string, number>;
  const ids: Record<string, string[]> = {
    products: planItemIds.products,
    rikmaMissions: planItemIds.missions,
    rikmaResources: planItemIds.resources
  };
  return {
    ...state,
    items: state.items.map((it) => {
      const list = ids[it.group];
      if (!list) return it;
      const itemId = list[next[it.group]++];
      return itemId ? { ...it, spec: { ...(it.spec ?? {}), planItem: { boardId: String(boardId), itemId } } } : it;
    })
  };
}

/** The board row an item was imported from, if any. */
export function planItemOf(item: AssistantItem): { boardId: string; itemId: string } | null {
  const p = item.spec?.planItem as { boardId?: unknown; itemId?: unknown } | undefined;
  return p && typeof p.boardId === 'string' && typeof p.itemId === 'string'
    ? { boardId: p.boardId, itemId: p.itemId }
    : null;
}
