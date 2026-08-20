/**
 * Writing the *proposed* stipend rows (docs/PLAN_STIPEND.md §5).
 *
 * A pledge row is born with the proposal, not with its approval: both parties
 * and the moach tab can then see the exact terms while they are still being
 * negotiated, and maturation only has to flip `status` instead of
 * reconstructing the agreement from the decision's rounds.
 *
 * Shared by both entry points, because a rikma-wide program proposed *for a
 * named person and mission* carries the same pledge underneath it — the
 * program is the rikma's consent to the dilution, the pledge is the concrete
 * commitment being consented to.
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
import type { PartialStipendTerms } from '$lib/stipend/types.js';

// `advance` stays in the Strapi enum (dropping a deployed enum value is a
// migration, and rows may already carry it) but is no longer writable — see
// src/lib/stipend/ADVANCE_MODE.md.
const MODES = ['equity', 'gift'] as const;
const SCOPES = ['allMissions', 'selectedMissions', 'singleMission'] as const;
const RECOURSES = ['nonRecourse', 'personal'] as const;
const INITIATORS = ['funder', 'recipient', 'member'] as const;

export interface CreateProposedPledgeInput {
  projectId: string;
  funderId: string | null;
  /**
   * Null for a stipend on an **open** mission: nobody is doing the work yet, so
   * there is nobody to pay. The pledge waits, linked to the mission, until
   * someone takes it (see ./fromMission.ts → `carryStipendToMission`).
   */
  recipientId: string | null;
  programId?: string | null;
  terms: PartialStipendTerms;
  why?: string | null;
  proposedById: string;
  initiatedBy: (typeof INITIATORS)[number];
  /** Missions in progress — what the cycle meters hours against. */
  missionIds?: string[];
  /** Open missions — the same link before anyone has taken the work. */
  openMissionIds?: string[];
  matbeaId?: string | null;
}

/** Create the `status: proposed` pledge row and return its id. */
export async function createProposedPledge(
  exec: Exec,
  input: CreateProposedPledgeInput
): Promise<string | null> {
  const nowISO = new Date().toISOString();
  const t = input.terms;
  const missionIds = input.missionIds ?? [];
  const openMissionIds = input.openMissionIds ?? [];

  const created = await run(
    exec,
    `mutation { createStipendPledge(data: { ${fields(
      strField('project', input.projectId),
      input.funderId ? strField('funder', input.funderId) : null,
      input.recipientId ? strField('recipient', input.recipientId) : null,
      input.programId ? strField('stipend_program', input.programId) : null,
      enumField('mode', t.mode, MODES),
      numField('costShare', t.costShare),
      numField('equityMultiplier', t.equityMultiplier),
      numField('stipendRate', t.stipendRate),
      numField('monthlyCap', t.monthlyCap),
      numField('totalCap', t.totalCap),
      numField('noticeCycles', t.noticeCycles),
      numField('revenueTrigger', t.revenueTrigger),
      enumField('recourse', t.recourse, RECOURSES),
      enumField('scope', t.scope, SCOPES),
      enumField('initiatedBy', input.initiatedBy, INITIATORS),
      'status: proposed',
      strField('descrip', input.why ?? null),
      strField('proposedBy', input.proposedById),
      numField('cycleSize', t.cycleSize),
      dateField('start', t.start ?? nowISO),
      dateField('end', t.end),
      input.matbeaId ? strField('matbea', input.matbeaId) : null,
      missionIds.length > 0
        ? `mesimabetahaliches: [${missionIds.map((m) => gqlStr(m)).join(', ')}]`
        : null,
      openMissionIds.length > 0
        ? `open_missions: [${openMissionIds.map((m) => gqlStr(m)).join(', ')}]`
        : null,
      dateField('publishedAt', nowISO)
    )} }) { data { id } } }`,
    'createProposedPledge'
  );

  return created?.createStipendPledge?.data?.id
    ? String(created.createStipendPledge.data.id)
    : null;
}
