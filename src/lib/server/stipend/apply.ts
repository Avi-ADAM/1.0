/**
 * Reading a stipend Decision back and applying the version on the table
 * (docs/PLAN_STIPEND.md §5, §6).
 *
 * Written once and called from two places — the explicit vote and the restime
 * clock — because "approved by everyone" and "nobody objected in time" must
 * produce byte-identical outcomes. That is the whole promise of silence-as-
 * consent; two implementations would eventually break it.
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
import type { StipendTerms } from '$lib/stipend/types.js';
import { closeStipendDecision, type StipendDecisionKind, type Vot } from './decision.js';

const MODES = ['equity', 'advance', 'gift'] as const;
const SCOPES = ['allMissions', 'selectedMissions', 'singleMission'] as const;
const RECOURSES = ['nonRecourse', 'personal'] as const;

function num(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export interface StipendDecisionRound extends StipendTerms {
  ordern: number;
  why: string | null;
  proposedById: string | null;
  zman: string | null;
}

export interface StipendDecision {
  id: string;
  kind: StipendDecisionKind;
  archived: boolean;
  decisionName: string;
  why: string | null;
  projectId: string | null;
  projectRestime: string | null;
  memberIds: string[];
  funderId: string | null;
  recipientId: string | null;
  programId: string | null;
  pledgeId: string | null;
  rounds: StipendDecisionRound[];
  vots: Vot[];
  timegramaId: string | null;
  timegramaDate: string | null;
}

/** The round on the table = the highest `ordern`, not the newest row. */
export function standingRound(decision: StipendDecision): StipendDecisionRound {
  const rounds = [...decision.rounds].sort((a, b) => a.ordern - b.ordern);
  return rounds[rounds.length - 1];
}

export function standingOrder(decision: StipendDecision): number {
  return decision.rounds.reduce((max, r) => Math.max(max, r.ordern), 1);
}

/** Who must sign this kind of proposal — derived, never stored. */
export function signerIds(decision: StipendDecision): string[] {
  if (decision.kind === 'stipendPledge') {
    return [decision.funderId, decision.recipientId].filter(Boolean).map(String) as string[];
  }
  return decision.memberIds;
}

export function signedIdsOn(decision: StipendDecision, order: number): string[] {
  return Array.from(
    new Set(
      decision.vots
        .filter((v) => Number(v.order) === order && v.what !== false)
        .map((v) => String(v.userId))
    )
  );
}

export async function fetchStipendDecision(
  exec: Exec,
  decisionId: string
): Promise<StipendDecision | null> {
  const data = await run(
    exec,
    `{ decision(id: ${gqlStr(decisionId)}) { data { id attributes {
      kind archived decisionName archWhy
      vots { what order zman users_permissions_user { data { id } } }
      negostip {
        ordern why zman mode costShare equityMultiplier stipendRate monthlyCap
        totalCap noticeCycles revenueTrigger recourse scope start end cycleSize
        proposedBy { data { id } }
      }
      stipFunder { data { id } }
      stipRecipient { data { id } }
      stipendProgram { data { id } }
      stipendPledge { data { id } }
      timegrama { data { id attributes { date done } } }
      projects { data { id attributes { restime user_1s { data { id } } } } }
    } } } }`,
    'fetchStipendDecision'
  );

  const d = data?.decision?.data;
  if (!d) return null;
  const a = d.attributes ?? {};
  if (a.kind !== 'stipendProgram' && a.kind !== 'stipendPledge') return null;

  const project = a.projects?.data?.[0];
  const rounds: StipendDecisionRound[] = (a.negostip ?? []).map((r: any) => {
    const t = normalizeTerms({
      mode: r.mode,
      costShare: num(r.costShare) ?? undefined,
      equityMultiplier: num(r.equityMultiplier) ?? undefined,
      stipendRate: num(r.stipendRate) ?? undefined,
      monthlyCap: num(r.monthlyCap),
      totalCap: num(r.totalCap),
      noticeCycles: num(r.noticeCycles),
      revenueTrigger: num(r.revenueTrigger),
      recourse: r.recourse ?? undefined,
      scope: r.scope ?? undefined,
      start: r.start ?? null,
      end: r.end ?? null,
      cycleSize: num(r.cycleSize)
    });
    return {
      ...t,
      ordern: num(r.ordern) ?? 1,
      why: r.why ?? null,
      proposedById: r.proposedBy?.data?.id ? String(r.proposedBy.data.id) : null,
      zman: r.zman ?? null
    };
  });

  return {
    id: String(d.id),
    kind: a.kind,
    archived: a.archived === true,
    decisionName: String(a.decisionName ?? ''),
    why: a.archWhy ?? null,
    projectId: project?.id ? String(project.id) : null,
    projectRestime: project?.attributes?.restime ?? null,
    memberIds: (project?.attributes?.user_1s?.data ?? []).map((u: any) => String(u.id)),
    funderId: a.stipFunder?.data?.id ? String(a.stipFunder.data.id) : null,
    recipientId: a.stipRecipient?.data?.id ? String(a.stipRecipient.data.id) : null,
    programId: a.stipendProgram?.data?.id ? String(a.stipendProgram.data.id) : null,
    pledgeId: a.stipendPledge?.data?.id ? String(a.stipendPledge.data.id) : null,
    rounds: rounds.length > 0 ? rounds : [{ ...normalizeTerms({}), ordern: 1, why: null, proposedById: null, zman: null }],
    vots: (a.vots ?? []).map((v: any) => ({
      userId: String(v.users_permissions_user?.data?.id ?? ''),
      order: num(v.order) ?? 1,
      what: v.what !== false,
      zman: v.zman ?? undefined
    })),
    timegramaId: a.timegrama?.data?.id ? String(a.timegrama.data.id) : null,
    timegramaDate: a.timegrama?.data?.attributes?.date ?? null
  };
}

function termFields(terms: StipendTerms): Array<string | null> {
  return [
    enumField('mode', terms.mode, MODES),
    numField('costShare', terms.costShare),
    numField('equityMultiplier', terms.equityMultiplier),
    numField('stipendRate', terms.stipendRate),
    numField('monthlyCap', terms.monthlyCap),
    numField('totalCap', terms.totalCap),
    numField('noticeCycles', terms.noticeCycles),
    numField('revenueTrigger', terms.revenueTrigger),
    enumField('recourse', terms.recourse, RECOURSES),
    enumField('scope', terms.scope, SCOPES),
    dateField('start', terms.start),
    dateField('end', terms.end),
    numField('cycleSize', terms.cycleSize)
  ];
}

export interface AppliedStipend {
  kind: StipendDecisionKind;
  programId: string | null;
  pledgeId: string | null;
  mashabetahalichId: string | null;
  terms: StipendTerms;
}

/**
 * Apply the standing version: the pledge / program row comes into existence
 * (or is updated in place, when the proposal amended an existing one) and the
 * decision closes.
 *
 * The pledge also gets its engine — a recurring `mashabetahalich` at the
 * stipend rate. That is deliberate reuse: cycles, dormancy, "stop at the end
 * of the cycle" and the whole archival negotiation already work on it, so the
 * stipend inherits an ending it never had to invent.
 */
export async function applyStandingStipend(
  exec: Exec,
  decision: StipendDecision,
  opts: { missionIds?: string[]; matbeaId?: string | null; fundedBy?: string | null } = {}
): Promise<AppliedStipend> {
  const round = standingRound(decision);
  const terms: StipendTerms = normalizeTerms(round);
  const nowISO = new Date().toISOString();

  if (decision.kind === 'stipendProgram') {
    const programId = await upsertProgram(exec, decision, terms, nowISO, opts.matbeaId ?? null);
    await closeStipendDecision(exec, decision.id, decision.timegramaId);
    return { kind: decision.kind, programId, pledgeId: null, mashabetahalichId: null, terms };
  }

  const { pledgeId, mashabetahalichId } = await upsertPledge(exec, decision, terms, nowISO, opts);
  await closeStipendDecision(exec, decision.id, decision.timegramaId);
  return { kind: decision.kind, programId: decision.programId, pledgeId, mashabetahalichId, terms };
}

async function upsertProgram(
  exec: Exec,
  decision: StipendDecision,
  terms: StipendTerms,
  nowISO: string,
  matbeaId: string | null
): Promise<string | null> {
  const common = fields(
    ...termFields(terms),
    strField('name', decision.decisionName),
    strField('descrip', decision.why),
    'status: active',
    decision.funderId ? strField('funder', decision.funderId) : 'seekingFunder: true',
    matbeaId ? strField('matbea', matbeaId) : null
  );

  if (decision.programId) {
    await run(
      exec,
      `mutation { updateStipendProgram(id: ${gqlStr(decision.programId)}, data: { ${common} }) { data { id } } }`,
      'updateProgram'
    );
    return decision.programId;
  }

  const created = await run(
    exec,
    `mutation { createStipendProgram(data: { ${fields(
      common,
      decision.projectId ? strField('project', decision.projectId) : null,
      strField('proposedBy', decision.rounds[0]?.proposedById),
      dateField('publishedAt', nowISO)
    )} }) { data { id } } }`,
    'createProgram'
  );
  const programId = created?.createStipendProgram?.data?.id
    ? String(created.createStipendProgram.data.id)
    : null;
  if (programId) {
    await run(
      exec,
      `mutation { updateDecision(id: ${gqlStr(decision.id)}, data: { stipendProgram: ${gqlStr(programId)} }) { data { id } } }`,
      'linkProgramToDecision'
    ).catch((e) => console.warn('[stipend] linking program to decision failed (non-fatal):', e));
  }
  return programId;
}

async function upsertPledge(
  exec: Exec,
  decision: StipendDecision,
  terms: StipendTerms,
  nowISO: string,
  opts: { missionIds?: string[]; matbeaId?: string | null }
): Promise<{ pledgeId: string | null; mashabetahalichId: string | null }> {
  const missionIds = opts.missionIds ?? [];
  const common = fields(
    ...termFields(terms),
    'status: active',
    strField('descrip', decision.why),
    decision.funderId ? strField('funder', decision.funderId) : null,
    decision.recipientId ? strField('recipient', decision.recipientId) : null,
    decision.programId ? strField('stipend_program', decision.programId) : null,
    opts.matbeaId ? strField('matbea', opts.matbeaId) : null,
    missionIds.length > 0
      ? `mesimabetahaliches: [${missionIds.map((m) => gqlStr(m)).join(', ')}]`
      : null
  );

  let pledgeId = decision.pledgeId;
  if (pledgeId) {
    await run(
      exec,
      `mutation { updateStipendPledge(id: ${gqlStr(pledgeId)}, data: { ${common} }) { data { id } } }`,
      'updatePledge'
    );
  } else {
    const created = await run(
      exec,
      `mutation { createStipendPledge(data: { ${fields(
        common,
        decision.projectId ? strField('project', decision.projectId) : null,
        strField('proposedBy', decision.rounds[0]?.proposedById),
        dateField('start', terms.start ?? nowISO),
        dateField('publishedAt', nowISO)
      )} }) { data { id } } }`,
      'createPledge'
    );
    pledgeId = created?.createStipendPledge?.data?.id
      ? String(created.createStipendPledge.data.id)
      : null;
    if (pledgeId) {
      await run(
        exec,
        `mutation { updateDecision(id: ${gqlStr(decision.id)}, data: { stipendPledge: ${gqlStr(pledgeId)} }) { data { id } } }`,
        'linkPledgeToDecision'
      ).catch((e) => console.warn('[stipend] linking pledge to decision failed (non-fatal):', e));
    }
  }
  if (!pledgeId) return { pledgeId: null, mashabetahalichId: null };

  // The engine. Ending the stipend is `proposeObjectArchive` on this row, with
  // `endOfCycle` scheduling `archiveEffectiveFrom` — no bespoke stop flow.
  const mashabetahalichId = await ensureEngine(exec, decision, terms, pledgeId, nowISO);
  return { pledgeId, mashabetahalichId };
}

async function ensureEngine(
  exec: Exec,
  decision: StipendDecision,
  terms: StipendTerms,
  pledgeId: string,
  nowISO: string
): Promise<string | null> {
  const existing = await run(
    exec,
    `{ stipendPledge(id: ${gqlStr(pledgeId)}) { data { attributes { mashabetahalich { data { id } } } } } }`,
    'readEngine'
  ).catch(() => null);
  const current = existing?.stipendPledge?.data?.attributes?.mashabetahalich?.data?.id;

  const engineFields = fields(
    strField('name', decision.decisionName),
    strField('descrip', decision.why),
    'recurring: true',
    'unit: hour',
    'kindOf: monthly',
    'status_mashab: active',
    'lifecycle: active',
    numField('pricePerUnit', terms.stipendRate),
    numField('cycleSize', terms.cycleSize),
    dateField('start', terms.start ?? nowISO),
    dateField('end', terms.end)
  );

  if (current) {
    await run(
      exec,
      `mutation { updateMashabetahalich(id: ${gqlStr(String(current))}, data: { ${engineFields} }) { data { id } } }`,
      'updateEngine'
    ).catch((e) => console.warn('[stipend] updating the pledge engine failed (non-fatal):', e));
    return String(current);
  }

  try {
    const created = await run(
      exec,
      `mutation { createMashabetahalich(data: { ${fields(
        engineFields,
        decision.projectId ? strField('project', decision.projectId) : null,
        decision.funderId ? strField('users_permissions_user', decision.funderId) : null,
        dateField('publishedAt', nowISO)
      )} }) { data { id } } }`,
      'createEngine'
    );
    const engineId = created?.createMashabetahalich?.data?.id
      ? String(created.createMashabetahalich.data.id)
      : null;
    if (engineId) {
      await run(
        exec,
        `mutation { updateStipendPledge(id: ${gqlStr(pledgeId)}, data: { mashabetahalich: ${gqlStr(engineId)} }) { data { id } } }`,
        'linkEngine'
      );
    }
    return engineId;
  } catch (e) {
    // A pledge without its engine still pays out; it just loses the automatic
    // cycle/dormancy machinery. Better than losing the agreement.
    console.warn('[stipend] creating the pledge engine failed (non-fatal):', e);
    return null;
  }
}
