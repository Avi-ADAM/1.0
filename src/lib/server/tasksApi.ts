// src/lib/server/tasksApi.ts
//
// Pure, side-effect-free helpers for the External Tasks API
// (PLAN_EXTERNAL_TASKS_API). Kept separate from the SvelteKit endpoint so the
// validation + field-mapping logic can be unit-tested without the request
// machinery — the same split `salesApi.ts` uses.

export const TASKS_CREATE_SCOPE = 'tasks:create';
export const TASKS_READ_SCOPE = 'tasks:read';
export const TASK_SOURCE = 'api';

/** `Act.hashivut` — the urgency colours Strapi accepts. */
export const URGENCIES = ['white', 'green', 'yellow', 'red'] as const;
export type Urgency = (typeof URGENCIES)[number];

/** Every event the outgoing webhook can carry. */
export const WEBHOOK_EVENTS = [
  'task.created',
  'task.accepted',
  'task.assigned',
  'task.progress',
  'task.done'
] as const;
export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export interface TasksPayload {
  name: string;
  description: string;
  link: string;
  externalId: string;
  missionId: string | null;
  assignedUserId: string | null;
  roleIds: string[];
  urgency: Urgency;
  dateS: string | null;
  dateF: string | null;
}

export type ValidationResult =
  | { ok: true; value: TasksPayload }
  | { ok: false; status: number; message: string };

function isIsoDate(v: unknown): boolean {
  if (typeof v !== 'string' || !v.trim()) return false;
  return !Number.isNaN(Date.parse(v));
}

/**
 * Validate the raw request body and normalise it into a TasksPayload.
 * Never throws — a bad body returns `{ ok: false, status: 400, message }`.
 */
export function validateTasksPayload(body: any): ValidationResult {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, status: 400, message: 'Invalid JSON body' };
  }

  const name = body.name != null ? String(body.name).trim() : '';
  if (!name) return { ok: false, status: 400, message: 'name is required' };

  const description = body.description != null ? String(body.description) : '';
  const link = body.link != null ? String(body.link).trim() : '';
  const externalId = body.externalId != null ? String(body.externalId).trim() : '';

  const missionId =
    body.missionId != null && String(body.missionId).trim() !== ''
      ? String(body.missionId).trim()
      : null;
  const assignedUserId =
    body.assignedUserId != null && String(body.assignedUserId).trim() !== ''
      ? String(body.assignedUserId).trim()
      : null;

  let roleIds: string[] = [];
  if (body.roleIds != null) {
    if (!Array.isArray(body.roleIds)) {
      return { ok: false, status: 400, message: 'roleIds must be an array of role ids' };
    }
    roleIds = body.roleIds.map((r: unknown) => String(r).trim()).filter(Boolean);
  }

  // Assigning to a person and to a role at once is contradictory: `createTask`
  // silently drops the roles when a person is set, and a caller who sent both
  // would never see that the role half of their request evaporated.
  if (assignedUserId && roleIds.length > 0) {
    return {
      ok: false,
      status: 400,
      message: 'Send either assignedUserId or roleIds, not both — a task goes to a person or to a role'
    };
  }

  const urgencyRaw = body.urgency != null ? String(body.urgency).trim() : 'white';
  if (!URGENCIES.includes(urgencyRaw as Urgency)) {
    return {
      ok: false,
      status: 400,
      message: `urgency must be one of: ${URGENCIES.join(', ')}`
    };
  }

  let dateS: string | null = null;
  let dateF: string | null = null;
  if (body.dateS != null) {
    if (!isIsoDate(body.dateS)) return { ok: false, status: 400, message: 'dateS must be an ISO date' };
    dateS = String(body.dateS);
  }
  if (body.dateF != null) {
    if (!isIsoDate(body.dateF)) return { ok: false, status: 400, message: 'dateF must be an ISO date' };
    dateF = String(body.dateF);
  }

  return {
    ok: true,
    value: {
      name,
      description,
      link,
      externalId,
      missionId,
      assignedUserId,
      roleIds,
      urgency: urgencyRaw as Urgency,
      dateS,
      dateF
    }
  };
}

/**
 * Map a validated payload onto the exact params `createTask` expects.
 * `projectId` is supplied by the caller (derived from the API key, never the
 * client).
 *
 * `isAssigned` is the switch `createTask` branches on: true reads
 * `assignedUserId`/`missionId`, false reads `tafkidims`. A task with neither a
 * person nor a role is an unassigned rikma task, so it stays `isAssigned:false`
 * with no roles — the notification then falls back to the whole rikma.
 */
export function buildCreateTaskParams(args: {
  payload: TasksPayload;
  projectId: string;
}): Record<string, unknown> {
  const { payload, projectId } = args;
  const isAssigned = !!payload.assignedUserId;

  const params: Record<string, unknown> = {
    projectId,
    name: payload.name,
    description: payload.description,
    link: payload.link,
    isAssigned,
    hashivut: payload.urgency,
    source: TASK_SOURCE,
    // Never auto-approve on behalf of the assignee: an API-created task is an
    // offer until a human accepts it in the platform.
    myIshur: false
  };

  if (isAssigned) {
    params.assignedUserId = payload.assignedUserId;
    if (payload.missionId) params.missionId = payload.missionId;
  } else if (payload.roleIds.length > 0) {
    params.tafkidims = payload.roleIds;
  }

  if (payload.externalId) params.externalId = payload.externalId;
  if (payload.dateS) params.dateS = payload.dateS;
  if (payload.dateF) params.dateF = payload.dateF;

  return params;
}

/**
 * The task's state as the *external* system cares about it. `myIshur` is the
 * assignee's consent, so a task assigned to someone who has not answered yet is
 * `awaitingConsent` and not `accepted` — that distinction is the whole point of
 * routing API-created work through the platform.
 */
export type TaskSyncStatus = 'open' | 'awaitingConsent' | 'accepted' | 'done';

export interface TaskStatusView {
  taskId: string;
  externalId: string | null;
  status: TaskSyncStatus;
  progress: number;
  naasa: boolean;
  assignee: { id: string; username: string | null } | null;
}

/** Shape the `tasksApiActStatus` / `tasksApiActByExternalId` row into a status view. */
export function toTaskStatusView(row: any): TaskStatusView | null {
  if (!row?.id) return null;
  const a = row.attributes ?? {};
  const assigneeRow = a.my?.data?.[0] ?? null;
  const assignee = assigneeRow?.id
    ? { id: String(assigneeRow.id), username: assigneeRow.attributes?.username ?? null }
    : null;

  const naasa = !!a.naasa;
  let status: TaskSyncStatus;
  if (naasa) status = 'done';
  else if (a.myIshur) status = 'accepted';
  else if (assignee) status = 'awaitingConsent';
  else status = 'open';

  return {
    taskId: String(row.id),
    externalId: a.externalId != null && a.externalId !== '' ? String(a.externalId) : null,
    status,
    progress: Number.isFinite(Number(a.status)) ? Number(a.status) : 0,
    naasa,
    assignee
  };
}
