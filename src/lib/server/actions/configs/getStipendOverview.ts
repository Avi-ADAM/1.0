/**
 * Action: getStipendOverview (docs/PLAN_STIPEND.md §8 — the moach tab).
 *
 * One rikma's stipend picture: the programs and what is left of their budgets,
 * every pledge and who is on both ends, what has actually been paid, and — the
 * number the plan insists on — **the dilution so far**, i.e. how much of the
 * rikma's total value came from stipend equity credit rather than from work.
 *
 * Transparency here is not decoration: overlapping programs can dilute further
 * than anyone expected (§11.4), and the only defence is that the running total
 * is visible in one place.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { execFromContext } from '$lib/server/archive/exec.js';
import {
  fetchActivePrograms,
  fetchApprovedHours,
  fetchMeteredHours,
  fetchProjectContext,
  fetchProjectStipendMissions,
  fetchProjectPayments,
  fetchProjectPledges,
  fetchRecipientContribution
} from '$lib/server/stipend/read.js';
import { effectiveStipendPolicy } from '$lib/stipend/computeStipendEquity.js';
import { computeStipendCycle, cycleWindow, settlementFrom } from '$lib/stipend/computeStipendCycle.js';

const handler: ActionExecutionHandler = async (params, context) => {
  const projectId = String(params.projectId ?? '');
  if (!projectId) throw new Error('projectId is required');

  const exec = execFromContext(context);

  const [project, programs, pledges, payments, missions] = await Promise.all([
    fetchProjectContext(exec, projectId),
    fetchActivePrograms(exec, projectId).catch(() => []),
    fetchProjectPledges(exec, projectId, ['proposed', 'active', 'exhausted', 'closed']).catch(() => []),
    fetchProjectPayments(exec, projectId).catch(() => []),
    fetchProjectStipendMissions(exec, projectId).catch(() => [])
  ]);
  if (!project) throw new Error(`Project ${projectId} not found`);

  // Only confirmed rows count — the same rule the equity ledger itself follows.
  const confirmed = payments.filter((p) => p.status === 'confirmed');
  const paidTotal = round2(confirmed.reduce((sum, p) => sum + p.amount, 0));
  const creditTotal = round2(confirmed.reduce((sum, p) => sum + p.equityCredit, 0));
  const debitTotal = round2(confirmed.reduce((sum, p) => sum + p.equityDebit, 0));

  const perMember = new Map<string, { userId: string; credit: number; debit: number; received: number; funded: number }>();
  for (const p of confirmed) {
    if (p.funderId) {
      const row = perMember.get(p.funderId) ?? { userId: p.funderId, credit: 0, debit: 0, received: 0, funded: 0 };
      row.credit = round2(row.credit + p.equityCredit);
      row.funded = round2(row.funded + p.amount);
      perMember.set(p.funderId, row);
    }
    if (p.recipientId) {
      const row = perMember.get(p.recipientId) ?? { userId: p.recipientId, credit: 0, debit: 0, received: 0, funded: 0 };
      row.debit = round2(row.debit + p.equityDebit);
      row.received = round2(row.received + p.amount);
      perMember.set(p.recipientId, row);
    }
  }

  const names = new Map(project.members.map((m) => [m.id, m.username]));

  /**
   * Per pledge: what is **owed and not yet paid**, and what is **paid and not
   * yet confirmed**. The rikma could see what had already moved and nothing
   * about what was still coming, which is the half of the question the person
   * waiting for the money actually asks (docs/FIXES.md §10, §14).
   *
   * Same window and same pure function as the settlement — a number here that
   * the pay card would refuse to produce would be worse than no number.
   */
  const pledgeStates = await Promise.all(
    pledges.map(async (pledge) => {
      const sent = payments
        .filter((p) => p.pledgeId === pledge.id && p.status === 'sent')
        .reduce((sum, p) => sum + p.amount, 0);
      const confirmed = payments.filter((p) => p.pledgeId === pledge.id && p.status === 'confirmed');
      const base = {
        pledgeId: pledge.id,
        awaitingConfirmation: round2(sent),
        cyclesPaid: confirmed.length,
        lastPaidAt: confirmed[0]?.cycleEnd ?? null,
        accruedUnpaid: 0,
        accruedHours: 0,
        cycleStart: null as string | null,
        cycleEnd: null as string | null
      };
      if (pledge.status !== 'active' || !pledge.projectId || !pledge.recipientId) return base;

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
      const program = programs.find((p) => p.id === pledge.programId) ?? null;
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
      return {
        ...base,
        accruedUnpaid: cycle.amount,
        accruedHours: cycle.hours,
        cycleStart: from,
        cycleEnd: window.cycleEnd
      };
    })
  );
  const stateByPledge = new Map(pledgeStates.map((s) => [s.pledgeId, s]));

  // The mission a payment answers, resolved once here rather than in the view:
  // "₪2,100 in March" means nothing without "for building the site".
  const missionNameById = new Map<string, string>(
    missions.map((m) => [m.id, m.name] as [string, string])
  );
  const missionsByPledge = new Map<string, string[]>(
    pledges.map(
      (p) =>
        [p.id, p.missionIds.map((id) => missionNameById.get(id) ?? '').filter(Boolean)] as [
          string,
          string[]
        ]
    )
  );

  return {
    data: {
      projectId,
      // The member list rides along so a stipend dialog opened from a card
      // (which knows a mission, not a rikma) can offer the funder/recipient
      // pickers without a second round trip.
      members: project.members,
      // Every stipend is about a specific piece of work, so the form that
      // proposes one has to be able to name it — and the market rate that
      // comes with the mission is also the ceiling the stipend rate is
      // measured against.
      missions,
      policy: effectiveStipendPolicy(project.policy),
      policyIsDefault: project.policy == null,
      defaultRate: project.defaultRate,
      defaultCostShare: project.defaultCostShare,
      programs,
      // Each pledge carries the names of the missions it meters and its live
      // state, so the tab can say who is funding whom, for what work, how much
      // is owed right now and how much is waiting to be confirmed — in one row.
      pledges: pledges.map((p) => ({
        ...p,
        missionNames: missionsByPledge.get(p.id) ?? [],
        state: stateByPledge.get(p.id) ?? null
      })),
      // The cycle-by-cycle ledger. It was always read here and never rendered,
      // so "how much did this person get, and for what" had no screen at all
      // (docs/FIXES.md §11).
      payments: payments.map((p) => ({
        ...p,
        funderName: names.get(p.funderId ?? '') ?? '',
        recipientName: names.get(p.recipientId ?? '') ?? '',
        missionNames: p.pledgeId ? missionsByPledge.get(p.pledgeId) ?? [] : []
      })),
      totals: {
        paid: paidTotal,
        equityCredit: creditTotal,
        equityDebit: debitTotal,
        /** Net value the stipends added to the rikma — the dilution, in ₪. */
        netAdded: round2(creditTotal - debitTotal),
        pending: round2(
          payments.filter((p) => p.status === 'sent').reduce((sum, p) => sum + p.amount, 0)
        ),
        /** Approved, owed, and nobody has settled it yet — across every pledge. */
        accrued: round2(pledgeStates.reduce((sum, s) => sum + s.accruedUnpaid, 0)),
        budgetLeft: round2(sumBudgets(programs))
      },
      perMember: Array.from(perMember.values()).map((row) => ({
        ...row,
        username: names.get(row.userId) ?? '',
        net: round2(row.credit - row.debit)
      }))
    },
    updateStrategy: { type: 'none' as const }
  };
};

/** Σ of what is left in every open programme — the ceiling on future dilution. */
function sumBudgets(programs: Array<{ remainingCap: number | null }>): number {
  let total = 0;
  for (const p of programs) total += p.remainingCap ?? 0;
  return total;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export const getStipendOverviewConfig: ActionConfig = {
  key: 'getStipendOverview',
  description:
    'Read-only. One rikma’s stipend picture: programs and remaining budget, pledges, payments, and the running equity credit/debit each member has accumulated from stipends.',
  graphqlOperation: handler,
  paramSchema: {
    projectId: { type: 'string', required: true, description: 'The rikma' }
  },
  authRules: [
    { type: 'jwt', errorMessage: 'Must be logged in' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Must be a member of the rikma to see its stipend ledger'
    }
  ],
  updateStrategy: { type: 'none' }
};
