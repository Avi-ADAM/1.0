// T10 (PLAN_T10_COMPACTION §2.4) — the exact inverse of normalizeState.
//
// A quorum-signed snapshot carries `normalizeState(state)` inline; a replica
// that prunes its history rebuilds its base ProjectState from that JSON with
// this module. Contract (tested property-style in stateRestore.test.ts):
//
//     normalizeState(restoreState(n)) ≡ n        (byte-identical canonical)
//
// Any future change to normalizeState MUST update this file and the symmetry
// test together — that's part of invariant 2 in the handoff. A snapshot
// declares its `stateV`; restoring an unknown version is refused loudly
// rather than guessed.

import type {
  ProjectState,
  TosplitView,
  SubjectRound,
  SaleView,
  SaleClaimView,
  MissionView,
  HalukaView,
  DecisionView,
  StageVotesView,
  TimerView,
  ForumView,
  MeetingView,
  AwayMark
} from './projection';
import { emptyState } from './projection';
import { STATE_ROOT_VERSION } from './stateRoot';

export type RestoreResult =
  | { ok: true; state: ProjectState; reason?: undefined }
  | { ok: false; reason: string; state?: undefined };

type Norm = Record<string, unknown>;
type Entry = [string, unknown];

function entries(x: unknown): Entry[] {
  return Array.isArray(x) ? (x as Entry[]) : [];
}

export function restoreState(normalized: unknown): RestoreResult {
  const n = normalized as Norm | null;
  if (!n || typeof n !== 'object') return { ok: false, reason: 'not_an_object' };
  if (n.v !== STATE_ROOT_VERSION) {
    return { ok: false, reason: `unknown_state_version:${String(n.v)}` };
  }

  const state = emptyState((n.projectId as string | null) ?? null);
  state.asOf = typeof n.asOf === 'number' ? n.asOf : 0;

  for (const m of (Array.isArray(n.members) ? n.members : []) as string[]) {
    state.members.add(m);
  }
  for (const [k, v] of entries(n.balances)) {
    state.balances.set(k, BigInt(v as string));
  }
  for (const [k, v] of entries(n.tosplits)) {
    state.tosplits.set(k, restoreTosplit(v as Norm));
  }
  for (const [k, v] of entries(n.rounds)) {
    state.rounds.set(k, restoreRound(v as Norm));
  }
  for (const [k, v] of entries(n.sales)) {
    state.sales.set(k, v as SaleView);
  }
  for (const [k, v] of entries(n.saleClaims)) {
    state.saleClaims.set(k, restoreSaleClaim(v as Norm));
  }
  for (const [k, v] of entries(n.missions)) {
    state.missions.set(k, restoreMission(v as Norm));
  }
  for (const [k, v] of entries(n.halukas)) {
    state.halukas.set(k, v as HalukaView);
  }
  for (const [k, v] of entries(n.decisions)) {
    state.decisions.set(k, v as DecisionView);
  }
  for (const [k, v] of entries(n.stageVotes)) {
    state.stageVotes.set(k, restoreStageVotes(v as Norm));
  }
  for (const [k, v] of entries(n.timers)) {
    state.timers.set(k, v as TimerView);
  }
  for (const [k, v] of entries(n.forums)) {
    state.forums.set(k, v as ForumView);
  }
  for (const [k, v] of entries(n.meetings)) {
    state.meetings.set(k, restoreMeeting(v as Norm));
  }
  for (const [k, v] of entries(n.away)) {
    state.away.set(k, v as AwayMark);
  }
  for (const [k, v] of entries(n.settings)) {
    state.settings.set(k, v);
  }
  // state.snapshots stays [] on purpose: marks are attestations ABOUT roots,
  // excluded from the root itself (stateRoot.ts) — pre-snapshot marks are
  // part of what compaction prunes.
  return { ok: true, state };
}

function restoreTosplit(t: Norm): TosplitView {
  return {
    id: t.id as string,
    createdBy: t.createdBy as string,
    createdAt: t.createdAt as number,
    predicate: (t.predicate ?? undefined) as TosplitView['predicate'],
    approved: Boolean(t.approved),
    votes: new Map(
      entries(t.votes) as [string, { what: boolean; ts: number; eventId: string }][]
    )
  };
}

function restoreRound(r: Norm): SubjectRound {
  const out: SubjectRound = { current: r.current as number, start: r.start as number };
  if (r.closed) out.closed = r.closed as SubjectRound['closed'];
  return out;
}

function restoreSaleClaim(c: Norm): SaleClaimView {
  return {
    decisionId: c.decisionId as string,
    saleId: c.saleId as string,
    holderId: c.holderId as string,
    reporterId: c.reporterId as string,
    standingOrder: c.standingOrder as number,
    signers: new Set((c.signers as string[]) ?? []),
    ...(c.closed ? { closed: c.closed as SaleClaimView['closed'] } : {})
  };
}

function restoreMission(m: Norm): MissionView {
  return {
    ...(m as unknown as MissionView),
    stageIds: [...((m.stageIds as string[]) ?? [])]
  };
}

function restoreStageVotes(s: Norm): StageVotesView {
  return {
    subjectType: s.subjectType as string,
    subjectId: s.subjectId as string,
    approved: Boolean(s.approved),
    votes: new Map(
      entries(s.votes) as [string, { what: boolean; ts: number; eventId: string; order: number }][]
    )
  };
}

function restoreMeeting(m: Norm): MeetingView {
  return {
    id: m.id as string,
    createdBy: m.createdBy as string,
    createdAt: m.createdAt as number,
    date: m.date as string | undefined,
    name: m.name as string | undefined,
    approvals: new Set((m.approvals as string[]) ?? [])
  };
}
