// Shared consent-event mappings for the S2b category-A expansion
// (HANDOFF_DISTRIBUTED_DB T4, step 6 — "sign in parallel, not instead").
//
// Same contract as specs/addVote.ts and specs/createSale.ts: one module is
// the single source of truth for each action's predicate shape, imported by
// both the server ActionConfig and the client shadow-sign path.
//
// Unlike addVote (whose call sites sign manually), these actions are signed
// centrally from executeAction via shadowSignRegistry — the subject ids are
// created server-side, so each entry also declares how to combine the action
// params with the action RESULT into sign-params. Returning [] means
// "shadow-skip this invocation" (missing id, malformed result…).

import type { ConsentSpec } from '$lib/server/actions/types';

export type ShadowSignJob = { spec: ConsentSpec; params: Record<string, unknown> };

export type ShadowJobDeriver = (
  params: Record<string, unknown>,
  resultData: Record<string, unknown>
) => ShadowSignJob[];

// ---------------------------------------------------------------- mission

export const createMissionConsentSpec: ConsentSpec = {
  action: 'mission.create',
  subjectType: 'mission',
  subjectIdParam: 'missionId',
  requireConsensus: false, // the consensus rides pendm.vote / ask.vote
  restimeFrom: 'project',
  predicateFromParams: (params) => ({
    name: params.missionName != null ? String(params.missionName) : undefined,
    hours: typeof params.nhours === 'number' && params.nhours > 0 ? params.nhours : undefined,
    perhour: typeof params.valph === 'number' && params.valph > 0 ? params.valph : undefined,
    // The currency `perhour` was typed in (PLAN_MULTI_CURRENCY); absent = the rikma's.
    currency: params.entryCurrency != null ? String(params.entryCurrency) : undefined,
    assignee: params.assignedUserId != null ? String(params.assignedUserId) : undefined,
    branch: params.branch,
    stageIds: params.stageIds
  })
};

export const completeMissionConsentSpec: ConsentSpec = {
  action: 'mission.complete',
  subjectType: 'mission',
  // The mesimabetahalich id — the reducer resolves stage ids to the mission
  // via MissionView.stageIds, or plants a legacy stub.
  subjectIdParam: 'missionId',
  requireConsensus: false, // sovereign self-report; approval is the consensus
  restimeFrom: 'project',
  predicateFromParams: (params) => ({
    hoursDone: params.hoursdon !== undefined ? Number(params.hoursdon) : undefined,
    // Deletable free text (HANDOFF T4 deletion policy) — payload.redact target.
    why: params.why != null ? String(params.why) : undefined
  })
};

// ---------------------------------------------------------------- haluka

export const createHalukaConsentSpec: ConsentSpec = {
  action: 'haluka.create',
  subjectType: 'haluka',
  subjectIdParam: 'halukaId',
  requireConsensus: false,
  restimeFrom: 'project',
  // createHaluka nests everything under `data` (raw GraphQL shape) — the
  // default params.projectId derivation would miss it.
  projectIdFromParams: (params) => {
    const data = (params.data ?? {}) as Record<string, unknown>;
    return data.project != null ? String(data.project) : null;
  },
  predicateFromParams: (params) => {
    const data = (params.data ?? {}) as Record<string, unknown>;
    return {
      from: data.usersend != null ? String(data.usersend) : undefined,
      to: data.userrecive != null ? String(data.userrecive) : undefined,
      tosplitId: data.tosplit != null ? String(data.tosplit) : undefined,
      amount: typeof data.amount === 'number' ? data.amount : undefined,
      code: data.matbea != null ? String(data.matbea) : undefined
    };
  }
};

// ---------------------------------------------------------------- tosplit
// A2 (PLAN_DISTRIBUTED_EXECUTION): the split lifecycle around the votes
// addVote already signs — the proposal those votes land on, its approval,
// and each transfer's receipt. STATUS ONLY: no event here carries a balance
// delta. Strapi's `hervachti` is one number per user across every rikma,
// while the projection's balances are per rikma, so signing deltas now would
// turn every multi-rikma member into a standing mismatch (A2 card).

export const createTosplitConsentSpec: ConsentSpec = {
  action: 'tosplit.create',
  subjectType: 'tosplit',
  subjectIdParam: 'tosplitId',
  requireConsensus: false, // the consensus rides tosplit.vote
  restimeFrom: 'project',
  // createTosplit nests everything under `data` (raw GraphQL shape).
  projectIdFromParams: (params) => {
    const data = (params.data ?? {}) as Record<string, unknown>;
    return data.project != null ? String(data.project) : null;
  },
  predicateFromParams: (params) => {
    const data = (params.data ?? {}) as Record<string, unknown>;
    return {
      halukaIds: idList(data.halukas),
      saleIds: idList(data.sales)
    };
  }
};

export const approveHalukaConsentSpec: ConsentSpec = {
  action: 'haluka.approve',
  subjectType: 'haluka',
  subjectIdParam: 'halukaId',
  requireConsensus: false, // quorum-free until the verifier owns it (policy.ts)
  restimeFrom: 'project',
  predicateFromParams: (params) => ({
    tosplitId: params.tosplitId != null ? String(params.tosplitId) : undefined
  })
};

export const confirmHalukaConsentSpec: ConsentSpec = {
  action: 'haluka.confirm',
  subjectType: 'haluka',
  subjectIdParam: 'halukaId',
  requireConsensus: false, // the receiver's sovereign "it arrived"
  predicateFromParams: () => ({})
};

// ---------------------------------------------------------------- timer
// A2 batch 2: the work timer. The subject is the Strapi TIMER, not the
// mission — every start and stop carries the timer id while a stop does not
// know its mission, and the timer's interval list is the Strapi record the
// shadow panel compares against. The reducer keys by subject id, so the
// type changes nothing in it.
//
// `order` is the interval's own time (start or stop, epoch ms): dedupeKey
// folds (actor, subject, action, order), so a constant order would let the
// stop swallow its start — and a repeated stop of the same interval (a
// second tab, a redelivered bot update) folds into the first instead of
// crediting it twice.

export const timeTickConsentSpec: ConsentSpec = {
  action: 'time.tick',
  subjectType: 'timer',
  subjectIdParam: 'timerId',
  requireConsensus: false, // the member's own clock; approval rides finiapruval
  predicateFromParams: (params) => ({
    op: params.op === 'stop' ? 'stop' : 'start',
    order: typeof params.order === 'number' ? params.order : undefined,
    sessionMs: typeof params.sessionMs === 'number' ? params.sessionMs : undefined,
    // A start that opened a NEW timer: its whole history is on the chain, so
    // the shadow panel may compare its total with Strapi (a resumed legacy
    // timer has hours the chain never saw).
    fresh: params.fresh === true ? true : undefined,
    mission: params.missionId != null ? String(params.missionId) : undefined
  })
};

type Interval = { start?: unknown; stop?: unknown };

function intervalsOf(x: unknown): Interval[] {
  return Array.isArray(x) ? (x.filter((i) => i && typeof i === 'object') as Interval[]) : [];
}

const msOf = (x: unknown): number => (typeof x === 'string' ? Date.parse(x) : NaN);

/**
 * What a stop closed: every interval ending at the latest stop time. stopTimer
 * closes all open intervals with one `now`, so they share it; an older closed
 * interval cannot end later than the stop that is happening.
 */
export function closedByStop(timers: unknown): { at: number; sessionMs: number } | null {
  let at = -Infinity;
  for (const i of intervalsOf(timers)) {
    const s = msOf(i.stop);
    if (Number.isFinite(s) && s > at) at = s;
  }
  if (!Number.isFinite(at)) return null;
  let sessionMs = 0;
  for (const i of intervalsOf(timers)) {
    if (msOf(i.stop) !== at) continue;
    const st = msOf(i.start);
    if (Number.isFinite(st) && at >= st) sessionMs += at - st;
  }
  return { at, sessionMs };
}

// ---------------------------------------------------------------- chat

export const createChatMessageConsentSpec: ConsentSpec = {
  action: 'message.post',
  subjectType: 'message',
  subjectIdParam: 'messageId',
  requireConsensus: false,
  predicateFromParams: (params) => ({
    forumId: params.forumId != null ? String(params.forumId) : undefined,
    // Deletable free text (HANDOFF T4 deletion policy) — payload.redact target.
    body: params.message != null ? String(params.message) : undefined
  })
};

// ------------------------------------------------------------ registry map

function str(x: unknown): string | undefined {
  return x === undefined || x === null ? undefined : String(x);
}

/** Relation lists arrive as ids or as `{ id }` rows; signed as id strings. */
function idList(x: unknown): string[] {
  if (!Array.isArray(x)) return [];
  const out: string[] = [];
  for (const item of x) {
    const id = str(item !== null && typeof item === 'object' ? (item as { id?: unknown }).id : item);
    if (id) out.push(id);
  }
  return out;
}

/**
 * actionKey → jobs. Only S2b actions live here — addVote / createSale /
 * counterSaleClaim keep their existing per-call-site signing (adding them
 * here would double-sign).
 */
export const s2bShadowJobs: Record<string, ShadowJobDeriver> = {
  createMission: (params, result) => {
    const missionId = str(result.missionId);
    if (!missionId) return [];
    const entityType = str(result.createdEntityType);
    const branch =
      entityType === 'pendm' ? 'pend'
      : entityType === 'mesimabetahalich' ? 'self'
      : params.assignedUserId != null ? 'ask'
      : 'open';
    const stageId = str(result.createdEntityId);
    return [{
      spec: createMissionConsentSpec,
      params: { ...params, missionId, branch, stageIds: stageId ? [stageId] : [] }
    }];
  },

  completeMission: (params, result) => {
    if (params.missionId == null) return [];
    // The client call site doesn't know the project; the action result does
    // — inject it so the shadow event routes into the project's Space.
    const projectId = str(result.projectId);
    return [{
      spec: completeMissionConsentSpec,
      params: projectId ? { ...params, projectId } : params
    }];
  },

  createHaluka: (params, result) => {
    // graphqlOperation is the raw '69createHaluka' mutation — the created id
    // comes back in GraphQL shape.
    const halukaId =
      str((result as any)?.createHaluka?.data?.id) ??
      str((result as any)?.data?.createHaluka?.data?.id);
    if (!halukaId) return [];
    return [{ spec: createHalukaConsentSpec, params: { ...params, halukaId } }];
  },

  createChatMessage: (params, result) => {
    const messageId = str(result.messageId) ?? str((result as any)?.data?.messageId);
    if (!messageId) return [];
    return [{ spec: createChatMessageConsentSpec, params: { ...params, messageId } }];
  },

  createTosplit: (params, result) => {
    // Returns the raw '70.5createTosplit' result, as the qid did.
    const tosplitId =
      str((result as any)?.data?.createTosplit?.data?.id) ??
      str((result as any)?.createTosplit?.data?.id);
    if (!tosplitId) return [];
    return [{ spec: createTosplitConsentSpec, params: { ...params, tosplitId } }];
  },

  approveHaluka: (params) => {
    // One approval per transfer in the split. A split with nothing to
    // transfer (always so in a rikma of one) has no haluka to sign.
    const tosplitId = str(params.tosplitId);
    if (!tosplitId) return [];
    return idList(params.halukot).map((halukaId) => ({
      spec: approveHalukaConsentSpec,
      params: { projectId: params.projectId, tosplitId, halukaId }
    }));
  },

  confirmHaluka: (params) => {
    // Only the receiver's confirmation is the chain's haluka.confirm (the
    // reducer ignores anyone else). The sender's "I sent it" has no event yet.
    if (params.kind !== 'receive') return [];
    const halukaId = str(params.halukaId);
    if (!halukaId) return [];
    return [{
      spec: confirmHalukaConsentSpec,
      params: { projectId: params.projectId || undefined, halukaId }
    }];
  },

  timerStart: (params, result) => {
    // A manual timer opens stopped and empty — its hours arrive typed in,
    // through timerSave, and are not a clock tick.
    if (params.manual === true) return [];
    const fresh = params.timerId == null || String(params.timerId) === '0';
    const timerId = fresh
      ? str((result as any)?.createTimer?.data?.id) ?? str((result as any)?.data?.createTimer?.data?.id)
      : str(params.timerId);
    if (!timerId) return [];
    // The interval this start opened (startTimer stamps both with one `now`).
    const order = msOf(fresh ? params.start : params.newStart);
    if (!Number.isFinite(order)) return [];
    return [{
      spec: timeTickConsentSpec,
      params: {
        projectId: params.projectId,
        timerId,
        missionId: params.missionId,
        op: 'start',
        order,
        fresh
      }
    }];
  },

  timerStop: (params) => {
    const timerId = str(params.timerId);
    // isActive:false is a stop; the same action key also carries edits that
    // leave the timer running.
    if (!timerId || params.isActive !== false) return [];
    const closed = closedByStop(params.timers);
    if (!closed) return [];
    return [{
      spec: timeTickConsentSpec,
      params: {
        projectId: params.projectId,
        timerId,
        op: 'stop',
        order: closed.at,
        sessionMs: closed.sessionMs
      }
    }];
  }
};
