/**
 * The `fulfillmentRule` Decision — the writes (docs/inprogress/PLAN_SHOP_OPERATIONS.md §2.3, A2).
 *
 * A rule that lands work on someone else rides one open Decision:
 *
 *   openRuleRound  — a proposal or a counter (any edit of the rule): a new
 *                    round in `vots`, the editor's yes, everyone it lands on
 *                    asked, and the rikma's restime from now.
 *   answerRule     — an explicit yes in the standing round; once everyone
 *                    asked said yes the Decision closes without waiting.
 *   withdrawFromRule — a target pausing the rule: their row in the round says
 *                    so, and silence never sweeps them back in.
 *   closeRuleDecisions — the rule was archived.
 *   matureFulfillmentRule — the clock ran out (timegrama `decision`
 *                    finalizer): silence is consent for everyone asked.
 *
 * The Decision is deliberately not linked to `projects` (the heart would show
 * it to the whole rikma as a generic vote); it hangs off the step. Until
 * `1.0b` deploys `kind: fulfillmentRule` + `Decision.fulfillmentStep` every
 * write here fails, is logged, and the rule keeps A1's explicit-yes consent.
 */
import { stepTargetUsers } from '$lib/fulfillment/plan';
import {
  answerRound,
  matureRule,
  openRound,
  readRuleVotes,
  roundComplete,
  roundOf,
  votsInput,
  type RuleVote
} from '$lib/fulfillment/consent';
import { missionsMapOf, stepOf } from '$lib/fulfillment/rows';
import { calcDeadlineMs } from '$lib/server/actions/configs/actionUtils.js';

export type Run = (qid: string, vars: Record<string, unknown>) => Promise<any>;

interface OpenDecision {
  id: string;
  votes: RuleVote[];
  timegramaId: string | null;
  deadline: string | null;
}

async function openDecisionOf(run: Run, stepId: string): Promise<OpenDecision | null> {
  const res = await run('fulfillmentRuleDecisions', { sid: stepId });
  const node = (res?.data?.decisions?.data ?? [])[0];
  if (!node) return null;
  const tg = node.attributes?.timegrama?.data;
  return {
    id: String(node.id),
    votes: readRuleVotes(node.attributes?.vots),
    timegramaId: tg?.id != null ? String(tg.id) : null,
    deadline: tg?.attributes?.done ? null : (tg?.attributes?.date ?? null)
  };
}

async function deadlineFor(run: Run, projectId: string, now: Date): Promise<string> {
  let restime = 'feh';
  try {
    const res = await run('128getProjectMembersAndRestime', { pid: projectId });
    restime = res?.data?.project?.data?.attributes?.restime ?? 'feh';
  } catch {
    /* the default restime */
  }
  return new Date(now.getTime() + calcDeadlineMs(restime)).toISOString();
}

/**
 * A proposal, or a counter-proposal — every edit of a rule that lands on
 * someone else. Returns the deadline, or null when the Decision is not
 * deployed yet (the rule then waits for explicit answers, as in A1).
 */
export async function openRuleRound(
  run: Run,
  input: { projectId: string; stepId: string; stepName: string; openerId: string; targets: string[]; why?: string | null; now?: Date }
): Promise<{ decisionId: string; deadline: string; round: number } | null> {
  const now = input.now ?? new Date();
  try {
    const deadline = await deadlineFor(run, input.projectId, now);
    const open = await openDecisionOf(run, input.stepId);
    const votes = openRound(open?.votes ?? [], input.openerId, input.targets, now.toISOString(), input.why ?? null);
    let decisionId: string;
    if (open) {
      decisionId = open.id;
      await run('fulfillmentRuleDecisionUpdate', { id: open.id, data: { vots: votsInput(votes), decisionName: input.stepName } });
      // A counter restarts the clock (§2.3).
      if (open.timegramaId) await run('mrResetTimegrama', { id: open.timegramaId, date: deadline });
      else await run('fulfillmentRuleClock', { date: deadline, decision: open.id });
    } else {
      const res = await run('fulfillmentRuleDecisionCreate', {
        data: {
          kind: 'fulfillmentRule',
          decisionName: input.stepName,
          fulfillmentStep: input.stepId,
          vots: votsInput(votes),
          archived: false,
          publishedAt: now.toISOString()
        }
      });
      const id = res?.data?.createDecision?.data?.id;
      if (!id) throw new Error('createDecision returned no id');
      decisionId = String(id);
      await run('fulfillmentRuleClock', { date: deadline, decision: decisionId });
    }
    return { decisionId, deadline, round: roundOf(votes) };
  } catch (e) {
    console.warn('[fulfillment] rule Decision unavailable — explicit consent only (1.0b not deployed?):', (e as Error)?.message ?? e);
    return null;
  }
}

/** Archive the open Decision and stop its clock. */
async function closeDecision(run: Run, open: OpenDecision, votes?: RuleVote[]): Promise<void> {
  await run('fulfillmentRuleDecisionUpdate', {
    id: open.id,
    data: { archived: true, ...(votes ? { vots: votsInput(votes) } : {}) }
  });
  if (open.timegramaId) await run('mrSetTimegramaDone', { id: open.timegramaId, done: true });
}

/**
 * An explicit yes. `complete` = everyone asked has now agreed, so the Decision
 * closed without waiting for the clock. null = no Decision (A1 consent).
 */
export async function answerRule(
  run: Run,
  input: { stepId: string; userId: string; now?: Date }
): Promise<{ complete: boolean } | null> {
  try {
    const open = await openDecisionOf(run, input.stepId);
    if (!open) return null;
    const votes = answerRound(open.votes, input.userId, (input.now ?? new Date()).toISOString());
    if (roundComplete(votes)) {
      await closeDecision(run, open, votes);
      return { complete: true };
    }
    await run('fulfillmentRuleDecisionUpdate', { id: open.id, data: { vots: votsInput(votes) } });
    return { complete: false };
  } catch (e) {
    console.warn('[fulfillment] could not record the answer on the rule Decision:', (e as Error)?.message ?? e);
    return null;
  }
}

/** A target paused the rule: in this round, their silence is no longer a yes. */
export async function withdrawFromRule(run: Run, input: { stepId: string; userId: string; now?: Date }): Promise<void> {
  try {
    const open = await openDecisionOf(run, input.stepId);
    if (!open) return;
    const round = roundOf(open.votes);
    const kept = open.votes.filter((v) => !(v.order === round && v.userId === input.userId));
    const votes: RuleVote[] = [
      ...kept,
      { userId: input.userId, what: false, order: round, why: 'paused', zman: (input.now ?? new Date()).toISOString() }
    ];
    await run('fulfillmentRuleDecisionUpdate', { id: open.id, data: { vots: votsInput(votes) } });
  } catch (e) {
    console.warn('[fulfillment] could not record the pause on the rule Decision:', (e as Error)?.message ?? e);
  }
}

/** The rule is gone: its open Decision closes with it. */
export async function closeRuleDecisions(run: Run, stepId: string): Promise<void> {
  try {
    const open = await openDecisionOf(run, stepId);
    if (open) await closeDecision(run, open);
  } catch {
    /* nothing open, or not deployed */
  }
}

type Deadlines = Map<string, { deadline: string; decisionId: string }>;

/**
 * When each step's silence becomes consent, and whether the clock exists at
 * all (`ready` — `Decision.fulfillmentStep` is deployed). Before `1.0b`
 * deploys it the filter on the relation fails, so even a rikma with no steps
 * learns which consent it is on: silence (A2) or explicit yes only (A1).
 */
export async function ruleClock(run: Run, stepIds: string[]): Promise<{ ready: boolean; deadlines: Deadlines }> {
  const deadlines: Deadlines = new Map();
  try {
    // An id no step has: the probe still asks the schema.
    const res = await run('fulfillmentRuleDeadlines', { sids: stepIds.length ? stepIds : ['0'] });
    for (const d of res?.data?.decisions?.data ?? []) {
      const sid = d?.attributes?.fulfillmentStep?.data?.id;
      const tg = d?.attributes?.timegrama?.data?.attributes;
      if (sid != null && tg?.date && !tg.done) deadlines.set(String(sid), { deadline: tg.date, decisionId: String(d.id) });
    }
    return { ready: true, deadlines };
  } catch {
    return { ready: false, deadlines };
  }
}

/** When each step's silence becomes consent — for the editor and the heart. */
export async function ruleDeadlines(run: Run, stepIds: string[]): Promise<Deadlines> {
  if (stepIds.length === 0) return new Map();
  return (await ruleClock(run, stepIds)).deadlines;
}

export interface MaturedRule {
  outcome: 'matured' | 'closed';
  projectId: string | null;
  stepName: string;
  proposerId: string | null;
  agreedBySilence: string[];
  live: boolean;
}

/**
 * The clock ran out on a `fulfillmentRule` round (timegrama `decision`
 * finalizer). Everyone asked who still holds the work agrees; the rule goes
 * live once everyone it lands on has agreed. The caller tells them.
 */
export async function matureRuleDecision(run: Run, decisionId: string): Promise<MaturedRule> {
  const res = await run('fulfillmentRuleDecision', { id: decisionId });
  const node = res?.data?.decision?.data;
  const a = node?.attributes;
  const closed: MaturedRule = { outcome: 'closed', projectId: null, stepName: '', proposerId: null, agreedBySilence: [], live: false };
  if (!a || a.archived || a.kind !== 'fulfillmentRule') return closed;
  const timegramaId = a.timegrama?.data?.id != null ? String(a.timegrama.data.id) : null;
  const open: OpenDecision = { id: String(node.id), votes: readRuleVotes(a.vots), timegramaId, deadline: null };

  const stepNode = a.fulfillmentStep?.data;
  const step = stepOf(stepNode);
  const projectId = stepNode?.attributes?.project?.data?.id != null ? String(stepNode.attributes.project.data.id) : null;
  if (!step || step.archived || !projectId) {
    await closeDecision(run, open);
    return { ...closed, projectId };
  }

  const missionsRes = await run('fulfillmentMissions', { pid: projectId });
  const missions = missionsMapOf(missionsRes?.data?.mesimabetahaliches?.data ?? []);
  const targets = stepTargetUsers(step, missions);
  const out = matureRule({
    proposerId: step.proposedById,
    targets,
    consentedBy: step.consentedBy,
    votes: open.votes,
    paused: step.consentState === 'paused'
  });
  await run('fulfillmentStepUpdate', { id: step.id, data: { consentedBy: out.consentedBy, consentState: out.consentState } });
  await closeDecision(run, open);
  return {
    outcome: 'matured',
    projectId,
    stepName: step.name,
    proposerId: step.proposedById,
    agreedBySilence: out.agreedBySilence,
    live: out.consentState === 'active' || out.consentState === 'self'
  };
}
