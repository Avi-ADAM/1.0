/**
 * Action: counterStipendTerms (docs/PLAN_STIPEND.md §5, super-principles).
 *
 * The move that exists instead of a "no" button. Nobody rejects a stipend —
 * they put different terms on the table: a lower rate, a smaller budget, a
 * higher α ("I'm not willing to be diluted that much"), a cap, an end date.
 *
 * The clock restarts, because the other side is now being asked something it
 * has not yet answered, and the counter-proposer's signature is part of the
 * same write: proposing is agreeing.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { execFromContext } from '$lib/server/archive/exec.js';
import { addStipendRound } from '$lib/server/stipend/decision.js';
import {
  fetchStipendDecision,
  signerIds,
  standingOrder,
  standingRound
} from '$lib/server/stipend/apply.js';
import { normalizeTerms, validateStipendTerms } from '$lib/stipend/computeStipendEquity.js';
import { fetchProjectContext } from '$lib/server/stipend/read.js';

const handler: ActionExecutionHandler = async (params, context, { notifier }) => {
  const decisionId = String(params.decisionId ?? '');
  if (!decisionId) throw new Error('decisionId is required');

  const exec = execFromContext(context);
  const userId = String(context.userId);

  const decision = await fetchStipendDecision(exec, decisionId);
  if (!decision) throw new Error(`Stipend decision ${decisionId} not found`);
  if (decision.archived) throw new Error('This proposal is already closed');

  const signers = signerIds(decision);
  if (signers.length > 0 && !signers.includes(userId)) {
    throw new Error('Only the parties to this proposal may counter it');
  }

  const standing = standingRound(decision);
  const values = (params.newTerms ?? params) as Record<string, any>;
  const numOr = (key: string, fallback: number | null | undefined) =>
    values[key] != null && values[key] !== '' ? Number(values[key]) : fallback;

  // A counter carries the *whole* set of terms — the fields the counterer did
  // not touch stay as they stand, so nothing silently reverts to a default.
  const terms = normalizeTerms({
    mode: values.mode ?? standing.mode,
    costShare: numOr('costShare', standing.costShare),
    equityMultiplier: numOr('equityMultiplier', standing.equityMultiplier),
    stipendRate: numOr('stipendRate', standing.stipendRate),
    monthlyCap: numOr('monthlyCap', standing.monthlyCap),
    totalCap: numOr('totalCap', standing.totalCap),
    noticeCycles: numOr('noticeCycles', standing.noticeCycles),
    revenueTrigger: numOr('revenueTrigger', standing.revenueTrigger),
    recourse: values.recourse ?? standing.recourse,
    scope: values.scope ?? standing.scope,
    start: values.start ?? standing.start,
    end: values.end ?? standing.end,
    cycleSize: numOr('cycleSize', standing.cycleSize)
  });

  const project = decision.projectId ? await fetchProjectContext(exec, decision.projectId) : null;
  const validation = validateStipendTerms({
    terms,
    marketRate: params.marketRate != null ? Number(params.marketRate) : null,
    policy: project?.policy ?? null
  });
  // A pledge counter may not turn a bilateral deal into a diluting one behind
  // the rikma's back — that needs a program, not a counter-round.
  if (decision.kind === 'stipendPledge' && validation.scope === 'rikma' && !decision.programId) {
    throw new Error(
      'Those terms would dilute the whole rikma, which a two-party agreement cannot do. Counter with a higher costShare, or ask the rikma for a stipend program'
    );
  }
  if (!validation.ok) throw new Error(validation.errors[0]);

  const ordern = standingOrder(decision) + 1;
  const result = await addStipendRound(exec, {
    decisionId,
    rounds: decision.rounds,
    vots: decision.vots,
    terms,
    why: params.why ? String(params.why).trim() : null,
    proposedById: userId,
    ordern,
    projectRestime: decision.projectRestime,
    oldTimegramaId: decision.timegramaId
  });

  const others = signers.filter((id) => id !== userId);
  if (notifier && decision.projectId && others.length > 0) {
    notifier
      .notify(
        {
          recipients: { type: 'specificUsers', config: { userIdsParam: 'recipients' } },
          templates: {
            title: { he: 'הצעה נגדית על המלגה', en: 'Counter-terms on the stipend' },
            body: {
              he: `הוצעו תנאים אחרים: ₪${terms.stipendRate} לשעה${terms.totalCap ? `, תקרה ₪${terms.totalCap}` : ''}. הגרסה החדשה היא זו שעל השולחן.`,
              en: `Different terms are on the table: ${terms.stipendRate} per hour${terms.totalCap ? `, cap ${terms.totalCap}` : ''}. The new version is the one being decided.`
            }
          },
          channels: ['socket', 'push'],
          metadata: { type: 'voteUpdate', url: 'lev', priority: 'high' }
        },
        { recipients: others, projectId: decision.projectId },
        { projectId: decision.projectId, decisionId },
        context
      )
      .catch((e: unknown) => console.warn('[counterStipendTerms] notification failed:', e));
  }

  return {
    data: { decisionId, ordern: result.ordern, deadline: result.deadline, terms },
    updateStrategy: { type: 'fullRefresh' as const }
  };
};

export const counterStipendTermsConfig: ActionConfig = {
  key: 'counterStipendTerms',
  description:
    'Put different stipend terms on the table (the counter-offer that replaces a rejection). Opens a new round on the same Decision and restarts the restime clock.',
  graphqlOperation: handler,

  paramSchema: {
    decisionId: { type: 'string', required: true, description: 'The stipend Decision being countered' },
    newTerms: { type: 'object', required: false, description: 'Any subset of the terms; the rest stay as they stand' },
    stipendRate: { type: 'number', required: false, description: 'Shorthand for newTerms.stipendRate' },
    costShare: { type: 'number', required: false, description: 'Shorthand for newTerms.costShare' },
    totalCap: { type: 'number', required: false, description: 'Shorthand for newTerms.totalCap' },
    monthlyCap: { type: 'number', required: false, description: 'Shorthand for newTerms.monthlyCap' },
    end: { type: 'string', required: false, description: 'Shorthand for newTerms.end' },
    marketRate: { type: 'number', required: false, description: 'Market rate to validate the ceiling against' },
    why: { type: 'string', required: false, description: 'Why these terms instead' }
  },

  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in to counter a stipend proposal' }],

  updateStrategy: { type: 'fullRefresh' }
};
