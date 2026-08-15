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
  fetchProjectContext,
  fetchProjectPayments,
  fetchProjectPledges
} from '$lib/server/stipend/read.js';
import { effectiveStipendPolicy } from '$lib/stipend/computeStipendEquity.js';

const handler: ActionExecutionHandler = async (params, context) => {
  const projectId = String(params.projectId ?? '');
  if (!projectId) throw new Error('projectId is required');

  const exec = execFromContext(context);

  const [project, programs, pledges, payments] = await Promise.all([
    fetchProjectContext(exec, projectId),
    fetchActivePrograms(exec, projectId).catch(() => []),
    fetchProjectPledges(exec, projectId, ['proposed', 'active', 'exhausted', 'closed']).catch(() => []),
    fetchProjectPayments(exec, projectId).catch(() => [])
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

  return {
    data: {
      projectId,
      policy: effectiveStipendPolicy(project.policy),
      policyIsDefault: project.policy == null,
      defaultRate: project.defaultRate,
      defaultCostShare: project.defaultCostShare,
      programs,
      pledges,
      payments,
      totals: {
        paid: paidTotal,
        equityCredit: creditTotal,
        equityDebit: debitTotal,
        /** Net value the stipends added to the rikma — the dilution, in ₪. */
        netAdded: round2(creditTotal - debitTotal),
        pending: round2(
          payments.filter((p) => p.status === 'sent').reduce((sum, p) => sum + p.amount, 0)
        ),
        budgetLeft: round2(
          programs.reduce<number>((sum, p) => sum + (p.remainingCap ?? 0), 0)
        )
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
