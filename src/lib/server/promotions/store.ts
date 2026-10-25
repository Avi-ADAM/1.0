/**
 * Strapi reads and writes for shop promotions (docs/inprogress/PLAN_SHOP_PROMOTIONS.md §4).
 *
 * Written against `Exec` like the archival and stipend modules, so the
 * actions (the caller's JWT), the timegrama finalizer and the promotions
 * clock (the service token) share one implementation.
 */
import {
  dateField,
  enumField,
  fields,
  gqlStr,
  jsonField,
  numField,
  run,
  strField,
  type Exec
} from '$lib/server/archive/gql.js';
import { PROMO_KINDS, normalizePromoPolicy, type PromoPolicy, type PromoTerms, type ShelfProduct } from '$lib/shop/promoTerms';
import type { PromotionStatus } from '$lib/shop/promotions';

const STATUSES: readonly PromotionStatus[] = ['proposed', 'scheduled', 'active', 'paused', 'ended'];
const ENDED_REASONS = ['time', 'cap', 'early', 'superseded'] as const;
export type EndedReason = (typeof ENDED_REASONS)[number];

const num = (v: unknown): number | null => {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const idOf = (rel: any): string | null => (rel?.data?.id != null ? String(rel.data.id) : null);

export interface PromoProject {
  id: string;
  name: string;
  restime: string | null;
  currencyCode: string | null;
  memberIds: string[];
  policy: PromoPolicy | null;
}

export async function fetchPromoProject(exec: Exec, projectId: string): Promise<PromoProject | null> {
  const data = await run(
    exec,
    `{ project(id: ${gqlStr(projectId)}) { data { id attributes {
      projectName restime currencyCode promoPolicy user_1s { data { id } }
    } } } }`,
    'promo:project'
  );
  const p = data?.project?.data;
  if (!p) return null;
  const a = p.attributes ?? {};
  return {
    id: String(p.id),
    name: String(a.projectName ?? ''),
    restime: a.restime ?? null,
    currencyCode: a.currencyCode ?? null,
    memberIds: (a.user_1s?.data ?? []).map((u: any) => String(u.id)),
    policy: normalizePromoPolicy(a.promoPolicy)
  };
}

/** The rikma's products — enough to resolve a scope, its eligibility and its list prices. */
export async function fetchShelf(exec: Exec, projectId: string): Promise<ShelfProduct[]> {
  const data = await run(
    exec,
    `{ matanots(filters: { projectcreates: { id: { eq: ${gqlStr(projectId)} } } }, pagination: { limit: 300 }) { data { id attributes {
      name price pricingMode origin archived lifecycle
      owner_user { data { id } }
      categories { data { id } }
      variants(pagination: { limit: 100 }) { data { id attributes { price active } } }
    } } } }`,
    'promo:shelf'
  );
  return (data?.matanots?.data ?? []).map((m: any) => {
    const a = m.attributes ?? {};
    return {
      id: String(m.id),
      name: String(a.name ?? ''),
      price: num(a.price),
      pricingMode: a.pricingMode ?? null,
      origin: a.origin ?? null,
      ownerId: idOf(a.owner_user),
      archived: a.archived === true || a.lifecycle === 'archived',
      categoryIds: (a.categories?.data ?? []).map((c: any) => String(c.id)),
      variants: (a.variants?.data ?? [])
        .filter((v: any) => v?.attributes?.active !== false)
        .map((v: any) => ({ id: String(v.id), price: num(v.attributes?.price) }))
    } satisfies ShelfProduct;
  });
}

export interface PromotionRow {
  id: string;
  projectId: string | null;
  decisionId: string | null;
  decisionArchived: boolean;
  proposedById: string | null;
  status: PromotionStatus;
  kind: PromoTerms['kind'];
  name: string | null;
  scope: PromoTerms['scope'];
  rule: PromoTerms['rule'];
  startsAt: string | null;
  endsAt: string | null;
  capUnits: number | null;
  capOrders: number | null;
  perOrderMax: number | null;
  usedUnits: number | null;
  usedOrders: number | null;
  pausedAt: string | null;
  pausedById: string | null;
}

const ROW_FIELDS = `
  status kind name scope rule startsAt endsAt capUnits capOrders perOrderMax usedUnits usedOrders pausedAt
  project { data { id } }
  decision { data { id attributes { archived } } }
  proposedBy { data { id } }
  pausedBy { data { id } }`;

function rowOf(node: any): PromotionRow | null {
  const a = node?.attributes;
  if (!a) return null;
  return {
    id: String(node.id),
    projectId: idOf(a.project),
    decisionId: idOf(a.decision),
    decisionArchived: a.decision?.data?.attributes?.archived === true,
    proposedById: idOf(a.proposedBy),
    status: STATUSES.includes(a.status) ? a.status : 'proposed',
    kind: a.kind,
    name: a.name ?? null,
    scope: a.scope ?? {},
    rule: a.rule ?? {},
    startsAt: a.startsAt ?? null,
    endsAt: a.endsAt ?? null,
    capUnits: num(a.capUnits),
    capOrders: num(a.capOrders),
    perOrderMax: num(a.perOrderMax),
    usedUnits: num(a.usedUnits),
    usedOrders: num(a.usedOrders),
    pausedAt: a.pausedAt ?? null,
    pausedById: idOf(a.pausedBy)
  };
}

export async function fetchPromotion(exec: Exec, id: string): Promise<PromotionRow | null> {
  const data = await run(exec, `{ promotion(id: ${gqlStr(id)}) { data { id attributes { ${ROW_FIELDS} } } } }`, 'promo:read');
  return rowOf(data?.promotion?.data);
}

/** Every promotion the clock may have to move (scheduled, active, paused). */
export async function fetchLivePromotions(exec: Exec): Promise<PromotionRow[]> {
  const data = await run(
    exec,
    `{ promotions(filters: { status: { in: ["scheduled", "active", "paused"] } }, pagination: { limit: 500 }) { data { id attributes { ${ROW_FIELDS} } } } }`,
    'promo:live'
  );
  return (data?.promotions?.data ?? []).map(rowOf).filter(Boolean) as PromotionRow[];
}

/** The terms of a version as promotion fields. */
export function termsFields(t: Partial<PromoTerms>): Array<string | null> {
  return [
    enumField('kind', t.kind, PROMO_KINDS),
    'name' in t ? (t.name ? strField('name', t.name) : 'name: null') : null,
    jsonField('scope', t.scope),
    jsonField('rule', t.rule),
    'startsAt' in t ? (t.startsAt ? dateField('startsAt', t.startsAt) : 'startsAt: null') : null,
    dateField('endsAt', t.endsAt),
    'capUnits' in t ? (numField('capUnits', t.capUnits) ?? 'capUnits: null') : null,
    'capOrders' in t ? (numField('capOrders', t.capOrders) ?? 'capOrders: null') : null,
    'perOrderMax' in t ? (numField('perOrderMax', t.perOrderMax) ?? 'perOrderMax: null') : null
  ];
}

export async function createPromotion(
  exec: Exec,
  input: { projectId: string; proposedById: string; terms: PromoTerms; status: PromotionStatus; currencyCode?: string | null }
): Promise<string> {
  const data = await run(
    exec,
    `mutation { createPromotion(data: { ${fields(
      strField('project', input.projectId),
      strField('proposedBy', input.proposedById),
      enumField('status', input.status, STATUSES),
      strField('currencyCode', input.currencyCode),
      'usedUnits: 0',
      'usedOrders: 0',
      ...termsFields(input.terms)
    )} }) { data { id } } }`,
    'promo:create'
  );
  const id = data?.createPromotion?.data?.id;
  if (!id) throw new Error('createPromotion returned no id');
  return String(id);
}

export interface PromotionPatch extends Partial<PromoTerms> {
  status?: PromotionStatus;
  endedReason?: EndedReason | null;
  decisionId?: string | null;
  pausedAt?: string | null;
  pausedById?: string | null;
}

export async function updatePromotion(exec: Exec, id: string, patch: PromotionPatch): Promise<void> {
  const parts = fields(
    ...termsFields(patch),
    enumField('status', patch.status, STATUSES),
    'endedReason' in patch ? (patch.endedReason ? enumField('endedReason', patch.endedReason, ENDED_REASONS) : 'endedReason: null') : null,
    'decisionId' in patch ? (patch.decisionId ? strField('decision', patch.decisionId) : 'decision: null') : null,
    'pausedAt' in patch ? (patch.pausedAt ? dateField('pausedAt', patch.pausedAt) : 'pausedAt: null') : null,
    'pausedById' in patch ? (patch.pausedById ? strField('pausedBy', patch.pausedById) : 'pausedBy: null') : null
  );
  if (!parts) return;
  await run(exec, `mutation { updatePromotion(id: ${gqlStr(id)}, data: { ${parts} }) { data { id } } }`, 'promo:update');
}

export async function writePromoPolicy(exec: Exec, projectId: string, policy: Record<string, unknown>): Promise<void> {
  await run(
    exec,
    `mutation { updateProject(id: ${gqlStr(projectId)}, data: { ${jsonField('promoPolicy', policy)} }) { data { id } } }`,
    'promo:policy'
  );
}

/** The roles the actor holds in the rikma, through running missions — for a role-limited envelope. */
export async function fetchActorRoles(exec: Exec, projectId: string, userId: string): Promise<string[]> {
  try {
    const data = await run(
      exec,
      `{ mesimabetahaliches(filters: { and: [
        { project: { id: { eq: ${gqlStr(projectId)} } } },
        { users_permissions_user: { id: { eq: ${gqlStr(userId)} } } },
        { or: [{ finnished: { null: true } }, { finnished: { eq: false } }] }
      ] }, pagination: { limit: 50 }) { data { attributes { tafkidims { data { id } } } } } }`,
      'promo:roles'
    );
    return [
      ...new Set<string>(
        (data?.mesimabetahaliches?.data ?? []).flatMap((m: any) => (m.attributes?.tafkidims?.data ?? []).map((r: any) => String(r.id)))
      )
    ];
  } catch {
    return [];
  }
}
