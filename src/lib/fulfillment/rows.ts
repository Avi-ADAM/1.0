/**
 * Strapi rows → the plain shapes of `plan.ts` (PLAN_SHOP_OPERATIONS A1).
 *
 * Pure and defensive — a missing relation reads as "none", never throws — so the
 * engine, the editor's loader and the heart's read all see one meaning.
 */
import { addressLine, addressOf } from '$lib/shop/manage';
import { resourceIdOfExternalId, stepIdOfExternalId } from './plan';
import type {
  ConsentState,
  DeliveryPreference,
  FulfillmentEvent,
  FulfillmentStepRow,
  OrderFacts,
  RunningMission,
  StepBatching,
  StepEffect,
  StepPer,
  StepRouting,
  StepTarget,
  StepWhen
} from './plan';
import { parseHHMM } from './time';

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
export const ROUTINGS = ['single', 'roundRobin', 'leastOpen', 'onShift'] as const;
export const BATCHINGS = ['perOrder', 'wave'] as const;
export const EVENTS = ['order.paid', 'stock.low'] as const;

/** A shipping-config id (zone, pickup point) — the shape `shipping.ts` keeps. */
const CONFIG_ID = /^[a-z0-9_-]{1,40}$/i;
/** A delivery option the buyer chose: `m:<zone>:<method>`. */
const METHOD_OPTION = /^m:[a-z0-9_-]{1,40}:[a-z0-9_-]{1,40}$/i;
const ENTITY_ID = /^\d{1,12}$/;

function stringList(v: unknown, ok: RegExp, max = 50): string[] {
  if (!Array.isArray(v)) return [];
  return [...new Set(v.map((x) => (typeof x === 'number' ? String(x) : x)).filter((x): x is string => typeof x === 'string' && ok.test(x)))].slice(0, max);
}

export function whenOf(v: unknown): StepWhen {
  const raw = v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
  const event: FulfillmentEvent = raw.event === 'stock.low' ? 'stock.low' : 'order.paid';
  if (event === 'stock.low') {
    const resources = stringList(raw.resources, ENTITY_ID);
    return { event, ...(resources.length ? { resources } : {}) };
  }
  const prefs = Array.isArray(raw.deliveryPreference)
    ? raw.deliveryPreference.filter((p): p is DeliveryPreference => (PREFERENCES as readonly string[]).includes(p as string))
    : [];
  const zones = stringList(raw.shippingZones, CONFIG_ID);
  const methods = stringList(raw.shippingMethods, METHOD_OPTION);
  const points = stringList(raw.pickupPoints, CONFIG_ID);
  const categories = stringList(raw.categories, ENTITY_ID);
  const after = stringList(raw.after, ENTITY_ID, 10);
  return {
    event,
    ...(after.length ? { after } : {}),
    ...(prefs.length ? { deliveryPreference: prefs } : {}),
    ...(zones.length ? { shippingZones: zones } : {}),
    ...(methods.length ? { shippingMethods: methods } : {}),
    ...(points.length ? { pickupPoints: points } : {}),
    ...(categories.length ? { categories } : {})
  };
}

/** The extra things the editor shows beside the planner's fields. */
export interface StepView extends FulfillmentStepRow {
  routing: StepRouting;
  batching: StepBatching;
  waveAt: string | null;
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
    routing: oneOf<StepRouting>(a.routing, ROUTINGS, 'single'),
    batching: oneOf<StepBatching>(a.batching, BATCHINGS, 'perOrder'),
    waveAt: parseHHMM(a.waveAt) != null ? String(a.waveAt).trim() : null,
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
        optionLabel: str(r.attributes?.optionLabelSnapshot),
        // Present only when the engine asked for categories (`fulfillmentOrderCategories`).
        ...(r.attributes?.matanot?.data?.attributes?.categories
          ? { categoryIds: idsOf(r.attributes.matanot.data.attributes.categories) }
          : {})
      }))
      .sort((x, y) => x.position - y.position)
  };
}

/** One heart card's worth of an automatic act (`getFulfillmentWork`). */
export interface FulfillWorkItem {
  actId: string;
  projectId: string;
  name: string;
  stepId: string | null;
  stepName: string;
  effect: StepEffect;
  /** `wave` steps: the heart draws every act of one wave as a single card. */
  batching: StepBatching;
  per: StepPer;
  dueAt: string | null;
  createdAt: string | null;
  /** Mine already, or open to a role I hold. */
  mine: boolean;
  /** Open to the whole rikma — handed off with no role to return to. */
  openToAll: boolean;
  roleName: string | null;
  missionName: string | null;
  /** `order` — an order's step; `stock` — a resource ran low (A3). */
  kind: 'order' | 'stock';
  /** stock acts: the resource, read live beside the act. */
  resourceId: string | null;
  stock: { name: string; onHand: number; lowStockAt: number | null; pricePerUnit: number | null } | null;
  orderId: string | null;
  orderRef: string | null;
  orderNumber: string;
  orderStatus: string | null;
  deliveryPreference: DeliveryPreference | null;
  buyerName: string | null;
  buyerPhone: string | null;
  address: string | null;
  /** The day the shop promised it leaves (Order.shipping.nextDispatch), when known. */
  dispatchOn: string | null;
  /** The act's items, one per line ("2 × צנצנת"). */
  items: string[];
}

export function workItemOf(node: any, uid: string, numberOf: (displayNumber: unknown, id: unknown) => string): FulfillWorkItem | null {
  const a = node?.attributes;
  if (!a || node?.id == null) return null;
  const order = a.order?.data;
  const oa = order?.attributes ?? {};
  const stepNode = a.fulfillment_step?.data;
  const step = stepNode?.attributes ?? {};
  const mine = idsOf(a.my).includes(String(uid));
  const externalId = str(a.externalId);
  const resourceId = resourceIdOfExternalId(externalId);
  const roles = a.tafkidims?.data ?? [];
  return {
    actId: String(node.id),
    projectId: idOf(a.project) ?? '',
    name: str(a.shem) ?? '',
    stepId: stepNode?.id != null ? String(stepNode.id) : stepIdOfExternalId(externalId),
    stepName: str(step.name) ?? '',
    effect: oneOf<StepEffect>(step.effect, EFFECTS, 'none'),
    batching: oneOf<StepBatching>(step.batching, BATCHINGS, 'perOrder'),
    per: oneOf<StepPer>(step.per, PERS, 'order'),
    dueAt: str(a.dateF),
    createdAt: str(a.createdAt),
    mine,
    openToAll: idsOf(a.my).length === 0 && roles.length === 0,
    roleName: str(roles[0]?.attributes?.roleDescription),
    missionName: str(a.mesimabetahaliches?.data?.[0]?.attributes?.name),
    kind: resourceId ? 'stock' : 'order',
    resourceId,
    stock: null,
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
    dispatchOn: null,
    // The planner wrote exactly the items into `des` (plan.ts `actText`); a
    // note added on completion is never shown here — the act is closed by then.
    items: (str(a.des) ?? '').split('\n').map((s) => s.trim()).filter(Boolean)
  };
}

/** A rule waiting for my answer (§2.3) — the heart's `fulfillRule` card. */
export interface RuleProposal {
  stepId: string;
  projectId: string;
  projectName: string | null;
  name: string;
  target: StepTarget;
  roleName: string | null;
  missionName: string | null;
  proposedByName: string | null;
  /** Everything the rule does, for the card to word in the reader's language. */
  per: StepPer;
  effect: StepEffect;
  when: StepWhen;
  dueHours: number | null;
  batching: StepBatching;
  waveAt: string | null;
  routing: StepRouting;
  /** When silence becomes my yes, if the rule rides a Decision. */
  deadline: string | null;
  decisionId: string | null;
}

/** The sales screen's Fulfilment tab (server/fulfillment/setup.ts). */
export interface StepRowView extends StepView {
  /** The people it lands on now. */
  targetIds: string[];
  /** …and of them, who has not agreed yet. */
  waitingFor: string[];
  /** When silence becomes the waiting people's yes (the rule's Decision), if any. */
  deadline: string | null;
}

/** What a rule's conditions can name — read beside the steps, each part optional. */
export interface FulfillmentChoices {
  zones: { id: string; name: string }[];
  /** Delivery options as the order reports them: `m:<zone>:<method>`. */
  methods: { id: string; name: string; zoneName: string }[];
  pickupPoints: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  products: { id: string; name: string }[];
  /** Resources with a shelf, for `stock.low` rules (A3). */
  resources: { id: string; name: string }[];
}

export interface FulfillmentSetup {
  ready: boolean;
  steps: StepRowView[];
  missions: { id: string; name: string; holderId: string | null; holderName: string | null }[];
  roles: { id: string; name: string }[];
  members: { id: string; name: string }[];
  choices: FulfillmentChoices;
  /** Silence-as-consent is live (the `fulfillmentRule` Decision deployed). */
  consentClock: boolean;
}

export const EMPTY_CHOICES: FulfillmentChoices = {
  zones: [],
  methods: [],
  pickupPoints: [],
  categories: [],
  products: [],
  resources: []
};
