// src/routes/api/api-keys/+server.ts

import { json, error }      from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateApiKey }   from '$lib/server/apiKeys';

const STRAPI_URL = process.env.STRAPI_URL!;

const SALES_API_KEY_NAME = 'sales-api';
const SALES_API_SCOPES = ['sales:report'];

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
    throw error(403, 'Only rikma members can create a sales API key');
  }
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

  // Rikma-scoped sales key: fixed name + scope, one active key per (rikma,user).
  const name = projectId ? SALES_API_KEY_NAME : bodyIn?.name;
  if (!name?.trim()) throw error(400, 'name is required');

  if (projectId) {
    await assertProjectMember(projectId, userId, jwt);
  }

  // --- DELETE existing key(s) with the same name (scoped to the project when
  //     project-scoped) so re-creating replaces rather than accumulates ---
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
    data.scopes = SALES_API_SCOPES;
    data.revoked = false;
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

  // raw is returned ONCE here and never stored — caller must save it
  return json({ id: created.id, name, prefix, raw }, { status: 201 });
};

// ─── GET — list the authenticated user's keys ─────────────────────
// Optional ?projectId= narrows to that rikma's key(s) for the sales panel.

export const GET: RequestHandler = async ({ url, cookies }) => {
  const jwt  = cookies.get('jwt');
  const userId = cookies.get('id');
  if (!jwt || !userId) throw error(401, 'Unauthorized');

  const projectId = url.searchParams.get('projectId');

  let endpoint =
    `${STRAPI_URL}/api/api-keys?populate=users_permissions_user&fields[0]=name&fields[1]=key_prefix&fields[2]=revoked&fields[3]=lastUsedAt`;
  if (projectId) {
    endpoint += `&filters[project][id][$eq]=${encodeURIComponent(projectId)}`;
  }

  const res = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${jwt}` },
    // The is-owner policy injects ?filters[user][id][$eq] on the Strapi side
  });

  if (!res.ok) throw error(res.status, 'Failed to fetch keys');

  const { data } = await res.json();

  // Strip the user relation — the client has no business seeing it
  const keys = data.map(({ id, attributes: { name, key_prefix, revoked, lastUsedAt } }: any) => ({
    id,
    name,
    key_prefix,
    revoked: !!revoked,
    lastUsedAt: lastUsedAt ?? null,
  }));

  return json(keys);
};

// ─── DELETE — remove a specific key ──────────────────────────────

export const DELETE: RequestHandler = async ({ url, cookies }) => {
  const jwt  = cookies.get('jwt');
  const userId = cookies.get('id');
  if (!jwt || !userId) throw error(401, 'Unauthorized');

  const id = url.searchParams.get('id');
  if (!id) throw error(400, 'id query param is required');

  const res = await fetch(`${STRAPI_URL}/api/api-keys/${id}`, {
    method:  'DELETE',
    headers: { Authorization: `Bearer ${jwt}` },
    // The is-owner policy blocks deletion if this key doesn't belong to the user
  });

  if (!res.ok) throw error(res.status, 'Failed to delete key');

  return json({ success: true });
};
