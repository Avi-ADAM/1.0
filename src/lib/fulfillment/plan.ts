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
 * A1 scope: `routing: 'single'`, the `order.paid` event. `consumptions` and
 * `procurements` are part of the shape now so A3 (stock) and B1 (BOM) feed the
 * same result instead of growing a second engine.
 */

export type FulfillmentEvent = 'order.paid';
export type StepTarget = 'mission' | 'role' | 'member';
export type StepPer = 'order' | 'line' | 'unit';
export type StepEffect = 'none' | 'markShipped' | 'markFulfilled';
export type ConsentState = 'self' | 'proposed' | 'active' | 'paused';
export type DeliveryPreference = 'pickup' | 'delivery' | 'digital' | 'contact';

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
  /** Only orders with one of these delivery preferences. Absent = every order. */
  deliveryPreference?: DeliveryPreference[];
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
}

export interface OrderLineFacts {
  id: string;
  position: number;
  productId: string | null;
  variantId: string | null;
  quantity: number;
  name: string;
  optionLabel: string | null;
}

export interface OrderFacts {
  id: string;
  ref: string;
  /** What people call it — `#K7Q4XM` or the storefront's number. */
  number: string;
  status: string;
  deliveryPreference: DeliveryPreference | null;
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

/** A3 / B1 fill these; the shape is fixed now. */
export interface PlannedConsumption {
  externalId: string;
  resourceId: string;
  quantity: number;
}
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
}

/** Statuses after which an order may still need its paid-order steps. */
const LIVE_AFTER_PAYMENT = new Set(['paid', 'shipped', 'fulfilled']);

/** `order:<ref>:step:<id>[:line:<position>]` — principle 6. */
export function fulfillmentExternalId(orderRef: string, stepId: string, linePosition?: number | null): string {
  const base = `order:${orderRef}:step:${stepId}`;
  return linePosition == null ? base : `${base}:line:${linePosition}`;
}

/** A step fires only once everyone it lands on agreed (or its author is its target). */
export function stepIsLive(step: Pick<FulfillmentStepRow, 'consentState' | 'archived'>): boolean {
  return !step.archived && (step.consentState === 'self' || step.consentState === 'active');
}

/** Does this step's `when` match this event on this order? */
export function stepMatches(step: FulfillmentStepRow, event: FulfillmentEvent, order: OrderFacts): boolean {
  if (step.when?.event !== event) return false;
  const prefs = step.when.deliveryPreference;
  if (prefs && prefs.length > 0) {
    if (!order.deliveryPreference || !prefs.includes(order.deliveryPreference)) return false;
  }
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
  // `category` has no relation yet (A2); until then it reads as the whole rikma.
  return lines;
}

type Placement =
  | { kind: 'person'; userId: string; missionId: string | null }
  | { kind: 'role'; roleId: string; blocker: BlockerCode | null }
  | { kind: 'none'; blocker: BlockerCode };

/**
 * Who gets the act, under `routing: 'single'`.
 *
 * - mission → its holder, inside that mission (principle 4: an act in running
 *   work, never a new mission);
 * - role → the one consenting holder of a running mission in that role; with
 *   several (or none who agreed) the act opens for the role and whoever holds
 *   it picks it up — `roundRobin` / `leastOpen` are A2;
 * - member → that member.
 */
export function placeStep(step: FulfillmentStepRow, missions: Map<string, RunningMission>): Placement {
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
  const holders = [...missions.values()].filter(
    (m) => !m.closed && m.holderId && m.roleIds.includes(step.roleId!)
  );
  if (holders.length === 0) return { kind: 'role', roleId: step.roleId, blocker: 'NO_HOLDER' };
  const consenting = holders.filter((m) => agreed.has(m.holderId!));
  if (holders.length === 1 && consenting.length === 1) {
    return { kind: 'person', userId: consenting[0].holderId!, missionId: consenting[0].id };
  }
  return { kind: 'role', roleId: step.roleId, blocker: consenting.length === 0 ? 'NOT_CONSENTED' : null };
}

/** `<due>` = paid time + dueHours; no paid time ⇒ from `now`. */
export function dueAtOf(paidAt: string | null, dueHours: number | null, now: number): string | null {
  if (dueHours == null || !(dueHours >= 0)) return null;
  const base = paidAt ? Date.parse(paidAt) : now;
  return new Date((Number.isFinite(base) ? base : now) + dueHours * 3600_000).toISOString();
}

function lineLabel(l: OrderLineFacts): string {
  const name = l.optionLabel ? `${l.name} (${l.optionLabel})` : l.name;
  return `${l.quantity} × ${name}`;
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
function actText(step: FulfillmentStepRow, order: OrderFacts, lines: OrderLineFacts[], line: OrderLineFacts | null) {
  const name = `${step.name} · ${order.number}${line ? ` · ${line.name}` : ''}`;
  return { name, description: (line ? [lineLabel(line)] : lines.map(lineLabel)).join('\n') };
}

export function planFulfillment(input: {
  event: FulfillmentEvent;
  order: OrderFacts;
  steps: FulfillmentStepRow[];
  missions: Map<string, RunningMission>;
  /** externalIds of acts already written for this order. */
  existingExternalIds: Iterable<string>;
  now: number;
}): FulfillmentPlan {
  const { event, order, steps, missions, now } = input;
  const existingIds = new Set(input.existingExternalIds);
  const plan: FulfillmentPlan = { acts: [], consumptions: [], procurements: [], blockers: [], existing: [] };
  if (event === 'order.paid' && !LIVE_AFTER_PAYMENT.has(order.status)) return plan;

  const ordered = [...steps].sort((a, b) => a.position - b.position || Number(a.id) - Number(b.id));
  for (const step of ordered) {
    if (!stepIsLive(step) || !stepMatches(step, event, order)) continue;
    const lines = linesInScope(step, order.lines);
    // A product-scoped step on an order that has none of its products does nothing.
    if (lines.length === 0) continue;

    const placement = placeStep(step, missions);
    const blocker = placement.kind === 'person' ? null : placement.blocker;
    if (blocker) plan.blockers.push({ stepId: step.id, code: blocker, openedForRole: placement.kind === 'role' });
    if (placement.kind === 'none') continue;

    // `unit` is one act per line carrying its quantity — an act per jar would
    // drown the heart (risk 1); the quantity is in the act.
    const targets: (OrderLineFacts | null)[] = step.per === 'order' ? [null] : lines;
    for (const line of targets) {
      const externalId = fulfillmentExternalId(order.ref, step.id, line?.position ?? null);
      if (existingIds.has(externalId)) {
        plan.existing.push(externalId);
        continue;
      }
      const text = actText(step, order, lines, line);
      plan.acts.push({
        externalId,
        stepId: step.id,
        lineId: line?.id ?? null,
        name: text.name,
        description: text.description,
        assignedUserId: placement.kind === 'person' ? placement.userId : null,
        missionId: placement.kind === 'person' ? placement.missionId : null,
        roleId: placement.kind === 'role' ? placement.roleId : null,
        dueAt: dueAtOf(order.paidAt, step.dueHours, now),
        effect: step.effect
      });
    }
  }
  return plan;
}

/**
 * The consent state a step is born in (principle 3, PLAN §2.3): `self` when the
 * only people it lands on are its author; otherwise `proposed`, until each of
 * them agrees. A1 has no silence clock yet — that is the `fulfillmentRule`
 * Decision of A2 — so until then a proposal waits for an explicit yes.
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
 * every current holder; a new holder agrees as part of taking the role (A2).
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
