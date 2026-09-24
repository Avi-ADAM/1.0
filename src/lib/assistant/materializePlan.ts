/**
 * What "create" on the blueprint review screen actually runs
 * (docs/PLAN_AI_SIGNUP_CONCIERGE.md §4.5) — decided here, purely, so the
 * order and every param are tested without a server.
 *
 * Nothing new is invented on the write side: each step is one of the actions
 * the site's own forms already run (createWeave, createMission, createResource,
 * createComplexMatanot), so every consent branch they carry still applies — in
 * a rikma with more than one member a complex product or an assigned mission
 * still goes to its vote.
 *
 * Rules:
 *  - only rows the person ticked are created; dropped rows never are;
 *  - a row that already has `createdRef` is skipped, so a re-run after a
 *    failure continues instead of duplicating;
 *  - a mission or resource that is part of a ticked product's recipe is
 *    created as that product's bill-of-materials line, not a second time on
 *    its own;
 *  - ticked-off rows that are not dropped become planning-board proposals
 *    (seedPlanBoards), so nothing the person did not explicitly refuse is lost.
 */

import { DEFAULT_RESTIME } from './blueprint.js';
import type { AssistantItem, AssistantState } from './types.js';

export type MaterializeStep =
  | { type: 'createRikma' }
  | { type: 'mission'; key: string }
  | { type: 'resource'; key: string }
  | { type: 'product'; key: string; missionKeys: string[]; resourceKeys: string[] }
  | { type: 'invite'; key: string; missionKeys: string[]; resourceKeys: string[] }
  | { type: 'seedLeftovers'; keys: string[] };

export type SkipReason = 'unknown' | 'dropped' | 'created' | 'inRecipe';

export interface MaterializePlan {
  steps: MaterializeStep[];
  skipped: { key: string; reason: SkipReason }[];
}

const BUILDABLE = new Set(['products', 'rikmaMissions', 'rikmaResources']);

function recipeOf(item: AssistantItem): { missionKeys: string[]; resourceKeys: string[] } {
  const r = (item.spec?.recipe ?? null) as { missionKeys?: string[]; resourceKeys?: string[] } | null;
  return { missionKeys: r?.missionKeys ?? [], resourceKeys: r?.resourceKeys ?? [] };
}

/**
 * @param selectedKeys the rows ticked on the review screen
 * @param hasProject   the session already targets (or already created) a rikma
 */
export function planMaterialization(
  state: AssistantState,
  selectedKeys: readonly string[],
  hasProject: boolean
): MaterializePlan {
  const byKey = new Map(state.items.map((it) => [it.key, it]));
  const skipped: MaterializePlan['skipped'] = [];
  const chosen = new Set<string>();

  for (const key of selectedKeys) {
    const it = byKey.get(key);
    if (!it) skipped.push({ key, reason: 'unknown' });
    else if (it.status === 'dropped') skipped.push({ key, reason: 'dropped' });
    else if (it.createdRef || it.status === 'applied') skipped.push({ key, reason: 'created' });
    else chosen.add(key);
  }

  const alive = (k: string) => {
    const it = byKey.get(k);
    return !!it && it.status !== 'dropped';
  };

  // Recipe lines of ticked products belong to the product.
  const inRecipe = new Set<string>();
  const products: MaterializeStep[] = [];
  for (const it of state.items) {
    if (it.group !== 'products' || !chosen.has(it.key)) continue;
    const { missionKeys, resourceKeys } = recipeOf(it);
    const m = missionKeys.filter(alive);
    const r = resourceKeys.filter(alive);
    m.forEach((k) => inRecipe.add(k));
    r.forEach((k) => inRecipe.add(k));
    products.push({ type: 'product', key: it.key, missionKeys: m, resourceKeys: r });
  }

  const missions: MaterializeStep[] = [];
  const resources: MaterializeStep[] = [];
  for (const it of state.items) {
    if (!chosen.has(it.key)) continue;
    if (it.group !== 'rikmaMissions' && it.group !== 'rikmaResources') continue;
    if (inRecipe.has(it.key)) {
      skipped.push({ key: it.key, reason: 'inRecipe' });
      continue;
    }
    if (it.group === 'rikmaMissions') missions.push({ type: 'mission', key: it.key });
    else resources.push({ type: 'resource', key: it.key });
  }

  // A partner is invited to what they bring — the standalone missions and
  // resources created for them (open), not recipe lines.
  const invites: MaterializeStep[] = [];
  for (const it of state.items) {
    if (it.group !== 'partners' || !chosen.has(it.key)) continue;
    const brings = (group: string, steps: MaterializeStep[]) =>
      steps
        .map((s) => (s as { key: string }).key)
        .filter((k) => {
          const row = byKey.get(k)!;
          return row.group === group && row.spec?.partnerKey === it.key;
        });
    invites.push({
      type: 'invite',
      key: it.key,
      missionKeys: brings('rikmaMissions', missions),
      resourceKeys: brings('rikmaResources', resources)
    });
  }

  const leftovers = state.items
    .filter(
      (it) =>
        BUILDABLE.has(it.group) &&
        !chosen.has(it.key) &&
        !inRecipe.has(it.key) &&
        it.status !== 'dropped' &&
        it.status !== 'applied' &&
        !it.createdRef
    )
    .map((it) => it.key);

  const steps: MaterializeStep[] = [];
  const createsSomething = products.length + missions.length + resources.length + invites.length > 0;
  if (!hasProject) {
    if (createsSomething || leftovers.length) steps.push({ type: 'createRikma' });
  }
  steps.push(...missions, ...resources, ...products, ...invites);
  if (leftovers.length) steps.push({ type: 'seedLeftovers', keys: leftovers });

  return { steps, skipped };
}

// ── Params for each step ────────────────────────────────────────────────────

export interface ParamContext {
  projectId: string;
  userId: string;
  /** Members of the rikma before this run; a new rikma has one (the founder). */
  memberCount: number;
  /** Vocabulary ids resolved per mission key (see resolveRowVocabulary). */
  vocab?: Record<string, { skillIds?: string[]; roleIds?: string[]; workwayIds?: string[] }>;
}

const num = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? v : undefined;
const str = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v.trim() : undefined);

function locationParams(fields: Record<string, unknown> | undefined): Record<string, unknown> {
  const loc = (fields?.location ?? null) as Record<string, unknown> | null;
  if (!loc) return {};
  const out: Record<string, unknown> = {};
  if (num(loc.lat) !== undefined) out.lat = loc.lat;
  if (num(loc.lng) !== undefined) out.lng = loc.lng;
  if (num(loc.radius) !== undefined) out.radius = loc.radius;
  if (typeof loc.isOnline === 'boolean') out.isOnline = loc.isOnline;
  if (str(loc.hint)) out.location_hint = str(loc.hint);
  return out;
}

/** createWeave. Values are split into known ids and names to mint by the caller. */
export function rikmaParams(
  state: AssistantState,
  vallues: { ids: string[]; newNames: string[] }
): Record<string, unknown> {
  const f = state.fields ?? {};
  return {
    projectName: str(f.name) ?? '',
    publicDescription: str(f.publicDescription) ?? null,
    descripFor: str(f.descripFor) ?? null,
    linkToWebsite: str(f.linkToWebsite) ?? null,
    restime: str(f.restime) ?? DEFAULT_RESTIME,
    timeToP: 'already',
    ...(str(f.currency) ? { currency: str(f.currency) } : {}),
    vallueIds: vallues.ids,
    newVallueNames: vallues.newNames
  };
}

/** createMission. `me` is assigned to the importer; `open` and partner rows stay open. */
export function missionParams(item: AssistantItem, ctx: ParamContext): Record<string, unknown> {
  const s = item.spec ?? {};
  const v = ctx.vocab?.[item.key] ?? {};
  return {
    projectId: ctx.projectId,
    missionName: item.label,
    ...(str(s.descrip) ? { descrip: str(s.descrip) } : {}),
    skillIds: v.skillIds ?? [],
    roleIds: v.roleIds ?? [],
    workwayIds: v.workwayIds ?? [],
    ...(num(s.hours) !== undefined ? { nhours: num(s.hours) } : {}),
    ...(num(s.ratePerHour) !== undefined ? { valph: num(s.ratePerHour) } : {}),
    ...(s.recurring === true ? { iskvua: true } : {}),
    ...(s.holder === 'me' ? { assignedUserId: ctx.userId } : {})
  };
}

/**
 * createResource. Self-assignment is only offered by the form in a one-member
 * rikma (ResourceCreator's `isSingleUser`), so the same rule holds here.
 */
export function resourceParams(item: AssistantItem, ctx: ParamContext): Record<string, unknown> {
  const s = item.spec ?? {};
  const price = num(s.price) ?? 0;
  const mine = s.holder === 'me' && ctx.memberCount === 1;
  return {
    projectId: ctx.projectId,
    name: item.label,
    ...(str(s.descrip) ? { description: str(s.descrip) } : {}),
    price,
    easy: price,
    kindOf: str(s.kindOf) ?? 'total',
    hm: num(s.quantity) && num(s.quantity)! > 0 ? num(s.quantity) : 1,
    ...(mine ? { isAssigned: true } : {})
  };
}

/**
 * createComplexMatanot.
 *  - no recipe, a price  → `fixed`, active at once (simple product);
 *  - no recipe, no price → `quote` (price on request), still simple;
 *  - a recipe            → `estimated`, priced from its lines, the stated price
 *                          as the estimate. In a multi-member rikma it goes to a
 *                          vote — the action decides that, not us.
 */
export function productParams(
  item: AssistantItem,
  recipe: { missions: AssistantItem[]; resources: AssistantItem[] },
  state: AssistantState,
  ctx: ParamContext
): Record<string, unknown> {
  const s = item.spec ?? {};
  const price = num(s.price);
  const hasRecipe = recipe.missions.length + recipe.resources.length > 0;
  const pricingMode = hasRecipe ? 'estimated' : s.pricingMode === 'quote' || price === undefined ? 'quote' : 'fixed';
  const unlimited = s.unlimited === true || s.kindOf === 'unlimited';
  const keywords = Array.isArray(s.keywords) ? (s.keywords as unknown[]).filter((k) => typeof k === 'string' && k.trim()) : [];
  const assignee = (row: AssistantItem) =>
    row.spec?.holder === 'me' ? ctx.userId : null;

  return {
    projectId: ctx.projectId,
    name: item.label,
    desc: str(s.desc) ?? '',
    pricingMode,
    ...(pricingMode === 'fixed' ? { fixedPrice: price } : {}),
    ...(pricingMode !== 'fixed' && price !== undefined ? { estimatedPrice: price } : {}),
    ...(str(s.currency) ? { currency: str(s.currency) } : {}),
    kindOf: unlimited ? 'unlimited' : (str(s.kindOf) ?? 'total'),
    quant: num(s.quant) ?? 1,
    unlimitedM: unlimited,
    ...(typeof s.isOnline === 'boolean' ? { isOnline: s.isOnline } : {}),
    ...locationParams(state.fields),
    ...(keywords.length ? { discoveryKeywords: (keywords as string[]).join(', ') } : {}),
    recipeMissions: recipe.missions.map((m) => ({
      name: m.label,
      hoursPerUnit: num(m.spec?.hours) ?? 0,
      unitsPerProduct: 1,
      ratePerHour: num(m.spec?.ratePerHour) ?? 0,
      notes: str(m.spec?.descrip) ?? '',
      mode: 'createNew',
      assignedMemberId: assignee(m)
    })),
    recipeResources: recipe.resources.map((r) => ({
      name: r.label,
      quantityPerUnit: num(r.spec?.quantity) ?? 1,
      pricePerUnit: num(r.spec?.price) ?? 0,
      kindOf: str(r.spec?.kindOf) ?? 'total',
      notes: str(r.spec?.descrip) ?? '',
      mode: 'createNew',
      assignedMemberId: assignee(r)
    }))
  };
}

/** seedPlanBoards keeps at most 4 boards of 6 rows (seedPlan.ts). */
export const LEFTOVER_BOARD_ROWS = 6;
export const LEFTOVER_BOARDS = 4;

/**
 * Leftover rows → seedPlanBoards' plan: flat `PlannedRow`s, chunked into the
 * boards it accepts. Same kinds the planning boards already know (`mission` /
 * `resource` / `product`), so "open in form" keeps working on them. Rows past
 * the boards' capacity come back in `overflow` so the caller can say so.
 */
export function leftoverBoards(
  state: AssistantState,
  keys: readonly string[],
  title: string
): { plan: { boards: Record<string, unknown>[] }; overflow: string[] } {
  const byKey = new Map(state.items.map((it) => [it.key, it]));
  const kindOf: Record<string, string> = {
    products: 'product',
    rikmaMissions: 'mission',
    rikmaResources: 'resource'
  };
  const rows = keys
    .map((k) => byKey.get(k))
    .filter((it): it is AssistantItem => !!it && !!kindOf[it.group])
    .map((it) => {
      const s = it.spec ?? {};
      const list = (v: unknown) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []);
      return {
        key: it.key,
        row: {
          kind: kindOf[it.group],
          name: it.label,
          descrip: str(s.descrip) ?? str(s.desc) ?? '',
          imp: 'nice',
          rationale: it.why ?? '',
          skills: list(s.skills),
          roles: list(s.roles),
          workways: list(s.workways),
          nhours: num(s.hours) ?? null,
          valph: num(s.ratePerHour) ?? null,
          kindOf: str(s.kindOf) ?? null,
          price: num(s.price) ?? null,
          quantity: num(s.quantity) ?? num(s.quant) ?? null
        }
      };
    });

  const capacity = LEFTOVER_BOARD_ROWS * LEFTOVER_BOARDS;
  const boards: Record<string, unknown>[] = [];
  for (let i = 0; i < Math.min(rows.length, capacity); i += LEFTOVER_BOARD_ROWS) {
    const n = i / LEFTOVER_BOARD_ROWS + 1;
    boards.push({
      title: n === 1 ? title : `${title} (${n})`,
      descrip: '',
      rationale: '',
      items: rows.slice(i, i + LEFTOVER_BOARD_ROWS).map((r) => r.row)
    });
  }
  return { plan: { boards }, overflow: rows.slice(capacity).map((r) => r.key) };
}
