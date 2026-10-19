/**
 * applyFulfillment — writes what `planFulfillment` decided
 * (docs/inprogress/PLAN_SHOP_OPERATIONS.md §3, A1).
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
 */
import { orderNumberOf } from '$lib/server/ordersApi.js';
import { planFulfillment, type Blocker, type FulfillmentEvent, type FulfillmentPlan } from '$lib/fulfillment/plan';
import { missionsMapOf, orderFactsOf, stepOf } from '$lib/fulfillment/rows';
import type { ActionContext } from '$lib/server/actions/types.js';
import { readOrderShipping } from '$lib/shop/shipping';

type Strapi = { execute: (qid: string, vars: any, jwt?: any, fetchFn?: any) => Promise<any> };
type RunAction = (key: string, params: Record<string, any>, context: ActionContext) => Promise<{ success: boolean; data?: any; error?: any }>;
type Notifier = { notify: (config: any, params: any, result: any, context: ActionContext) => Promise<void> };

export interface ApplyResult {
  ran: boolean;
  opened: string[];
  existing: string[];
  blockers: Blocker[];
  failed: { externalId: string; error: string }[];
}

const EMPTY: ApplyResult = { ran: false, opened: [], existing: [], blockers: [], failed: [] };

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
  const { event, projectId, orderId, context, strapi, runAction, notifier, announce } = input;
  const run = (qid: string, vars: Record<string, unknown>) => strapi.execute(qid, vars, context.jwt, context.fetch);

  // Until `1.0b` deploys the collection this read fails; that is "no
  // automation", not an error on every paid order.
  let stepsRes: any;
  try {
    stepsRes = await run('fulfillmentSteps', { pid: projectId });
  } catch {
    return EMPTY;
  }
  const steps = (stepsRes?.data?.fulfillmentSteps?.data ?? []).map(stepOf).filter(Boolean);
  // A rikma with no automation pays nothing for this step but one read.
  if (steps.length === 0) return EMPTY;

  const orderRes = await run('fulfillmentOrder', { pid: projectId, id: orderId });
  const node = orderRes?.data?.orders?.data?.[0];
  if (!node) return EMPTY;
  const order = orderFactsOf(node, orderNumberOf(node.attributes?.displayNumber, node.id));
  if (!order) return EMPTY;
  const wasPending = node.attributes?.fulfillmentPending === true;
  // Only a rule narrowed to shipping zones needs the order's zone — read beside
  // the order, so the order query stays valid before `Order.shipping` deploys.
  if (steps.some((st: any) => st?.when?.shippingZones?.length)) {
    try {
      const shipRes = await run('orderShippingById', { pid: projectId, id: orderId });
      order.shippingZoneId = readOrderShipping(shipRes?.data?.orders?.data?.[0]?.attributes?.shipping)?.zoneId ?? null;
    } catch {
      order.shippingZoneId = null;
    }
  }

  const [missionsRes, actsRes] = await Promise.all([
    run('fulfillmentMissions', { pid: projectId }),
    run('fulfillmentOrderActs', { oid: orderId })
  ]);
  const missions = missionsMapOf(missionsRes?.data?.mesimabetahaliches?.data ?? []);
  const existingExternalIds = (actsRes?.data?.acts?.data ?? [])
    .map((a: any) => a?.attributes?.externalId)
    .filter((x: unknown): x is string => typeof x === 'string');

  const plan: FulfillmentPlan = planFulfillment({
    event,
    order,
    steps: steps as NonNullable<ReturnType<typeof stepOf>>[],
    missions,
    existingExternalIds,
    now: Date.now()
  });

  const opened: string[] = [];
  const failed: ApplyResult['failed'] = [];
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
      if (res?.success) opened.push(act.externalId);
      else failed.push({ externalId: act.externalId, error: res?.error?.message ?? 'createTask failed' });
    } catch (err) {
      failed.push({ externalId: act.externalId, error: err instanceof Error ? err.message : String(err) });
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
            url: `moach/${projectId}/sales/manage/orders/${orderId}`,
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

  return { ran: true, opened, existing: plan.existing, blockers: plan.blockers, failed };
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
