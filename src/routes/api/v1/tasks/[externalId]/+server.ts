import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyApiKeyDetailed, assertScope, touchLastUsed } from '$lib/server/apiKeys';
import { strapiClient } from '$lib/server/actions/index.js';
import { toTaskStatusView, TASKS_READ_SCOPE } from '$lib/server/tasksApi';
import { ADMINMONTHER } from '$env/static/private';

/**
 * GET /api/v1/tasks/{externalId} — status pull for the External Tasks API.
 *
 * The lazy half of the sync contract: whoever cannot host a webhook receiver
 * can simply ask "what happened to my ticket's task?". Read-only, and scoped to
 * the key's own rikma — an externalId from another rikma is a 404 here, which
 * is also what stops a key from being used to probe other rikmot.
 */

const ADMIN_TOKEN = ADMINMONTHER.replace(/\s+/g, '').replace(/^ADMINMONTHER=/, '');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

export const GET: RequestHandler = async ({ request, params, fetch }) => {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) throw error(401, 'Missing Authorization header');
  const rawKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  const key = await verifyApiKeyDetailed(rawKey);
  if (!key) throw error(401, 'Invalid API key');
  if (key.revoked) throw error(401, 'API key has been revoked');
  if (!assertScope(key, TASKS_READ_SCOPE)) {
    throw error(403, `API key is missing the "${TASKS_READ_SCOPE}" scope`);
  }
  if (!key.project?.id) throw error(403, 'API key is not scoped to a rikma');

  const externalId = String(params.externalId ?? '').trim();
  if (!externalId) throw error(400, 'externalId is required');

  let res: any;
  try {
    res = await strapiClient.execute(
      'tasksApiActByExternalId',
      { pid: String(key.project.id), externalId },
      ADMIN_TOKEN,
      fetch
    );
  } catch (e) {
    console.error('[TasksAPI] status lookup failed:', e);
    throw error(502, 'Failed to look up the task');
  }

  const row = res?.data?.acts?.data?.[0];
  if (!row?.id) throw error(404, `No task with externalId "${externalId}" in this rikma`);

  touchLastUsed(key.keyId, fetch);

  const view = toTaskStatusView(row);
  return json(
    { success: true, ...view, externalId },
    { status: 200, headers: CORS_HEADERS }
  );
};

export const OPTIONS: RequestHandler = async () => {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
};
