/**
 * Strapi rows → the plain shapes of `plan.ts` (PLAN_SHOP_OPERATIONS A1).
 *
 * Pure and defensive — a missing relation reads as "none", never throws — so the
 * engine, the editor's loader and the heart's read all see one meaning.
 */
import { addressLine, addressOf } from '$lib/shop/manage';
import type {
  ConsentState,
  DeliveryPreference,
  FulfillmentStepRow,
  OrderFacts,
  RunningMission,
  StepEffect,
  StepPer,
  StepTarget,
  StepWhen
} from './plan';

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);
const idOf = (rel: any): string | null => (rel?.data?.id != null ? String(rel.data.id) : null);
const idsOf = (rel: any): string[] =>
  Array.isArray(rel?.data) ? rel.data.map((r: any) => r?.id).filter((x: any) => x != null).map(String) : [];
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(v as T) ? (v as T) : fallback;

export const TARGETS = ['mission', 'role', 'member'] as const;
export const PERS = ['order', 'line', 'unit'] as const;
export const EFFECTS = ['none', 'markShipped', 'markFulfilled'] as const;
export const CONSENT_STATES = ['self', 'proposed', 'active', 'paused'] as const;
export const PREFERENCES = ['pickup', 'delivery', 'digital', 'contact'] as const;

export function whenOf(v: unknown): StepWhen {
  const raw = v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
  const prefs = Array.isArray(raw.deliveryPreference)
    ? raw.deliveryPreference.filter((p): p is DeliveryPreference => (PREFERENCES as readonly string[]).includes(p as string))
    : [];
  return { event: 'order.paid', ...(prefs.length ? { deliveryPreference: prefs } : {}) };
}

/** The extra things the editor shows beside the planner's fields. */
export interface StepView extends FulfillmentStepRow {
  missionName: string | null;
  roleName: string | null;
  memberName: string | null;
  proposedById: string | null;
  proposedByName: string | null;
  productNames: string[];
}

export function stepOf(node: any): StepView | null {
  const a = node?.attributes;
  if (!a || node?.id == null) return null;
  const scope = oneOf(a.scope, ['rikma', 'category', 'product', 'variant'] as const, 'rikma');
  const due = a.dueHours == null ? null : Number(a.dueHours);
  return {
    id: String(node.id),
    name: str(a.name) ?? '',
    position: Number(a.position ?? 0) || 0,
    target: oneOf<StepTarget>(a.target, TARGETS, 'member'),
    missionId: idOf(a.mesimabetahalich),
    roleId: idOf(a.tafkidim),
    memberId: idOf(a.member),
    per: oneOf<StepPer>(a.per, PERS, 'order'),
    scope,
    productIds: idsOf(a.matanots),
    variantIds: idsOf(a.product_variants),
    when: whenOf(a.when),
    dueHours: Number.isFinite(due) ? due : null,
    effect: oneOf<StepEffect>(a.effect, EFFECTS, 'none'),
    consentState: oneOf<ConsentState>(a.consentState, CONSENT_STATES, 'proposed'),
    consentedBy: idsOf(a.consentedBy),
    archived: a.archived === true,
    missionName: str(a.mesimabetahalich?.data?.attributes?.name),
    roleName: str(a.tafkidim?.data?.attributes?.roleDescription),
    memberName: str(a.member?.data?.attributes?.username),
    proposedById: idOf(a.proposedBy),
    proposedByName: str(a.proposedBy?.data?.attributes?.username),
    productNames: (a.matanots?.data ?? []).map((m: any) => str(m?.attributes?.name)).filter(Boolean) as string[]
  };
}

export interface MissionView extends RunningMission {
  name: string;
  holderName: string | null;
  roles: { id: string; name: string }[];
}

export function missionOf(node: any): MissionView | null {
  const a = node?.attributes;
  if (!a || node?.id == null) return null;
  const lifecycle = a.lifecycle;
  return {
    id: String(node.id),
    name: str(a.name) ?? '',
    holderId: idOf(a.users_permissions_user),
    holderName: str(a.users_permissions_user?.data?.attributes?.username),
    // null lifecycle = legacy = active (CLAUDE.md, object archival).
    closed: a.finnished === true || lifecycle === 'archived' || lifecycle === 'released',
    roleIds: idsOf(a.tafkidims),
    roles: (a.tafkidims?.data ?? [])
      .filter((r: any) => r?.id != null)
      .map((r: any) => ({ id: String(r.id), name: str(r.attributes?.roleDescription) ?? '' }))
  };
}

export function missionsMapOf(nodes: any[]): Map<string, MissionView> {
  const map = new Map<string, MissionView>();
  for (const n of nodes ?? []) {
    const m = missionOf(n);
    if (m) map.set(m.id, m);
  }
  return map;
}

export function orderFactsOf(node: any, number: string): OrderFacts | null {
  const a = node?.attributes;
  if (!a || node?.id == null) return null;
  return {
    id: String(node.id),
    ref: String(a.ref ?? ''),
    number,
    status: String(a.status ?? ''),
    deliveryPreference: (PREFERENCES as readonly string[]).includes(a.deliveryPreference)
      ? (a.deliveryPreference as DeliveryPreference)
      : null,
    paidAt: str(a.paidAt),
    buyerName: str(a.buyerName),
    address: addressLine(addressOf(a.deliveryAddress)) || null,
    lines: [...(a.lines?.data ?? [])]
      .filter((r: any) => r?.id != null)
      .map((r: any) => ({
        id: String(r.id),
        position: Number(r.attributes?.position ?? 0) || 0,
        productId: idOf(r.attributes?.matanot),
        variantId: idOf(r.attributes?.variant),
        quantity: Number(r.attributes?.quantity ?? 0) || 0,
        name: str(r.attributes?.nameSnapshot) ?? '',
        optionLabel: str(r.attributes?.optionLabelSnapshot)
      }))
      .sort((x, y) => x.position - y.position)
  };
}

/** One heart card's worth of an automatic act (`getFulfillmentWork`). */
export interface FulfillWorkItem {
  actId: string;
  projectId: string;
  name: string;
  stepName: string;
  effect: StepEffect;
  dueAt: string | null;
  createdAt: string | null;
  /** Mine already, or open to a role I hold. */
  mine: boolean;
  roleName: string | null;
  missionName: string | null;
  orderId: string | null;
  orderRef: string | null;
  orderNumber: string;
  orderStatus: string | null;
  deliveryPreference: DeliveryPreference | null;
  buyerName: string | null;
  buyerPhone: string | null;
  address: string | null;
  /** The act's items, one per line ("2 × צנצנת"). */
  items: string[];
}

export function workItemOf(node: any, uid: string, numberOf: (displayNumber: unknown, id: unknown) => string): FulfillWorkItem | null {
  const a = node?.attributes;
  if (!a || node?.id == null) return null;
  const order = a.order?.data;
  const oa = order?.attributes ?? {};
  const step = a.fulfillment_step?.data?.attributes ?? {};
  const mine = idsOf(a.my).includes(String(uid));
  return {
    actId: String(node.id),
    projectId: idOf(a.project) ?? '',
    name: str(a.shem) ?? '',
    stepName: str(step.name) ?? '',
    effect: oneOf<StepEffect>(step.effect, EFFECTS, 'none'),
    dueAt: str(a.dateF),
    createdAt: str(a.createdAt),
    mine,
    roleName: str(a.tafkidims?.data?.[0]?.attributes?.roleDescription),
    missionName: str(a.mesimabetahaliches?.data?.[0]?.attributes?.name),
    orderId: order?.id != null ? String(order.id) : null,
    orderRef: str(oa.ref),
    orderNumber: order ? numberOf(oa.displayNumber, order.id) : '',
    orderStatus: str(oa.status),
    deliveryPreference: (PREFERENCES as readonly string[]).includes(oa.deliveryPreference)
      ? (oa.deliveryPreference as DeliveryPreference)
      : null,
    buyerName: str(oa.buyerName),
    buyerPhone: str(oa.buyerPhone),
    address: addressLine(addressOf(oa.deliveryAddress)) || null,
    // The planner wrote exactly the items into `des` (plan.ts `actText`); a
    // note added on completion is never shown here — the act is closed by then.
    items: (str(a.des) ?? '').split('\n').map((s) => s.trim()).filter(Boolean)
  };
}

/** The sales screen's Fulfilment tab (server/fulfillment/setup.ts). */
export interface StepRowView extends StepView {
  /** The people it lands on now. */
  targetIds: string[];
  /** …and of them, who has not agreed yet. */
  waitingFor: string[];
}

export interface FulfillmentSetup {
  ready: boolean;
  steps: StepRowView[];
  missions: { id: string; name: string; holderId: string | null; holderName: string | null }[];
  roles: { id: string; name: string }[];
  members: { id: string; name: string }[];
}
