import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyApiKeyDetailed, assertScope, touchLastUsed } from '$lib/server/apiKeys';
import { actionService, strapiClient } from '$lib/server/actions/index.js';
import type { ActionContext } from '$lib/server/actions/types.js';
import {
  validateTasksPayload,
  buildCreateTaskParams,
  toTaskStatusView,
  TASKS_CREATE_SCOPE
} from '$lib/server/tasksApi';
import { ADMINMONTHER } from '$env/static/private';

/**
 * POST /api/v1/tasks — External Tasks API (PLAN_EXTERNAL_TASKS_API).
 *
 * A deliberately "dumb" REST endpoint that a rikma member's own system (ticket
 * desk, bug board, contact form, bot) calls when it produces work. It rides the
 * same choke point as the in-app flow (`createTask`), so the assignee's consent
 * — `myIshur:false` until a human accepts in the platform — applies unchanged.
 *
 * Security: `projectId` is NEVER taken from the client; it is derived from the
 * scoped API key. The key's owner is used for exactly one thing — writing who
 * created the task (`Act.vali`). The worst a leaked key can do is propose work
 * to one rikma, and nobody is committed to any of it without accepting first.
 */

const ADMIN_TOKEN = ADMINMONTHER.replace(/\s+/g, '').replace(/^ADMINMONTHER=/, '');

// ─── Basic in-memory per-key rate limiting ──────────────────────────────────
// A ticket desk fires once per ticket; 60/min is generous, and it bounds the
// damage a leaked key can do before it is revoked.
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60 * 1000;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(keyId: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(keyId);
  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(keyId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (bucket.count >= RATE_LIMIT) return false;
  bucket.count += 1;
  return true;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

/**
 * Shared front door for both verbs: verify the key, check the scope, enforce
 * the rate limit and the origin allow-list. Throws the right HTTP error.
 */
async function authenticate(request: Request, scope: string) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) throw error(401, 'Missing Authorization header');
  const rawKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  const key = await verifyApiKeyDetailed(rawKey);
  if (!key) throw error(401, 'Invalid API key');
  if (key.revoked) throw error(401, 'API key has been revoked');
  if (!assertScope(key, scope)) throw error(403, `API key is missing the "${scope}" scope`);
  if (!key.project?.id) throw error(403, 'API key is not scoped to a rikma');

  if (!checkRateLimit(key.keyId)) throw error(429, 'Rate limit exceeded');

  if (key.allowedOrigins.length > 0) {
    const origin = request.headers.get('Origin');
    if (origin && !key.allowedOrigins.includes(origin)) {
      throw error(403, 'Origin not allowed for this API key');
    }
  }

  return key;
}

export const POST: RequestHandler = async ({ request, fetch }) => {
  const key = await authenticate(request, TASKS_CREATE_SCOPE);
  const projectId = String(key.project!.id);
  const creatorId = String(key.user.id);

  let body: any;
  try {
    body = await request.json();
  } catch {
    throw error(400, 'Invalid JSON body');
  }

  const validated = validateTasksPayload(body);
  if (validated.ok === false) throw error(validated.status, validated.message);
  const payload = validated.value;

  // 1. Idempotency — a ticket desk that retries must not put the same job on
  //    somebody's plate twice. Best-effort: if the lookup itself fails we would
  //    rather risk a duplicate than silently drop the work.
  if (payload.externalId) {
    try {
      const existing = await strapiClient.execute(
        'tasksApiActByExternalId',
        { pid: projectId, externalId: payload.externalId },
        ADMIN_TOKEN,
        fetch
      );
      const dup = existing?.data?.acts?.data?.[0];
      if (dup?.id) {
        touchLastUsed(key.keyId, fetch);
        const view = toTaskStatusView(dup);
        return json(
          {
            success: true,
            duplicated: true,
            taskId: String(dup.id),
            externalId: payload.externalId,
            status: view?.status ?? 'open',
            assignee: view?.assignee ?? null
          },
          { status: 200, headers: CORS_HEADERS }
        );
      }
    } catch (e) {
      console.error('[TasksAPI] idempotency lookup failed:', e);
    }
  }

  // 2. Every id in the payload must belong to THIS rikma. A key scoped to one
  //    rikma may not reach into another one's missions, members or roles — and
  //    a typo should say so rather than create a dangling task.
  let refs: any;
  try {
    refs = await strapiClient.execute('tasksApiProjectRefs', { pid: projectId }, ADMIN_TOKEN, fetch);
  } catch (e) {
    console.error('[TasksAPI] project refs lookup failed:', e);
    throw error(502, 'Failed to look up the rikma');
  }
  const projAttrs = refs?.data?.project?.data?.attributes;
  if (!projAttrs) throw error(404, 'Rikma not found');

  const memberIds = new Set<string>((projAttrs.user_1s?.data ?? []).map((u: any) => String(u.id)));
  const roleIds = new Set<string>((projAttrs.tafkidims?.data ?? []).map((r: any) => String(r.id)));
  const missionIds = new Set<string>(
    (projAttrs.mesimabetahaliches?.data ?? []).map((m: any) => String(m.id))
  );

  if (payload.missionId && !missionIds.has(payload.missionId)) {
    throw error(404, `Mission ${payload.missionId} is not an in-progress mission of this rikma`);
  }
  if (payload.assignedUserId && !memberIds.has(payload.assignedUserId)) {
    throw error(403, `User ${payload.assignedUserId} is not a member of this rikma`);
  }
  const unknownRole = payload.roleIds.find((r) => !roleIds.has(r));
  if (unknownRole) throw error(404, `Role ${unknownRole} does not belong to this rikma`);

  // 3. Execute the shared createTask action — same choke point as the UI flow,
  //    so notifications and the assignee-consent rule come along for free.
  const context: ActionContext = {
    userId: creatorId,
    jwt: ADMIN_TOKEN,
    lang: 'he',
    fetch
  };
  const params = buildCreateTaskParams({ payload, projectId });

  console.log(
    `[TasksAPI] createTask project=${projectId} externalId=${payload.externalId || '-'} ` +
      `assignee=${payload.assignedUserId ?? '-'} roles=${payload.roleIds.join(',') || '-'}`
  );

  const result = await actionService.executeAction('createTask', params, context);

  touchLastUsed(key.keyId, fetch);

  if (!result.success) {
    const code = result.error?.code;
    const status =
      code === 'VALIDATION_FAILED' ? 400 : code === 'UNAUTHORIZED' ? 403 : code === 'NOT_FOUND' ? 404 : 500;
    return json({ success: false, error: result.error }, { status, headers: CORS_HEADERS });
  }

  const taskId = result.data?.id != null ? String(result.data.id) : null;

  return json(
    {
      success: true,
      duplicated: false,
      taskId,
      externalId: payload.externalId || null,
      // An assigned task is an offer until the assignee accepts it in the
      // platform; an unassigned/role task is simply open for whoever takes it.
      status: payload.assignedUserId ? 'awaitingConsent' : 'open',
      assignee: payload.assignedUserId ? { id: payload.assignedUserId } : null
    },
    { status: 201, headers: CORS_HEADERS }
  );
};

export const OPTIONS: RequestHandler = async () => {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
};
