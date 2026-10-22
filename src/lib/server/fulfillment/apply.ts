/**
 * applyFulfillment — writes what `planFulfillment` decided
 * (docs/inprogress/PLAN_SHOP_OPERATIONS.md §3, A1–A3).
 *
 * Runs as step 5d of the ActionService, after the order and its sales are
 * written: a failure here must never fail an order the buyer already paid for.
 * It reads everything, plans, and opens each missing act **through the
 * `createTask` action** (principle 6) — so the act fires the task webhooks
 * like any other, and the consent check on the step lives in one place.
 *
 * Idempotent: every act carries `order:<ref>:step:<id>…` and the plan skips
 * what exists, so the payment provider's retry, a resumed order and the
 * "try again" button all land here safely. If writing fails the order is
 * flagged `fulfillmentPending` (risk 2) and the rikma is told; a later
 * successful run clears the flag.
 *
 * A2: it runs again whenever an act of the order is completed — the plan opens
 * the next steps of the chain and nothing twice. Routing reads the rikma's
 * recent acts; an act with a due time gets a reminder clock; a role nobody
 * holds turns into a suggestion to publish an open mission.
 * A3: the order's essence-only BOM is taken off the resources' shelves
 * (ledger on the order), and a shelf at its threshold opens the `stock.low`
 * rules' purchase acts.
 */
import { orderNumberOf } from '$lib/server/ordersApi.js';
import {
  emptyRouting,
  planFulfillment,
  stepIdOfExternalId,
  type Blocker,
  type FulfillmentEvent,
  type FulfillmentPlan,
  type RoutingState
} from '$lib/fulfillment/plan';
import { missionsMapOf, orderFactsOf, stepOf, type StepView } from '$lib/fulfillment/rows';
import type { ActionContext } from '$lib/server/actions/types.js';
import { readOrderShipping } from '$lib/shop/shipping';
import { consumeStock, hasStockLinks, loadLedger, loadRecipes, openLowStock, restoreStock, type Run } from './stock';

type Strapi = { execute: (qid: string, vars: any, jwt?: any, fetchFn?: any) => Promise<any> };
type RunAction = (key: string, params: Record<string, any>, context: ActionContext) => Promise<{ success: boolean; data?: any; error?: any }>;
type Notifier = { notify: (config: any, params: any, result: any, context: ActionContext) => Promise<void> };

export interface ApplyResult {
  ran: boolean;
  opened: string[];
  existing: string[];
  blockers: Blocker[];
  failed: { externalId: string; error: string }[];
  /** Chained steps still waiting for an earlier step of this order. */
  waiting?: string[];
  /** Stock moves written for this run (A3). */
  consumed?: number;
  /** Purchase acts a low shelf opened (A3). */
  lowStock?: string[];
}

const EMPTY: ApplyResult = { ran: false, opened: [], existing: [], blockers: [], failed: [] };

/** A step is done for an order once every act it opened for it is done. */
export function doneStepsOf(acts: { externalId: string | null; naasa: boolean }[]): string[] {
  const state = new Map<string, boolean>();
  for (const a of acts) {
    const id = stepIdOfExternalId(a.externalId);
    if (!id) continue;
    state.set(id, (state.get(id) ?? true) && a.naasa);
  }
  return [...state].filter(([, done]) => done).map(([id]) => id);
}

/** Open automatic acts per person and each step's last assignee — what routing remembers. */
export function routingStateOf(acts: any[]): RoutingState {
  const routing = emptyRouting();
  // Newest first (the qid sorts id:desc): the first act seen of a step is its last.
  for (const a of acts) {
    const at = a?.attributes ?? {};
    const who = (at.my?.data ?? []).map((u: any) => String(u.id));
    const step = at.fulfillment_step?.data?.id != null ? String(at.fulfillment_step.data.id) : null;
    if (step && who.length && !routing.lastAssignee.has(step)) routing.lastAssignee.set(step, who[0]);
    if (at.naasa !== true) for (const u of who) routing.load.set(u, (routing.load.get(u) ?? 0) + 1);
  }
  return routing;
}

/** The link that opens the mission form for a role nobody holds (§2.2: "publish an open mission?"). */
export function openMissionHref(projectId: string, roleName: string | null, actId?: string | null): string {
  const q = new URLSearchParams({ action: 'createmission' });
  if (roleName) {
    q.set('name', roleName);
    q.set('roles', roleName);
  }
  if (actId) q.set('fromAct', actId);
  return `moach/${projectId}/create?${q.toString()}`;
}

export async function applyFulfillment(input: {
  event: FulfillmentEvent;
  projectId: string;
  orderId: string;
  context: ActionContext;
  strapi: Strapi;
  runAction: RunAction;
  notifier?: Notifier;
  /** Tell the rikma about blockers — the first run and a manual retry, not every webhook retry. */
  announce: boolean;
}): Promise<ApplyResult> {
  const { projectId, orderId, context, strapi, runAction, notifier, announce } = input;
  if (input.event !== 'order.paid') return EMPTY;
  const run: Run = (qid, vars) => strapi.execute(qid, vars, context.jwt, context.fetch);

  // Until `1.0b` deploys the collection this read fails; that is "no
  // automation", not an error on every paid order.
  let stepsRes: any;
  try {
    stepsRes = await run('fulfillmentSteps', { pid: projectId });
  } catch {
    return EMPTY;
  }
  const steps: StepView[] = (stepsRes?.data?.fulfillmentSteps?.data ?? []).map(stepOf).filter(Boolean);
  // Stock (A3) needs no rule: a product linked to a resource is enough.
  let stockOn = await hasStockLinks(run, projectId);
  // A rikma with neither pays two reads.
  if (steps.length === 0 && !stockOn) return EMPTY;

  const orderRes = await run('fulfillmentOrder', { pid: projectId, id: orderId });
  const node = orderRes?.data?.orders?.data?.[0];
  if (!node) return EMPTY;
  const order = orderFactsOf(node, orderNumberOf(node.attributes?.displayNumber, node.id));
  if (!order) return EMPTY;
  const wasPending = node.attributes?.fulfillmentPending === true;

  // Order.shipping — only when a rule narrows by zone / method / pickup point
  // or batches in waves (the dispatch day). Read beside the order, so the
  // order query stays valid before the field deploys.
  const order$ = steps.filter((s) => s.when.event === 'order.paid' && !s.archived);
  const needsShipping = order$.some(
    (s) => s.when.shippingZones?.length || s.when.shippingMethods?.length || s.when.pickupPoints?.length || s.batching === 'wave'
  );
  if (needsShipping) {
    try {
      const shipRes = await run('orderShippingById', { pid: projectId, id: orderId });
      const ship = readOrderShipping(shipRes?.data?.orders?.data?.[0]?.attributes?.shipping);
      order.shippingZoneId = ship?.zoneId ?? null;
      order.shippingMethodId = ship?.optionId?.startsWith('m:') ? ship.optionId : null;
      order.pickupPointId = ship?.pickupPointId ?? null;
      order.dispatchOn = ship?.nextDispatch ?? null;
    } catch {
      order.shippingZoneId = null;
    }
  }
  // Product categories — only for a rule scoped to categories.
  if (order$.some((s) => s.scope === 'category' && s.when.categories?.length)) {
    try {
      const catRes = await run('fulfillmentOrderCategories', { pid: projectId, id: orderId });
      const byLine = new Map<string, string[]>();
      for (const l of catRes?.data?.orders?.data?.[0]?.attributes?.lines?.data ?? []) {
        const cats = (l?.attributes?.matanot?.data?.attributes?.categories?.data ?? []).map((c: any) => String(c.id));
        byLine.set(String(l.id), cats);
      }
      for (const line of order.lines) line.categoryIds = byLine.get(line.id) ?? [];
    } catch (err) {
      console.warn('[applyFulfillment] could not read categories:', err);
    }
  }

  const routed = order$.some((s) => s.target === 'role' && (s.routing === 'roundRobin' || s.routing === 'leastOpen'));
  const [missionsRes, actsRes, routingRes] = await Promise.all([
    run('fulfillmentMissions', { pid: projectId }),
    run('fulfillmentOrderActs', { oid: orderId }),
    routed ? run('fulfillmentRoutingActs', { pid: projectId }).catch(() => null) : Promise.resolve(null)
  ]);
  const missions = missionsMapOf(missionsRes?.data?.mesimabetahaliches?.data ?? []);
  const orderActs = (actsRes?.data?.acts?.data ?? []).map((a: any) => ({
    externalId: typeof a?.attributes?.externalId === 'string' ? a.attributes.externalId : null,
    naasa: a?.attributes?.naasa === true
  }));
  const existingExternalIds = orderActs.map((a: { externalId: string | null }) => a.externalId).filter((x: string | null): x is string => !!x);
  const routing = routingStateOf(routingRes?.data?.acts?.data ?? []);

  const recipes = stockOn
    ? await loadRecipes(run, projectId, order.lines.map((l) => l.productId ?? '').filter(Boolean))
    : null;
  if (recipes === null) stockOn = false;

  const plan: FulfillmentPlan = planFulfillment({
    event: 'order.paid',
    order,
    steps,
    missions,
    existingExternalIds,
    doneSteps: doneStepsOf(orderActs),
    routing,
    ...(stockOn && recipes ? { recipes } : {}),
    now: Date.now()
  });

  const opened: string[] = [];
  const failed: ApplyResult['failed'] = [];
  const openedIds = new Map<string, string>();
  for (const act of plan.acts) {
    try {
      const res = await runAction(
        'createTask',
        {
          projectId,
          name: act.name,
          description: act.description,
          isAssigned: !!act.assignedUserId,
          ...(act.assignedUserId ? { assignedUserId: act.assignedUserId } : {}),
          ...(act.missionId ? { missionId: act.missionId } : {}),
          ...(act.roleId ? { tafkidims: [act.roleId] } : {}),
          ...(act.dueAt ? { dateF: act.dueAt } : {}),
          hashivut: 'yellow',
          externalId: act.externalId,
          source: 'automation',
          orderId: order.id,
          ...(act.lineId ? { orderLineId: act.lineId } : {}),
          fulfillmentStepId: act.stepId
        },
        context
      );
      if (res?.success) {
        opened.push(act.externalId);
        const id = res.data?.id ?? res.data?.data?.id;
        if (id != null) openedIds.set(act.externalId, String(id));
      } else failed.push({ externalId: act.externalId, error: res?.error?.message ?? 'createTask failed' });
    } catch (err) {
      failed.push({ externalId: act.externalId, error: err instanceof Error ? err.message : String(err) });
    }
  }

  // A reminder before each due time (A2). A missing reminder is not a missing act.
  for (const act of plan.acts) {
    const actId = openedIds.get(act.externalId);
    if (!actId || !act.remindAt) continue;
    try {
      await run('fulfillmentReminderCreate', { date: act.remindAt, act: actId });
    } catch (err) {
      console.warn('[applyFulfillment] could not set a reminder for', act.externalId, err);
    }
  }

  // Stock (A3): what the order takes off each shelf, then the low ones.
  let consumed = 0;
  let lowStock: string[] = [];
  if (stockOn && plan.consumptions.length) {
    const ledger = await loadLedger(run, projectId, orderId);
    if (ledger) {
      try {
        const out = await consumeStock(run, { projectId, orderId, planned: plan.consumptions, ledger });
        consumed = out.applied.length;
        if (out.touched.length) {
          const low = await openLowStock({ projectId, touched: out.touched, steps, missions, routing, run, runAction, notifier, context });
          lowStock = low.opened;
        }
      } catch (err) {
        failed.push({ externalId: `order:${order.ref}:consume`, error: err instanceof Error ? err.message : String(err) });
      }
    }
  }

  // The flag follows the truth: set while something is missing, cleared once whole.
  const pendingNow = failed.length > 0;
  if (pendingNow !== wasPending) {
    try {
      await run('fulfillmentOrderFlag', { id: orderId, pending: pendingNow });
    } catch (err) {
      console.warn('[applyFulfillment] could not write fulfillmentPending:', err);
    }
  }

  if (notifier && (pendingNow || (announce && plan.blockers.length > 0))) {
    // A role nobody holds is not a dead end: suggest publishing an open mission (§2.2).
    const unheld = plan.blockers.find((b) => b.code === 'NO_HOLDER' && steps.find((s) => s.id === b.stepId)?.target === 'role');
    const unheldRole = unheld ? (steps.find((s) => s.id === unheld.stepId)?.roleName ?? null) : null;
    try {
      await notifier.notify(
        {
          recipients: { type: 'projectMembers', config: { projectIdParam: 'projectId' } },
          templates: pendingNow
            ? {
                title: { he: '⚠️ הזמנה נכנסה, אבל המטלות לא נפתחו', en: '⚠️ An order came in, but its tasks did not open' },
                body: {
                  he: `הזמנה ${order.number} נרשמה, אבל ${failed.length} מטלות ביצוע לא נפתחו. אפשר לנסות שוב מעמוד ההזמנה.`,
                  en: `Order ${order.number} was recorded, but ${failed.length} fulfilment tasks did not open. You can try again from the order's page.`
                }
              }
            : unheld
              ? {
                  title: {
                    he: `🧩 אין מי שמחזיק את התפקיד "${unheldRole ?? ''}"`,
                    en: `🧩 Nobody holds the role "${unheldRole ?? ''}"`
                  },
                  body: {
                    he: `בהזמנה ${order.number} נפתחה מטלה לתפקיד שאין לו כרגע מחזיק. לפרסם משימה פתוחה בתפקיד הזה?`,
                    en: `Order ${order.number} opened a task for a role nobody holds right now. Publish an open mission for it?`
                  }
                }
              : {
                  title: { he: '🧩 הזמנה בלי מי שיבצע שלב', en: '🧩 An order step has nobody to do it' },
                  body: {
                    he: `בהזמנה ${order.number} יש ${plan.blockers.length} שלבי ביצוע שאין מי שהסכים לקחת אותם כרגע. אפשר לעדכן את הכלל בלשונית "ביצוע", או לפרסם משימה פתוחה.`,
                    en: `Order ${order.number} has ${plan.blockers.length} fulfilment steps nobody has agreed to take right now. You can update the rule in the "Fulfilment" tab, or publish an open mission.`
                  }
                },
          intent: 'review',
          metadata: {
            type: 'fulfillmentBlocked',
            url:
              !pendingNow && unheld
                ? openMissionHref(projectId, unheldRole)
                : `moach/${projectId}/sales/manage/orders/${orderId}`,
            priority: pendingNow ? 'high' : 'normal'
          }
        },
        { projectId },
        null,
        context
      );
    } catch (err) {
      console.warn('[applyFulfillment] notification failed:', err);
    }
  }

  return {
    ran: true,
    opened,
    existing: plan.existing,
    blockers: plan.blockers,
    failed,
    waiting: plan.waiting ?? [],
    consumed,
    lowStock
  };
}

/**
 * An order was cancelled: its open automatic acts are closed (unpublished,
 * with the reason in the text); an act already done stays as it is (§2.2).
 */
export async function closeFulfillmentActs(input: {
  orderId: string;
  context: ActionContext;
  strapi: Strapi;
}): Promise<string[]> {
  const { orderId, context, strapi } = input;
  const res = await strapi.execute('fulfillmentOrderActs', { oid: orderId }, context.jwt, context.fetch);
  const closed: string[] = [];
  for (const a of res?.data?.acts?.data ?? []) {
    const at = a?.attributes ?? {};
    if (at.naasa === true || !at.publishedAt) continue;
    const des = [at.des, '— ההזמנה בוטלה · order cancelled'].filter(Boolean).join('\n');
    try {
      await strapi.execute('fulfillmentActClose', { id: a.id, des }, context.jwt, context.fetch);
      closed.push(String(a.id));
    } catch (err) {
      console.warn('[closeFulfillmentActs] could not close act', a.id, err);
    }
  }
  return closed;
}

/**
 * The order's status moved outside the card — the orders screen, an API key,
 * an agent (PLAN_SHOP_MCP_TOOLS `updateRikmaOrderStatus`). An order act whose
 * whole point was that change ("Shipped ✓") is done now, through `updateTask`
 * like any other; then the chain runs on (A2), so a step that waits for the
 * shipping does not wait for a stale card. Per-line and per-unit acts are
 * work in their own right and stay as they are. Best-effort: an act that
 * cannot be closed stays open, and its card still completes it.
 */
export async function settleEffectActs(input: {
  projectId: string;
  orderId: string;
  status: 'shipped' | 'fulfilled';
  context: ActionContext;
  strapi: Strapi;
  runAction: RunAction;
  notifier?: Notifier;
}): Promise<{ done: string[] }> {
  const { projectId, orderId, status, context, strapi, runAction } = input;
  // A fulfilled order is past its shipping too.
  const effects = status === 'fulfilled' ? ['markShipped', 'markFulfilled'] : ['markShipped'];
  let nodes: any[];
  try {
    const res = await strapi.execute('fulfillmentOrderEffectActs', { oid: orderId }, context.jwt, context.fetch);
    nodes = res?.data?.acts?.data ?? [];
  } catch {
    return { done: [] }; // not deployed — nothing to follow
  }
  const done: string[] = [];
  for (const a of nodes) {
    const at = a?.attributes ?? {};
    const step = at.fulfillment_step?.data?.attributes;
    if (at.naasa === true || !step || !effects.includes(step.effect) || (step.per ?? 'order') !== 'order') continue;
    try {
      const r = await runAction('updateTask', { id: String(a.id), projectId, naasa: true }, context);
      if (r.success) done.push(String(a.id));
    } catch (err) {
      console.warn('[settleEffectActs] could not close act', a.id, err);
    }
  }
  if (done.length) {
    try {
      await applyFulfillment({ event: 'order.paid', projectId, orderId, context, strapi, runAction, notifier: input.notifier, announce: false });
    } catch (err) {
      console.warn('[settleEffectActs] the chain did not run for order', orderId, err);
    }
  }
  return { done };
}

/**
 * A cancel before shipping gives the resources back what the order took (A3) —
 * the same rule `cancelOrder` restocks the shop by. A rikma without the A3
 * schema has no ledger, and nothing happens.
 */
export async function restoreOrderStock(input: {
  projectId: string;
  orderId: string;
  context: ActionContext;
  strapi: Strapi;
}): Promise<number> {
  const run: Run = (qid, vars) => input.strapi.execute(qid, vars, input.context.jwt, input.context.fetch);
  try {
    const out = await restoreStock(run, { projectId: input.projectId, orderId: input.orderId });
    return out.restored.length;
  } catch (err) {
    console.warn('[restoreOrderStock] could not give the stock back for order', input.orderId, err);
    return 0;
  }
}
