/**
 * Action: proposeStipendProgram (docs/PLAN_STIPEND.md §4).
 *
 * The rikma-wide half. A program is what makes a *diluting* stipend possible:
 * the rikma agrees once, in principle, to a closed budget and a cost-sharing
 * model, and after that each funder↔recipient pair signs its own terms inside
 * that envelope without another rikma vote.
 *
 * The vote is only possible because the dilution is a closed number: `totalCap`
 * bounds it, and the card shows each member their own percentage before and
 * after. Nobody is ever asked to approve open-ended dilution.
 *
 * A program with no funder yet is legitimate and useful — it is the rikma
 * saying "we would accept this kind of support", which is exactly what
 * `publishStipendFundingRequest` then advertises to the outside world.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { restimeLabel } from './actionUtils.js';
import { execFromContext } from '$lib/server/archive/exec.js';
import { dateField, enumField, fields, numField, run, strField } from '$lib/server/archive/gql.js';
import { openStipendDecision } from '$lib/server/stipend/decision.js';
import { fetchProjectContext } from '$lib/server/stipend/read.js';
import {
  consensusScope,
  effectiveStipendPolicy,
  normalizeTerms,
  validateStipendTerms
} from '$lib/stipend/computeStipendEquity.js';
import { applyStandingStipend, fetchStipendDecision } from '$lib/server/stipend/apply.js';

const MODES = ['equity', 'advance', 'gift'] as const;
const SCOPES = ['allMissions', 'selectedMissions', 'singleMission'] as const;

const handler: ActionExecutionHandler = async (params, context, { notifier }) => {
  const projectId = String(params.projectId ?? '');
  if (!projectId) throw new Error('projectId is required');

  const exec = execFromContext(context);
  const userId = String(context.userId);

  const project = await fetchProjectContext(exec, projectId);
  if (!project) throw new Error(`Project ${projectId} not found`);
  if (!project.memberIds.includes(userId)) {
    throw new Error('Only a member of the rikma may propose a stipend program');
  }
  if (effectiveStipendPolicy(project.policy) === 'off') {
    throw new Error('This rikma has turned subsistence stipends off');
  }

  const terms = normalizeTerms({
    mode: params.mode as any,
    costShare: params.costShare != null ? Number(params.costShare) : 0,
    equityMultiplier: params.equityMultiplier != null ? Number(params.equityMultiplier) : 1,
    stipendRate: params.stipendRate != null ? Number(params.stipendRate) : project.defaultRate ?? 0,
    monthlyCap: params.monthlyCap != null ? Number(params.monthlyCap) : null,
    totalCap: params.totalCap != null ? Number(params.totalCap) : null,
    revenueTrigger: params.revenueTrigger != null ? Number(params.revenueTrigger) : null,
    scope: SCOPES.includes(params.scope as any) ? (params.scope as any) : 'allMissions',
    start: params.start ? String(params.start) : null,
    end: params.end ? String(params.end) : null,
    cycleSize: params.cycleSize != null ? Number(params.cycleSize) : 1
  });

  const validation = validateStipendTerms({
    terms,
    marketRate: params.marketRate != null ? Number(params.marketRate) : null,
    policy: project.policy
  });
  if (!validation.ok && !validation.errors.every((e) => e === 'policyBilateralOnly')) {
    throw new Error(validation.errors[0]);
  }
  // A program is exactly the thing a `bilateral` rikma has not agreed to. Say
  // so in terms of the setting the rikma can change, not as a dead end.
  if (validation.errors.includes('policyBilateralOnly')) {
    throw new Error(
      'This rikma allows only stipends that dilute nobody. Change the rikma’s stipend policy to “collective” to allow programs'
    );
  }
  if (!(Number(terms.totalCap) > 0)) {
    throw new Error(
      'A program needs a total budget — that closed number is what makes the dilution votable'
    );
  }

  const funderId = params.funderId ? String(params.funderId) : null;
  if (funderId && !project.memberIds.includes(funderId)) {
    throw new Error('The funder must be a member of the rikma');
  }

  const nowISO = new Date().toISOString();
  const name = params.name
    ? String(params.name)
    : `תוכנית מלגות קיום · ₪${terms.stipendRate}/ש׳`;

  const created = await run(
    exec,
    `mutation { createStipendProgram(data: { ${fields(
      strField('project', projectId),
      strField('name', name),
      strField('descrip', params.why ? String(params.why) : null),
      funderId ? strField('funder', funderId) : 'seekingFunder: true',
      strField('proposedBy', userId),
      enumField('mode', terms.mode, MODES),
      numField('costShare', terms.costShare),
      numField('equityMultiplier', terms.equityMultiplier),
      numField('stipendRate', terms.stipendRate),
      numField('monthlyCap', terms.monthlyCap),
      numField('totalCap', terms.totalCap),
      numField('revenueTrigger', terms.revenueTrigger),
      enumField('scope', terms.scope, SCOPES),
      'status: proposed',
      'spent: 0',
      dateField('start', terms.start ?? nowISO),
      dateField('end', terms.end),
      params.matbeaId ? strField('matbea', String(params.matbeaId)) : null,
      dateField('publishedAt', nowISO)
    )} }) { data { id } } }`,
    'createProposedProgram'
  );
  const programId = created?.createStipendProgram?.data?.id
    ? String(created.createStipendProgram.data.id)
    : null;
  if (!programId) throw new Error('Failed to record the stipend program');

  const opened = await openStipendDecision(exec, {
    kind: 'stipendProgram',
    projectId,
    projectRestime: project.restime,
    decisionName: name,
    terms,
    why: params.why ? String(params.why) : null,
    initiatorId: userId,
    funderId,
    programId
  });

  // A rikma of one has nobody left to ask; the proposal is unanimous the moment
  // it is made.
  const others = project.memberIds.filter((id) => id !== userId);
  if (others.length === 0) {
    const decision = await fetchStipendDecision(exec, opened.decisionId);
    if (decision) {
      await applyStandingStipend(exec, decision, {
        matbeaId: params.matbeaId ? String(params.matbeaId) : null
      });
    }
    return {
      data: { programId, decisionId: opened.decisionId, immediate: true, scope: 'rikma', terms },
      updateStrategy: { type: 'fullRefresh' as const }
    };
  }

  if (notifier) {
    const lang = (context.lang === 'he' ? 'he' : 'en') as 'he' | 'en';
    notifier
      .notify(
        {
          recipients: { type: 'specificUsers', config: { userIdsParam: 'recipients' } },
          templates: {
            title: { he: 'הצעה לתוכנית מלגות קיום', en: 'A subsistence stipend program was proposed' },
            body: {
              he: `₪${terms.stipendRate} לשעה, תקציב כולל ₪${terms.totalCap}. הקלף מראה מה יקרה לחלק שלך אם התקציב ינוצל במלואו. אפשר לאשר, לפתוח שיחה או להציע תקציב או חלוקת-עלות אחרת. ללא תגובה תוך ${restimeLabel(project.restime, 'he')} ההצעה תאושר מעצמה.`,
              en: `${terms.stipendRate} per hour, total budget ${terms.totalCap}. The card shows what happens to your share if the whole budget is spent. Approve, discuss, or propose a different budget or cost split — with no response within ${restimeLabel(project.restime, lang)} it is approved on its own.`
            }
          },
          channels: ['socket', 'push'],
          metadata: { type: 'voteUpdate', url: 'lev', priority: 'high' }
        },
        { recipients: others, projectId },
        { projectId, decisionId: opened.decisionId },
        context
      )
      .catch((e: unknown) => console.warn('[proposeStipendProgram] notification failed:', e));
  }

  return {
    data: {
      programId,
      decisionId: opened.decisionId,
      timegramaId: opened.timegramaId,
      deadline: opened.deadline,
      immediate: false,
      scope: consensusScope(terms),
      terms
    },
    updateStrategy: { type: 'fullRefresh' as const }
  };
};

export const proposeStipendProgramConfig: ActionConfig = {
  key: 'proposeStipendProgram',
  description:
    'Propose a rikma-wide subsistence stipend program: the closed budget and cost-sharing model inside which individual pledges are then signed bilaterally. Opens a stipendProgram Decision for every member.',
  graphqlOperation: handler,

  paramSchema: {
    projectId: { type: 'string', required: true, description: 'Rikma the program belongs to' },
    name: { type: 'string', required: false, description: 'Program name' },
    stipendRate: { type: 'number', required: false, description: 'Maximum ₪ per approved hour' },
    totalCap: { type: 'number', required: true, description: 'Total budget — the bound on the dilution' },
    monthlyCap: { type: 'number', required: false, description: '₪ ceiling per cycle per recipient' },
    mode: { type: 'string', required: false, description: 'equity (default) | advance | gift' },
    costShare: { type: 'number', required: false, description: 'α — 0 (default for a program) puts the cost on the whole rikma' },
    equityMultiplier: { type: 'number', required: false, description: 'k — risk premium for the funder, ≥ 1' },
    revenueTrigger: { type: 'number', required: false, description: 'Monthly income at which the program ends by itself' },
    scope: { type: 'string', required: false, description: 'allMissions (default) | selectedMissions | singleMission' },
    funderId: { type: 'string', required: false, description: 'The funding member, when there already is one' },
    matbeaId: { type: 'string', required: false, description: 'Currency' },
    marketRate: { type: 'number', required: false, description: 'Market rate to validate the ceiling against' },
    cycleSize: { type: 'number', required: false, description: 'Months per cycle (default 1)' },
    start: { type: 'string', required: false, description: 'ISO start date' },
    end: { type: 'string', required: false, description: 'ISO end date' },
    why: { type: 'string', required: false, description: 'Why the rikma should agree' }
  },

  authRules: [
    { type: 'jwt', errorMessage: 'Must be logged in to propose a stipend program' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Must be a member of the rikma to propose a stipend program'
    }
  ],

  updateStrategy: { type: 'fullRefresh' }
};
