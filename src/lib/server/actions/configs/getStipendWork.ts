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
import { computeStipendCycle, cycleWindow, settlementFrom } from '$lib/stipend/computeStipendCycle.js';
import { computeStipendEquity } from '$lib/stipend/computeStipendEquity.js';
import {
  fetchApprovedHours,
  fetchMeteredHours,
  fetchProgram,
  fetchRecipientContribution,
  toPledge
} from '$lib/server/stipend/read.js';

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
          mesimabetahaliches { data { id attributes { name } } }
          open_missions { data { id attributes { name } } }
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
          mesimabetahaliches { data { id attributes { name } } }
          open_missions { data { id attributes { name } } }
          matbea { data { id } }
          decision { data { id } }
        } }
      }
      awaiting: stipendPayments(filters: { recipient: { id: { eq: ${gqlStr(userId)} } }, status: { eq: "sent" } }, pagination: { limit: 50 }, sort: "createdAt:desc") {
        data { id attributes {
          amount hours stipendRate mode costShare equityMultiplier
          equityCredit equityDebit cycleStart cycleEnd status
          project { data { id attributes { projectName profilePic { data { attributes { url } } } } } }
          funder { data { id attributes { username profilePic { data { attributes { url } } } } } }
          stipend_pledge { data { id attributes {
            mesimabetahaliches { data { id attributes { name } } }
          } } }
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
    const from = settlementFrom(
      { lastSettledAt: pledge.lastSettledAt, start: pledge.terms.start },
      window.cycleStart
    );

    const approved = await fetchApprovedHours(exec, pledge.projectId, pledge.recipientId, from).catch(
      () => []
    );
    const program = pledge.programId ? programs.get(pledge.programId) ?? null : null;
    // Identical inputs to the settlement's — the card must never offer a number
    // the settlement would refuse to produce.
    const [metered, ledger] = await Promise.all([
      fetchMeteredHours(exec, pledge.projectId, pledge.recipientId, from).catch(() => 0),
      fetchRecipientContribution(exec, pledge.projectId, pledge.recipientId).catch(() => null)
    ]);
    const cycle = computeStipendCycle({
      terms: pledge.terms,
      approved,
      cycleStart: from,
      cycleEnd: window.cycleEnd,
      paidTotal: pledge.paidTotal,
      programRemaining: program?.remainingCap ?? null,
      missionIds: pledge.terms.scope === 'allMissions' ? null : pledge.missionIds,
      hoursAlreadyMetered: metered,
      equityHeadroom: ledger ? Math.max(0, ledger.contribution - ledger.equityDebited) : null
    });
    if (cycle.amount <= 0) continue; // nothing approved this cycle — no card

    const lines = computeStipendEquity(cycle.amount, pledge.terms);
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
      cycleEnd: window.cycleEnd,
      // What the money is *for*, and what it does to the books. Both were
      // missing from the card, so the funder was asked to pay an amount with
      // no mission attached to it (docs/FIXES.md §12, §13).
      missionNames: (pledge.missions ?? []).map((m: any) => m.name).filter(Boolean),
      equityCredit: lines.equityCredit,
      equityDebit: lines.equityDebit,
      budgetLeft: cycle.remainingAfter ?? program?.remainingCap ?? null
    });
  }

  /**
   * The recipient's side of the same question: **what have I earned that
   * nobody has paid me yet.** The funder had this number all along (it is the
   * pay card); the person actually waiting for the money had no screen showing
   * it anywhere (docs/FIXES.md §10). Same window, same pure function — so the
   * two sides can never read different numbers off the same hours.
   */
  const accruals: Array<Record<string, unknown>> = [];
  for (const pledge of receivedPledges as any[]) {
    if (pledge.status !== 'active' || !pledge.projectId || !pledge.recipientId) continue;
    const window = cycleWindow(new Date(), pledge.terms.cycleSize ?? 1);
    const from = settlementFrom(
      { lastSettledAt: pledge.lastSettledAt, start: pledge.terms.start },
      window.cycleStart
    );
    const [approved, metered, ledger] = await Promise.all([
      fetchApprovedHours(exec, pledge.projectId, pledge.recipientId, from).catch(() => []),
      fetchMeteredHours(exec, pledge.projectId, pledge.recipientId, from).catch(() => 0),
      fetchRecipientContribution(exec, pledge.projectId, pledge.recipientId).catch(() => null)
    ]);
    const program = pledge.programId
      ? programs.get(pledge.programId) ?? (await fetchProgram(exec, pledge.programId).catch(() => null))
      : null;
    const cycle = computeStipendCycle({
      terms: pledge.terms,
      approved,
      cycleStart: from,
      cycleEnd: window.cycleEnd,
      paidTotal: pledge.paidTotal,
      programRemaining: program?.remainingCap ?? null,
      missionIds: pledge.terms.scope === 'allMissions' ? null : pledge.missionIds,
      hoursAlreadyMetered: metered,
      equityHeadroom: ledger ? Math.max(0, ledger.contribution - ledger.equityDebited) : null
    });
    if (cycle.amount <= 0) continue;

    const lines = computeStipendEquity(cycle.amount, pledge.terms);
    accruals.push({
      pledgeId: pledge.id,
      projectId: pledge.projectId,
      projectName: pledge.projectName ?? '',
      funderId: pledge.funderId,
      funderName: pledge.funderName,
      hours: cycle.hours,
      amount: cycle.amount,
      gross: cycle.gross,
      cappedBy: cycle.cappedBy,
      stipendRate: pledge.terms.stipendRate,
      mode: pledge.terms.mode,
      cycleStart: from,
      cycleEnd: window.cycleEnd,
      missionNames: (pledge.missions ?? []).map((m: any) => m.name).filter(Boolean),
      equityDebit: lines.equityDebit
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
      halukaId: a.haluka?.data?.id ? String(a.haluka.data.id) : null,
      // The mission the hours were worked on, and the exact equity the
      // confirmation moves. Confirming is the one act in this whole feature
      // that changes a percentage, and the card used to say so without saying
      // by how much (docs/FIXES.md §12, §13).
      missionNames: (a.stipend_pledge?.data?.attributes?.mesimabetahaliches?.data ?? [])
        .map((m: any) => String(m.attributes?.name ?? ''))
        .filter(Boolean),
      costShare: Number(a.costShare ?? 1),
      equityMultiplier: Number(a.equityMultiplier ?? 1),
      equityDebit: Number(a.equityDebit) || 0,
      equityCredit: Number(a.equityCredit) || 0
    };
  });

  return {
    data: { payables, confirmations, accruals, funded: fundedPledges, received: receivedPledges },
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
