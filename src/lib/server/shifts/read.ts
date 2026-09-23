/**
 * Strapi payloads → the flat shapes src/lib/shifts works on.
 *
 * The pure modules never see `{ data: { id, attributes } }`. Everything that
 * crosses from Strapi into them goes through one of these, so a renamed
 * field breaks here — loudly, in one place — instead of silently in the
 * algorithm.
 */

import type {
  AssignmentLike,
  AssignmentSource,
  AssignmentState,
  Commitment,
  Declaration,
  ShiftLike,
  ShiftPattern,
  Stance
} from '$lib/shifts/types.js';
import { holdsSeat } from '$lib/missions/headcount.js';
import type { StandingRule } from '$lib/shifts/rules.js';

type Node = { id?: string | number | null; attributes?: Record<string, any> | null } | null | undefined;

export const attrs = (n: Node): Record<string, any> => (n?.attributes ?? {}) as Record<string, any>;
export const relId = (rel: any): string | null => {
  const id = rel?.data?.id ?? rel?.id ?? null;
  return id == null ? null : String(id);
};
export const relIds = (rel: any): string[] => (rel?.data ?? []).map((n: Node) => String(n?.id));
export const nodes = (collection: any): Node[] => (collection?.data ?? []) as Node[];

const num = (v: unknown): number | null => (v == null || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));

export interface ShiftPlanView {
  id: string;
  projectId: string | null;
  openMissionId: string | null;
  missionId: string | null;
  name: string;
  pattern: ShiftPattern | null;
  timezone: string | null;
  cycleDays: number | null;
  horizonDays: number | null;
  closeOffsetHours: number | null;
  draftWindowHours: number | null;
  declareOpenDays: number | null;
  maxBackups: number | null;
  minRestHours: number | null;
  carryDecay: number | null;
  fairness: 'commitments' | 'manual';
  status: 'active' | 'paused';
  lifecycle: string | null;
  archived: boolean;
  balanceCache: Record<string, number> | null;
}

export function toPlan(n: Node): ShiftPlanView {
  const a = attrs(n);
  return {
    id: String(n?.id),
    projectId: relId(a.project),
    openMissionId: relId(a.open_mission),
    missionId: relId(a.mission),
    name: a.name ?? '',
    pattern: (a.pattern ?? null) as ShiftPattern | null,
    timezone: a.timezone ?? null,
    cycleDays: num(a.cycleDays),
    horizonDays: num(a.horizonDays),
    closeOffsetHours: num(a.closeOffsetHours),
    draftWindowHours: num(a.draftWindowHours),
    declareOpenDays: num(a.declareOpenDays),
    maxBackups: num(a.maxBackups),
    minRestHours: num(a.minRestHours),
    carryDecay: num(a.carryDecay),
    fairness: a.fairness === 'manual' ? 'manual' : 'commitments',
    status: a.status === 'paused' ? 'paused' : 'active',
    lifecycle: a.lifecycle ?? null,
    archived: a.archived === true,
    balanceCache: (a.balanceCache ?? null) as Record<string, number> | null
  };
}

/** An active plan: not paused, not archived, lifecycle NULL (legacy = active) or active/archiveProposed. */
export function planIsActive(p: ShiftPlanView): boolean {
  return p.status === 'active' && !p.archived && (p.lifecycle == null || p.lifecycle === 'active' || p.lifecycle === 'archiveProposed');
}

export interface ShiftView extends ShiftLike {
  planId: string | null;
  periodId: string | null;
  slotKey: string | null;
  note: string | null;
}

export function toShift(n: Node): ShiftView {
  const a = attrs(n);
  return {
    id: String(n?.id),
    start: a.start,
    end: a.end,
    need: num(a.need) ?? 1,
    tafkidimId: relId(a.tafkidim),
    state: a.state ?? 'open',
    planId: relId(a.shift_plan),
    periodId: relId(a.roster_period),
    slotKey: a.slotKey ?? null,
    note: a.note ?? null
  };
}

export interface DeclarationView extends Declaration {
  id: string;
  note: string | null;
}

const STANCES: Stance[] = ['want', 'can', 'ifNeeded', 'cannot'];

export function toDeclaration(n: Node): DeclarationView | null {
  const a = attrs(n);
  const shiftId = relId(a.shift);
  const userId = relId(a.users_permissions_user);
  if (!shiftId || !userId || !STANCES.includes(a.stance)) return null;
  return {
    id: String(n?.id),
    shiftId,
    userId,
    stance: a.stance,
    prefRank: num(a.prefRank),
    declaredAt: a.declaredAt,
    note: a.note ?? null
  };
}

export interface AssignmentView extends AssignmentLike {
  id: string;
  periodId: string | null;
  mesimabetahalichId: string | null;
  coveredForId: string | null;
  timerId: string | null;
  releasedAt: string | null;
}

const STATES: AssignmentState[] = ['draft', 'confirmed', 'released', 'done'];
const SOURCES: AssignmentSource[] = ['auto', 'swap', 'volunteer', 'cover'];

export function toAssignment(n: Node): AssignmentView | null {
  const a = attrs(n);
  const shiftId = relId(a.shift);
  const userId = relId(a.users_permissions_user);
  if (!shiftId || !userId) return null;
  return {
    id: String(n?.id),
    shiftId,
    userId,
    rank: num(a.rank) ?? 1,
    state: STATES.includes(a.state) ? a.state : 'draft',
    source: SOURCES.includes(a.source) ? a.source : 'auto',
    reason: a.reason ?? null,
    periodId: relId(a.roster_period),
    mesimabetahalichId: relId(a.mesimabetahalich),
    coveredForId: relId(a.coveredFor),
    timerId: relId(a.timer),
    releasedAt: a.releasedAt ?? null
  };
}

export interface PeriodView {
  id: string;
  planId: string | null;
  periodKey: string | null;
  start: string;
  end: string;
  closesAt: string;
  state: 'open' | 'draft' | 'closed' | 'cancelled';
  draftedAt: string | null;
  closedAt: string | null;
  seed: string | null;
  holes: number;
  quotaSnapshot: Record<string, any> | null;
  timegramaId: string | null;
}

export function toPeriod(n: Node): PeriodView {
  const a = attrs(n);
  return {
    id: String(n?.id),
    planId: relId(a.shift_plan),
    periodKey: a.periodKey ?? null,
    start: a.start,
    end: a.end,
    closesAt: a.closesAt,
    state: ['open', 'draft', 'closed', 'cancelled'].includes(a.state) ? a.state : 'open',
    draftedAt: a.draftedAt ?? null,
    closedAt: a.closedAt ?? null,
    seed: a.seed ?? null,
    holes: num(a.holes) ?? 0,
    quotaSnapshot: a.quotaSnapshot ?? null,
    timegramaId: relId(a.timegrama)
  };
}

export interface CommitmentView extends Commitment {
  mesimabetahalichId: string;
  /** The member's standing rules on this mission (src/lib/shifts/rules.ts). */
  rules?: StandingRule[] | null;
  rulesAt?: string | null;
}

/**
 * The mission's current assignees and their agreed shift commitment (§3.8),
 * from an OpenMission's `mesimabetahaliches`. Only people still holding a seat
 * count — the same rule as the headcount (§2).
 */
export function toCommitments(openMissionAttrs: Record<string, any>): CommitmentView[] {
  const out = new Map<string, CommitmentView>();
  for (const n of nodes(openMissionAttrs?.mesimabetahaliches)) {
    const a = attrs(n);
    if (!holdsSeat(a)) continue;
    const userId = relId(a.users_permissions_user);
    if (!userId) continue;
    // One person, two seats on the same mission (a race, §2.3): one commitment,
    // the more generous bounds.
    const prev = out.get(userId);
    const min = num(a.shiftsMin);
    const max = num(a.shiftsMax);
    out.set(userId, {
      userId,
      mesimabetahalichId: prev?.mesimabetahalichId ?? String(n?.id),
      min: prev ? Math.max(prev.min ?? 0, min ?? 0) || null : min,
      max: prev ? (prev.max == null || max == null ? null : Math.max(prev.max, max)) : max,
      tafkidimIds: [...new Set([...(prev?.tafkidimIds ?? []), ...relIds(a.tafkidims)])],
      rules: prev?.rules ?? (Array.isArray(a.shiftRules) ? a.shiftRules : null),
      rulesAt: prev?.rulesAt ?? a.shiftRulesAt ?? null
    });
  }
  return [...out.values()];
}
