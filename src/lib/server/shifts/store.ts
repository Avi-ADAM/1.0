/**
 * The shift store — every read and write against the five shift collections
 * (docs/PLAN_SHIFTS.md §3), in one place.
 *
 * Raw GraphQL documents rather than `qids.js`, the same choice as
 * `resources/bookingStore.ts`: `npm run validate:qids` checks every mutation
 * against the deployed schema, and collections that are not deployed yet
 * would fail the whole check. Writes pass `data` as a typed variable
 * (`ShiftAvailabilityInput`, …), so enums, relations and JSON all travel as
 * plain values.
 *
 * Nothing here decides anything. The algorithm lives in src/lib/shifts; the
 * authorization in the actions. This file only moves rows.
 */

import { run, type ShiftExec } from './exec.js';
import {
  nodes,
  toAssignment,
  toCommitments,
  toDeclaration,
  toPeriod,
  toPlan,
  toShift,
  type AssignmentView,
  type CommitmentView,
  type DeclarationView,
  type PeriodView,
  type ShiftPlanView,
  type ShiftView
} from './read.js';
import type { ShiftInstance, Stance } from '$lib/shifts/types.js';
import type { CycleWindow } from '$lib/shifts/settings.js';
import type { ProjectTiming } from '$lib/shifts/settings.js';

const LIMIT = 2000;

const PLAN_FIELDS = `name pattern timezone cycleDays horizonDays closeOffsetHours draftWindowHours
  declareOpenDays maxBackups minRestHours carryDecay fairness status lifecycle archived balanceCache
  project { data { id } } open_mission { data { id } } mission { data { id } }`;
const SHIFT_FIELDS = `slotKey start end need state note tafkidim { data { id } }
  shift_plan { data { id } } roster_period { data { id } }`;
const DECL_FIELDS = `stance prefRank declaredAt note declKey shift { data { id } } users_permissions_user { data { id } }`;
const ASSIGN_FIELDS = `rank state source reason releasedAt releaseReason shift { data { id } }
  users_permissions_user { data { id } } roster_period { data { id } } mesimabetahalich { data { id } }
  coveredFor { data { id } } timer { data { id } }`;
const PERIOD_FIELDS = `periodKey start end closesAt state draftedAt closedAt seed holes quotaSnapshot
  shift_plan { data { id } } timegrama { data { id } }`;

// ── plans ────────────────────────────────────────────────────────────────────

export async function loadProjectPlans(exec: ShiftExec, projectId: string): Promise<ShiftPlanView[]> {
  const d = await run(
    exec,
    `query ($pid: ID!) { shiftPlans(filters: { project: { id: { eq: $pid } } }, pagination: { limit: 200 }, sort: "createdAt:asc") {
      data { id attributes { ${PLAN_FIELDS} } } } }`,
    'loadProjectPlans',
    { pid: projectId }
  );
  return nodes(d?.shiftPlans).map(toPlan);
}

export interface PlanContext {
  plan: ShiftPlanView;
  project: ProjectTiming & { id: string | null; restime: string | null; members: string[] };
}

export async function loadPlan(exec: ShiftExec, planId: string): Promise<PlanContext | null> {
  const d = await run(
    exec,
    `query ($id: ID!) { shiftPlan(id: $id) { data { id attributes { ${PLAN_FIELDS}
      project { data { id attributes { shiftCycleDays shiftCloseOffsetHours shiftDraftWindowHours restime
        user_1s { data { id } } } } } } } } }`,
    'loadPlan',
    { id: planId }
  );
  const n = d?.shiftPlan?.data;
  if (!n) return null;
  const p = n.attributes?.project?.data;
  const pa = p?.attributes ?? {};
  return {
    plan: toPlan(n),
    project: {
      id: p?.id ? String(p.id) : null,
      shiftCycleDays: pa.shiftCycleDays ?? null,
      shiftCloseOffsetHours: pa.shiftCloseOffsetHours ?? null,
      shiftDraftWindowHours: pa.shiftDraftWindowHours ?? null,
      restime: pa.restime ?? null,
      members: (pa.user_1s?.data ?? []).map((u: any) => String(u.id))
    }
  };
}

/** The rikma's shift defaults (§3.7) — NULL fields fall through to the constants. */
export async function loadProjectTiming(exec: ShiftExec, projectId: string): Promise<ProjectTiming> {
  const d = await run(
    exec,
    `query ($id: ID!) { project(id: $id) { data { id attributes { shiftCycleDays shiftCloseOffsetHours shiftDraftWindowHours } } } }`,
    'loadProjectTiming',
    { id: projectId }
  );
  const a = d?.project?.data?.attributes ?? {};
  return {
    shiftCycleDays: a.shiftCycleDays ?? null,
    shiftCloseOffsetHours: a.shiftCloseOffsetHours ?? null,
    shiftDraftWindowHours: a.shiftDraftWindowHours ?? null
  };
}

/** Every active plan on the platform — the cron's work list. */
export async function loadActivePlans(exec: ShiftExec): Promise<ShiftPlanView[]> {
  const d = await run(
    exec,
    `query { shiftPlans(filters: { status: { eq: "active" }, archived: { ne: true },
      or: [{ lifecycle: { null: true } }, { lifecycle: { notIn: ["archived", "released"] } }] },
      pagination: { limit: 1000 }) { data { id attributes { ${PLAN_FIELDS} } } } }`,
    'loadActivePlans'
  );
  return nodes(d?.shiftPlans).map(toPlan);
}

export interface PlanInput {
  projectId: string;
  openMissionId?: string | null;
  missionId?: string | null;
  name: string;
  pattern: unknown;
  timezone?: string | null;
  cycleDays?: number | null;
  horizonDays?: number | null;
  closeOffsetHours?: number | null;
  draftWindowHours?: number | null;
  declareOpenDays?: number | null;
  maxBackups?: number | null;
  minRestHours?: number | null;
}

function planData(input: Partial<PlanInput>) {
  const data: Record<string, unknown> = {};
  if (input.projectId !== undefined) data.project = input.projectId;
  if (input.openMissionId !== undefined) data.open_mission = input.openMissionId;
  if (input.missionId !== undefined) data.mission = input.missionId;
  for (const k of ['name', 'pattern', 'timezone', 'cycleDays', 'horizonDays', 'closeOffsetHours', 'draftWindowHours', 'declareOpenDays', 'maxBackups', 'minRestHours'] as const) {
    if (input[k] !== undefined) data[k] = input[k];
  }
  return data;
}

/**
 * A plan proposed together with a mission that still awaits the rikma's vote
 * is created `paused` and hung on the pendm; `activatePlanForPendm` links it to
 * the OpenMission when the proposal matures. The staffing hours were part of
 * what the rikma voted on, so they start only when the vote passes.
 */
export async function createPlan(
  exec: ShiftExec,
  input: PlanInput & { pendmId?: string | null; status?: 'active' | 'paused' }
): Promise<ShiftPlanView> {
  const d = await run(
    exec,
    `mutation ($data: ShiftPlanInput!) { createShiftPlan(data: $data) { data { id attributes { ${PLAN_FIELDS} } } } }`,
    'createPlan',
    {
      data: {
        ...planData(input),
        ...(input.pendmId ? { pendm: input.pendmId } : {}),
        status: input.status ?? 'active',
        fairness: 'commitments',
        archived: false
      }
    }
  );
  return toPlan(d?.createShiftPlan?.data);
}

/** The pendm matured into an OpenMission: its plan goes live on that mission. */
export async function activatePlanForPendm(exec: ShiftExec, pendmId: string, openMissionId: string): Promise<string[]> {
  const d = await run(
    exec,
    `query ($id: ID!) { shiftPlans(filters: { pendm: { id: { eq: $id } } }, pagination: { limit: 10 }) { data { id } } }`,
    'activatePlanForPendm:find',
    { id: pendmId }
  );
  const ids = nodes(d?.shiftPlans).map((n) => String(n?.id));
  for (const id of ids) {
    await run(
      exec,
      `mutation ($id: ID!, $data: ShiftPlanInput!) { updateShiftPlan(id: $id, data: $data) { data { id } } }`,
      'activatePlanForPendm:update',
      { id, data: { open_mission: openMissionId, status: 'active' } }
    );
  }
  return ids;
}

// ── the shift commitment, a term of the assignment (§3.8) ────────────────────

export interface CommitmentValue {
  min: number | null;
  max: number | null;
}

const cleanCommitment = (c: Partial<CommitmentValue>): CommitmentValue => {
  const n = (v: unknown) => (v == null || v === '' || !Number.isFinite(Number(v)) ? null : Math.max(0, Math.floor(Number(v))));
  const min = n(c.min);
  let max = n(c.max);
  // "At least 3, at most 2" is not a commitment anyone can keep; read it as 3–3.
  if (min != null && max != null && max < min) max = min;
  return { min, max };
};

/** What the candidate stated on their request (`Ask.shiftsMin/Max`). */
export async function setAskCommitment(exec: ShiftExec, askId: string, c: Partial<CommitmentValue>): Promise<CommitmentValue> {
  const v = cleanCommitment(c);
  await run(
    exec,
    `mutation ($id: ID!, $data: AskInput!) { updateAsk(id: $id, data: $data) { data { id } } }`,
    'setAskCommitment',
    { id: askId, data: { shiftsMin: v.min, shiftsMax: v.max } }
  );
  return v;
}

/** The agreed commitment lands on the assignment itself (`Mesimabetahalich.shiftsMin/Max`). */
export async function setMissionCommitment(exec: ShiftExec, mesimabetahalichId: string, c: Partial<CommitmentValue>): Promise<CommitmentValue> {
  const v = cleanCommitment(c);
  await run(
    exec,
    `mutation ($id: ID!, $data: MesimabetahalichInput!) { updateMesimabetahalich(id: $id, data: $data) { data { id } } }`,
    'setMissionCommitment',
    { id: mesimabetahalichId, data: { shiftsMin: v.min, shiftsMax: v.max } }
  );
  return v;
}

/**
 * The commitment an acceptance agrees to: the latest negotiation round that
 * states one wins over the original request, exactly like hours and rate.
 */
export async function commitmentForAsk(exec: ShiftExec, askId: string): Promise<CommitmentValue | null> {
  const d = await run(
    exec,
    `query ($id: ID!) { ask(id: $id) { data { id attributes { shiftsMin shiftsMax
      negopendmissions(sort: "ordern:desc", pagination: { limit: 20 }) { data { id attributes { ordern shiftsMin shiftsMax } } } } } } }`,
    'commitmentForAsk',
    { id: askId }
  );
  const a = d?.ask?.data?.attributes;
  if (!a) return null;
  const round = nodes(a.negopendmissions)
    .map((n) => n?.attributes ?? {})
    .find((r: any) => r.shiftsMin != null || r.shiftsMax != null);
  const src = round ?? a;
  if (src.shiftsMin == null && src.shiftsMax == null) return null;
  return cleanCommitment({ min: src.shiftsMin, max: src.shiftsMax });
}

export async function updatePlan(
  exec: ShiftExec,
  id: string,
  patch: Partial<PlanInput> & { status?: 'active' | 'paused'; balanceCache?: Record<string, number>; lifecycle?: string; archived?: boolean }
): Promise<void> {
  const data: Record<string, unknown> = planData(patch);
  for (const k of ['status', 'balanceCache', 'lifecycle', 'archived'] as const) if (patch[k] !== undefined) data[k] = patch[k];
  await run(exec, `mutation ($id: ID!, $data: ShiftPlanInput!) { updateShiftPlan(id: $id, data: $data) { data { id } } }`, 'updatePlan', { id, data });
}

// ── who is on the mission ────────────────────────────────────────────────────

/** The mission's assignees and their agreed commitment (§3.8). */
export async function loadCommitments(exec: ShiftExec, openMissionId: string): Promise<CommitmentView[]> {
  const d = await run(
    exec,
    `query ($id: ID!) { openMission(id: $id) { data { id attributes {
      mesimabetahaliches(pagination: { limit: 500 }) { data { id attributes {
        lifecycle finnished shiftsMin shiftsMax users_permissions_user { data { id } } tafkidims { data { id } } } } } } } } }`,
    'loadCommitments',
    { id: openMissionId }
  );
  return toCommitments(d?.openMission?.data?.attributes ?? {});
}

// ── shifts, declarations, assignments in a window ────────────────────────────

export interface WindowData {
  shifts: ShiftView[];
  declarations: DeclarationView[];
  assignments: AssignmentView[];
}

export async function loadWindow(exec: ShiftExec, planIds: string[], from: string, to: string): Promise<WindowData> {
  if (planIds.length === 0) return { shifts: [], declarations: [], assignments: [] };
  const vars = { ids: planIds, from, to };
  const d = await run(
    exec,
    `query ($ids: [ID], $from: DateTime, $to: DateTime) {
      shifts(filters: { shift_plan: { id: { in: $ids } }, start: { gte: $from, lt: $to } },
        sort: "start:asc", pagination: { limit: ${LIMIT} }) { data { id attributes { ${SHIFT_FIELDS} } } }
      shiftAvailabilities(filters: { shift_plan: { id: { in: $ids } }, shift: { start: { gte: $from, lt: $to } } },
        pagination: { limit: ${LIMIT * 4} }) { data { id attributes { ${DECL_FIELDS} } } }
      shiftAssignments(filters: { shift_plan: { id: { in: $ids } }, shift: { start: { gte: $from, lt: $to } } },
        pagination: { limit: ${LIMIT * 4} }) { data { id attributes { ${ASSIGN_FIELDS} } } }
    }`,
    'loadWindow',
    vars
  );
  return {
    shifts: nodes(d?.shifts).map(toShift),
    declarations: nodes(d?.shiftAvailabilities).map(toDeclaration).filter((x): x is DeclarationView => !!x),
    assignments: nodes(d?.shiftAssignments).map(toAssignment).filter((x): x is AssignmentView => !!x)
  };
}

export interface ShiftContext {
  shift: ShiftView;
  planId: string;
  projectId: string | null;
  openMissionId: string | null;
}

export async function loadShift(exec: ShiftExec, shiftId: string): Promise<ShiftContext | null> {
  const d = await run(
    exec,
    `query ($id: ID!) { shift(id: $id) { data { id attributes { ${SHIFT_FIELDS}
      shift_plan { data { id attributes { project { data { id } } open_mission { data { id } } } } } } } } }`,
    'loadShift',
    { id: shiftId }
  );
  const n = d?.shift?.data;
  if (!n) return null;
  const plan = n.attributes?.shift_plan?.data;
  return {
    shift: toShift(n),
    planId: String(plan?.id ?? ''),
    projectId: plan?.attributes?.project?.data?.id ? String(plan.attributes.project.data.id) : null,
    openMissionId: plan?.attributes?.open_mission?.data?.id ? String(plan.attributes.open_mission.data.id) : null
  };
}

// ── declarations ─────────────────────────────────────────────────────────────

export interface DeclareInput {
  shiftId: string;
  planId: string;
  projectId: string | null;
  userId: string;
  stance: Stance;
  prefRank?: number | null;
  note?: string | null;
  now?: Date;
}

/**
 * One standing statement per person per shift (`declKey` is unique). A change
 * of stance resets `declaredAt` — otherwise a `cannot` made early could turn
 * into a `want` at the last minute and still win the "declared first"
 * tie-break (§3.3). Changing only the preference rank or the note keeps it.
 */
export async function upsertDeclaration(exec: ShiftExec, input: DeclareInput): Promise<DeclarationView> {
  const declKey = `${input.shiftId}|${input.userId}`;
  const now = (input.now ?? new Date()).toISOString();
  const found = await run(
    exec,
    `query ($k: String!) { shiftAvailabilities(filters: { declKey: { eq: $k } }, pagination: { limit: 1 }) {
      data { id attributes { ${DECL_FIELDS} } } } }`,
    'findDeclaration',
    { k: declKey }
  );
  const existing = nodes(found?.shiftAvailabilities).map(toDeclaration).find(Boolean) ?? null;

  const data: Record<string, unknown> = { stance: input.stance };
  if (input.prefRank !== undefined) data.prefRank = input.prefRank;
  if (input.note !== undefined) data.note = input.note;

  if (existing) {
    if (existing.stance !== input.stance) data.declaredAt = now;
    const d = await run(
      exec,
      `mutation ($id: ID!, $data: ShiftAvailabilityInput!) { updateShiftAvailability(id: $id, data: $data) {
        data { id attributes { ${DECL_FIELDS} } } } }`,
      'updateDeclaration',
      { id: existing.id, data }
    );
    return toDeclaration(d?.updateShiftAvailability?.data)!;
  }

  const d = await run(
    exec,
    `mutation ($data: ShiftAvailabilityInput!) { createShiftAvailability(data: $data) {
      data { id attributes { ${DECL_FIELDS} } } } }`,
    'createDeclaration',
    {
      data: {
        ...data,
        declKey,
        declaredAt: now,
        shift: input.shiftId,
        shift_plan: input.planId,
        project: input.projectId,
        users_permissions_user: input.userId
      }
    }
  );
  return toDeclaration(d?.createShiftAvailability?.data)!;
}

// ── materializing shifts ─────────────────────────────────────────────────────

export interface SyncResult {
  created: number;
  reopened: number;
  cancelled: number;
}

/**
 * Make the stored shifts in [from, to) match what the pattern says.
 *
 *  - an instance with no row → created;
 *  - a cancelled row the pattern brings back (same slotKey) → reopened, not
 *    duplicated — `slotKey` is unique;
 *  - an `open` row the pattern no longer has → cancelled. A shift already
 *    rostered, running or done is never touched: people were told they are
 *    coming, and removing it is an `editObject` decision, not a sync.
 */
export async function syncShifts(
  exec: ShiftExec,
  plan: { id: string; projectId: string | null },
  instances: ShiftInstance[],
  from: string,
  to: string
): Promise<SyncResult> {
  const d = await run(
    exec,
    `query ($id: ID!, $from: DateTime, $to: DateTime) {
      shifts(filters: { shift_plan: { id: { eq: $id } }, start: { gte: $from, lt: $to } }, pagination: { limit: ${LIMIT} }) {
        data { id attributes { ${SHIFT_FIELDS} } } } }`,
    'syncShifts:read',
    { id: plan.id, from, to }
  );
  const stored = nodes(d?.shifts).map(toShift);
  const byKey = new Map(stored.filter((s) => s.slotKey).map((s) => [s.slotKey as string, s]));
  const wanted = new Set(instances.map((i) => i.slotKey));
  const result: SyncResult = { created: 0, reopened: 0, cancelled: 0 };

  for (const inst of instances) {
    const row = byKey.get(inst.slotKey);
    if (!row) {
      await run(
        exec,
        `mutation ($data: ShiftInput!) { createShift(data: $data) { data { id } } }`,
        'syncShifts:create',
        {
          data: {
            slotKey: inst.slotKey,
            start: inst.start,
            end: inst.end,
            need: inst.need,
            state: 'open',
            shift_plan: plan.id,
            project: plan.projectId,
            tafkidim: inst.tafkidimId
          }
        }
      );
      result.created++;
    } else if (row.state === 'cancelled') {
      await setShift(exec, row.id, { state: 'open', need: inst.need, end: inst.end });
      result.reopened++;
    } else if (row.state === 'open' && (row.need !== inst.need || row.end !== inst.end)) {
      // A pattern edit that the rikma already approved may change the size or
      // the end of a not-yet-rostered shift.
      await setShift(exec, row.id, { need: inst.need, end: inst.end });
    }
  }
  for (const row of stored) {
    if (row.state === 'open' && row.slotKey && !wanted.has(row.slotKey)) {
      await setShift(exec, row.id, { state: 'cancelled' });
      result.cancelled++;
    }
  }
  return result;
}

export async function setShift(
  exec: ShiftExec,
  id: string,
  data: Partial<{ state: string; need: number; end: string; roster_period: string | null; note: string }>
): Promise<void> {
  await run(exec, `mutation ($id: ID!, $data: ShiftInput!) { updateShift(id: $id, data: $data) { data { id } } }`, 'setShift', { id, data });
}

// ── roster periods ───────────────────────────────────────────────────────────

export async function loadPeriods(
  exec: ShiftExec,
  planId: string,
  opts: { states?: string[]; before?: string; limit?: number } = {}
): Promise<PeriodView[]> {
  // GraphQL rejects a declared variable the document does not use, so the
  // optional filters bring their own declarations.
  const decl = ['$id: ID!', opts.states ? '$states: [String]' : '', opts.before ? '$before: DateTime' : ''].filter(Boolean).join(', ');
  const vars: Record<string, unknown> = { id: planId };
  if (opts.states) vars.states = opts.states;
  if (opts.before) vars.before = opts.before;
  const d = await run(
    exec,
    `query (${decl}) {
      rosterPeriods(filters: { shift_plan: { id: { eq: $id } } ${opts.states ? ', state: { in: $states }' : ''} ${opts.before ? ', start: { lt: $before }' : ''} },
        sort: "start:desc", pagination: { limit: ${opts.limit ?? 50} }) { data { id attributes { ${PERIOD_FIELDS} } } } }`,
    'loadPeriods',
    vars
  );
  return nodes(d?.rosterPeriods).map(toPeriod);
}

export async function loadPeriod(exec: ShiftExec, id: string): Promise<PeriodView | null> {
  const d = await run(exec, `query ($id: ID!) { rosterPeriod(id: $id) { data { id attributes { ${PERIOD_FIELDS} } } } }`, 'loadPeriod', { id });
  return d?.rosterPeriod?.data ? toPeriod(d.rosterPeriod.data) : null;
}

/** The period for a cycle window, created on first sight (`periodKey` is unique). */
export async function ensurePeriod(
  exec: ShiftExec,
  plan: { id: string; projectId: string | null },
  w: CycleWindow
): Promise<{ period: PeriodView; created: boolean }> {
  const found = await run(
    exec,
    `query ($k: String!) { rosterPeriods(filters: { periodKey: { eq: $k } }, pagination: { limit: 1 }) {
      data { id attributes { ${PERIOD_FIELDS} } } } }`,
    'ensurePeriod:find',
    { k: w.periodKey }
  );
  const existing = nodes(found?.rosterPeriods)[0];
  if (existing) return { period: toPeriod(existing), created: false };
  const d = await run(
    exec,
    `mutation ($data: RosterPeriodInput!) { createRosterPeriod(data: $data) { data { id attributes { ${PERIOD_FIELDS} } } } }`,
    'ensurePeriod:create',
    {
      data: {
        periodKey: w.periodKey,
        start: w.start,
        end: w.end,
        closesAt: w.closesAt,
        state: 'open',
        holes: 0,
        shift_plan: plan.id,
        project: plan.projectId
      }
    }
  );
  return { period: toPeriod(d?.createRosterPeriod?.data), created: true };
}

export async function updatePeriod(
  exec: ShiftExec,
  id: string,
  data: Partial<{ state: string; draftedAt: string; closedAt: string; seed: string; holes: number; quotaSnapshot: unknown; closesAt: string }>
): Promise<void> {
  await run(exec, `mutation ($id: ID!, $data: RosterPeriodInput!) { updateRosterPeriod(id: $id, data: $data) { data { id } } }`, 'updatePeriod', { id, data });
}

/** Attach every shift of the window to its period (so a period's shifts read back in one query). */
export async function attachShifts(exec: ShiftExec, periodId: string, shiftIds: string[]): Promise<void> {
  for (const id of shiftIds) await setShift(exec, id, { roster_period: periodId });
}

// ── assignments ──────────────────────────────────────────────────────────────

export interface AssignmentInput {
  shiftId: string;
  userId: string;
  rank: number;
  state: 'draft' | 'confirmed' | 'released' | 'done';
  source: 'auto' | 'swap' | 'volunteer' | 'cover';
  reason?: string | null;
  periodId?: string | null;
  planId: string;
  projectId: string | null;
  mesimabetahalichId?: string | null;
  coveredForId?: string | null;
}

export async function createAssignment(exec: ShiftExec, a: AssignmentInput): Promise<AssignmentView> {
  const d = await run(
    exec,
    `mutation ($data: ShiftAssignmentInput!) { createShiftAssignment(data: $data) { data { id attributes { ${ASSIGN_FIELDS} } } } }`,
    'createAssignment',
    {
      data: {
        shift: a.shiftId,
        users_permissions_user: a.userId,
        rank: a.rank,
        state: a.state,
        source: a.source,
        reason: a.reason ?? null,
        roster_period: a.periodId ?? null,
        shift_plan: a.planId,
        project: a.projectId,
        mesimabetahalich: a.mesimabetahalichId ?? null,
        coveredFor: a.coveredForId ?? null
      }
    }
  );
  return toAssignment(d?.createShiftAssignment?.data)!;
}

export async function updateAssignment(
  exec: ShiftExec,
  id: string,
  data: Partial<{ state: string; rank: number; releasedAt: string; releaseReason: string; timer: string; reason: string }>
): Promise<void> {
  await run(exec, `mutation ($id: ID!, $data: ShiftAssignmentInput!) { updateShiftAssignment(id: $id, data: $data) { data { id } } }`, 'updateAssignment', { id, data });
}

export async function loadAssignment(exec: ShiftExec, id: string): Promise<(AssignmentView & { shift: ShiftView | null; planId: string | null; projectId: string | null }) | null> {
  const d = await run(
    exec,
    `query ($id: ID!) { shiftAssignment(id: $id) { data { id attributes { ${ASSIGN_FIELDS}
      shift { data { id attributes { ${SHIFT_FIELDS} } } } shift_plan { data { id } } project { data { id } } } } } }`,
    'loadAssignment',
    { id }
  );
  const n = d?.shiftAssignment?.data;
  if (!n) return null;
  const base = toAssignment(n);
  if (!base) return null;
  return {
    ...base,
    shift: n.attributes?.shift?.data ? toShift(n.attributes.shift.data) : null,
    planId: n.attributes?.shift_plan?.data?.id ? String(n.attributes.shift_plan.data.id) : null,
    projectId: n.attributes?.project?.data?.id ? String(n.attributes.project.data.id) : null
  };
}

/** A member's own assignments from `from` on, across every rikma (§9.3 `/me/shifts`). */
export async function loadMyAssignments(exec: ShiftExec, userId: string, from: string): Promise<Array<AssignmentView & { shift: ShiftView | null; projectId: string | null }>> {
  const d = await run(
    exec,
    `query ($uid: ID!, $from: DateTime) { shiftAssignments(filters: { users_permissions_user: { id: { eq: $uid } },
      state: { ne: "released" }, shift: { end: { gt: $from } } }, pagination: { limit: 500 }) {
      data { id attributes { ${ASSIGN_FIELDS} shift { data { id attributes { ${SHIFT_FIELDS} } } } project { data { id } } } } } }`,
    'loadMyAssignments',
    { uid: userId, from }
  );
  return nodes(d?.shiftAssignments)
    .map((n: any) => {
      const base = toAssignment(n);
      if (!base) return null;
      return {
        ...base,
        shift: n.attributes?.shift?.data ? toShift(n.attributes.shift.data) : null,
        projectId: n.attributes?.project?.data?.id ? String(n.attributes.project.data.id) : null
      };
    })
    .filter((x: any): x is AssignmentView & { shift: ShiftView | null; projectId: string | null } => !!x);
}

