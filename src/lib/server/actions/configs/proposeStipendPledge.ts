/**
 * Action: proposeStipendPledge (docs/PLAN_STIPEND.md §5).
 *
 * "I'll fund your living costs while you work here" — or, from the other side,
 * "I need a stipend to be able to keep working here". Both open the same
 * bilateral proposal; only `initiatedBy` differs, and a third member of the
 * rikma can open it on someone's behalf (a mission owner suggesting that the
 * rikma's funder support the person doing the work).
 *
 * The terms decide the consent scope, not the proposer: while `(k − α) = 0`
 * nobody outside the two parties is affected, so nobody outside signs. A
 * diluting pledge needs a `stipendProgram` above it — the rikma agrees to the
 * dilution once, in principle, and the pairs settle their own terms inside it.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { restimeLabel } from './actionUtils.js';
import { execFromContext } from '$lib/server/archive/exec.js';
import { openStipendDecision } from '$lib/server/stipend/decision.js';
import { createProposedPledge } from '$lib/server/stipend/create.js';
import {
  fetchProgram,
  fetchProjectContext,
  fetchProjectPledges,
  fetchProjectStipendMissions,
  fetchApprovedHours
} from '$lib/server/stipend/read.js';
import { validateStipendTerms, normalizeTerms } from '$lib/stipend/computeStipendEquity.js';
import type { PartialStipendTerms } from '$lib/stipend/types.js';

const SCOPES = ['allMissions', 'selectedMissions', 'singleMission'] as const;
const RECOURSES = ['nonRecourse', 'personal'] as const;
const INITIATORS = ['funder', 'recipient', 'member'] as const;

/** Turn a validation key into the sentence the user reads. */
const ERROR_TEXT: Record<string, string> = {
  rateRequired: 'A stipend needs an hourly rate',
  rateAboveMarket:
    'The stipend rate is higher than the mission’s market rate — that would push the recipient’s own equity below zero',
  noMarketRate:
    'This mission has no market rate, so there is no share to give up — propose it as a gift instead',
  policyOff: 'This rikma has turned subsistence stipends off',
  policyBilateralOnly:
    'These terms dilute every other member, and the rikma has not agreed to dilution. Raise costShare to 1, or open a stipend program — that vote is what authorises it',
  outsideEnvelopeMode: 'These terms use a different mode than the program allows',
  outsideEnvelopeRate: 'The rate is above what the program allows',
  outsideEnvelopeCostShare: 'The program does not let the rikma carry this much of the cost',
  outsideEnvelopeMultiplier: 'The risk premium is above what the program allows',
  programExhausted: 'The program’s budget is already spent'
};

const handler: ActionExecutionHandler = async (params, context, { notifier }) => {
  const projectId = String(params.projectId ?? '');
  const funderId = String(params.funderId ?? '');
  const recipientId = String(params.recipientId ?? '');
  if (!projectId) throw new Error('projectId is required');
  if (!funderId || !recipientId) throw new Error('A stipend needs both a funder and a recipient');
  if (funderId === recipientId) throw new Error('A member cannot fund their own stipend');

  const exec = execFromContext(context);
  const userId = String(context.userId);

  const project = await fetchProjectContext(exec, projectId);
  if (!project) throw new Error(`Project ${projectId} not found`);
  if (!project.memberIds.includes(userId)) {
    throw new Error('Only a member of the rikma may propose a stipend in it');
  }
  if (!project.memberIds.includes(recipientId)) {
    throw new Error('The recipient must be a member of the rikma');
  }
  // The funder may be an outsider only through the funding request route,
  // which adds them to the rikma first — see publishStipendFundingRequest.
  if (!project.memberIds.includes(funderId)) {
    throw new Error('The funder must be a member of the rikma');
  }

  const terms: PartialStipendTerms = normalizeTerms({
    mode: params.mode as any,
    costShare:
      params.costShare != null ? Number(params.costShare) : project.defaultCostShare ?? 1,
    equityMultiplier: params.equityMultiplier != null ? Number(params.equityMultiplier) : 1,
    stipendRate:
      params.stipendRate != null ? Number(params.stipendRate) : project.defaultRate ?? 0,
    monthlyCap: params.monthlyCap != null ? Number(params.monthlyCap) : null,
    totalCap: params.totalCap != null ? Number(params.totalCap) : null,
    noticeCycles: params.noticeCycles != null ? Number(params.noticeCycles) : 1,
    revenueTrigger: params.revenueTrigger != null ? Number(params.revenueTrigger) : null,
    recourse: RECOURSES.includes(params.recourse as any) ? (params.recourse as any) : 'nonRecourse',
    scope: SCOPES.includes(params.scope as any) ? (params.scope as any) : 'allMissions',
    start: params.start ? String(params.start) : null,
    end: params.end ? String(params.end) : null,
    cycleSize: params.cycleSize != null ? Number(params.cycleSize) : 1
  });

  // **The mission is mandatory.** Not for tidiness: each cycle pays `hours
  // approved on that mission that month × the stipend rate` (§6), so a stipend
  // with no mission has no meter and the amount would have to be typed by hand.
  const missionIds: string[] = Array.isArray(params.missionIds)
    ? params.missionIds.map((m: unknown) => String(m)).filter(Boolean)
    : [];
  if (missionIds.length === 0) {
    throw new Error(
      'A stipend has to name the mission it pays for — each month is that mission’s approved hours times the stipend rate, and without it there is nothing to compute'
    );
  }
  if (terms.scope === 'allMissions') {
    terms.scope = missionIds.length > 1 ? 'selectedMissions' : 'singleMission';
  }

  // The missions, read back rather than trusted: they must belong to this
  // rikma, and a stipend pays the person actually doing the work — naming
  // someone else's mission would meter the payment off hours the recipient
  // never worked.
  const projectMissions = await fetchProjectStipendMissions(exec, projectId).catch(() => []);
  const missions = projectMissions.filter(
    (m) => m.kind === 'inProgress' && missionIds.includes(m.id)
  );
  if (missions.length === 0) {
    throw new Error('Those missions are not missions in progress in this rikma');
  }
  const wrongHands = missions.filter((m) => m.userId && m.userId !== recipientId);
  if (wrongHands.length > 0) {
    throw new Error(
      'A stipend pays the member doing the mission — this mission is being done by someone else'
    );
  }

  // **One stipend per person per piece of work.** Two live pledges covering
  // the same recipient's same mission are not two agreements — they are the
  // same agreement counted twice, and the settlement has no way to tell: each
  // one meters the same approved hours from scratch. Live, four active pledges
  // offered the funder four cards for the same 5.01 hours and confirming them
  // drove the recipient's own equity to −2.25% (docs/FIXES.md §2). Changing the
  // terms of a running stipend is `counterStipendTerms` on its decision, or
  // `proposeObjectArchive` on its engine — not a second pledge.
  const live = await fetchProjectPledges(exec, projectId, ['proposed', 'active']).catch(() => []);
  const clash = live.find((p) => {
    if (p.recipientId !== recipientId) return false;
    if (p.terms.scope === 'allMissions' || terms.scope === 'allMissions') return true;
    return p.missionIds.some((id) => missionIds.includes(id));
  });
  if (clash) {
    throw new Error(
      clash.status === 'active'
        ? 'A stipend for this member’s work is already running. Change its terms on the running agreement instead of opening a second one — two would pay for the same approved hours twice'
        : 'A stipend for this member’s work is already on the table, waiting for an answer. Counter that proposal instead of opening a second one'
    );
  }

  // The market rate the ceiling is measured against: the lowest rate among the
  // covered missions, so the guard holds for every one of them. Approved hours
  // carry the rate they were approved at; a mission with none yet still has its
  // own ₪/hour, which is the number the rikma agreed to.
  const approved = await fetchApprovedHours(exec, projectId, recipientId);
  const relevant = approved.filter(
    (a) => a.mesimabetahalichId && missionIds.includes(a.mesimabetahalichId)
  );
  const rates = [
    ...relevant.map((a) => a.perhour),
    ...missions.map((m) => m.perhour)
  ].filter((r): r is number => r != null && r > 0);
  const marketRate =
    params.marketRate != null
      ? Number(params.marketRate)
      : rates.length > 0
        ? Math.min(...rates)
        : null;

  const program = params.programId ? await fetchProgram(exec, String(params.programId)) : null;
  const validation = validateStipendTerms({
    terms,
    marketRate,
    policy: project.policy,
    envelope: program
      ? {
          mode: program.mode,
          costShare: program.costShare,
          equityMultiplier: program.equityMultiplier,
          stipendRate: program.stipendRate,
          remainingCap: program.remainingCap,
          // Only an approved program authorises dilution; one still on the
          // table authorises nothing.
          active: program.status === 'active'
        }
      : null
  });
  if (!validation.ok) {
    throw new Error(ERROR_TEXT[validation.errors[0]] ?? validation.errors[0]);
  }
  // A diluting pledge without a program above it has nobody's consent for the
  // dilution — the rikma has to agree in principle first (§5).
  if (validation.scope === 'rikma' && !program) {
    throw new Error(
      'These terms raise the rikma’s total value, which dilutes every member. Open a stipend program for the rikma to approve first'
    );
  }

  const initiatedBy = INITIATORS.includes(params.initiatedBy as any)
    ? (params.initiatedBy as (typeof INITIATORS)[number])
    : userId === funderId
      ? 'funder'
      : userId === recipientId
        ? 'recipient'
        : 'member';

  // The row is born `proposed`, so both parties (and the moach tab) can see the
  // exact terms while they are still being negotiated. Maturation flips it to
  // active; it never has to be re-created from the decision's rounds.
  const pledgeId = await createProposedPledge(exec, {
    projectId,
    funderId,
    recipientId,
    programId: program?.id ?? null,
    terms,
    why: params.why ? String(params.why) : null,
    proposedById: userId,
    initiatedBy,
    missionIds,
    matbeaId: params.matbeaId ? String(params.matbeaId) : null
  });
  if (!pledgeId) throw new Error('Failed to record the stipend proposal');

  const funderName = project.members.find((m) => m.id === funderId)?.username ?? '';
  const recipientName = project.members.find((m) => m.id === recipientId)?.username ?? '';

  const opened = await openStipendDecision(exec, {
    kind: 'stipendPledge',
    projectId,
    projectRestime: project.restime,
    decisionName: `מלגת קיום: ${funderName} → ${recipientName}`,
    terms,
    why: params.why ? String(params.why) : null,
    initiatorId: userId,
    funderId,
    recipientId,
    programId: program?.id ?? null,
    pledgeId
  });

  // The other party gets asked; when a third member opened it, both do — but
  // not with the same sentence. Being funded and funding are different
  // questions, and only one of them is a commitment to pay.
  const asked = [funderId, recipientId].filter((id) => id !== userId);
  if (notifier && asked.length > 0) {
    const lang = (context.lang === 'he' ? 'he' : 'en') as 'he' | 'en';
    const missionHe = missionIds.length > 0 ? ' עבור המשימה שסוכמה' : ' על שעות שאושרו';
    const missionEn = missionIds.length > 0 ? ' for the agreed mission' : ' on approved hours';

    if (asked.includes(recipientId)) {
      notifier
        .notify(
          {
            recipients: { type: 'specificUsers', config: { userIdsParam: 'recipients' } },
            templates: {
              title: { he: 'הצעה למלגת קיום', en: 'A subsistence stipend was proposed' },
              body: {
                he: `${funderName} מציע/ה לממן לך ₪${terms.stipendRate} לשעה${missionHe}. הקלף מראה מה את/ה מקבל/ת ומה זה עושה לחלק שלך. אפשר לאשר, לפתוח שיחה או להציע תנאים אחרים. ללא תגובה תוך ${restimeLabel(project.restime, 'he')} ההצעה תאושר מעצמה.`,
                en: `${funderName} offers to fund you at ${terms.stipendRate} per hour${missionEn}. The card shows what you receive and what it does to your share. Approve, open a discussion, or propose different terms — with no response within ${restimeLabel(project.restime, lang)} it is approved on its own.`
              }
            },
            channels: ['socket', 'push'],
            metadata: { type: 'voteUpdate', url: 'lev', priority: 'high' }
          },
          { recipients: [recipientId], projectId },
          { projectId, decisionId: opened.decisionId },
          context
        )
        .catch((e: unknown) => console.warn('[proposeStipendPledge] notification failed:', e));
    }

    if (asked.includes(funderId)) {
      notifier
        .notify(
          {
            recipients: { type: 'specificUsers', config: { userIdsParam: 'recipients' } },
            templates: {
              title: {
                he: 'הוצעת כמממן/ת של מלגת קיום',
                en: 'You were named as the funder of a stipend'
              },
              body: {
                he: `הוצע שאת/ה תממן/י את ${recipientName} ב־₪${terms.stipendRate} לשעה${missionHe}. זו התחייבות לתשלום מכיסך: היא לא תיכנס לתוקף בלי אישור מפורש שלך — שתיקה לא מאשרת אותה. אפשר לאשר, לפתוח שיחה או להציע תנאים אחרים.`,
                en: `It was proposed that you fund ${recipientName} at ${terms.stipendRate} per hour${missionEn}. This is a commitment to pay out of your own pocket: it cannot take effect without your explicit approval — silence will not approve it. Approve, open a discussion, or propose different terms.`
              }
            },
            channels: ['socket', 'push', 'email'],
            metadata: { type: 'voteUpdate', url: 'lev', priority: 'high' }
          },
          { recipients: [funderId], projectId },
          { projectId, decisionId: opened.decisionId },
          context
        )
        .catch((e: unknown) => console.warn('[proposeStipendPledge] funder notification failed:', e));
    }
  }

  return {
    data: {
      pledgeId,
      decisionId: opened.decisionId,
      timegramaId: opened.timegramaId,
      deadline: opened.deadline,
      scope: validation.scope,
      terms
    },
    updateStrategy: { type: 'fullRefresh' as const }
  };
};

export const proposeStipendPledgeConfig: ActionConfig = {
  key: 'proposeStipendPledge',
  description:
    'Propose a bilateral subsistence stipend (funder → recipient) inside a rikma. Opens a stipendPledge Decision that both parties sign; silence for the rikma’s restime approves it.',
  graphqlOperation: handler,

  paramSchema: {
    projectId: { type: 'string', required: true, description: 'Rikma the stipend lives in' },
    funderId: { type: 'string', required: true, description: 'Member paying the stipend' },
    recipientId: { type: 'string', required: true, description: 'Member receiving it' },
    stipendRate: { type: 'number', required: false, description: '₪ per approved hour (≤ the mission’s market rate)' },
    mode: { type: 'string', required: false, description: 'equity (default) | advance | gift' },
    costShare: { type: 'number', required: false, description: 'α — 1 = the recipient carries the cost, 0 = the whole rikma' },
    equityMultiplier: { type: 'number', required: false, description: 'k — the funder’s risk premium, ≥ 1' },
    monthlyCap: { type: 'number', required: false, description: '₪ ceiling per cycle' },
    totalCap: { type: 'number', required: false, description: '₪ ceiling overall — the automatic ending' },
    noticeCycles: { type: 'number', required: false, description: 'Cycles of notice required to stop' },
    revenueTrigger: { type: 'number', required: false, description: 'Monthly income at which the stipend ends by itself' },
    recourse: { type: 'string', required: false, description: 'nonRecourse (default) | personal — advances only' },
    scope: { type: 'string', required: false, description: 'allMissions (default) | selectedMissions | singleMission' },
    missionIds: { type: 'array', required: false, description: 'Missions covered when the scope is not allMissions' },
    programId: { type: 'string', required: false, description: 'Stipend program this pledge sits inside' },
    matbeaId: { type: 'string', required: false, description: 'Currency' },
    marketRate: { type: 'number', required: false, description: 'Market rate to validate against (defaults to the covered missions’ lowest)' },
    initiatedBy: { type: 'string', required: false, description: 'funder | recipient | member' },
    cycleSize: { type: 'number', required: false, description: 'Months per cycle (default 1)' },
    start: { type: 'string', required: false, description: 'ISO start date' },
    end: { type: 'string', required: false, description: 'ISO end date' },
    why: { type: 'string', required: false, description: 'A word to the other party' }
  },

  authRules: [
    { type: 'jwt', errorMessage: 'Must be logged in to propose a stipend' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Must be a member of the rikma to propose a stipend in it'
    }
  ],

  updateStrategy: { type: 'fullRefresh' }
};
