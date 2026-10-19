/**
 * The rikma's order automation (docs/inprogress/PLAN_SHOP_OPERATIONS.md §2, A1).
 *
 *   saveFulfillmentStep     — write a rule. Landing work on someone else is a
 *                             proposal they answer; on yourself it is live at
 *                             once (principle 3). Every edit asks again.
 *   respondFulfillmentStep  — "yes, open these for me". The only other answers
 *                             are to edit the rule (a counter) or talk — never
 *                             a bare no.
 *   setFulfillmentStepPaused — stop / restart. A target pausing withdraws their
 *                             own yes, so nobody else can switch it back on
 *                             over their head.
 *   archiveFulfillmentStep  — the rule stops; acts it already opened stay.
 *   getFulfillmentWork      — my open automatic acts, for the heart.
 *   takeFulfillmentAct      — an act open to my role becomes mine.
 *   completeFulfillmentAct  — done, through `updateTask` (webhooks), and the
 *                             step's effect: "shipped" *is* the status change.
 *   retryOrderFulfillment   — the engine again, for an order whose acts did
 *                             not open (risk 2). Idempotent.
 *
 * Every Strapi call here is a serviceAdmin qid (qidsFulfillment.js); the checks
 * below are the only gate, so they are explicit.
 */
import type { ActionConfig, ActionContext, ActionExecutionHandler } from '../types.js';
import { ActionError } from '../errors.js';
import { scope, scopeList } from '$lib/realtime/scopes.js';
import { orderNumberOf } from '$lib/server/ordersApi.js';
import {
  consentStateOf,
  stepTargetUsers,
  type ConsentState,
  type FulfillmentStepRow
} from '$lib/fulfillment/plan';
import { EFFECTS, PERS, PREFERENCES, TARGETS, missionsMapOf, stepOf, workItemOf, type StepView } from '$lib/fulfillment/rows';

type Strapi = { execute: (qid: string, vars: any, jwt?: any, fetchFn?: any) => Promise<any> };

const runner = (strapi: Strapi, context: ActionContext) => (qid: string, vars: Record<string, unknown>) =>
  strapi.execute(qid, vars, context.jwt, context.fetch);

async function runAction(key: string, params: Record<string, any>, context: ActionContext) {
  const { actionService } = await import('$lib/server/actions/index.js');
  return actionService.executeAction(key, params, context);
}

async function loadStep(strapi: Strapi, context: ActionContext, projectId: string, stepId: string): Promise<StepView> {
  const res = await runner(strapi, context)('fulfillmentStep', { pid: projectId, id: stepId });
  const step = stepOf(res?.data?.fulfillmentSteps?.data?.[0]);
  if (!step || step.archived) throw new ActionError('NOT_FOUND', `No fulfilment step ${stepId} in this rikma`);
  return step;
}

async function loadMissions(strapi: Strapi, context: ActionContext, projectId: string) {
  const res = await runner(strapi, context)('fulfillmentMissions', { pid: projectId });
  return missionsMapOf(res?.data?.mesimabetahaliches?.data ?? []);
}

/** Tell the people a rule lands on that it waits for their yes. */
async function announceProposal(
  notifier: any,
  context: ActionContext,
  projectId: string,
  stepName: string,
  targetIds: string[]
) {
  const ids = targetIds.filter((id) => id !== String(context.userId));
  if (!notifier || ids.length === 0) return;
  try {
    await notifier.notify(
      {
        recipients: { type: 'specificUsers', config: { userIdsParam: 'targetIds', projectIdParam: 'projectId' } },
        templates: {
          title: { he: '🧩 הצעה: מטלות אוטומטיות בשבילך', en: '🧩 Proposal: automatic tasks for you' },
          body: {
            he: `הוצע שכל הזמנה מתאימה תפתח לך מטלת "${stepName}". שום מטלה לא תיפתח לך לפני שתסכים/י — אפשר לאשר, לשנות את הכלל או לדבר על זה.`,
            en: `It was proposed that every matching order opens a "${stepName}" task for you. Nothing opens for you until you agree — you can approve, change the rule or talk it over.`
          }
        },
        intent: 'consent',
        metadata: { type: 'fulfillmentRule', url: `moach/${projectId}/sales/manage/fulfillment`, priority: 'normal' }
      },
      { projectId, targetIds: ids },
      null,
      context
    );
  } catch (err) {
    console.warn('[fulfillment] proposal notification failed:', err);
  }
}

const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);

// ── saveFulfillmentStep ───────────────────────────────────────────────────────

const saveStep: ActionExecutionHandler = async (params, context, { strapi, notifier }) => {
  const projectId = String(params.projectId);
  const actor = String(context.userId);
  const run = runner(strapi, context);

  const name = str(params.name);
  if (!name || name.length > 80) throw new ActionError('VALIDATION_FAILED', 'name is required (up to 80 characters)');
  const target = params.target;
  if (!(TARGETS as readonly string[]).includes(target)) throw new ActionError('VALIDATION_FAILED', 'target must be mission, role or member');
  const per = params.per ?? 'order';
  if (!(PERS as readonly string[]).includes(per)) throw new ActionError('VALIDATION_FAILED', 'per must be order, line or unit');
  const effect = params.effect ?? 'none';
  if (!(EFFECTS as readonly string[]).includes(effect)) throw new ActionError('VALIDATION_FAILED', 'effect is not known');
  const prefs: string[] = Array.isArray(params.deliveryPreference) ? params.deliveryPreference : [];
  if (prefs.some((p) => !(PREFERENCES as readonly string[]).includes(p))) {
    throw new ActionError('VALIDATION_FAILED', 'deliveryPreference has an unknown value');
  }
  const dueHours = params.dueHours == null || params.dueHours === '' ? null : Number(params.dueHours);
  if (dueHours != null && !(Number.isInteger(dueHours) && dueHours >= 0 && dueHours <= 24 * 60)) {
    throw new ActionError('VALIDATION_FAILED', 'dueHours must be a whole number of hours');
  }

  // The target must be of this rikma.
  const missions = await loadMissions(strapi, context, projectId);
  const missionId = target === 'mission' ? str(String(params.missionId ?? '')) : null;
  const roleId = target === 'role' ? str(String(params.roleId ?? '')) : null;
  const memberId = target === 'member' ? str(String(params.memberId ?? '')) : null;
  if (target === 'mission' && (!missionId || !missions.has(missionId))) {
    throw new ActionError('NOT_FOUND', 'That mission is not in this rikma');
  }
  if (target === 'role' && (!roleId || ![...missions.values()].some((m) => m.roleIds.includes(roleId)))) {
    throw new ActionError('NOT_FOUND', 'No mission in this rikma has that role');
  }
  if (target === 'member') {
    const res = await run('128getProjectMembersAndRestime', { pid: projectId });
    const memberIds = (res?.data?.project?.data?.attributes?.user_1s?.data ?? []).map((u: any) => String(u.id));
    if (!memberId || !memberIds.includes(memberId)) throw new ActionError('NOT_FOUND', 'That person is not a member of this rikma');
  }

  const draft = { target, missionId, roleId, memberId } as Pick<FulfillmentStepRow, 'target' | 'missionId' | 'roleId' | 'memberId'>;
  const targets = stepTargetUsers(draft, missions);
  // Any change of terms asks again (principle 3) — the author's own yes counts
  // when the rule lands on them.
  const consentedBy = targets.includes(actor) ? [actor] : [];
  const consentState: ConsentState = consentStateOf(actor, targets, consentedBy);

  const data: Record<string, unknown> = {
    project: projectId,
    name,
    target,
    mesimabetahalich: missionId,
    tafkidim: roleId,
    member: memberId,
    per,
    scope: 'rikma',
    when: { event: 'order.paid', ...(prefs.length ? { deliveryPreference: prefs } : {}) },
    dueHours,
    effect,
    routing: 'single',
    batching: 'perOrder',
    consentState,
    consentedBy,
    proposedBy: actor
  };
  if (typeof params.position === 'number') data.position = params.position;

  let stepId: string;
  if (params.stepId) {
    const existing = await loadStep(strapi, context, projectId, String(params.stepId));
    stepId = existing.id;
    await run('fulfillmentStepUpdate', { id: stepId, data });
  } else {
    const res = await run('fulfillmentStepCreate', { data });
    const id = res?.data?.createFulfillmentStep?.data?.id;
    if (!id) throw new Error('Failed to create the fulfilment step');
    stepId = String(id);
  }

  if (consentState === 'proposed') await announceProposal(notifier, context, projectId, name, targets);
  return { stepId, consentState, waitingFor: targets.filter((t) => !consentedBy.includes(t)) };
};

// ── respondFulfillmentStep ────────────────────────────────────────────────────

const respondStep: ActionExecutionHandler = async (params, context, { strapi }) => {
  const projectId = String(params.projectId);
  const actor = String(context.userId);
  const step = await loadStep(strapi, context, projectId, String(params.stepId));
  const missions = await loadMissions(strapi, context, projectId);
  const targets = stepTargetUsers(step, missions);
  if (!targets.includes(actor)) {
    throw new ActionError('NOT_TARGET', 'Only the people this rule lands on answer it');
  }
  const consentedBy = [...new Set([...step.consentedBy, actor])];
  const consentState: ConsentState =
    step.consentState === 'paused' ? 'paused' : consentStateOf(step.proposedById ?? actor, targets, consentedBy);
  await runner(strapi, context)('fulfillmentStepUpdate', { id: step.id, data: { consentedBy, consentState } });
  return { stepId: step.id, consentState, waitingFor: targets.filter((t) => !consentedBy.includes(t)) };
};

// ── setFulfillmentStepPaused ──────────────────────────────────────────────────

const pauseStep: ActionExecutionHandler = async (params, context, { strapi }) => {
  const projectId = String(params.projectId);
  const actor = String(context.userId);
  const step = await loadStep(strapi, context, projectId, String(params.stepId));
  const missions = await loadMissions(strapi, context, projectId);
  const targets = stepTargetUsers(step, missions);
  const isTarget = targets.includes(actor);
  if (!isTarget && step.proposedById !== actor) {
    throw new ActionError('NOT_ALLOWED', 'Only the rule’s author or the people it lands on can pause or restart it');
  }
  let consentedBy = step.consentedBy;
  let consentState: ConsentState;
  if (params.paused === true) {
    // Pausing as a target is taking back my own yes.
    if (isTarget) consentedBy = consentedBy.filter((id) => id !== actor);
    consentState = 'paused';
  } else {
    if (isTarget) consentedBy = [...new Set([...consentedBy, actor])];
    consentState = consentStateOf(step.proposedById ?? actor, targets, consentedBy);
  }
  await runner(strapi, context)('fulfillmentStepUpdate', { id: step.id, data: { consentedBy, consentState } });
  return { stepId: step.id, consentState };
};

// ── archiveFulfillmentStep ────────────────────────────────────────────────────

const archiveStep: ActionExecutionHandler = async (params, context, { strapi }) => {
  const projectId = String(params.projectId);
  const step = await loadStep(strapi, context, projectId, String(params.stepId));
  await runner(strapi, context)('fulfillmentStepUpdate', { id: step.id, data: { archived: true, consentState: 'paused' } });
  return { stepId: step.id, archived: true };
};

// ── getFulfillmentWork ────────────────────────────────────────────────────────

const getWork: ActionExecutionHandler = async (_params, context, { strapi }) => {
  const uid = String(context.userId);
  let res: any;
  try {
    res = await runner(strapi, context)('fulfillmentMyActs', { uid });
  } catch {
    // Before `1.0b` deploys `Act.fulfillment_step` the heart simply has no such cards.
    return { data: { items: [] }, updateStrategy: { type: 'none' } };
  }
  const items = (res?.data?.acts?.data ?? [])
    .map((n: any) => workItemOf(n, uid, (d, id) => orderNumberOf(d as string, id as string)))
    .filter(Boolean)
    // An act whose order was cancelled meanwhile is not work any more.
    .filter((w: any) => w.orderStatus !== 'cancelled');
  return { data: { items }, updateStrategy: { type: 'none' } };
};

// ── take / complete ───────────────────────────────────────────────────────────

async function loadAct(strapi: Strapi, context: ActionContext, projectId: string, actId: string) {
  const res = await runner(strapi, context)('fulfillmentAct', { id: actId });
  const node = res?.data?.act?.data;
  const a = node?.attributes;
  if (!a || String(a.project?.data?.id ?? '') !== projectId || !a.fulfillment_step?.data) {
    throw new ActionError('NOT_FOUND', `No automatic task ${actId} in this rikma`);
  }
  return {
    id: String(node.id),
    done: a.naasa === true,
    assignees: (a.my?.data ?? []).map((u: any) => String(u.id)),
    roleIds: (a.tafkidims?.data ?? []).map((r: any) => String(r.id)),
    missionIds: (a.mesimabetahaliches?.data ?? []).map((m: any) => String(m.id)),
    orderRef: a.order?.data?.attributes?.ref ?? null,
    orderStatus: a.order?.data?.attributes?.status ?? null,
    effect: a.fulfillment_step.data.attributes?.effect ?? 'none'
  };
}

/** The running mission through which `actor` holds one of these roles, if any. */
async function myMissionInRole(strapi: Strapi, context: ActionContext, projectId: string, actor: string, roleIds: string[]) {
  const missions = await loadMissions(strapi, context, projectId);
  return [...missions.values()].find((m) => !m.closed && m.holderId === actor && m.roleIds.some((r) => roleIds.includes(r))) ?? null;
}

async function take(strapi: Strapi, context: ActionContext, projectId: string, act: Awaited<ReturnType<typeof loadAct>>) {
  const actor = String(context.userId);
  if (act.assignees.includes(actor)) return;
  if (act.assignees.length > 0) throw new ActionError('TAKEN', 'Someone else already took this task');
  const mission = await myMissionInRole(strapi, context, projectId, actor, act.roleIds);
  if (!mission) throw new ActionError('NOT_IN_ROLE', 'This task is open to a role you do not hold in this rikma');
  const r = await runAction(
    'updateTask',
    { id: act.id, projectId, uid: [actor], mesimabetahaliches: [mission.id], isAssigned: true, myIshur: true },
    context
  );
  if (!r.success) throw new ActionError('TAKE_FAILED', r.error?.message ?? 'Could not take the task');
}

const takeAct: ActionExecutionHandler = async (params, context, { strapi }) => {
  const projectId = String(params.projectId);
  const act = await loadAct(strapi, context, projectId, String(params.actId));
  if (act.done) return { actId: act.id, taken: false, done: true };
  await take(strapi, context, projectId, act);
  return { actId: act.id, taken: true };
};

const completeAct: ActionExecutionHandler = async (params, context, { strapi }) => {
  const projectId = String(params.projectId);
  const act = await loadAct(strapi, context, projectId, String(params.actId));
  if (!act.done) {
    if (act.orderStatus === 'cancelled') throw new ActionError('ORDER_CANCELLED', 'The order was cancelled — this task is closed');
    // An act still open to the role is taken by whoever finishes it.
    await take(strapi, context, projectId, act);
    const r = await runAction('updateTask', { id: act.id, projectId, naasa: true }, context);
    if (!r.success) throw new ActionError('COMPLETE_FAILED', r.error?.message ?? 'Could not mark the task done');
  }

  // The effect — "shipped" on the card *is* the order's status change.
  let effect: { key: string; ok: boolean; status?: string; error?: string } | null = null;
  const key = act.effect === 'markShipped' ? 'markOrderShipped' : act.effect === 'markFulfilled' ? 'markOrderFulfilled' : null;
  if (key && act.orderRef) {
    const r = await runAction(key, { projectId, orderRef: act.orderRef }, context);
    effect = r.success
      ? { key, ok: true, status: (r.data as any)?.status }
      : { key, ok: false, error: r.error?.message };
  }
  return { actId: act.id, done: true, effect };
};

// ── retryOrderFulfillment ─────────────────────────────────────────────────────

const retryOrder: ActionExecutionHandler = async (params, context, { strapi, notifier }) => {
  const projectId = String(params.projectId);
  const { applyFulfillment } = await import('$lib/server/fulfillment/apply.js');
  const result = await applyFulfillment({
    event: 'order.paid',
    projectId,
    orderId: String(params.orderId),
    context,
    strapi,
    runAction,
    notifier: notifier as any,
    announce: true
  });
  return { orderId: String(params.orderId), ...result };
};

// ── configs ───────────────────────────────────────────────────────────────────

const memberRules = (what: string) => [
  { type: 'jwt' as const, errorMessage: `Must be authenticated to ${what}` },
  {
    type: 'projectMember' as const,
    config: { projectIdParam: 'projectId' },
    errorMessage: `Only rikma members can ${what}`
  }
];

const stepScopes = (p: Record<string, any>) => scopeList([scope('project', p.projectId)]);
const actScopes = (p: Record<string, any>) => scopeList([scope('project', p.projectId), scope('act', p.actId)]);

const STEP_PARAMS = {
  projectId: { type: 'string' as const, required: true },
  stepId: { type: 'string' as const, required: true }
};
const ACT_PARAMS = {
  projectId: { type: 'string' as const, required: true },
  actId: { type: 'string' as const, required: true }
};

export const saveFulfillmentStepConfig: ActionConfig = {
  key: 'saveFulfillmentStep',
  description:
    "Create or edit a rule of the rikma's order automation: an order event opens an act for a running mission, a role or a member. Live at once when it lands only on its author; otherwise proposed until each person it lands on agrees. Every edit asks again.",
  graphqlOperation: saveStep,
  paramSchema: {
    projectId: { type: 'string', required: true },
    stepId: { type: 'string', required: false, description: 'Absent = a new rule' },
    name: { type: 'string', required: true },
    target: { type: 'string', required: true, description: 'mission | role | member' },
    missionId: { type: 'string', required: false },
    roleId: { type: 'string', required: false },
    memberId: { type: 'string', required: false },
    per: { type: 'string', required: false, description: 'order (default) | line | unit' },
    deliveryPreference: { type: 'array', required: false, description: 'Only orders with these delivery preferences' },
    dueHours: { type: 'number', required: false },
    effect: { type: 'string', required: false, description: 'none | markShipped | markFulfilled' },
    position: { type: 'number', required: false }
  },
  authRules: memberRules('change the order automation'),
  realtime: { scopes: stepScopes }
};

export const respondFulfillmentStepConfig: ActionConfig = {
  key: 'respondFulfillmentStep',
  description: 'Agree to a proposed automation rule that lands on you. To disagree, edit the rule or talk it over.',
  graphqlOperation: respondStep,
  paramSchema: STEP_PARAMS,
  authRules: memberRules('answer an automation rule'),
  realtime: { scopes: stepScopes }
};

export const setFulfillmentStepPausedConfig: ActionConfig = {
  key: 'setFulfillmentStepPaused',
  description: "Pause or restart an automation rule (its author or the people it lands on). A target pausing withdraws their own consent.",
  graphqlOperation: pauseStep,
  paramSchema: { ...STEP_PARAMS, paused: { type: 'boolean', required: true } },
  authRules: memberRules('pause an automation rule'),
  realtime: { scopes: stepScopes }
};

export const archiveFulfillmentStepConfig: ActionConfig = {
  key: 'archiveFulfillmentStep',
  description: 'Stop an automation rule for good; acts it already opened stay as they are.',
  graphqlOperation: archiveStep,
  paramSchema: STEP_PARAMS,
  authRules: memberRules('remove an automation rule'),
  realtime: { scopes: stepScopes }
};

export const getFulfillmentWorkConfig: ActionConfig = {
  key: 'getFulfillmentWork',
  description: "The caller's open automatic acts (assigned to them, or open to a role they hold), for the heart's fulfil cards.",
  graphqlOperation: getWork,
  paramSchema: {},
  authRules: [{ type: 'jwt' }],
  updateStrategy: { type: 'none' }
};

export const takeFulfillmentActConfig: ActionConfig = {
  key: 'takeFulfillmentAct',
  description: 'Take an automatic act that is open to a role you hold; it opens inside your running mission.',
  graphqlOperation: takeAct,
  paramSchema: ACT_PARAMS,
  authRules: memberRules('take a task'),
  realtime: { scopes: actScopes }
};

export const completeFulfillmentActConfig: ActionConfig = {
  key: 'completeFulfillmentAct',
  description: "Mark an automatic act done (through updateTask) and run its step's effect on the order: shipped / delivered.",
  graphqlOperation: completeAct,
  paramSchema: ACT_PARAMS,
  authRules: memberRules('complete a task'),
  realtime: { scopes: actScopes }
};

export const retryOrderFulfillmentConfig: ActionConfig = {
  key: 'retryOrderFulfillment',
  description: "Run the order automation again for one paid order — opens only the acts still missing.",
  graphqlOperation: retryOrder,
  paramSchema: {
    projectId: { type: 'string', required: true },
    orderId: { type: 'string', required: true }
  },
  authRules: memberRules('retry an order'),
  realtime: { scopes: stepScopes }
};

export const fulfillmentActionConfigs: ActionConfig[] = [
  saveFulfillmentStepConfig,
  respondFulfillmentStepConfig,
  setFulfillmentStepPausedConfig,
  archiveFulfillmentStepConfig,
  getFulfillmentWorkConfig,
  takeFulfillmentActConfig,
  completeFulfillmentActConfig,
  retryOrderFulfillmentConfig
];
