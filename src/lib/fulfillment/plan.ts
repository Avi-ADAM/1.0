/**
 * planFulfillment — "an order was paid ⇒ what the rikma has to do now"
 * (docs/inprogress/PLAN_SHOP_OPERATIONS.md §3).
 *
 * Pure, like `planOrder`: every decision is taken here, before the first write,
 * so `applyFulfillment` only writes what is missing and a retry finishes the job
 * without opening anything twice (every act carries a deterministic
 * `externalId`, principle 6).
 *
 * What it never does (principle 2): log hours, approve anything, or invent a
 * holder. A step it cannot place becomes a `blocker` — the rikma is told, and
 * the act still opens for the role when there is one, so the work is visible
 * ("a no that is not absolute", principle 5).
 *
 * Who may receive an automatic act is decided by consent, not by the rule's
 * author (principle 3): a user is assigned only if they are in the step's
 * `consentedBy`. A step that is `proposed` or `paused` opens nothing.
 *
 * A2 adds, all still pure:
 *   - chains: a step with `when.after` opens once every step it waits for is
 *     done for this order. A step that does not apply to the order (another
 *     zone, paused, no line in scope) does not hold its followers back;
 *   - conditions: categories (line level), shipping methods and pickup points
 *     (order level) beside A1's delivery preference and zones;
 *   - `per: 'unit'` — one act per unit (production), capped so a line of 300
 *     opens 12 acts, the last carrying the rest;
 *   - routing `roundRobin` / `leastOpen` among the consenting holders of a role;
 *   - `wave` batching: the act is due at the wave's hour on the wave's day —
 *     the shop's day of dispatch when the order has one — and the heart draws
 *     a wave as one card (levFulfill.ts). Acts stay one per order on purpose:
 *     the order's effect, its chain, its cancel and the webhooks are all per
 *     order, and two orders paid in the same minute must not race to open
 *     "the" wave act;
 *   - a reminder time for every act with a due time.
 * `planStockLow` is the same engine for `when.event: 'stock.low'` (A3), and the
 * stock an order consumes is planned here too (`consumptions`, via stock.ts).
 */
import { planConsumption, type RecipeRow } from './stock';
import { SHOP_TIME_ZONE, addDays, parseHHMM, zonedParts, zonedToUtcMs } from './time';

export type FulfillmentEvent = 'order.paid' | 'stock.low';
export type StepTarget = 'mission' | 'role' | 'member';
export type StepPer = 'order' | 'line' | 'unit';
export type StepEffect = 'none' | 'markShipped' | 'markFulfilled';
export type ConsentState = 'self' | 'proposed' | 'active' | 'paused';
export type DeliveryPreference = 'pickup' | 'delivery' | 'digital' | 'contact';
export type StepRouting = 'single' | 'roundRobin' | 'leastOpen' | 'onShift';
export type StepBatching = 'perOrder' | 'wave';

/** A running mission, as the planner needs it. */
export interface RunningMission {
  id: string;
  holderId: string | null;
  /** Finished, archived or released — no longer anyone's running work. */
  closed: boolean;
  roleIds: string[];
}

export interface StepWhen {
  event: FulfillmentEvent;
  /** Chain: opens once these steps are done for the order (order steps only). */
  after?: string[];
  /** Only orders with one of these delivery preferences. Absent = every order. */
  deliveryPreference?: DeliveryPreference[];
  /** Only orders shipped to one of these zones of the rikma's shipping config. Absent = any. */
  shippingZones?: string[];
  /** Only orders that chose one of these delivery methods (`m:<zone>:<method>`). */
  shippingMethods?: string[];
  /** Only orders collected at one of these pickup points. */
  pickupPoints?: string[];
  /** Only the lines whose product is in one of these categories (scope `category`). */
  categories?: string[];
  /** `stock.low` only: which resources. Absent = any resource of the rikma. */
  resources?: string[];
}

export interface FulfillmentStepRow {
  id: string;
  name: string;
  position: number;
  target: StepTarget;
  missionId: string | null;
  roleId: string | null;
  memberId: string | null;
  per: StepPer;
  scope: 'rikma' | 'category' | 'product' | 'variant';
  productIds: string[];
  variantIds: string[];
  when: StepWhen;
  dueHours: number | null;
  effect: StepEffect;
  consentState: ConsentState;
  consentedBy: string[];
  archived: boolean;
  /** Absent = `single` (A1). */
  routing?: StepRouting;
  /** Absent = `perOrder` (A1). */
  batching?: StepBatching;
  /** `HH:MM` in the shop's zone — the wave's cut-off. */
  waveAt?: string | null;
}

export interface OrderLineFacts {
  id: string;
  position: number;
  productId: string | null;
  variantId: string | null;
  quantity: number;
  name: string;
  optionLabel: string | null;
  /** The product's categories — read only when a rule asks for them. */
  categoryIds?: string[];
}

export interface OrderFacts {
  id: string;
  ref: string;
  /** What people call it — `#K7Q4XM` or the storefront's number. */
  number: string;
  status: string;
  deliveryPreference: DeliveryPreference | null;
  /** The shipping zone the order travels to (Order.shipping), when known. */
  shippingZoneId?: string | null;
  /** The delivery option the buyer chose (`m:<zone>:<method>` · `p:<point>` · …). */
  shippingMethodId?: string | null;
  pickupPointId?: string | null;
  /** The day the shop promised it leaves (YYYY-MM-DD), when the method has fixed days. */
  dispatchOn?: string | null;
  paidAt: string | null;
  buyerName: string | null;
  /** One line, already flattened: "הרצל 1, נתניה". */
  address: string | null;
  lines: OrderLineFacts[];
}

export interface PlannedAct {
  externalId: string;
  stepId: string;
  lineId: string | null;
  name: string;
  description: string;
  /** The consenting person who gets it. Absent ⇒ open to `roleId`. */
  assignedUserId: string | null;
  missionId: string | null;
  roleId: string | null;
  dueAt: string | null;
  effect: StepEffect;
  /** The wave's day (YYYY-MM-DD) when the step batches in waves. */
  wave?: string | null;
  /** When to remind whoever holds it (a `timegrama` on the act). */
  remindAt?: string | null;
}

export type BlockerCode =
  /** The rule names a mission / role / member that is not there any more. */
  | 'NO_TARGET'
  /** Nobody holds the mission or the role right now. */
  | 'NO_HOLDER'
  /** The person who holds it now never agreed to this rule. */
  | 'NOT_CONSENTED';

export interface Blocker {
  stepId: string;
  code: BlockerCode;
  /** Whether an act still opened (for the role) despite the blocker. */
  openedForRole: boolean;
}

/** What an order takes off a resource's shelf (A3) — see stock.ts. */
export interface PlannedConsumption {
  externalId: string;
  resourceId: string;
  quantity: number;
  /** The order line it is for, and the BOM row that says so. */
  lineId?: string | null;
  recipeId?: string | null;
}
/** B1 fills these; the shape is fixed now. */
export interface PlannedProcurement {
  externalId: string;
  resourceId: string;
  quantity: number;
}

export interface FulfillmentPlan {
  acts: PlannedAct[];
  consumptions: PlannedConsumption[];
  procurements: PlannedProcurement[];
  blockers: Blocker[];
  /** Acts the plan wants that already exist — a retry's no-ops. */
  existing: string[];
  /** Steps that apply to the order but wait for an earlier step of the chain. */
  waiting?: string[];
}

/** Statuses after which an order may still need its paid-order steps. */
const LIVE_AFTER_PAYMENT = new Set(['paid', 'shipped', 'fulfilled']);

/** A line of 300 opens this many unit acts; the last carries the rest (risk 1). */
export const UNIT_CAP = 12;

/** `order:<ref>:step:<id>[:line:<position>[:unit:<k>]]` — principle 6. */
export function fulfillmentExternalId(
  orderRef: string,
  stepId: string,
  linePosition?: number | null,
  unit?: number | null
): string {
  const base = `order:${orderRef}:step:${stepId}`;
  if (linePosition == null) return base;
  const line = `${base}:line:${linePosition}`;
  return unit == null ? line : `${line}:unit:${unit}`;
}

/** The step an order act's externalId belongs to, or null. */
export function stepIdOfExternalId(externalId: string | null | undefined): string | null {
  const m = /^order:.+:step:(\d+)(?::line:\d+(?::unit:\d+)?)?$/.exec(String(externalId ?? ''));
  return m ? m[1] : null;
}

const quantityText = (n: number) => String(Math.round(n * 1000) / 1000);

/** `stock:<resource>:low:<delivered>:step:<id>` — one purchase per refill (A3). */
export function stockLowExternalId(resourceId: string, quantityDelivered: number, stepId: string): string {
  return `stock:${resourceId}:low:${quantityText(quantityDelivered)}:step:${stepId}`;
}

/** The resource a `stock.low` act is about, or null. */
export function resourceIdOfExternalId(externalId: string | null | undefined): string | null {
  const m = /^stock:(\d+):low:/.exec(String(externalId ?? ''));
  return m ? m[1] : null;
}

/** A step fires only once everyone it lands on agreed (or its author is its target). */
export function stepIsLive(step: Pick<FulfillmentStepRow, 'consentState' | 'archived'>): boolean {
  return !step.archived && (step.consentState === 'self' || step.consentState === 'active');
}

const hasAny = (list: string[] | undefined): list is string[] => Array.isArray(list) && list.length > 0;

/** Does this step's `when` match this event on this order? (order-level conditions) */
export function stepMatches(step: FulfillmentStepRow, event: FulfillmentEvent, order: OrderFacts): boolean {
  if ((step.when?.event ?? 'order.paid') !== event) return false;
  const prefs = step.when.deliveryPreference;
  if (prefs && prefs.length > 0) {
    if (!order.deliveryPreference || !prefs.includes(order.deliveryPreference)) return false;
  }
  const zones = step.when.shippingZones;
  if (hasAny(zones) && (!order.shippingZoneId || !zones.includes(order.shippingZoneId))) return false;
  const methods = step.when.shippingMethods;
  if (hasAny(methods) && (!order.shippingMethodId || !methods.includes(order.shippingMethodId))) return false;
  const points = step.when.pickupPoints;
  if (hasAny(points) && (!order.pickupPointId || !points.includes(order.pickupPointId))) return false;
  return true;
}

/** The lines of the order a step is about (its scope). */
export function linesInScope(step: FulfillmentStepRow, lines: OrderLineFacts[]): OrderLineFacts[] {
  if (step.scope === 'product' && step.productIds.length) {
    const ids = new Set(step.productIds);
    return lines.filter((l) => l.productId != null && ids.has(l.productId));
  }
  if (step.scope === 'variant' && step.variantIds.length) {
    const ids = new Set(step.variantIds);
    return lines.filter((l) => l.variantId != null && ids.has(l.variantId));
  }
  const cats = step.when?.categories;
  if (step.scope === 'category' && hasAny(cats)) {
    const ids = new Set(cats);
    return lines.filter((l) => (l.categoryIds ?? []).some((c) => ids.has(c)));
  }
  return lines;
}

// ─── routing ────────────────────────────────────────────────────────────────

/**
 * What routing remembers across the acts of one run (and is seeded from the
 * rikma's recent acts): open automatic acts per person for `leastOpen`, and the
 * last person each step's acts went to for `roundRobin`.
 */
export interface RoutingState {
  load: Map<string, number>;
  lastAssignee: Map<string, string>;
}

export function emptyRouting(): RoutingState {
  return { load: new Map(), lastAssignee: new Map() };
}

/** Record an assignment so the next act of the run sees it. */
export function noteAssignment(routing: RoutingState, stepId: string, userId: string): void {
  routing.lastAssignee.set(stepId, userId);
  routing.load.set(userId, (routing.load.get(userId) ?? 0) + 1);
}

const byNumericId = (a: string, b: string) => {
  const x = Number(a);
  const y = Number(b);
  return Number.isFinite(x) && Number.isFinite(y) && x !== y ? x - y : a.localeCompare(b);
};

export interface Holder {
  userId: string;
  missionId: string;
}

/** The running holders of a role — one entry per person, through their first mission. */
export function roleHolders(roleId: string | null, missions: Map<string, RunningMission>): Holder[] {
  if (!roleId) return [];
  const seen = new Map<string, Holder>();
  const list = [...missions.values()]
    .filter((m) => !m.closed && m.holderId && m.roleIds.includes(roleId))
    .sort((a, b) => byNumericId(a.id, b.id));
  for (const m of list) if (!seen.has(m.holderId!)) seen.set(m.holderId!, { userId: m.holderId!, missionId: m.id });
  return [...seen.values()].sort((a, b) => byNumericId(a.userId, b.userId));
}

/**
 * The next holder under a routing mode, or null when there is nobody but
 * `exclude`. `roundRobin` continues after the step's last assignee;
 * `leastOpen` takes whoever has the fewest open automatic acts, and breaks a
 * tie in round-robin order so a quiet day still spreads the work.
 */
export function pickHolder(
  mode: 'roundRobin' | 'leastOpen',
  stepId: string,
  candidates: Holder[],
  routing: RoutingState,
  exclude?: string | null
): Holder | null {
  const list = candidates.filter((c) => c.userId !== exclude).sort((a, b) => byNumericId(a.userId, b.userId));
  if (list.length === 0) return null;
  const last = routing.lastAssignee.get(stepId) ?? exclude ?? null;
  const start = last == null ? 0 : list.findIndex((c) => byNumericId(c.userId, last) > 0);
  const rotation = start <= 0 ? list : [...list.slice(start), ...list.slice(0, start)];
  if (mode === 'roundRobin') return rotation[0];
  let best = rotation[0];
  for (const c of rotation) if ((routing.load.get(c.userId) ?? 0) < (routing.load.get(best.userId) ?? 0)) best = c;
  return best;
}

type Placement =
  | { kind: 'person'; userId: string; missionId: string | null }
  | { kind: 'role'; roleId: string; blocker: BlockerCode | null }
  | { kind: 'none'; blocker: BlockerCode };

const isRouted = (step: Pick<FulfillmentStepRow, 'target' | 'routing'>) =>
  step.target === 'role' && (step.routing === 'roundRobin' || step.routing === 'leastOpen');

/**
 * Who gets the act.
 *
 * - mission → its holder, inside that mission (principle 4: an act in running
 *   work, never a new mission);
 * - role → under `single`, the one consenting holder of a running mission in
 *   that role; with several (or none who agreed) the act opens for the role
 *   and whoever holds it picks it up. Under `roundRobin` / `leastOpen` one of
 *   the consenting holders is picked. `onShift` reads as `single` until
 *   PLAN_SHIFTS exposes who is on shift;
 * - member → that member.
 */
export function placeStep(
  step: FulfillmentStepRow,
  missions: Map<string, RunningMission>,
  routing?: RoutingState
): Placement {
  const agreed = new Set(step.consentedBy);
  if (step.target === 'mission') {
    const m = step.missionId ? missions.get(step.missionId) : undefined;
    if (!m) return { kind: 'none', blocker: 'NO_TARGET' };
    if (m.closed || !m.holderId) return { kind: 'none', blocker: 'NO_HOLDER' };
    if (!agreed.has(m.holderId)) return { kind: 'none', blocker: 'NOT_CONSENTED' };
    return { kind: 'person', userId: m.holderId, missionId: m.id };
  }
  if (step.target === 'member') {
    if (!step.memberId) return { kind: 'none', blocker: 'NO_TARGET' };
    if (!agreed.has(step.memberId)) return { kind: 'none', blocker: 'NOT_CONSENTED' };
    return { kind: 'person', userId: step.memberId, missionId: null };
  }
  // role
  if (!step.roleId) return { kind: 'none', blocker: 'NO_TARGET' };
  const holders = roleHolders(step.roleId, missions);
  if (holders.length === 0) return { kind: 'role', roleId: step.roleId, blocker: 'NO_HOLDER' };
  const consenting = holders.filter((h) => agreed.has(h.userId));
  if (isRouted(step) && consenting.length > 0) {
    const pick = pickHolder(step.routing as 'roundRobin' | 'leastOpen', step.id, consenting, routing ?? emptyRouting());
    if (pick) return { kind: 'person', userId: pick.userId, missionId: pick.missionId };
  }
  if (holders.length === 1 && consenting.length === 1) {
    return { kind: 'person', userId: consenting[0].userId, missionId: consenting[0].missionId };
  }
  return { kind: 'role', roleId: step.roleId, blocker: consenting.length === 0 ? 'NOT_CONSENTED' : null };
}

// ─── time ───────────────────────────────────────────────────────────────────

/** `<due>` = paid time + dueHours; no paid time ⇒ from `now`. */
export function dueAtOf(paidAt: string | null, dueHours: number | null, now: number): string | null {
  if (dueHours == null || !(dueHours >= 0)) return null;
  const base = paidAt ? Date.parse(paidAt) : now;
  return new Date((Number.isFinite(base) ? base : now) + dueHours * 3600_000).toISOString();
}

/**
 * The wave an order joins: today's if it came before the cut-off, else
 * tomorrow's — and never before the day the shop promised it leaves, so the
 * northern zone that ships on Tuesdays is picked on Tuesday.
 */
export function waveOf(
  baseMs: number,
  atMinutes: number,
  dispatchOn: string | null | undefined,
  timeZone = SHOP_TIME_ZONE
): { day: string; cutoff: string } {
  const p = zonedParts(baseMs, timeZone);
  let day = p.minutes < atMinutes ? p.day : addDays(p.day, 1);
  if (dispatchOn && /^\d{4}-\d{2}-\d{2}$/.test(dispatchOn) && dispatchOn > day) day = dispatchOn;
  return { day, cutoff: new Date(zonedToUtcMs(day, atMinutes, timeZone)).toISOString() };
}

/** When an act is due and which wave it is in. */
export function timingOf(
  step: Pick<FulfillmentStepRow, 'batching' | 'waveAt' | 'dueHours'>,
  input: { paidAt: string | null; chained: boolean; dispatchOn?: string | null; now: number; timeZone?: string }
): { dueAt: string | null; wave: string | null } {
  const base = input.chained ? null : input.paidAt;
  const at = step.batching === 'wave' ? parseHHMM(step.waveAt) : null;
  if (at != null) {
    const baseMs = base ? Date.parse(base) : input.now;
    const w = waveOf(Number.isFinite(baseMs) ? baseMs : input.now, at, input.dispatchOn, input.timeZone);
    const extra = step.dueHours != null && step.dueHours >= 0 ? step.dueHours * 3600_000 : 0;
    return { dueAt: new Date(Date.parse(w.cutoff) + extra).toISOString(), wave: w.day };
  }
  return { dueAt: dueAtOf(base, step.dueHours, input.now), wave: null };
}

/**
 * One reminder, a quarter of the way before the due time (at least 15 minutes,
 * at most 3 hours before it). Nothing under half an hour: the card's own clock
 * already says it.
 */
export function reminderAtOf(fromMs: number, dueAt: string | null): string | null {
  if (!dueAt) return null;
  const due = Date.parse(dueAt);
  if (!Number.isFinite(due)) return null;
  const window = due - fromMs;
  if (window <= 30 * 60_000) return null;
  const lead = Math.min(3 * 3600_000, Math.max(15 * 60_000, window * 0.25));
  return new Date(due - lead).toISOString();
}

// ─── text ───────────────────────────────────────────────────────────────────

function lineLabel(l: OrderLineFacts, quantity = l.quantity): string {
  const name = l.optionLabel ? `${l.name} (${l.optionLabel})` : l.name;
  return `${quantity} × ${name}`;
}

interface Slot {
  line: OrderLineFacts | null;
  unit: number | null;
  /** Units this act carries (unit acts: 1, the last one the rest). */
  quantity: number | null;
  of: number | null;
}

/** The acts one step opens on one order: per order, per line in scope, or per unit. */
function slotsOf(step: FulfillmentStepRow, lines: OrderLineFacts[]): Slot[] {
  if (step.per === 'order') return [{ line: null, unit: null, quantity: null, of: null }];
  if (step.per === 'line') return lines.map((line) => ({ line, unit: null, quantity: null, of: null }));
  const out: Slot[] = [];
  for (const line of lines) {
    const q = Math.max(1, Math.floor(Number(line.quantity) || 1));
    const n = Math.min(q, UNIT_CAP);
    for (let k = 1; k <= n; k++) out.push({ line, unit: k, quantity: k === n ? q - n + 1 : 1, of: q });
  }
  return out;
}

/**
 * The act's own text: what to do and the items, language-neutral on purpose —
 * the heart card draws its labels in the reader's language.
 *
 * **Never the buyer's name, phone or address** (principle 7): an act is
 * mirrored to external systems through the task webhooks, so the stored text
 * is public to them. The card reads those from the order, inside the rikma;
 * exporting an address is `exportAddress`, explicitly, on a rule (A6).
 */
function actText(step: FulfillmentStepRow, order: OrderFacts, lines: OrderLineFacts[], slot: Slot) {
  const { line } = slot;
  if (line && slot.unit != null && slot.of != null) {
    const last = slot.unit + (slot.quantity ?? 1) - 1;
    const range = last > slot.unit ? `${slot.unit}–${last}` : String(slot.unit);
    return {
      name: `${step.name} · ${order.number} · ${line.name} ${range}/${slot.of}`,
      description: lineLabel(line, slot.quantity ?? 1)
    };
  }
  const name = `${step.name} · ${order.number}${line ? ` · ${line.name}` : ''}`;
  return { name, description: (line ? [lineLabel(line)] : lines.map((l) => lineLabel(l))).join('\n') };
}

const afterOf = (s: Pick<FulfillmentStepRow, 'when'>): string[] => (Array.isArray(s.when?.after) ? s.when.after : []);

const byPosition = (a: FulfillmentStepRow, b: FulfillmentStepRow) =>
  a.position - b.position || byNumericId(a.id, b.id);

// ─── the order engine ───────────────────────────────────────────────────────

export function planFulfillment(input: {
  event: 'order.paid';
  order: OrderFacts;
  steps: FulfillmentStepRow[];
  missions: Map<string, RunningMission>;
  /** externalIds of acts already written for this order. */
  existingExternalIds: Iterable<string>;
  now: number;
  /** Steps whose acts for this order are all done — what a chain waits for. */
  doneSteps?: Iterable<string>;
  /** Seeded from the rikma's recent acts; updated as this run assigns. */
  routing?: RoutingState;
  /** The rikma's essence-only BOM rows (A3) — what each line takes off a shelf. */
  recipes?: RecipeRow[];
  timeZone?: string;
}): FulfillmentPlan {
  const { order, steps, missions, now } = input;
  const existingIds = new Set(input.existingExternalIds);
  const plan: FulfillmentPlan = { acts: [], consumptions: [], procurements: [], blockers: [], existing: [], waiting: [] };
  if (!LIVE_AFTER_PAYMENT.has(order.status)) return plan;

  if (input.recipes?.length) plan.consumptions = planConsumption(order, input.recipes);

  const routing = input.routing ?? emptyRouting();
  const done = new Set(input.doneSteps ?? []);
  const orderSteps = steps.filter((s) => (s.when?.event ?? 'order.paid') === 'order.paid');
  const byId = new Map(orderSteps.map((s) => [s.id, s]));

  const stepActs = new Map<string, boolean>();
  for (const x of existingIds) {
    const id = stepIdOfExternalId(x);
    if (id && x.startsWith(`order:${order.ref}:step:`)) stepActs.set(id, true);
  }
  const applies = (s: FulfillmentStepRow) =>
    stepIsLive(s) && stepMatches(s, 'order.paid', order) && linesInScope(s, order.lines).length > 0;

  // A predecessor is settled when its acts for this order are done — or when
  // it never applied to this order and whatever it waited for is settled.
  const memo = new Map<string, boolean>();
  const settled = (id: string, trail: Set<string>): boolean => {
    const known = memo.get(id);
    if (known !== undefined) return known;
    const s = byId.get(id);
    let ok: boolean;
    if (!s) ok = true; // archived, removed, or not an order step: no constraint
    else if (trail.has(id)) ok = true; // a cycle — saving rejects them; never deadlock on one
    else if (stepActs.has(id)) ok = done.has(id);
    else if (applies(s)) ok = false;
    else {
      const next = new Set(trail).add(id);
      ok = afterOf(s).every((p) => settled(p, next));
    }
    memo.set(id, ok);
    return ok;
  };

  for (const step of [...orderSteps].sort(byPosition)) {
    if (!applies(step)) continue;
    const after = afterOf(step);
    if (!after.every((p) => settled(p, new Set([step.id])))) {
      plan.waiting!.push(step.id);
      continue;
    }
    const lines = linesInScope(step, order.lines);

    const first = placeStep(step, missions, routing);
    const blocker = first.kind === 'person' ? null : first.blocker;
    if (blocker) plan.blockers.push({ stepId: step.id, code: blocker, openedForRole: first.kind === 'role' });
    if (first.kind === 'none') continue;

    const timing = timingOf(step, {
      paidAt: order.paidAt,
      chained: after.length > 0,
      dispatchOn: order.dispatchOn ?? null,
      now,
      timeZone: input.timeZone
    });
    for (const slot of slotsOf(step, lines)) {
      const externalId = fulfillmentExternalId(order.ref, step.id, slot.line?.position ?? null, slot.unit);
      if (existingIds.has(externalId)) {
        plan.existing.push(externalId);
        continue;
      }
      const placement = isRouted(step) ? placeStep(step, missions, routing) : first;
      if (placement.kind === 'none') continue;
      if (placement.kind === 'person') noteAssignment(routing, step.id, placement.userId);
      const text = actText(step, order, lines, slot);
      plan.acts.push({
        externalId,
        stepId: step.id,
        lineId: slot.line?.id ?? null,
        name: text.name,
        description: text.description,
        assignedUserId: placement.kind === 'person' ? placement.userId : null,
        missionId: placement.kind === 'person' ? placement.missionId : null,
        roleId: placement.kind === 'role' ? placement.roleId : null,
        dueAt: timing.dueAt,
        effect: step.effect,
        wave: timing.wave,
        remindAt: reminderAtOf(now, timing.dueAt)
      });
    }
  }
  return plan;
}

// ─── the stock engine (A3) ──────────────────────────────────────────────────

export interface StockLowFacts {
  resourceId: string;
  name: string;
  onHand: number;
  lowStockAt: number;
  /** Part of the externalId: a refill raises it, so the next low opens a new act. */
  quantityDelivered: number;
}

/**
 * A resource fell to its threshold ⇒ the `stock.low` steps that cover it each
 * open one act ("buy more jars" for the procurement role). `matched: false`
 * means no rule covers it — the caller tells the resource's giver instead.
 */
export function planStockLow(input: {
  resource: StockLowFacts;
  steps: FulfillmentStepRow[];
  missions: Map<string, RunningMission>;
  existingExternalIds: Iterable<string>;
  now: number;
  routing?: RoutingState;
}): { acts: PlannedAct[]; blockers: Blocker[]; existing: string[]; matched: boolean } {
  const { resource, missions, now } = input;
  const existingIds = new Set(input.existingExternalIds);
  const routing = input.routing ?? emptyRouting();
  const out = { acts: [] as PlannedAct[], blockers: [] as Blocker[], existing: [] as string[], matched: false };
  const steps = input.steps
    .filter((s) => s.when?.event === 'stock.low' && stepIsLive(s))
    .filter((s) => !hasAny(s.when.resources) || s.when.resources.includes(resource.resourceId))
    .sort(byPosition);
  for (const step of steps) {
    out.matched = true;
    const externalId = stockLowExternalId(resource.resourceId, resource.quantityDelivered, step.id);
    if (existingIds.has(externalId)) {
      out.existing.push(externalId);
      continue;
    }
    const placement = placeStep(step, missions, routing);
    if (placement.kind !== 'person') {
      out.blockers.push({ stepId: step.id, code: placement.blocker ?? 'NO_HOLDER', openedForRole: placement.kind === 'role' });
    }
    if (placement.kind === 'none') continue;
    if (placement.kind === 'person') noteAssignment(routing, step.id, placement.userId);
    const dueAt = dueAtOf(null, step.dueHours, now);
    out.acts.push({
      externalId,
      stepId: step.id,
      lineId: null,
      name: `${step.name} · ${resource.name}`,
      description: `${resource.name}: ${quantityText(resource.onHand)} ≤ ${quantityText(resource.lowStockAt)}`,
      assignedUserId: placement.kind === 'person' ? placement.userId : null,
      missionId: placement.kind === 'person' ? placement.missionId : null,
      roleId: placement.kind === 'role' ? placement.roleId : null,
      dueAt,
      effect: 'none',
      wave: null,
      remindAt: reminderAtOf(now, dueAt)
    });
  }
  return out;
}

// ─── rules ──────────────────────────────────────────────────────────────────

export type ChainProblem = 'UNKNOWN_STEP' | 'NOT_ORDER_STEP' | 'CYCLE' | 'SELF';

/**
 * Can `stepId` wait for `after`? Every step named must be a live order step of
 * the rikma, and the chain must not come back to itself — checked when the
 * rule is saved, so the planner never meets a cycle in practice.
 */
export function chainProblem(
  stepId: string | null,
  after: string[],
  steps: Pick<FulfillmentStepRow, 'id' | 'when' | 'archived'>[]
): ChainProblem | null {
  if (after.length === 0) return null;
  const byId = new Map(steps.filter((s) => !s.archived).map((s) => [s.id, s]));
  for (const id of after) {
    if (stepId != null && id === stepId) return 'SELF';
    const s = byId.get(id);
    if (!s) return 'UNKNOWN_STEP';
    if ((s.when?.event ?? 'order.paid') !== 'order.paid') return 'NOT_ORDER_STEP';
  }
  if (stepId == null) return null;
  // Does any predecessor (transitively) wait for this step?
  const stack = [...after];
  const seen = new Set<string>();
  while (stack.length) {
    const id = stack.pop()!;
    if (id === stepId) return 'CYCLE';
    if (seen.has(id)) continue;
    seen.add(id);
    const s = byId.get(id);
    if (s) stack.push(...afterOf(s));
  }
  return null;
}

/**
 * The consent state a step is born in (principle 3, PLAN §2.3): `self` when the
 * only people it lands on are its author; otherwise `proposed`, until each of
 * them agrees — explicitly, or by silence once the rikma's restime runs out
 * on the rule's `fulfillmentRule` Decision (A2, consent.ts).
 */
export function consentStateOf(authorId: string, targetUserIds: string[], consentedBy: string[]): ConsentState {
  const targets = [...new Set(targetUserIds)];
  if (targets.length === 0) return 'proposed';
  const agreed = new Set([...consentedBy, authorId]);
  if (targets.every((t) => t === authorId)) return 'self';
  return targets.every((t) => agreed.has(t)) ? 'active' : 'proposed';
}

/**
 * The people a step lands on today — whose yes it needs. A role step needs
 * every current holder; a new holder agrees as part of taking the role.
 */
export function stepTargetUsers(
  step: Pick<FulfillmentStepRow, 'target' | 'missionId' | 'roleId' | 'memberId'>,
  missions: Map<string, RunningMission>
): string[] {
  if (step.target === 'member') return step.memberId ? [step.memberId] : [];
  if (step.target === 'mission') {
    const m = step.missionId ? missions.get(step.missionId) : undefined;
    return m && !m.closed && m.holderId ? [m.holderId] : [];
  }
  if (!step.roleId) return [];
  return [
    ...new Set(
      [...missions.values()]
        .filter((m) => !m.closed && m.holderId && m.roleIds.includes(step.roleId!))
        .map((m) => m.holderId!)
    )
  ];
}
