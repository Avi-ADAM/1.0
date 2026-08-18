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

// `advance` stays in the Strapi enum (dropping a deployed enum value is a
// migration, and rows may already carry it) but is no longer writable from
// here — see src/lib/stipend/ADVANCE_MODE.md.
const MODES = ['equity', 'gift'] as const;
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
  // `policyBilateralOnly` is not a blocker *here*, and blocking on it was a
  // dead end: a diluting pledge sent members to open a program, and the program
  // refused because the rikma had not agreed to dilution — which is precisely
  // the question the program puts to them. Proposing one **is** asking; every
  // member votes on it, sees their own before/after percentage, and the cap
  // bounds the answer. Only `off` — the rikma having said "not at all" — stops
  // it, and that is checked above.
  const blockers = validation.errors.filter((e) => e !== 'policyBilateralOnly');
  if (blockers.length > 0) throw new Error(blockers[0]);
  // A program has to be **bounded**, but there are two honest ways to bound
  // one and members need both: a closed total budget ("₪6,000 and that's it"),
  // or a monthly ceiling that runs until somebody stops it ("₪1,500 a month
  // for as long as this lasts") — the shape most subsistence actually has,
  // since nobody knows in advance how many months they will need.
  //
  // What the open-ended form gives up is the single final number, so the card
  // shows a year of the monthly ceiling and says it keeps going; what it must
  // never give up is a ceiling, or the vote would be on an unknown amount.
  const openEnded = !(Number(terms.totalCap) > 0);
  if (openEnded && !(Number(terms.monthlyCap) > 0)) {
    throw new Error(
      'A program needs either a total budget or a monthly ceiling — members are voting on an amount, and there has to be one'
    );
  }

  const funderId = params.funderId ? String(params.funderId) : null;
  if (funderId && !project.memberIds.includes(funderId)) {
    throw new Error('The funder must be a member of the rikma');
  }

  const nowISO = new Date().toISOString();
  // The name is what the votes list and every notification show, so it carries
  // the shape of the budget too — "up to ₪6,000" reads very differently from
  // "₪1,500 a month until stopped", and a member should not have to open the
  // card to tell which one they were asked about.
  const name = params.name
    ? String(params.name)
    : openEnded
      ? `תוכנית מלגות קיום · ₪${terms.stipendRate}/ש׳ · עד ₪${terms.monthlyCap} לחודש, עד עצירה`
      : `תוכנית מלגות קיום · ₪${terms.stipendRate}/ש׳ · תקציב ₪${terms.totalCap}`;

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
    const budgetHe = openEnded
      ? `עד ₪${terms.monthlyCap} לחודש, ללא תאריך סיום — ממשיך עד שעוצרים אותו`
      : `תקציב כולל ₪${terms.totalCap}`;
    const budgetEn = openEnded
      ? `up to ${terms.monthlyCap} a month, with no end date — it runs until someone stops it`
      : `a total budget of ${terms.totalCap}`;

    // Two different questions, so two different messages. The rikma is asked
    // "may we be diluted"; the named funder is asked "will you pay", which is
    // the one question silence cannot answer — their card says so, and so does
    // this.
    const votersOnly = others.filter((id) => id !== funderId);
    if (votersOnly.length > 0) {
      notifier
        .notify(
          {
            recipients: { type: 'specificUsers', config: { userIdsParam: 'recipients' } },
            templates: {
              title: { he: 'הצעה לתוכנית מלגות קיום', en: 'A subsistence stipend program was proposed' },
              body: {
                he: `₪${terms.stipendRate} לשעה, ${budgetHe}. הקלף מראה מה יקרה לחלק שלך. אפשר לאשר, לפתוח שיחה או להציע תקציב או חלוקת-עלות אחרת. ללא תגובה תוך ${restimeLabel(project.restime, 'he')} ההצעה תאושר מעצמה — אלא אם המממן עדיין לא חתם.`,
                en: `${terms.stipendRate} per hour, ${budgetEn}. The card shows what happens to your share. Approve, discuss, or propose a different budget or cost split — with no response within ${restimeLabel(project.restime, lang)} it is approved on its own, unless the funder has yet to sign.`
              }
            },
            channels: ['socket', 'push'],
            metadata: { type: 'voteUpdate', url: 'lev', priority: 'high' }
          },
          { recipients: votersOnly, projectId },
          { projectId, decisionId: opened.decisionId },
          context
        )
        .catch((e: unknown) => console.warn('[proposeStipendProgram] notification failed:', e));
    }

    if (funderId && funderId !== userId) {
      notifier
        .notify(
          {
            recipients: { type: 'specificUsers', config: { userIdsParam: 'recipients' } },
            templates: {
              title: {
                he: 'הוצעת כמממן/ת של תוכנית מלגות קיום',
                en: 'You were named as the funder of a stipend program'
              },
              body: {
                he: `הוצע שאת/ה תממן/י מלגת קיום ב־₪${terms.stipendRate} לשעה מאושרת, ${budgetHe}. זו התחייבות לתשלום מכיסך: היא לא תיכנס לתוקף בלי אישור מפורש שלך, גם אם אף אחד אחר לא יגיב. אפשר לאשר, לפתוח שיחה או להציע תנאים אחרים.`,
                en: `You have been proposed as the funder of a subsistence stipend at ${terms.stipendRate} per approved hour, ${budgetEn}. This is a commitment to pay out of your own pocket: it cannot take effect without your explicit approval, no matter who else stays silent. Approve, open a discussion, or propose different terms.`
              }
            },
            channels: ['socket', 'push', 'email'],
            metadata: { type: 'voteUpdate', url: 'lev', priority: 'high' }
          },
          { recipients: [funderId], projectId },
          { projectId, decisionId: opened.decisionId },
          context
        )
        .catch((e: unknown) => console.warn('[proposeStipendProgram] funder notification failed:', e));
    }
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
