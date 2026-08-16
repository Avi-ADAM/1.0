// src/routes/api/api-keys/+server.ts

import { json, error }      from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateApiKey }   from '$lib/server/apiKeys';
import { webhookSecretForKey } from '$lib/server/webhooks/secret';
import { invalidateWebhookTargets } from '$lib/server/webhooks/targets';

import { STRAPI_URL } from '$lib/server/strapiUrl.js';

// The original rikma-scoped key: one per (rikma, user), fixed name and scope.
// Kept verbatim so the existing sales panel — which posts only `{ projectId }`
// — keeps behaving exactly as it did.
const SALES_API_KEY_NAME = 'sales-api';
const SALES_API_SCOPES = ['sales:report'];

/**
 * Capabilities a rikma-scoped key may be granted. A key carries only what was
 * ticked, so a ticket-desk key can never file a sale and a shop key can never
 * put work on a member's plate.
 */
const GRANTABLE_SCOPES = ['sales:report', 'tasks:create', 'tasks:read'] as const;

/** Callbacks must be absolute http(s) — a relative or exotic URL is a config bug. */
function normalizeCallbackUrl(raw: unknown): string | null {
  if (raw == null || String(raw).trim() === '') return null;
  let parsed: URL;
  try {
    parsed = new URL(String(raw).trim());
  } catch {
    throw error(400, 'callbackUrl must be an absolute URL');
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw error(400, 'callbackUrl must be http or https');
  }
  return parsed.toString();
}

function normalizeScopes(raw: unknown): string[] {
  if (!Array.isArray(raw)) throw error(400, 'scopes must be an array');
  const scopes = [...new Set(raw.map((s) => String(s).trim()).filter(Boolean))];
  const unknown = scopes.find((s) => !GRANTABLE_SCOPES.includes(s as any));
  if (unknown) throw error(400, `Unknown scope "${unknown}"`);
  if (scopes.length === 0) throw error(400, 'At least one scope is required');
  return scopes;
}

// Verify the user is a member of the rikma before minting a project-scoped key.
async function assertProjectMember(projectId: string, userId: number, jwt: string) {
  const query = `
    query CheckMember($pid: ID!) {
      project(id: $pid) {
        data { id attributes { user_1s { data { id } } } }
      }
    }
  `;
  const res = await fetch(`${STRAPI_URL}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({ query, variables: { pid: projectId } })
  });
  if (!res.ok) throw error(res.status, 'Failed to verify project membership');
  const { data, errors } = await res.json();
  if (errors) throw error(400, 'Failed to verify project membership');
  const members: any[] = data?.project?.data?.attributes?.user_1s?.data ?? [];
  if (!members.some((m) => String(m.id) === String(userId))) {
    throw error(403, 'Only rikma members can create a rikma API key');
  }
}

/** Fetch one key and confirm it belongs to the caller — used by PATCH/DELETE. */
async function loadOwnedKey(id: string, jwt: string) {
  const res = await fetch(
    `${STRAPI_URL}/api/api-keys/${id}?populate[project][fields][0]=id`,
    { headers: { Authorization: `Bearer ${jwt}` } }
    // The is-owner policy 404s a key that belongs to somebody else.
  );
  if (!res.ok) throw error(res.status === 404 ? 404 : res.status, 'API key not found');
  const { data } = await res.json();
  if (!data?.id) throw error(404, 'API key not found');
  return data;
}

// ─── POST — create a new key ──────────────────────────────────────

export const POST: RequestHandler = async ({ request, cookies }) => {
  const jwt  = cookies.get('jwt');
  const userIdStr = cookies.get('id');
  if (!jwt || !userIdStr) throw error(401, 'Unauthorized');
  const userId = parseInt(userIdStr, 10);
  if (isNaN(userId)) throw error(400, 'Invalid user ID');

  const bodyIn = await request.json();
  const projectId: string | undefined = bodyIn?.projectId ? String(bodyIn.projectId) : undefined;

  // Two shapes live here:
  //  - legacy sales panel: { projectId } alone ⇒ the fixed sales key, one per
  //    (rikma, user), re-created in place.
  //  - the rikma API page: { projectId, name, scopes[], callbackUrl } ⇒ a named
  //    key per connected system, so a rikma can have several.
  const explicitScopes = bodyIn?.scopes != null;
  const scopes = explicitScopes ? normalizeScopes(bodyIn.scopes) : SALES_API_SCOPES;
  const callbackUrl = normalizeCallbackUrl(bodyIn?.callbackUrl);

  const name = projectId
    ? (explicitScopes ? String(bodyIn?.name ?? '').trim() : SALES_API_KEY_NAME)
    : bodyIn?.name;
  if (!name?.trim()) throw error(400, 'name is required');

  if (projectId) {
    await assertProjectMember(projectId, userId, jwt);
  } else if (explicitScopes || callbackUrl) {
    // Scopes and webhooks only mean something relative to a rikma.
    throw error(400, 'scopes and callbackUrl require a projectId');
  }

  // --- DELETE existing key(s) with the same name (scoped to the project when
  //     project-scoped) so re-creating replaces rather than accumulates. With
  //     named keys this is now per-name, which is what allows several. ---
  const listFilters = projectId
    ? `filters[name][$eq]=${encodeURIComponent(name)}&filters[project][id][$eq]=${encodeURIComponent(projectId)}`
    : `filters[name][$eq]=${encodeURIComponent(name)}`;
  const listRes = await fetch(`${STRAPI_URL}/api/api-keys?${listFilters}`, {
    headers: { Authorization: `Bearer ${jwt}` }
  });
  if (listRes.ok) {
    const { data: existingKeys } = await listRes.json();
    for (const k of existingKeys) {
      await fetch(`${STRAPI_URL}/api/api-keys/${k.id}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${jwt}` },
      });
    }
  }

  const { raw, hash, prefix } = generateApiKey(userId);

  const data: Record<string, unknown> = {
    name,
    key_hash:   hash,
    key_prefix: prefix,
    users_permissions_user: userId,
  };
  if (projectId) {
    data.project = projectId;
    data.scopes = scopes;
    data.revoked = false;
    if (callbackUrl) data.callback_url = callbackUrl;
  }

  const res = await fetch(`${STRAPI_URL}/api/api-keys`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      Authorization:   `Bearer ${jwt}`,   // user's JWT — Strapi policy assigns ownership
    },
    body: JSON.stringify({ data }),
  });

  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    throw error(res.status, b?.error?.message ?? 'Strapi error');
  }

  const { data: created } = await res.json();

  if (projectId) invalidateWebhookTargets(projectId);

  // raw is returned ONCE here and never stored — caller must save it. The
  // webhook secret is derived from the key's id rather than stored, so it can
  // always be recomputed server-side but is likewise shown only now.
  return json(
    {
      id: created.id,
      name,
      prefix,
      raw,
      scopes: projectId ? scopes : [],
      callbackUrl: callbackUrl ?? null,
      webhookSecret: callbackUrl ? webhookSecretForKey(created.id) : null
    },
    { status: 201 }
  );
};

// ─── GET — list the authenticated user's keys ─────────────────────
// Optional ?projectId= narrows to that rikma's key(s) for the integration panels.

export const GET: RequestHandler = async ({ url, cookies }) => {
  const jwt  = cookies.get('jwt');
  const userId = cookies.get('id');
  if (!jwt || !userId) throw error(401, 'Unauthorized');

  const projectId = url.searchParams.get('projectId');

  let endpoint =
    `${STRAPI_URL}/api/api-keys?populate=users_permissions_user&fields[0]=name&fields[1]=key_prefix&fields[2]=revoked&fields[3]=lastUsedAt&fields[4]=scopes&fields[5]=callback_url`;
  if (projectId) {
    endpoint += `&filters[project][id][$eq]=${encodeURIComponent(projectId)}`;
  }

  const res = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${jwt}` },
    // The is-owner policy injects ?filters[user][id][$eq] on the Strapi side
  });

  if (!res.ok) throw error(res.status, 'Failed to fetch keys');

  const { data } = await res.json();

  // Strip the user relation — the client has no business seeing it. The
  // webhook secret is never listed: it is shown once, at creation.
  const keys = data.map(
    ({ id, attributes: { name, key_prefix, revoked, lastUsedAt, scopes, callback_url } }: any) => ({
      id,
      name,
      key_prefix,
      revoked: !!revoked,
      lastUsedAt: lastUsedAt ?? null,
      scopes: Array.isArray(scopes) ? scopes : [],
      callbackUrl: callback_url ?? null,
    })
  );

  return json(keys);
};

// ─── PATCH — change a key's callback URL / allowed origins ────────
// Separate from POST so pointing a webhook at a new host does not force the
// user to rotate a key that is already deployed in their system.

export const PATCH: RequestHandler = async ({ request, url, cookies }) => {
  const jwt  = cookies.get('jwt');
  const userId = cookies.get('id');
  if (!jwt || !userId) throw error(401, 'Unauthorized');

  const id = url.searchParams.get('id');
  if (!id) throw error(400, 'id query param is required');

  const body = await request.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  if ('callbackUrl' in body) {
    // An explicit null/'' clears the webhook — that is how you turn it off.
    data.callback_url = normalizeCallbackUrl(body.callbackUrl);
  }
  if ('allowedOrigins' in body) {
    if (body.allowedOrigins != null && !Array.isArray(body.allowedOrigins)) {
      throw error(400, 'allowedOrigins must be an array');
    }
    data.allowed_origins = (body.allowedOrigins ?? []).map((o: unknown) => String(o).trim()).filter(Boolean);
  }
  if (Object.keys(data).length === 0) throw error(400, 'Nothing to update');

  const existing = await loadOwnedKey(id, jwt);

  const res = await fetch(`${STRAPI_URL}/api/api-keys/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({ data }),
  });
  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    throw error(res.status, b?.error?.message ?? 'Failed to update key');
  }

  const projectId = existing?.attributes?.project?.data?.id;
  if (projectId) invalidateWebhookTargets(String(projectId));

  return json({
    success: true,
    callbackUrl: data.callback_url ?? null,
    // Re-shown on change so the receiver can be configured in the same breath.
    webhookSecret: data.callback_url ? webhookSecretForKey(id) : null
  });
};

// ─── DELETE — remove a specific key ──────────────────────────────

export const DELETE: RequestHandler = async ({ url, cookies }) => {
  const jwt  = cookies.get('jwt');
  const userId = cookies.get('id');
  if (!jwt || !userId) throw error(401, 'Unauthorized');

  const id = url.searchParams.get('id');
  if (!id) throw error(400, 'id query param is required');

  // Read it first so the rikma's webhook-target cache can be cleared: a key
  // deleted while its callback is cached would keep being called for up to the
  // cache TTL.
  const existing = await loadOwnedKey(id, jwt).catch(() => null);

  const res = await fetch(`${STRAPI_URL}/api/api-keys/${id}`, {
    method:  'DELETE',
    headers: { Authorization: `Bearer ${jwt}` },
    // The is-owner policy blocks deletion if this key doesn't belong to the user
  });

  if (!res.ok) throw error(res.status, 'Failed to delete key');

  const projectId = existing?.attributes?.project?.data?.id;
  if (projectId) invalidateWebhookTargets(String(projectId));

  return json({ success: true });
};
