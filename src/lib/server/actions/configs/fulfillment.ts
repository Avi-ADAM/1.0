/**
 * The rikma's order automation (docs/inprogress/PLAN_SHOP_OPERATIONS.md §2, A1–A2).
 *
 *   saveFulfillmentStep     — write a rule. Landing work on someone else is a
 *                             proposal they answer; on yourself it is live at
 *                             once (principle 3). Every edit asks again: a new
 *                             round on the rule's `fulfillmentRule` Decision,
 *                             and silence within restime is consent (A2). An
 *                             edit by someone the rule lands on is their
 *                             counter-proposal — same thing, same clock reset.
 *   respondFulfillmentStep  — "yes, open these for me". The only other answers
 *                             are to edit the rule (a counter) or talk — never
 *                             a bare no.
 *   setFulfillmentStepPaused — stop / restart. A target pausing withdraws their
 *                             own yes, so nobody else can switch it back on
 *                             over their head — and silence will not either.
 *   archiveFulfillmentStep  — the rule stops; acts it already opened stay.
 *   getFulfillmentWork      — my open automatic acts and the rules waiting for
 *                             my answer, for the heart.
 *   takeFulfillmentAct      — an act open to my role (or to everyone) becomes mine.
 *   completeFulfillmentAct  — done, through `updateTask` (webhooks), the step's
 *                             effect ("shipped" *is* the status change), and
 *                             the next steps of the chain open (A2).
 *   completeFulfillmentWave — a wave's acts at once — one card, one tap (A2).
 *   handOffFulfillmentAct   — "pass to someone else": the next consenting
 *                             holder by the rule's routing, else open to the
 *                             role — and when nobody holds it, the rikma is
 *                             offered to publish an open mission (§2.2).
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
  chainProblem,
  consentStateOf,
  pickHolder,
  roleHolders,
  stepTargetUsers,
  type ConsentState,
  type FulfillmentStepRow
} from '$lib/fulfillment/plan';
import { readShippingConfig } from '$lib/server/shop/shippingConfig.js';
import {
  BATCHINGS,
  EFFECTS,
  PERS,
  PREFERENCES,
  ROUTINGS,
  TARGETS,
  missionsMapOf,
  stepOf,
  workItemOf,
  type FulfillWorkItem,
  type RuleProposal,
  type StepView
} from '$lib/fulfillment/rows';
import { parseHHMM } from '$lib/fulfillment/time';
import { onHandOf, stockResourceOf } from '$lib/fulfillment/stock';
import { readOrderShipping } from '$lib/shop/shipping';
import {
  answerRule,
  closeRuleDecisions,
  openRuleRound,
  ruleDeadlines,
  withdrawFromRule
} from '$lib/server/fulfillment/consent';
import { openMissionHref, routingStateOf } from '$lib/server/fulfillment/apply';

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

const fmtDeadline = (iso: string, lang: 'he' | 'en') => {
  try {
    return new Intl.DateTimeFormat(lang === 'he' ? 'he-IL' : 'en-GB', {
      timeZone: 'Asia/Jerusalem',
      weekday: 'short',
      day: 'numeric',
      month: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

/** Tell the people a rule lands on that it waits for their yes — and until when. */
async function announceProposal(
  notifier: any,
  context: ActionContext,
  projectId: string,
  stepName: string,
  targetIds: string[],
  deadline: string | null,
  counter: boolean
) {
  const ids = targetIds.filter((id) => id !== String(context.userId));
  if (!notifier || ids.length === 0) return;
  const silence = deadline
    ? {
        he: ` אם לא תהיה תגובה עד ${fmtDeadline(deadline, 'he')} — זו הסכמה.`,
        en: ` If there is no answer by ${fmtDeadline(deadline, 'en')}, that counts as consent.`
      }
    : { he: ' שום מטלה לא תיפתח לך לפני שתסכים/י.', en: ' Nothing opens for you until you agree.' };
  try {
    await notifier.notify(
      {
        recipients: { type: 'specificUsers', config: { userIdsParam: 'targetIds', projectIdParam: 'projectId' } },
        templates: {
          title: counter
            ? { he: `🧩 הצעה נגדית לכלל "${stepName}"`, en: `🧩 A counter-proposal on "${stepName}"` }
            : { he: '🧩 הצעה: מטלות אוטומטיות בשבילך', en: '🧩 Proposal: automatic tasks for you' },
          body: {
            he: `${counter ? `הכלל "${stepName}" שונה.` : `הוצע שכל הזמנה מתאימה תפתח לך מטלת "${stepName}".`}${silence.he} אפשר לאשר, לשנות את הכלל או לדבר על זה.`,
            en: `${counter ? `The rule "${stepName}" was changed.` : `It was proposed that every matching order opens a "${stepName}" task for you.`}${silence.en} You can approve, change the rule or talk it over.`
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
const idList = (v: unknown, max = 50): string[] =>
  Array.isArray(v) ? [...new Set(v.map((x) => String(x ?? '').trim()).filter((x) => /^\d{1,12}$/.test(x)))].slice(0, max) : [];
const textList = (v: unknown, max = 50): string[] =>
  Array.isArray(v) ? [...new Set(v.map((x) => String(x ?? '').trim()).filter(Boolean))].slice(0, max) : [];

// ── saveFulfillmentStep ───────────────────────────────────────────────────────

const SCOPES = ['rikma', 'category', 'product', 'variant'] as const;

const saveStep: ActionExecutionHandler = async (params, context, { strapi, notifier }) => {
  const projectId = String(params.projectId);
  const actor = String(context.userId);
  const run = runner(strapi, context);

  const name = str(params.name);
  if (!name || name.length > 80) throw new ActionError('VALIDATION_FAILED', 'name is required (up to 80 characters)');
  const target = params.target;
  if (!(TARGETS as readonly string[]).includes(target)) throw new ActionError('VALIDATION_FAILED', 'target must be mission, role or member');
  const event = params.event === 'stock.low' ? 'stock.low' : 'order.paid';
  const stock = event === 'stock.low';

  const per = stock ? 'order' : (params.per ?? 'order');
  if (!(PERS as readonly string[]).includes(per)) throw new ActionError('VALIDATION_FAILED', 'per must be order, line or unit');
  const effect = stock ? 'none' : (params.effect ?? 'none');
  if (!(EFFECTS as readonly string[]).includes(effect)) throw new ActionError('VALIDATION_FAILED', 'effect is not known');
  const routing = params.routing ?? 'single';
  if (!(ROUTINGS as readonly string[]).includes(routing)) throw new ActionError('VALIDATION_FAILED', 'routing must be single, roundRobin, leastOpen or onShift');
  const batching = stock ? 'perOrder' : (params.batching ?? 'perOrder');
  if (!(BATCHINGS as readonly string[]).includes(batching)) throw new ActionError('VALIDATION_FAILED', 'batching must be perOrder or wave');
  const waveAt = batching === 'wave' ? str(params.waveAt) : null;
  if (batching === 'wave' && parseHHMM(waveAt) == null) throw new ActionError('VALIDATION_FAILED', 'A wave needs its hour (waveAt, HH:MM)');

  const scopeKind = stock ? 'rikma' : (params.scope ?? 'rikma');
  if (!(SCOPES as readonly string[]).includes(scopeKind)) throw new ActionError('VALIDATION_FAILED', 'scope must be rikma, category, product or variant');
  const categories = scopeKind === 'category' ? idList(params.categories, 20) : [];
  if (scopeKind === 'category' && categories.length === 0) throw new ActionError('VALIDATION_FAILED', 'A category rule names at least one category');
  const productIds = scopeKind === 'product' ? idList(params.productIds) : [];
  if (scopeKind === 'product') {
    if (productIds.length === 0) throw new ActionError('VALIDATION_FAILED', 'A product rule names at least one product');
    const res = await run('fulfillmentProducts', { pid: projectId, ids: productIds });
    const found = new Set((res?.data?.matanots?.data ?? []).map((m: any) => String(m.id)));
    if (productIds.some((p) => !found.has(p))) throw new ActionError('NOT_FOUND', 'A product of the rule is not of this rikma');
  }
  if (scopeKind === 'variant') throw new ActionError('VALIDATION_FAILED', 'Variant rules are not offered yet — use the product');

  const prefs: string[] = stock ? [] : Array.isArray(params.deliveryPreference) ? params.deliveryPreference : [];
  if (prefs.some((p) => !(PREFERENCES as readonly string[]).includes(p))) {
    throw new ActionError('VALIDATION_FAILED', 'deliveryPreference has an unknown value');
  }
  const zones = stock ? [] : textList(params.shippingZones);
  const methods = stock ? [] : textList(params.shippingMethods);
  const points = stock ? [] : textList(params.pickupPoints);
  if (zones.length || methods.length || points.length) {
    const { config } = await readShippingConfig(run, projectId);
    const zoneIds = new Set(config.zones.map((z) => z.id));
    const methodIds = new Set(config.zones.flatMap((z) => z.methods.map((m) => `m:${z.id}:${m.id}`)));
    const pointIds = new Set(config.pickupPoints.map((p) => p.id));
    if (zones.some((z) => !zoneIds.has(z))) throw new ActionError('NOT_FOUND', 'shippingZones names a zone this rikma does not have');
    if (methods.some((m) => !methodIds.has(m))) throw new ActionError('NOT_FOUND', 'shippingMethods names a delivery method this rikma does not have');
    if (points.some((p) => !pointIds.has(p))) throw new ActionError('NOT_FOUND', 'pickupPoints names a pickup point this rikma does not have');
  }

  const dueHours = params.dueHours == null || params.dueHours === '' ? null : Number(params.dueHours);
  if (dueHours != null && !(Number.isInteger(dueHours) && dueHours >= 0 && dueHours <= 24 * 60)) {
    throw new ActionError('VALIDATION_FAILED', 'dueHours must be a whole number of hours');
  }

  // A chain waits only for order steps of this rikma, and never comes back to itself.
  const after = stock ? [] : idList(params.after, 10);
  const stepsRes = after.length ? await run('fulfillmentSteps', { pid: projectId }) : null;
  if (after.length) {
    const all = (stepsRes?.data?.fulfillmentSteps?.data ?? []).map(stepOf).filter(Boolean) as StepView[];
    const problem = chainProblem(params.stepId ? String(params.stepId) : null, after, all);
    if (problem) {
      const msg: Record<string, string> = {
        UNKNOWN_STEP: 'A step this rule waits for is not in this rikma',
        NOT_ORDER_STEP: 'A rule can only wait for steps of an order',
        SELF: 'A rule cannot wait for itself',
        CYCLE: 'That would make the steps wait for each other in a circle'
      };
      throw new ActionError('VALIDATION_FAILED', msg[problem]);
    }
  }

  // stock.low: which resources (absent = any resource of the rikma).
  const resources = stock ? idList(params.resources) : [];
  if (resources.length) {
    let found: string[] = [];
    try {
      const res = await run('stockResourcesByIds', { ids: resources });
      found = (res?.data?.mashabetahaliches?.data ?? [])
        .map(stockResourceOf)
        .filter((r: any) => r && r.projectId === projectId)
        .map((r: any) => r.id);
    } catch {
      throw new ActionError('NOT_READY', 'Stock from resources is not available yet');
    }
    if (resources.some((r) => !found.includes(r))) throw new ActionError('NOT_FOUND', 'A resource of the rule is not of this rikma');
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

  const when: Record<string, unknown> = stock
    ? { event, ...(resources.length ? { resources } : {}) }
    : {
        event,
        ...(after.length ? { after } : {}),
        ...(prefs.length ? { deliveryPreference: prefs } : {}),
        ...(zones.length ? { shippingZones: zones } : {}),
        ...(methods.length ? { shippingMethods: methods } : {}),
        ...(points.length ? { pickupPoints: points } : {}),
        ...(categories.length ? { categories } : {})
      };

  const data: Record<string, unknown> = {
    project: projectId,
    name,
    target,
    mesimabetahalich: missionId,
    tafkidim: roleId,
    member: memberId,
    per,
    scope: scopeKind,
    matanots: productIds,
    when,
    dueHours,
    effect,
    routing,
    batching,
    waveAt,
    consentState,
    consentedBy
  };
  if (typeof params.position === 'number') data.position = params.position;

  let stepId: string;
  let counter = false;
  let proposerId = actor;
  if (params.stepId) {
    const existing = await loadStep(strapi, context, projectId, String(params.stepId));
    stepId = existing.id;
    // An edit by someone the rule lands on is their counter-proposal; the
    // rule's author stays its author.
    const before = stepTargetUsers(existing, missions);
    counter = before.includes(actor) && existing.proposedById != null && existing.proposedById !== actor;
    if (counter) {
      // Bilateral (§2.3): the author answers the counter too — by silence or a yes —
      // so it waits even when the counter-proposer is the only one it lands on.
      proposerId = existing.proposedById!;
      data.consentState = 'proposed';
    } else {
      data.proposedBy = actor;
    }
    await run('fulfillmentStepUpdate', { id: stepId, data });
  } else {
    data.proposedBy = actor;
    const res = await run('fulfillmentStepCreate', { data });
    const id = res?.data?.createFulfillmentStep?.data?.id;
    if (!id) throw new Error('Failed to create the fulfilment step');
    stepId = String(id);
  }

  const finalState = data.consentState as ConsentState;
  // Who this round asks: everyone it lands on — and, for a counter, its author.
  const asked = counter ? [...new Set([...targets, proposerId])] : targets;
  let deadline: string | null = null;
  if (finalState === 'proposed' && asked.some((t) => t !== actor)) {
    const round = await openRuleRound(run, {
      projectId,
      stepId,
      stepName: name,
      openerId: actor,
      targets: asked,
      why: str(params.why)
    });
    deadline = round?.deadline ?? null;
  } else {
    // Live (or nobody to ask): nothing stands on the table any more.
    await closeRuleDecisions(run, stepId);
  }

  if (finalState === 'proposed') await announceProposal(notifier, context, projectId, name, asked, deadline, counter);
  return { stepId, consentState: finalState, waitingFor: asked.filter((t) => t !== actor && !consentedBy.includes(t)), deadline };
};

// ── respondFulfillmentStep ────────────────────────────────────────────────────

const respondStep: ActionExecutionHandler = async (params, context, { strapi }) => {
  const projectId = String(params.projectId);
  const actor = String(context.userId);
  const step = await loadStep(strapi, context, projectId, String(params.stepId));
  const missions = await loadMissions(strapi, context, projectId);
  const targets = stepTargetUsers(step, missions);
  const isTarget = targets.includes(actor);
  // The author answers a counter-proposal on their rule (§2.3, bilateral).
  const isAuthorAsked = !isTarget && step.proposedById === actor && step.consentState === 'proposed';
  if (!isTarget && !isAuthorAsked) {
    throw new ActionError('NOT_TARGET', 'Only the people this rule lands on answer it');
  }
  const run = runner(strapi, context);
  const consentedBy = isTarget ? [...new Set([...step.consentedBy, actor])] : step.consentedBy;
  // The yes is also this round's answer on the rule's Decision (A2).
  const answer = await answerRule(run, { stepId: step.id, userId: actor });
  const consentState: ConsentState =
    step.consentState === 'paused'
      ? 'paused'
      : answer && !answer.complete
        ? 'proposed' // the round still waits — for others it asked, or the author of a counter
        : consentStateOf(step.proposedById ?? actor, targets, consentedBy);
  await run('fulfillmentStepUpdate', { id: step.id, data: { consentedBy, consentState } });
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
  const run = runner(strapi, context);
  let consentedBy = step.consentedBy;
  let consentState: ConsentState;
  if (params.paused === true) {
    // Pausing as a target is taking back my own yes — silence will not give it back.
    if (isTarget) {
      consentedBy = consentedBy.filter((id) => id !== actor);
      await withdrawFromRule(run, { stepId: step.id, userId: actor });
    }
    consentState = 'paused';
  } else {
    if (isTarget) consentedBy = [...new Set([...consentedBy, actor])];
    consentState = consentStateOf(step.proposedById ?? actor, targets, consentedBy);
  }
  await run('fulfillmentStepUpdate', { id: step.id, data: { consentedBy, consentState } });
  return { stepId: step.id, consentState };
};

// ── archiveFulfillmentStep ────────────────────────────────────────────────────

const archiveStep: ActionExecutionHandler = async (params, context, { strapi }) => {
  const projectId = String(params.projectId);
  const step = await loadStep(strapi, context, projectId, String(params.stepId));
  const run = runner(strapi, context);
  await run('fulfillmentStepUpdate', { id: step.id, data: { archived: true, consentState: 'paused' } });
  await closeRuleDecisions(run, step.id);
  return { stepId: step.id, archived: true };
};

// ── getFulfillmentWork ────────────────────────────────────────────────────────

/** Rules in my rikmas that land on me and wait for my answer (§2.3) — the heart's `fulfillRule` cards. */
async function myProposals(run: (qid: string, vars: Record<string, unknown>) => Promise<any>, uid: string): Promise<RuleProposal[]> {
  let stepsRes: any;
  let missionsRes: any;
  try {
    [stepsRes, missionsRes] = await Promise.all([run('fulfillmentMyRuleSteps', { uid }), run('fulfillmentMyMissions', { uid })]);
  } catch {
    return [];
  }
  const missionIds = new Set<string>();
  const rolesByProject = new Map<string, Set<string>>();
  for (const m of missionsRes?.data?.mesimabetahaliches?.data ?? []) {
    const a = m?.attributes ?? {};
    if (a.finnished === true || a.lifecycle === 'archived' || a.lifecycle === 'released') continue;
    missionIds.add(String(m.id));
    const pid = a.project?.data?.id != null ? String(a.project.data.id) : null;
    if (!pid) continue;
    const set = rolesByProject.get(pid) ?? new Set<string>();
    for (const r of a.tafkidims?.data ?? []) set.add(String(r.id));
    rolesByProject.set(pid, set);
  }
  const out: RuleProposal[] = [];
  for (const node of stepsRes?.data?.fulfillmentSteps?.data ?? []) {
    const s = stepOf(node);
    // A paused rule opens nothing — asking about it now would only nag.
    if (!s || s.archived || s.consentState === 'paused' || s.consentedBy.includes(uid) || s.proposedById === uid) continue;
    const pid = node?.attributes?.project?.data?.id != null ? String(node.attributes.project.data.id) : '';
    const mine =
      (s.target === 'member' && s.memberId === uid) ||
      (s.target === 'mission' && !!s.missionId && missionIds.has(s.missionId)) ||
      (s.target === 'role' && !!s.roleId && (rolesByProject.get(pid)?.has(s.roleId) ?? false));
    if (!mine) continue;
    out.push({
      stepId: s.id,
      projectId: pid,
      projectName: str(node?.attributes?.project?.data?.attributes?.projectName),
      name: s.name,
      target: s.target,
      roleName: s.roleName,
      missionName: s.missionName,
      proposedByName: s.proposedByName,
      per: s.per,
      effect: s.effect,
      when: s.when,
      dueHours: s.dueHours,
      batching: s.batching,
      waveAt: s.waveAt,
      routing: s.routing,
      deadline: null,
      decisionId: null
    });
  }
  const deadlines = await ruleDeadlines(run, out.map((p) => p.stepId));
  for (const p of out) {
    const d = deadlines.get(p.stepId);
    if (d) {
      p.deadline = d.deadline;
      p.decisionId = d.decisionId;
    }
  }
  return out;
}

const getWork: ActionExecutionHandler = async (_params, context, { strapi }) => {
  const uid = String(context.userId);
  const run = runner(strapi, context);
  let res: any;
  try {
    res = await run('fulfillmentMyActs', { uid });
  } catch {
    // Before `1.0b` deploys `Act.fulfillment_step` the heart simply has no such cards.
    return { data: { items: [], proposals: [] }, updateStrategy: { type: 'none' } };
  }
  const items: FulfillWorkItem[] = (res?.data?.acts?.data ?? [])
    .map((n: any) => workItemOf(n, uid, (d, id) => orderNumberOf(d as string, id as string)))
    .filter((w: FulfillWorkItem | null): w is FulfillWorkItem => !!w)
    // An act whose order was cancelled meanwhile is not work any more.
    .filter((w: FulfillWorkItem) => w.orderStatus !== 'cancelled');

  // Stock acts read their shelf live (A3); order acts their dispatch day.
  const resourceIds = [...new Set(items.map((w) => w.resourceId).filter((x): x is string => !!x))];
  if (resourceIds.length) {
    try {
      const r = await run('stockResourcesByIds', { ids: resourceIds });
      const byId = new Map<string, any>();
      for (const n of r?.data?.mashabetahaliches?.data ?? []) {
        const s = stockResourceOf(n);
        if (s) byId.set(s.id, s);
      }
      for (const w of items) {
        const s = w.resourceId ? byId.get(w.resourceId) : null;
        if (s && s.projectId === w.projectId) w.stock = { name: s.name, onHand: onHandOf(s), lowStockAt: s.lowStockAt, pricePerUnit: s.pricePerUnit };
      }
    } catch {
      /* not deployed: the card reads the act's own text */
    }
  }
  const orderIds = [...new Set(items.map((w) => w.orderId).filter((x): x is string => !!x))];
  if (orderIds.length) {
    try {
      const r = await run('fulfillmentOrdersShipping', { ids: orderIds });
      const byId = new Map<string, string | null>();
      for (const o of r?.data?.orders?.data ?? []) byId.set(String(o.id), readOrderShipping(o?.attributes?.shipping)?.nextDispatch ?? null);
      for (const w of items) if (w.orderId) w.dispatchOn = byId.get(w.orderId) ?? null;
    } catch {
      /* Order.shipping not deployed */
    }
  }

  const proposals = await myProposals(run, uid);
  return { data: { items, proposals }, updateStrategy: { type: 'none' } };
};

// ── take / complete / hand off ────────────────────────────────────────────────

async function loadAct(strapi: Strapi, context: ActionContext, projectId: string, actId: string) {
  const res = await runner(strapi, context)('fulfillmentAct', { id: actId });
  const node = res?.data?.act?.data;
  const a = node?.attributes;
  if (!a || String(a.project?.data?.id ?? '') !== projectId || !a.fulfillment_step?.data) {
    throw new ActionError('NOT_FOUND', `No automatic task ${actId} in this rikma`);
  }
  const st = a.fulfillment_step.data;
  const sa = st.attributes ?? {};
  return {
    id: String(node.id),
    name: String(a.shem ?? ''),
    done: a.naasa === true,
    assignees: (a.my?.data ?? []).map((u: any) => String(u.id)),
    assigneeName: a.my?.data?.[0]?.attributes?.username ?? null,
    roleIds: (a.tafkidims?.data ?? []).map((r: any) => String(r.id)),
    missionIds: (a.mesimabetahaliches?.data ?? []).map((m: any) => String(m.id)),
    externalId: typeof a.externalId === 'string' ? a.externalId : null,
    orderId: a.order?.data?.id != null ? String(a.order.data.id) : null,
    orderRef: a.order?.data?.attributes?.ref ?? null,
    orderStatus: a.order?.data?.attributes?.status ?? null,
    effect: sa.effect ?? 'none',
    step: {
      id: String(st.id),
      routing: sa.routing ?? 'single',
      target: sa.target ?? 'member',
      roleId: sa.tafkidim?.data?.id != null ? String(sa.tafkidim.data.id) : null,
      roleName: sa.tafkidim?.data?.attributes?.roleDescription ?? null,
      missionId: sa.mesimabetahalich?.data?.id != null ? String(sa.mesimabetahalich.data.id) : null,
      consentedBy: (sa.consentedBy?.data ?? []).map((u: any) => String(u.id))
    }
  };
}
type LoadedAct = Awaited<ReturnType<typeof loadAct>>;

/** The running mission through which `actor` holds one of these roles, if any. */
async function myMissionInRole(strapi: Strapi, context: ActionContext, projectId: string, actor: string, roleIds: string[]) {
  const missions = await loadMissions(strapi, context, projectId);
  return [...missions.values()].find((m) => !m.closed && m.holderId === actor && m.roleIds.some((r) => roleIds.includes(r))) ?? null;
}

async function take(strapi: Strapi, context: ActionContext, projectId: string, act: LoadedAct) {
  const actor = String(context.userId);
  if (act.assignees.includes(actor)) return;
  if (act.assignees.length > 0) throw new ActionError('TAKEN', 'Someone else already took this task');
  // Open to everyone (handed off with no role to return to): any member takes it.
  if (act.roleIds.length === 0) {
    const r = await runAction('updateTask', { id: act.id, projectId, uid: [actor], isAssigned: true, myIshur: true }, context);
    if (!r.success) throw new ActionError('TAKE_FAILED', r.error?.message ?? 'Could not take the task');
    return;
  }
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

/** Done + effect; the chain is the caller's (one engine run per order). */
async function completeOne(strapi: Strapi, context: ActionContext, projectId: string, act: LoadedAct) {
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
    effect = r.success ? { key, ok: true, status: (r.data as any)?.status } : { key, ok: false, error: r.error?.message };
  }
  return effect;
}

/** The next steps of an order's chain (A2) — the engine again; it opens only what is due. */
async function runChain(strapi: Strapi, context: ActionContext, projectId: string, orderId: string, notifier: any) {
  try {
    const { applyFulfillment } = await import('$lib/server/fulfillment/apply.js');
    const out = await applyFulfillment({
      event: 'order.paid',
      projectId,
      orderId,
      context,
      strapi,
      runAction,
      notifier,
      announce: false
    });
    return { opened: out.opened, waiting: out.waiting ?? [] };
  } catch (err) {
    console.warn('[fulfillment] the chain did not run for order', orderId, err);
    return { opened: [], waiting: [] };
  }
}

const completeAct: ActionExecutionHandler = async (params, context, { strapi, notifier }) => {
  const projectId = String(params.projectId);
  const act = await loadAct(strapi, context, projectId, String(params.actId));
  const effect = await completeOne(strapi, context, projectId, act);
  const chain = act.orderId ? await runChain(strapi, context, projectId, act.orderId, notifier) : null;
  return { actId: act.id, done: true, effect, chain };
};

/** Every act of a wave at once: one card, one tap — each order still gets its effect and its chain. */
const completeWave: ActionExecutionHandler = async (params, context, { strapi, notifier }) => {
  const projectId = String(params.projectId);
  const actIds = idList(params.actIds, 60);
  if (actIds.length === 0) throw new ActionError('VALIDATION_FAILED', 'actIds is required');
  const results: { actId: string; done: boolean; error?: string }[] = [];
  const orders = new Set<string>();
  for (const id of actIds) {
    try {
      const act = await loadAct(strapi, context, projectId, id);
      if (act.orderStatus === 'cancelled') {
        results.push({ actId: id, done: false, error: 'ORDER_CANCELLED' });
        continue;
      }
      await completeOne(strapi, context, projectId, act);
      if (act.orderId) orders.add(act.orderId);
      results.push({ actId: id, done: true });
    } catch (err) {
      results.push({ actId: id, done: false, error: err instanceof Error ? err.message : String(err) });
    }
  }
  for (const orderId of orders) await runChain(strapi, context, projectId, orderId, notifier);
  return { done: results.filter((r) => r.done).length, results };
};

/**
 * "Pass to someone else" (§2.2, principle 5): an act is never declined into
 * the void. The next consenting holder by the rule's routing gets it; with
 * nobody, it opens to the role (or, for a mission / member rule, to the roles
 * of the mission — else to the whole rikma), and when nobody holds that role
 * the rikma is offered to publish an open mission for it.
 */
const handOffAct: ActionExecutionHandler = async (params, context, { strapi, notifier }) => {
  const projectId = String(params.projectId);
  const actor = String(context.userId);
  const run = runner(strapi, context);
  const act = await loadAct(strapi, context, projectId, String(params.actId));
  if (act.done) throw new ActionError('DONE', 'This task is already done');
  if (act.orderStatus === 'cancelled') throw new ActionError('ORDER_CANCELLED', 'The order was cancelled — this task is closed');
  if (!act.assignees.includes(actor)) throw new ActionError('NOT_YOURS', 'Only whoever holds the task can pass it on');

  const missions = await loadMissions(strapi, context, projectId);
  const roleId = act.step.target === 'role' ? act.step.roleId : null;
  const candidates = roleId ? roleHolders(roleId, missions).filter((h) => act.step.consentedBy.includes(h.userId)) : [];

  let pick = null as null | { userId: string; missionId: string };
  const to = str(params.toUserId ? String(params.toUserId) : null);
  if (to) {
    pick = candidates.find((c) => c.userId === to) ?? null;
    if (!pick) throw new ActionError('NOT_CONSENTED', 'They have not agreed to this rule — open the task to the role instead');
  } else if (candidates.length) {
    const mode = act.step.routing === 'leastOpen' ? 'leastOpen' : 'roundRobin';
    let routing = { load: new Map<string, number>(), lastAssignee: new Map<string, string>() };
    if (mode === 'leastOpen') {
      try {
        const r = await run('fulfillmentRoutingActs', { pid: projectId });
        routing = routingStateOf(r?.data?.acts?.data ?? []);
      } catch {
        /* an even spread without the load */
      }
    }
    routing.lastAssignee.set(act.step.id, actor);
    pick = pickHolder(mode, act.step.id, candidates, routing, actor);
  }

  const name = act.name;
  const notify = async (rule: any, extra: Record<string, unknown>, templates: any, url: string, intent = 'personal') => {
    if (!notifier) return;
    try {
      await notifier.notify({ recipients: rule, templates, intent, metadata: { type: 'fulfillmentHandOff', url, priority: 'normal' } }, { projectId, ...extra }, null, context);
    } catch (err) {
      console.warn('[fulfillment] hand-off notification failed:', err);
    }
  };

  if (pick) {
    const r = await runAction('updateTask', { id: act.id, projectId, uid: [pick.userId], mesimabetahaliches: [pick.missionId], isAssigned: true }, context);
    if (!r.success) throw new ActionError('HANDOFF_FAILED', r.error?.message ?? 'Could not pass the task on');
    await notify(
      { type: 'specificUsers', config: { userIdsParam: 'targetIds', projectIdParam: 'projectId' } },
      { targetIds: [pick.userId] },
      {
        title: { he: `↪ קיבלת מטלה: ${name}`, en: `↪ A task was passed to you: ${name}` },
        body: {
          he: `${act.assigneeName ?? 'חבר/ה ברקמה'} העביר/ה אליך את המטלה. אם גם לך זה לא מסתדר — אפשר להעביר הלאה.`,
          en: `${act.assigneeName ?? 'A rikma member'} passed you this task. If it does not work for you either, you can pass it on.`
        }
      },
      `/lev?project=${projectId}`
    );
    return { actId: act.id, to: pick.userId, openTo: null };
  }

  // Nobody to pass it to: it opens again.
  const roles: string[] = roleId
    ? [roleId]
    : [...new Set<string>(act.missionIds.flatMap((mid: string) => missions.get(mid)?.roleIds ?? []))];
  await run('fulfillmentActRelease', { id: act.id });
  if (roles.join(',') !== act.roleIds.join(',')) await run('fulfillmentActRoles', { id: act.id, roles });

  const holders = [...new Set(roles.flatMap((r) => roleHolders(r, missions).map((h) => h.userId)))].filter((u) => u !== actor);
  if (roles.length && holders.length) {
    await notify(
      { type: 'specificUsers', config: { userIdsParam: 'targetIds', projectIdParam: 'projectId' } },
      { targetIds: holders },
      {
        title: { he: `🧩 מטלה פתוחה לתפקיד שלך: ${name}`, en: `🧩 A task is open for your role: ${name}` },
        body: { he: 'מי שיכול/ה — אפשר לקחת אותה מעמוד הלב.', en: 'Whoever can — take it from the heart page.' }
      },
      `/lev?project=${projectId}`
    );
    return { actId: act.id, to: null, openTo: 'role' };
  }
  // A role nobody (else) holds, or no role at all: the rikma hears, with the way out.
  const roleName = act.step.roleName;
  await notify(
    { type: 'projectMembers', config: { projectIdParam: 'projectId', excludeSender: true } },
    {},
    roles.length
      ? {
          title: { he: `🧩 אין מי שייקח את "${name}"`, en: `🧩 Nobody can take "${name}"` },
          body: {
            he: `המטלה הוחזרה לתפקיד${roleName ? ` "${roleName}"` : ''}, ואין לו כרגע מחזיק אחר. לפרסם משימה פתוחה בתפקיד הזה?`,
            en: `The task went back to the role${roleName ? ` "${roleName}"` : ''}, and nobody else holds it right now. Publish an open mission for it?`
          }
        }
      : {
          title: { he: `🧩 מטלה פתוחה לכל הרקמה: ${name}`, en: `🧩 A task is open to the whole rikma: ${name}` },
          body: { he: 'מי שיכול/ה — אפשר לקחת אותה מעמוד הלב.', en: 'Whoever can — take it from the heart page.' }
        },
    roles.length ? openMissionHref(projectId, roleName, act.id) : `/lev?project=${projectId}`,
    'review'
  );
  return {
    actId: act.id,
    to: null,
    openTo: roles.length ? 'role' : 'all',
    suggestOpenMission: roles.length > 0,
    openMissionHref: roles.length ? `/${openMissionHref(projectId, roleName, act.id)}` : null
  };
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
    "Create or edit a rule of the rikma's order automation: an order event (or a resource running low) opens an act for a running mission, a role or a member. Live at once when it lands only on its author; otherwise proposed — silence within the rikma's restime is consent, and an edit by someone it lands on is a counter-proposal that restarts the clock.",
  graphqlOperation: saveStep,
  paramSchema: {
    projectId: { type: 'string', required: true },
    stepId: { type: 'string', required: false, description: 'Absent = a new rule' },
    name: { type: 'string', required: true },
    event: { type: 'string', required: false, description: 'order.paid (default) | stock.low' },
    target: { type: 'string', required: true, description: 'mission | role | member' },
    missionId: { type: 'string', required: false },
    roleId: { type: 'string', required: false },
    memberId: { type: 'string', required: false },
    per: { type: 'string', required: false, description: 'order (default) | line | unit' },
    scope: { type: 'string', required: false, description: 'rikma (default) | category | product' },
    categories: { type: 'array', required: false, description: 'scope category: category ids' },
    productIds: { type: 'array', required: false, description: 'scope product: product ids of this rikma' },
    after: { type: 'array', required: false, description: 'Chain: step ids this rule waits for, for the same order' },
    deliveryPreference: { type: 'array', required: false, description: 'Only orders with these delivery preferences' },
    shippingZones: { type: 'array', required: false, description: "Only orders shipped to these zones of the rikma's shipping config" },
    shippingMethods: { type: 'array', required: false, description: 'Only orders that chose these delivery methods (m:<zone>:<method>)' },
    pickupPoints: { type: 'array', required: false, description: 'Only orders collected at these pickup points' },
    resources: { type: 'array', required: false, description: 'stock.low: only these resources (absent = any)' },
    routing: { type: 'string', required: false, description: 'single (default) | roundRobin | leastOpen | onShift' },
    batching: { type: 'string', required: false, description: 'perOrder (default) | wave' },
    waveAt: { type: 'string', required: false, description: 'wave: the cut-off hour, HH:MM (Israel time)' },
    dueHours: { type: 'number', required: false },
    effect: { type: 'string', required: false, description: 'none | markShipped | markFulfilled' },
    position: { type: 'number', required: false },
    why: { type: 'string', required: false, description: 'A counter-proposal: why' }
  },
  authRules: memberRules('change the order automation'),
  realtime: { scopes: stepScopes }
};

export const respondFulfillmentStepConfig: ActionConfig = {
  key: 'respondFulfillmentStep',
  description: 'Agree to a proposed automation rule that lands on you. To disagree, edit the rule (a counter-proposal) or talk it over.',
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
  description:
    "The caller's open automatic acts (assigned to them, open to a role they hold, or open to everyone) and the automation rules waiting for their answer, for the heart's cards.",
  graphqlOperation: getWork,
  paramSchema: {},
  authRules: [{ type: 'jwt' }],
  updateStrategy: { type: 'none' }
};

export const takeFulfillmentActConfig: ActionConfig = {
  key: 'takeFulfillmentAct',
  description: 'Take an automatic act that is open to a role you hold (it opens inside your running mission) or to the whole rikma.',
  graphqlOperation: takeAct,
  paramSchema: ACT_PARAMS,
  authRules: memberRules('take a task'),
  realtime: { scopes: actScopes }
};

export const completeFulfillmentActConfig: ActionConfig = {
  key: 'completeFulfillmentAct',
  description:
    "Mark an automatic act done (through updateTask), run its step's effect on the order (shipped / delivered) and open the next steps of the order's chain.",
  graphqlOperation: completeAct,
  paramSchema: ACT_PARAMS,
  authRules: memberRules('complete a task'),
  realtime: { scopes: actScopes }
};

export const completeFulfillmentWaveConfig: ActionConfig = {
  key: 'completeFulfillmentWave',
  description: 'Mark every act of a wave done at once — each order still gets its effect and its chain.',
  graphqlOperation: completeWave,
  paramSchema: {
    projectId: { type: 'string', required: true },
    actIds: { type: 'array', required: true, description: 'The acts of the wave (up to 60)' }
  },
  authRules: memberRules('complete a wave'),
  realtime: { scopes: stepScopes }
};

export const handOffFulfillmentActConfig: ActionConfig = {
  key: 'handOffFulfillmentAct',
  description:
    "Pass an automatic act you hold to someone else: a named consenting holder, or the next one by the rule's routing; with nobody, it opens to the role and the rikma is offered to publish an open mission.",
  graphqlOperation: handOffAct,
  paramSchema: { ...ACT_PARAMS, toUserId: { type: 'string', required: false, description: 'A consenting holder of the role; absent = by routing' } },
  authRules: memberRules('pass a task on'),
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
  completeFulfillmentWaveConfig,
  handOffFulfillmentActConfig,
  retryOrderFulfillmentConfig
];
