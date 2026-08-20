/**
 * A mission that came with its own stipend need, becoming a real pledge
 * (docs/PLAN_STIPEND.md §13).
 *
 * When a mission is proposed, its author can attach "and it wants ₪X an hour of
 * living money, carried like this". The rikma then answers **one** question:
 * the hours, the rate, and the stipend that goes with them. That vote is what
 * bounds the dilution — the most that can ever be paid is `hours × rate`, a
 * closed number on the same card, which is exactly the bound §4 demands before
 * anyone approves being diluted.
 *
 * So by the time someone takes the mission, the terms are already agreed by
 * everyone whose percentage they move. What is left is the two-party half:
 * this opens the ordinary `stipendPledge` with the funder's signature already
 * on it (they proposed it), leaving the person taking the mission to sign,
 * discuss or counter — the same three answers as everywhere else.
 *
 * Called from every path where an open mission turns into a mission in
 * progress. Best-effort by design: a mission assignment must never fail
 * because its stipend could not be opened.
 */

import {
  dateField,
  enumField,
  fields,
  gqlStr,
  numField,
  run,
  strField,
  type Exec
} from '$lib/server/archive/gql.js';
import { consensusScope, normalizeTerms, validateStipendTerms } from '$lib/stipend/computeStipendEquity.js';
import { openStipendDecision } from './decision.js';
import { fetchActivePrograms, fetchProjectContext } from './read.js';

// `advance` stays in the Strapi enum (dropping a deployed enum value is a
// migration, and rows may already carry it) but is no longer writable from
// here — see src/lib/stipend/ADVANCE_MODE.md.
const MODES = ['equity', 'gift'] as const;
const RECOURSES = ['nonRecourse', 'personal'] as const;
const SCOPES = ['allMissions', 'selectedMissions', 'singleMission'] as const;

/** The stipend half of a mission, as it comes back from any of the queries. */
export interface MissionStipendNeed {
  stipendRate?: unknown;
  stipendCostShare?: unknown;
  stipendMode?: unknown;
  stipendFunder?: { data?: { id?: unknown } | null } | null;
}

export interface OpenPledgeInput {
  projectId: string;
  /** The mission-in-progress the stipend is scoped to. */
  mesimabetahalichId: string;
  /** Who took the mission — the recipient of the stipend. */
  recipientId: string;
  /** Hours the mission was assigned, so the budget is a closed number. */
  hours?: number | null;
  missionName?: string;
  /** Monthly commitment: the cap covers one cycle's worth, not the whole run. */
  iskvua?: boolean;
}

export interface OpenPledgeResult {
  opened: boolean;
  reason?: 'noStipend' | 'noFunder' | 'funderIsRecipient' | 'needsProgram' | 'failed';
  pledgeId?: string;
  decisionId?: string;
}

/**
 * Read the need off a mission record and, when it is complete, open the pledge.
 *
 * Returns `{ opened: false }` with a reason rather than throwing — a mission
 * whose stipend has no funder yet is a perfectly ordinary state: the need stays
 * visible on the mission, and any member can still pick it up later through the
 * ordinary offer button.
 */
export async function openPledgeFromMission(
  exec: Exec,
  need: MissionStipendNeed | null | undefined,
  input: OpenPledgeInput
): Promise<OpenPledgeResult> {
  const rate = Number(need?.stipendRate);
  if (!need || !Number.isFinite(rate) || rate <= 0) return { opened: false, reason: 'noStipend' };

  const funderId = need.stipendFunder?.data?.id ? String(need.stipendFunder.data.id) : null;
  if (!funderId) return { opened: false, reason: 'noFunder' };
  if (funderId === String(input.recipientId)) {
    return { opened: false, reason: 'funderIsRecipient' };
  }

  const hours = Number(input.hours);
  const terms = normalizeTerms({
    mode: need.stipendMode as any,
    costShare: need.stipendCostShare != null ? Number(need.stipendCostShare) : 1,
    equityMultiplier: 1,
    stipendRate: rate,
    // The budget the rikma actually signed off: this mission's hours at this
    // rate. For a recurring mission that is one cycle, which is also what the
    // monthly cap should be.
    totalCap: Number.isFinite(hours) && hours > 0 && !input.iskvua ? Math.round(hours * rate * 100) / 100 : null,
    monthlyCap:
      input.iskvua && Number.isFinite(hours) && hours > 0
        ? Math.round(hours * rate * 100) / 100
        : null,
    scope: 'singleMission'
  });

  try {
    const project = await fetchProjectContext(exec, input.projectId);

    // A mission may advertise a stipend before the rikma has agreed to be
    // diluted for it (an open mission can be given a need while the programme
    // that authorises the dilution is still on the table). While the terms
    // move the rikma's total value, only an **active** programme is that
    // consent — so until one exists the need stays visible and nothing opens.
    if (consensusScope(terms) === 'rikma') {
      const programs = await fetchActivePrograms(exec, input.projectId).catch(() => []);
      const covering = programs.find(
        (p) =>
          p.status === 'active' &&
          validateStipendTerms({
            terms,
            marketRate: null,
            policy: project?.policy ?? null,
            envelope: {
              mode: p.mode,
              costShare: p.costShare,
              equityMultiplier: p.equityMultiplier,
              stipendRate: p.stipendRate,
              remainingCap: p.remainingCap,
              active: true
            }
          }).ok
      );
      if (!covering) return { opened: false, reason: 'needsProgram' };
    }

    const nowISO = new Date().toISOString();
    const name = input.missionName ?? '';

    const created = await run(
      exec,
      `mutation { createStipendPledge(data: { ${fields(
        strField('project', input.projectId),
        strField('funder', funderId),
        strField('recipient', String(input.recipientId)),
        enumField('mode', terms.mode, MODES),
        numField('costShare', terms.costShare),
        numField('equityMultiplier', terms.equityMultiplier),
        numField('stipendRate', terms.stipendRate),
        numField('monthlyCap', terms.monthlyCap),
        numField('totalCap', terms.totalCap),
        numField('noticeCycles', terms.noticeCycles),
        enumField('recourse', terms.recourse, RECOURSES),
        enumField('scope', 'singleMission', SCOPES),
        'initiatedBy: funder',
        'status: proposed',
        strField('proposedBy', funderId),
        `mesimabetahaliches: [${gqlStr(input.mesimabetahalichId)}]`,
        dateField('start', nowISO),
        dateField('publishedAt', nowISO)
      )} }) { data { id } } }`,
      'fromMission:createPledge'
    );
    const pledgeId = created?.createStipendPledge?.data?.id
      ? String(created.createStipendPledge.data.id)
      : null;
    if (!pledgeId) return { opened: false, reason: 'failed' };

    const opened = await openStipendDecision(exec, {
      kind: 'stipendPledge',
      projectId: input.projectId,
      projectRestime: project?.restime ?? null,
      decisionName: name ? `מלגת קיום: ${name}` : 'מלגת קיום',
      terms,
      why: null,
      // Proposing is agreeing, and the funder proposed this when the mission
      // was put to the rikma — so their signature is already on round 1.
      initiatorId: funderId,
      funderId,
      recipientId: String(input.recipientId),
      pledgeId
    });

    return { opened: true, pledgeId, decisionId: opened.decisionId };
  } catch (e) {
    console.warn('[stipend] opening the mission’s pledge failed (non-fatal):', e);
    return { opened: false, reason: 'failed' };
  }
}

/** Read just the stipend half of an open mission. */
export async function fetchMissionStipendNeed(
  exec: Exec,
  openMissionId: string
): Promise<MissionStipendNeed | null> {
  const data = await run(
    exec,
    `{ openMission(id: ${gqlStr(openMissionId)}) { data { attributes {
      stipendRate stipendCostShare stipendMode
      stipendFunder { data { id } }
    } } } }`,
    'fromMission:read'
  ).catch(() => null);
  return data?.openMission?.data?.attributes ?? null;
}

export interface CarryInput extends OpenPledgeInput {
  openMissionId: string;
}

/**
 * The single call every "an open mission just became someone's mission" path
 * makes. Copies the declared need onto the mission in progress — so it stays
 * visible, and so a funder who appears later can still pick it up — and opens
 * the pledge when a funder was already named.
 *
 * Deliberately swallows its own failures: a stipend that could not be opened
 * must never cost someone their mission assignment. The need is still recorded
 * on the mission, so nothing is lost that a member cannot redo by hand.
 */
export async function carryStipendToMission(
  exec: Exec,
  input: CarryInput
): Promise<OpenPledgeResult> {
  const need = await fetchMissionStipendNeed(exec, input.openMissionId);
  const rate = Number(need?.stipendRate);
  if (!need || !Number.isFinite(rate) || rate <= 0) return { opened: false, reason: 'noStipend' };

  const funderId = need.stipendFunder?.data?.id ? String(need.stipendFunder.data.id) : null;
  const mode =
    need.stipendMode === 'gift' || need.stipendMode === 'advance' ? 'gift' : 'equity';

  await run(
    exec,
    `mutation { updateMesimabetahalich(id: ${gqlStr(input.mesimabetahalichId)}, data: { ${fields(
      numField('stipendRate', rate),
      numField('stipendCostShare', need.stipendCostShare != null ? Number(need.stipendCostShare) : 1),
      enumField('stipendMode', mode, MODES),
      funderId ? strField('stipendFunder', funderId) : null
    )} }) { data { id } } }`,
    'fromMission:carry'
  ).catch((e) => console.warn('[stipend] copying the need onto the mission failed:', e));

  // A stipend the rikma already voted on is waiting on this mission as a
  // pledge with no recipient. Claim it rather than opening a second one.
  const waiting = await findPledgeOnOpenMission(exec, input.openMissionId);
  if (waiting) return adoptPledgeIntoMission(exec, waiting, input);

  return openPledgeFromMission(exec, need, input);
}

interface WaitingPledge {
  id: string;
  funderId: string | null;
  programId: string | null;
  terms: ReturnType<typeof normalizeTerms>;
  name: string;
}

/** A pledge already attached to this open mission and still without a taker. */
async function findPledgeOnOpenMission(
  exec: Exec,
  openMissionId: string
): Promise<WaitingPledge | null> {
  const data = await run(
    exec,
    `{ stipendPledges(filters: {
        open_missions: { id: { eq: ${gqlStr(openMissionId)} } },
        status: { in: ["proposed","active"] },
        recipient: { id: { null: true } }
      }, pagination: { limit: 1 }) {
      data { id attributes {
        mode costShare equityMultiplier stipendRate monthlyCap totalCap
        noticeCycles revenueTrigger recourse scope start end cycleSize descrip
        funder { data { id } }
        stipend_program { data { id } }
      } } } }`,
    'fromMission:findWaitingPledge'
  ).catch(() => null);

  const row = data?.stipendPledges?.data?.[0];
  if (!row?.id) return null;
  const a = row.attributes ?? {};
  return {
    id: String(row.id),
    funderId: a.funder?.data?.id ? String(a.funder.data.id) : null,
    programId: a.stipend_program?.data?.id ? String(a.stipend_program.data.id) : null,
    name: String(a.descrip ?? ''),
    terms: normalizeTerms({
      mode: a.mode,
      costShare: a.costShare != null ? Number(a.costShare) : undefined,
      equityMultiplier: a.equityMultiplier != null ? Number(a.equityMultiplier) : undefined,
      stipendRate: a.stipendRate != null ? Number(a.stipendRate) : undefined,
      monthlyCap: a.monthlyCap != null ? Number(a.monthlyCap) : null,
      totalCap: a.totalCap != null ? Number(a.totalCap) : null,
      noticeCycles: a.noticeCycles != null ? Number(a.noticeCycles) : null,
      revenueTrigger: a.revenueTrigger != null ? Number(a.revenueTrigger) : null,
      recourse: a.recourse ?? undefined,
      scope: 'singleMission',
      start: a.start ?? null,
      end: a.end ?? null,
      cycleSize: a.cycleSize != null ? Number(a.cycleSize) : null
    })
  };
}

/**
 * Hand the waiting pledge its taker.
 *
 * This is the step that makes an open-mission stipend payable at all: the
 * monthly amount is computed from approved hours, and approved hours hang off
 * the **mesimabetahalich**, never off the open mission. Until the pledge holds
 * that link the cycle would find no hours and pay nothing, so the conversion
 * happens here, in the one place every assignment path goes through.
 *
 * The terms are not re-opened — the rikma already approved them, and the funder
 * already signed for them. What is new is *who receives*, and that person signs
 * for themselves: the bilateral decision gives them the same three answers as
 * everywhere else (approve · discuss · counter).
 */
async function adoptPledgeIntoMission(
  exec: Exec,
  pledge: WaitingPledge,
  input: CarryInput
): Promise<OpenPledgeResult> {
  if (pledge.funderId && pledge.funderId === String(input.recipientId)) {
    return { opened: false, reason: 'funderIsRecipient' };
  }

  try {
    await run(
      exec,
      `mutation { updateStipendPledge(id: ${gqlStr(pledge.id)}, data: { ${fields(
        strField('recipient', String(input.recipientId)),
        `mesimabetahaliches: [${gqlStr(input.mesimabetahalichId)}]`,
        // Still `proposed`: the taker has not signed yet. Their signature on
        // the decision below is what turns it on.
        'status: proposed'
      )} }) { data { id } } }`,
      'fromMission:adoptPledge'
    );
  } catch (e) {
    console.warn('[stipend] attaching the waiting pledge to the mission failed:', e);
    return { opened: false, reason: 'failed' };
  }

  // Nobody has agreed to pay yet (a programme published while still seeking a
  // funder). The pledge keeps the mission and waits; any member can still take
  // the funding side through the ordinary offer button.
  if (!pledge.funderId) return { opened: false, reason: 'noFunder' };

  try {
    const project = await fetchProjectContext(exec, input.projectId);
    const name = input.missionName ?? pledge.name;
    const opened = await openStipendDecision(exec, {
      kind: 'stipendPledge',
      projectId: input.projectId,
      projectRestime: project?.restime ?? null,
      decisionName: name ? `מלגת קיום: ${name}` : 'מלגת קיום',
      terms: pledge.terms,
      why: null,
      // The funder committed when the rikma approved the programme, so their
      // signature is already on round 1 — exactly as when a mission carries its
      // own need.
      initiatorId: pledge.funderId,
      funderId: pledge.funderId,
      recipientId: String(input.recipientId),
      programId: pledge.programId,
      pledgeId: pledge.id
    });
    return { opened: true, pledgeId: pledge.id, decisionId: opened.decisionId };
  } catch (e) {
    console.warn('[stipend] opening the taker’s decision failed (non-fatal):', e);
    return { opened: true, pledgeId: pledge.id };
  }
}
