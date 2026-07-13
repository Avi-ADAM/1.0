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
  }
};
