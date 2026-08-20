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
 *
 * **A program is normally about a specific person and a specific mission.**
 * "Subsistence" is never abstract: somebody is doing work they cannot afford
 * to keep doing. So when the proposal names a recipient, the concrete pledge
 * is written underneath the program in the same breath and hangs off the same
 * Decision — the rikma votes on the dilution *and* on what it buys, and
 * approving it activates both. A program with no named recipient stays
 * possible, but it is the budget-first exception, not the shape to design for.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { restimeLabel } from './actionUtils.js';
import { execFromContext } from '$lib/server/archive/exec.js';
import { dateField, enumField, fields, gqlStr, numField, run, strField } from '$lib/server/archive/gql.js';
import { openStipendDecision } from '$lib/server/stipend/decision.js';
import { createProposedPledge } from '$lib/server/stipend/create.js';
import {
  fetchProjectContext,
  fetchProjectStipendMissions
} from '$lib/server/stipend/read.js';
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

  const funderId = params.funderId ? String(params.funderId) : null;
  if (funderId && !project.memberIds.includes(funderId)) {
    throw new Error('The funder must be a member of the rikma');
  }

  // **The mission is mandatory**, and it is mandatory for a mechanical reason:
  // each cycle pays `hours approved on that mission that month × the stipend
  // rate` (§6). Without a named mission there is no meter, and the monthly
  // amount would have to be typed by hand — which is exactly what the whole
  // model refuses to allow.
  const missionIds: string[] = Array.isArray(params.missionIds)
    ? params.missionIds.map((m: unknown) => String(m)).filter(Boolean)
    : [];
  const openMissionId = params.openMissionId ? String(params.openMissionId) : null;
  if (missionIds.length === 0 && !openMissionId) {
    throw new Error(
      'A stipend has to name the mission it pays for — each month is that mission’s approved hours times the stipend rate, and without it there is nothing to compute'
    );
  }

  // Read the missions back rather than trusting the ids: they have to belong to
  // this rikma, and their own ₪/hour is the ceiling the stipend rate is
  // measured against — the market rate is what buys the equity, the stipend is
  // what buys groceries, and a stipend above the market rate would push the
  // recipient's own share below zero (§1).
  const allMissions = await fetchProjectStipendMissions(exec, projectId).catch(() => []);
  const missions = allMissions.filter((m) => m.kind === 'inProgress' && missionIds.includes(m.id));
  if (missionIds.length > 0 && missions.length === 0) {
    throw new Error('Those missions are not missions in progress in this rikma');
  }
  const openMission = openMissionId
    ? allMissions.find((m) => m.kind === 'open' && m.id === openMissionId) ?? null
    : null;
  if (openMissionId && !openMission) {
    throw new Error('That open mission does not belong to this rikma');
  }

  // Who the stipend is for is **derived from the work**, not chosen: a stipend
  // pays the person doing the mission. An open mission has nobody on it yet —
  // a legitimate state, and the reason this can be null — and then whoever
  // takes the mission signs the pledge (see server/stipend/fromMission.ts).
  const performerIds = Array.from(
    new Set(missions.map((m) => m.userId).filter((id): id is string => !!id))
  );
  if (performerIds.length > 1) {
    throw new Error('Those missions are done by different members — a stipend pays one person');
  }
  const recipientId =
    performerIds[0] ?? (params.recipientId ? String(params.recipientId) : null);
  if (recipientId && !project.memberIds.includes(recipientId)) {
    throw new Error('The recipient must be a member of the rikma');
  }
  if (recipientId && funderId && recipientId === funderId) {
    throw new Error('A member cannot fund their own stipend');
  }

  const missionRates = [...missions, ...(openMission ? [openMission] : [])]
    .map((m) => m.perhour)
    .filter((r): r is number => r != null && r > 0);
  const marketRate =
    params.marketRate != null
      ? Number(params.marketRate)
      : missionRates.length > 0
        ? Math.min(...missionRates)
        : null;

  // Naming missions *is* the scope: a program that lists them is not an
  // "every hour in the rikma" program, and the pledge underneath it has to
  // carry the same answer, or the cycle settlement would pay for work the
  // rikma never approved paying for.
  if (params.scope == null) {
    terms.scope = missions.length > 1 ? 'selectedMissions' : 'singleMission';
  }

  const validation = validateStipendTerms({
    terms,
    marketRate,
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

  const nowISO = new Date().toISOString();
  // The name is what the votes list and every notification show, so it carries
  // the shape of the budget too — "up to ₪6,000" reads very differently from
  // "₪1,500 a month until stopped", and a member should not have to open the
  // card to tell which one they were asked about.
  const recipientName = recipientId
    ? project.members.find((m) => m.id === recipientId)?.username ?? ''
    : '';
  const budgetLabel = openEnded
    ? `עד ₪${terms.monthlyCap} לחודש, עד עצירה`
    : `תקציב ₪${terms.totalCap}`;
  const forWhom = recipientName ? `ל${recipientName}` : 'לריקמה';
  const namedMission = missions.length === 1 ? missions[0] : openMission;
  const forWhat = namedMission ? ` · ${namedMission.name}` : '';
  const name = params.name
    ? String(params.name)
    : `מלגת קיום ${forWhom}${forWhat} · ₪${terms.stipendRate}/ש׳ · ${budgetLabel}`;

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

  // An **open** mission also gets the need written on the mission itself —
  // `stipendRate` & co. are how a mission page says "this comes with living
  // money", and that is what a candidate reads before applying (§13). The
  // binding link is the pledge below; these four fields are the shop window.
  if (openMission) {
    await run(
      exec,
      `mutation { updateOpenMission(id: ${gqlStr(openMission.id)}, data: { ${fields(
        numField('stipendRate', terms.stipendRate),
        numField('stipendCostShare', terms.costShare),
        enumField('stipendMode', terms.mode, MODES),
        funderId ? strField('stipendFunder', funderId) : null
      )} }) { data { id } } }`,
      'attachStipendToOpenMission'
    ).catch((e: unknown) =>
      console.warn('[proposeStipendProgram] attaching the need to the open mission failed:', e)
    );
  }

  // The concrete commitment under the envelope. Written now, `proposed`, so
  // the card can name the mission (and the person, when there is one) the
  // rikma is being asked to dilute itself for — and so maturation only has to
  // flip its status.
  //
  // For an open mission the recipient is null: the work has no taker yet. The
  // pledge still exists and still names the mission, which is what makes it
  // findable when somebody does take it (server/stipend/fromMission.ts).
  const pledgeId =
    recipientId || openMission
      ? await createProposedPledge(exec, {
          projectId,
          funderId,
          recipientId,
          programId,
          terms,
          why: params.why ? String(params.why) : null,
          proposedById: userId,
          initiatedBy:
            userId === recipientId ? 'recipient' : userId === funderId ? 'funder' : 'member',
          missionIds,
          openMissionIds: openMission ? [openMission.id] : undefined,
          matbeaId: params.matbeaId ? String(params.matbeaId) : null
        })
      : null;

  const opened = await openStipendDecision(exec, {
    kind: 'stipendProgram',
    projectId,
    projectRestime: project.restime,
    decisionName: name,
    terms,
    why: params.why ? String(params.why) : null,
    initiatorId: userId,
    funderId,
    recipientId,
    programId,
    pledgeId
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

    // Who and what for — the two things a voter needs before any number.
    const missionNames = [...missions, ...(openMission ? [openMission] : [])].map((m) => m.name);
    const missionHe = missionNames.length > 0 ? ` על «${missionNames.join('», «')}»` : '';
    const missionEn = missionNames.length > 0 ? ` for “${missionNames.join('”, “')}”` : '';
    const forWhomHe = recipientName
      ? `מלגת קיום ל${recipientName}${missionHe}`
      : 'תקציב מלגות קיום לריקמה';
    const forWhomEn = recipientName
      ? `A subsistence stipend for ${recipientName}${missionEn}`
      : 'A subsistence stipend budget for the rikma';

    // Two different questions, so two different messages. The rikma is asked
    // "may we be diluted"; the named funder is asked "will you pay", which is
    // the one question silence cannot answer — their card says so, and so does
    // this.
    const votersOnly = others.filter((id) => id !== funderId && id !== recipientId);
    if (votersOnly.length > 0) {
      notifier
        .notify(
          {
            recipients: { type: 'specificUsers', config: { userIdsParam: 'recipients' } },
            templates: {
              title: { he: 'הצעה לתוכנית מלגות קיום', en: 'A subsistence stipend program was proposed' },
              body: {
                he: `${forWhomHe}: ₪${terms.stipendRate} לשעה, ${budgetHe}. הקלף מראה מה יקרה לחלק שלך. אפשר לאשר, לפתוח שיחה או להציע תקציב או חלוקת-עלות אחרת. ללא תגובה תוך ${restimeLabel(project.restime, 'he')} ההצעה תאושר מעצמה — אלא אם המממן עדיין לא חתם.`,
                en: `${forWhomEn}: ${terms.stipendRate} per hour, ${budgetEn}. The card shows what happens to your share. Approve, discuss, or propose a different budget or cost split — with no response within ${restimeLabel(project.restime, lang)} it is approved on its own, unless the funder has yet to sign.`
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

    if (recipientId && recipientId !== userId) {
      notifier
        .notify(
          {
            recipients: { type: 'specificUsers', config: { userIdsParam: 'recipients' } },
            templates: {
              title: {
                he: 'הוצעה מלגת קיום עבורך',
                en: 'A subsistence stipend was proposed for you'
              },
              body: {
                he: `הוצע שהריקמה תממן לך ₪${terms.stipendRate} לשעה מאושרת${missionHe}, ${budgetHe}. הקלף מראה מה את/ה מקבל/ת ומה זה עושה לחלק שלך. אפשר לאשר, לפתוח שיחה או להציע תנאים אחרים.`,
                en: `It was proposed that the rikma funds you at ${terms.stipendRate} per approved hour${missionEn}, ${budgetEn}. The card shows what you receive and what it does to your share. Approve, open a discussion, or propose different terms.`
              }
            },
            channels: ['socket', 'push'],
            metadata: { type: 'voteUpdate', url: 'lev', priority: 'high' }
          },
          { recipients: [recipientId], projectId },
          { projectId, decisionId: opened.decisionId },
          context
        )
        .catch((e: unknown) => console.warn('[proposeStipendProgram] recipient notification failed:', e));
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
                he: `הוצע שאת/ה תממן/י ${recipientName ? `את ${recipientName}` : 'מלגת קיום'}${missionHe} ב־₪${terms.stipendRate} לשעה מאושרת, ${budgetHe}. זו התחייבות לתשלום מכיסך: היא לא תיכנס לתוקף בלי אישור מפורש שלך, גם אם אף אחד אחר לא יגיב. אפשר לאשר, לפתוח שיחה או להציע תנאים אחרים.`,
                en: `You have been proposed as the funder of ${recipientName ? recipientName + '’s' : 'a'} subsistence stipend${missionEn} at ${terms.stipendRate} per approved hour, ${budgetEn}. This is a commitment to pay out of your own pocket: it cannot take effect without your explicit approval, no matter who else stays silent. Approve, open a discussion, or propose different terms.`
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
    totalCap: { type: 'number', required: false, description: 'Total budget — the closed bound on the dilution. Optional only when monthlyCap is given (an open-ended program that runs until stopped)' },
    monthlyCap: { type: 'number', required: false, description: '₪ ceiling per cycle per recipient — and the bound of an open-ended program' },
    mode: { type: 'string', required: false, description: 'equity (default) | advance | gift' },
    costShare: { type: 'number', required: false, description: 'α — 0 (default for a program) puts the cost on the whole rikma' },
    equityMultiplier: { type: 'number', required: false, description: 'k — risk premium for the funder, ≥ 1' },
    revenueTrigger: { type: 'number', required: false, description: 'Monthly income at which the program ends by itself' },
    scope: { type: 'string', required: false, description: 'allMissions (default) | selectedMissions | singleMission' },
    funderId: { type: 'string', required: false, description: 'The funding member, when there already is one' },
    recipientId: { type: 'string', required: false, description: 'Who the stipend is for — writes the concrete pledge under the program' },
    missionIds: { type: 'array', required: false, description: 'The in-progress missions the stipend pays for' },
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
