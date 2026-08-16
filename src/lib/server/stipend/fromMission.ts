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
import { normalizeTerms } from '$lib/stipend/computeStipendEquity.js';
import { openStipendDecision } from './decision.js';
import { fetchProjectContext } from './read.js';

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
  reason?: 'noStipend' | 'noFunder' | 'funderIsRecipient' | 'failed';
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

  return openPledgeFromMission(exec, need, input);
}
