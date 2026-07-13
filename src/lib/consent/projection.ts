import type { ConsentEvent } from './event';
import { dedupeKey } from './event';
import { reducers } from './reducers';

export type TosplitView = {
  id: string;
  createdBy: string;
  createdAt: number;
  predicate: Record<string, unknown> | undefined;
  votes: Map<string, { what: boolean; ts: number; eventId: string }>;
  approved: boolean;
};

/**
 * Per-subject round tracking (PLAN_restime_in_signed_chain §3).
 *   - `current`  = the active round (0 for initial proposal)
 *   - `start`    = ts of the event that opened this round (proposal.create or
 *                  the most recent proposal.counter)
 *   - `closed`   = populated when a consensus.timeout for THIS round was
 *                  successfully ingested. Cleared by a subsequent counter
 *                  (counter reopens the conversation).
 */
export type SubjectRound = {
  current: number;
  start: number;
  closed?: {
    round: number;
    reachedAt: number;
    decision: 'approve' | 'reject';
  };
};

/**
 * A quorum-attested checkpoint (PLAN_rikma_as_state_machine §5.1). Records
 * that a `snapshot.commit` event vouched for `stateRoot` as the state after
 * event `upTo`. Snapshots are attestations ABOUT state — they are deliberately
 * excluded from the committed state root (see stateRoot.ts), otherwise a
 * snapshot would change the very root it attests.
 */
export type SnapshotMark = {
  eventId: string;     // the snapshot.commit event
  upTo: string;        // last event covered by the attested root
  stateRoot: string;   // the attested root
  ts: number;
  by: string;          // signer (typically quorum.reachingActor)
  /** T10 — the full DAG frontier the snapshot covers (a DAG can have several
   *  heads; `upTo` alone names only one). Absent on pre-T10 marks. Excluded
   *  from the committed state root like the rest of the mark. */
  heads?: string[];
};

/**
 * A reported sale, projected from `sale.record` (PLAN_sale_holder_consent).
 * Keyed by the Sale's id (ev.subject.id on the sale.record event).
 *
 *   - status 'self'      → sovereign self-report, final immediately.
 *   - status 'open'      → claim about someone else's holding, awaiting
 *                          bilateral consensus on `decisionId` (see
 *                          ProjectState.saleClaims).
 *   - status 'confirmed' → the saleClaim matured (mutual vote or timeout);
 *                          `version` holds the values that were agreed.
 */
export type SaleView = {
  id: string;
  reporterId: string;
  holderId: string;
  status: 'self' | 'open' | 'confirmed';
  decisionId?: string;
  confirmedBy?: 'vote' | 'timeout';
  version: {
    total?: number;
    quantity?: number;
    kindOf?: string;
    saleDate?: string;
    startDate?: string;
    finishDate?: string;
  };
};

/**
 * Bilateral consensus tracker for a `saleClaim` Decision — exactly two
 * parties (reporter + holder), unlike the rikma-wide quorum other Decision
 * kinds use. Keyed by the Decision's id.
 *
 *   - `standingOrder` is the round currently on the table (1 = the original
 *     claim; bumped by `proposal.counter`).
 *   - `signers` holds who has signed the standing round; proposing a counter
 *     counts as the proposer's own signature on the new round.
 *   - `closed` is set once both parties signed the same round (vote) or a
 *     `consensus.timeout` matured it (timeout).
 */
export type SaleClaimView = {
  decisionId: string;
  saleId: string;
  holderId: string;
  reporterId: string;
  standingOrder: number;
  signers: Set<string>;
  closed?: { decidedAt: number; by: 'vote' | 'timeout' };
};

/**
 * A mission and its lifecycle, projected from mission.* events (S2b, T4).
 * pendm / negopendmission / mesimabetahalich / finnishedMission / finiapruval
 * are NOT separate entities here — they are states of this one view
 * (PLAN_serverless_p2p_data §2).
 *
 *   pend → (unanimous pendm.vote) → inProgress → (mission.complete) →
 *   completed → (mission.approve) → approved
 *
 * `stageIds` holds the legacy Strapi stage-entity ids (pendm id, ask id,
 * mesimabetahalich id…) so stage-vote events whose subject is the stage
 * entity can find their mission.
 */
export type MissionView = {
  id: string;
  createdBy: string;
  createdAt: number;
  name?: string;
  assignee?: string;
  hours?: number;
  perhour?: number;
  stageIds: string[];
  state: 'pend' | 'proposed' | 'inProgress' | 'completed' | 'approved';
  completion?: {
    by: string;
    ts: number;
    hoursDone?: number;
    /** Deletable free text (HANDOFF T4 deletion policy) — blanked by payload.redact. */
    why?: string;
    redacted?: boolean;
  };
  approval?: { by: string; ts: number };
};

/** A haluka (distribution transfer), projected from haluka.* events. */
export type HalukaView = {
  id: string;
  from: string;
  to: string;
  tosplitId?: string;
  amount?: number;
  code?: string;
  status: 'pending' | 'approved' | 'confirmed';
};

/**
 * A Decision entity (generic — any `kind`). The bilateral saleClaim kind
 * keeps its dedicated `saleClaims` tracker; this view is the generic record
 * (kind, creator) that decision.create plants for every kind.
 */
export type DecisionView = {
  id: string;
  createdBy: string;
  createdAt: number;
  kind?: string;
  /** Optional pointer to the entity the decision is about. */
  ref?: string;
};

/**
 * Generic per-subject vote tally for staged consent subjects
 * (pend / sheirutpend / ask / decision / weFinnish…). Keyed by subjectKey.
 * Unanimity over current members follows the tosplitVote rule.
 */
export type StageVotesView = {
  subjectType: string;
  subjectId: string;
  votes: Map<string, { what: boolean; ts: number; eventId: string; order: number }>;
  approved: boolean;
};

/** Work-timer accumulator per mission/stage subject, from time.tick events. */
export type TimerView = {
  id: string;
  totalMs: number;
  runningSince?: number;
  runningBy?: string;
};

export type MessageView = {
  id: string;
  by: string;
  ts: number;
  /** Deletable free text (HANDOFF T4 deletion policy) — blanked by payload.redact. */
  body?: string;
  /** S3 upgrade path: content-addressed payload reference (sha256). */
  bodyRef?: string;
  redacted?: boolean;
};

/**
 * A forum and its messages. `createdBy`/`createdAt` are set by forum.create;
 * a message.post for an unknown forum plants an implicit stub (legacy forums
 * predate the chain and never got a create event).
 */
export type ForumView = {
  id: string;
  createdBy?: string;
  createdAt?: number;
  kind?: string;
  /** Ordered by (ts, id) — deterministic regardless of arrival order. */
  messages: MessageView[];
};

/** A meeting (pgisha), from pgisha.create / pgisha.approve. */
export type MeetingView = {
  id: string;
  createdBy: string;
  createdAt: number;
  date?: string;
  name?: string;
  approvals: Set<string>;
};

/** member.away marks — actor's own declaration of temporary absence. */
export type AwayMark = { since: number; until?: number };

export type ProjectState = {
  projectId: string | null;
  members: Set<string>;
  /**
   * hervachti per member, in bigint agorot (D-12). Single-currency per rikma
   * for now; multi-currency requires a keyed structure AND a
   * STATE_ROOT_VERSION bump.
   */
  balances: Map<string, bigint>;
  tosplits: Map<string, TosplitView>;
  /** Keyed by `${subject.type}:${subject.id}` */
  rounds: Map<string, SubjectRound>;
  snapshots: SnapshotMark[];
  /** Keyed by Sale id (PLAN_sale_holder_consent). */
  sales: Map<string, SaleView>;
  /** Keyed by Decision id — only entries for kind:'saleClaim'. */
  saleClaims: Map<string, SaleClaimView>;
  // ---- S2b (HANDOFF T4) — category-A entity maps ----
  /** Keyed by Mission id. */
  missions: Map<string, MissionView>;
  /** Keyed by Haluka id. */
  halukas: Map<string, HalukaView>;
  /** Keyed by Decision id — generic record for every kind. */
  decisions: Map<string, DecisionView>;
  /** Keyed by subjectKey — generic staged-consent vote tallies. */
  stageVotes: Map<string, StageVotesView>;
  /** Keyed by subject id (mission / mesimabetahalich). */
  timers: Map<string, TimerView>;
  /** Keyed by Forum id. */
  forums: Map<string, ForumView>;
  /** Keyed by Meeting (pgisha) id. */
  meetings: Map<string, MeetingView>;
  /** Keyed by userId — member.away declarations. */
  away: Map<string, AwayMark>;
  /** Keyed by settings path — project.amend value.set entries. */
  settings: Map<string, unknown>;
  asOf: number;
};

export function emptyState(projectId: string | null = null): ProjectState {
  return {
    projectId,
    members: new Set(),
    balances: new Map(),
    tosplits: new Map(),
    rounds: new Map(),
    snapshots: [],
    sales: new Map(),
    saleClaims: new Map(),
    missions: new Map(),
    halukas: new Map(),
    decisions: new Map(),
    stageVotes: new Map(),
    timers: new Map(),
    forums: new Map(),
    meetings: new Map(),
    away: new Map(),
    settings: new Map(),
    asOf: 0
  };
}

export function subjectKey(type: string, id: string): string {
  return `${type}:${id}`;
}

// Topological sort: parents before children. Ties broken by ts then id.
export function topoSort(events: ConsentEvent[]): ConsentEvent[] {
  const byId = new Map(events.map((e) => [e.id, e]));
  const indeg = new Map<string, number>();
  for (const e of events) indeg.set(e.id, 0);
  for (const e of events) {
    for (const p of e.parents) {
      if (byId.has(p)) indeg.set(e.id, (indeg.get(e.id) ?? 0) + 1);
    }
  }
  const ready: ConsentEvent[] = events.filter((e) => (indeg.get(e.id) ?? 0) === 0);
  const sortReady = (arr: ConsentEvent[]) =>
    arr.sort((a, b) => (a.ts - b.ts) || a.id.localeCompare(b.id));
  sortReady(ready);

  const result: ConsentEvent[] = [];
  const childrenOf = new Map<string, string[]>();
  for (const e of events) {
    for (const p of e.parents) {
      if (!byId.has(p)) continue;
      const arr = childrenOf.get(p) ?? [];
      arr.push(e.id);
      childrenOf.set(p, arr);
    }
  }

  while (ready.length) {
    const next = ready.shift()!;
    result.push(next);
    for (const childId of childrenOf.get(next.id) ?? []) {
      const d = (indeg.get(childId) ?? 1) - 1;
      indeg.set(childId, d);
      if (d === 0) {
        ready.push(byId.get(childId)!);
        sortReady(ready);
      }
    }
  }
  // Cycle or dangling parents: append remaining by ts/id for resilience.
  if (result.length !== events.length) {
    const placed = new Set(result.map((e) => e.id));
    const rest = events.filter((e) => !placed.has(e.id));
    sortReady(rest);
    result.push(...rest);
  }
  return result;
}

export function applyEvent(prev: ProjectState, ev: ConsentEvent): ProjectState {
  const reducer = reducers[ev.action];
  const next = reducer ? reducer(prev, ev) : prev;
  const asOf = Math.max(prev.asOf, ev.ts);
  // Never mutate a state object we didn't create in this call: `prev` may be
  // a shared base (projectFrom over a restored snapshot, T10).
  if (next === prev) return asOf === prev.asOf ? prev : { ...prev, asOf };
  next.asOf = asOf;
  return next;
}

/**
 * T10 (PLAN_T10_COMPACTION) — fold `events` on top of an existing base state
 * instead of emptyState. This is how a compacted replica resumes: base =
 * restoreState(snapshot.state), events = the tail after the snapshot.
 * Ordering + dedupe semantics are identical to project(); the base is never
 * mutated.
 */
export function projectFrom(base: ProjectState, events: ConsentEvent[]): ProjectState {
  const ordered = topoSort(events);
  // dedupe: keep the latest-ts entry per (actor, subject, action, order)
  const byKey = new Map<string, ConsentEvent>();
  for (const e of ordered) {
    const k = dedupeKey(e);
    const cur = byKey.get(k);
    if (!cur || e.ts > cur.ts) byKey.set(k, e);
  }
  const finalEvents = ordered.filter((e) => byKey.get(dedupeKey(e)) === e);

  let state = base;
  for (const e of finalEvents) state = applyEvent(state, e);
  return state;
}

export function project(events: ConsentEvent[], projectId: string | null = null): ProjectState {
  return projectFrom(emptyState(projectId), events);
}
