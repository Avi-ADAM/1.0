/**
 * Action: getStipendWork (docs/PLAN_STIPEND.md §8).
 *
 * Everything about stipends that is waiting for *me*, in one read:
 *
 *   payables      — cycles I owe as a funder ("42h × ₪50 = ₪2,100 — pay")
 *   confirmations — money sent to me that I have not confirmed arrived
 *   pledges       — my running stipends, either side, for context on the cards
 *
 * The due amount is computed here, from approved hours, using the same pure
 * function the settlement uses — the card can never show a number the
 * settlement would not produce.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { execFromContext } from '$lib/server/archive/exec.js';
import { gqlStr, run } from '$lib/server/archive/gql.js';
import { computeStipendCycle, cycleWindow } from '$lib/stipend/computeStipendCycle.js';
import { fetchApprovedHours, fetchProgram, toPledge } from '$lib/server/stipend/read.js';

const handler: ActionExecutionHandler = async (_params, context) => {
  const exec = execFromContext(context);
  const userId = String(context.userId);

  const data = await run(
    exec,
    `{
      funded: stipendPledges(filters: { funder: { id: { eq: ${gqlStr(userId)} } }, status: { in: ["proposed","active"] } }, pagination: { limit: 50 }) {
        data { id attributes {
          mode costShare equityMultiplier stipendRate monthlyCap totalCap paidTotal
          noticeCycles revenueTrigger recourse scope status descrip start end cycleSize lastSettledAt
          project { data { id attributes { projectName } } }
          stipend_program { data { id } }
          funder { data { id attributes { username } } }
          recipient { data { id attributes { username profilePic { data { attributes { url } } } } } }
          mashabetahalich { data { id } }
          mesimabetahaliches { data { id } }
          matbea { data { id } }
          decision { data { id } }
        } }
      }
      received: stipendPledges(filters: { recipient: { id: { eq: ${gqlStr(userId)} } }, status: { in: ["proposed","active"] } }, pagination: { limit: 50 }) {
        data { id attributes {
          mode costShare equityMultiplier stipendRate monthlyCap totalCap paidTotal
          noticeCycles revenueTrigger recourse scope status descrip start end cycleSize lastSettledAt
          project { data { id attributes { projectName } } }
          stipend_program { data { id } }
          funder { data { id attributes { username profilePic { data { attributes { url } } } } } }
          recipient { data { id attributes { username } } }
          mashabetahalich { data { id } }
          mesimabetahaliches { data { id } }
          matbea { data { id } }
          decision { data { id } }
        } }
      }
      awaiting: stipendPayments(filters: { recipient: { id: { eq: ${gqlStr(userId)} } }, status: { eq: "sent" } }, pagination: { limit: 50 }, sort: "createdAt:desc") {
        data { id attributes {
          amount hours stipendRate mode cycleStart cycleEnd status
          project { data { id attributes { projectName profilePic { data { attributes { url } } } } } }
          funder { data { id attributes { username profilePic { data { attributes { url } } } } } }
          stipend_pledge { data { id } }
          haluka { data { id } }
        } }
      }
    }`,
    'getStipendWork'
  );

  const fundedPledges = (data?.funded?.data ?? []).map(toPledge).filter(Boolean);
  const receivedPledges = (data?.received?.data ?? []).map(toPledge).filter(Boolean);

  // Program budgets are shared across pledges, so read each one once.
  const programIds = Array.from(
    new Set(fundedPledges.map((p: any) => p.programId).filter(Boolean) as string[])
  );
  const programs = new Map<string, Awaited<ReturnType<typeof fetchProgram>>>();
  for (const id of programIds) {
    programs.set(id, await fetchProgram(exec, id).catch(() => null));
  }

  const payables: Array<Record<string, unknown>> = [];
  for (const pledge of fundedPledges as any[]) {
    if (pledge.status !== 'active' || !pledge.projectId || !pledge.recipientId) continue;
    const window = cycleWindow(new Date(), pledge.terms.cycleSize ?? 1);
    const from =
      pledge.lastSettledAt && new Date(pledge.lastSettledAt) > new Date(window.cycleStart)
        ? pledge.lastSettledAt
        : window.cycleStart;

    const approved = await fetchApprovedHours(exec, pledge.projectId, pledge.recipientId, from).catch(
      () => []
    );
    const program = pledge.programId ? programs.get(pledge.programId) ?? null : null;
    const cycle = computeStipendCycle({
      terms: pledge.terms,
      approved,
      cycleStart: from,
      cycleEnd: window.cycleEnd,
      paidTotal: pledge.paidTotal,
      programRemaining: program?.remainingCap ?? null,
      missionIds: pledge.terms.scope === 'allMissions' ? null : pledge.missionIds
    });
    if (cycle.amount <= 0) continue; // nothing approved this cycle — no card

    payables.push({
      pledgeId: pledge.id,
      projectId: pledge.projectId,
      recipientId: pledge.recipientId,
      recipientName: pledge.recipientName,
      hours: cycle.hours,
      amount: cycle.amount,
      gross: cycle.gross,
      cappedBy: cycle.cappedBy,
      exhausts: cycle.exhausts,
      stipendRate: pledge.terms.stipendRate,
      mode: pledge.terms.mode,
      cycleStart: from,
      cycleEnd: window.cycleEnd
    });
  }

  const confirmations = (data?.awaiting?.data ?? []).map((row: any) => {
    const a = row.attributes ?? {};
    return {
      paymentId: String(row.id),
      pledgeId: a.stipend_pledge?.data?.id ? String(a.stipend_pledge.data.id) : null,
      projectId: a.project?.data?.id ? String(a.project.data.id) : null,
      projectName: a.project?.data?.attributes?.projectName ?? '',
      funderId: a.funder?.data?.id ? String(a.funder.data.id) : null,
      funderName: a.funder?.data?.attributes?.username ?? '',
      funderPic: a.funder?.data?.attributes?.profilePic?.data?.attributes?.url ?? null,
      amount: Number(a.amount) || 0,
      hours: Number(a.hours) || 0,
      stipendRate: Number(a.stipendRate) || 0,
      mode: a.mode ?? 'equity',
      cycleStart: a.cycleStart ?? null,
      cycleEnd: a.cycleEnd ?? null,
      halukaId: a.haluka?.data?.id ? String(a.haluka.data.id) : null
    };
  });

  return {
    data: { payables, confirmations, funded: fundedPledges, received: receivedPledges },
    updateStrategy: { type: 'none' as const }
  };
};

export const getStipendWorkConfig: ActionConfig = {
  key: 'getStipendWork',
  description:
    'Read-only. The current member’s stipend to-dos: cycles they owe as a funder (amount derived from approved hours), payments awaiting their confirmation as a recipient, and their running pledges on both sides.',
  graphqlOperation: handler,
  paramSchema: {},
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in to read your stipends' }],
  updateStrategy: { type: 'none' }
};
