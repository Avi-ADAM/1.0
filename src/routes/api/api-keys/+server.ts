// src/routes/api/api-keys/+server.ts

import { json, error }      from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateApiKey }   from '$lib/server/apiKeys';

const STRAPI_URL = process.env.STRAPI_URL!;

// ─── POST — create a new key ──────────────────────────────────────

export const POST: RequestHandler = async ({ request, cookies }) => {
  const jwt  = cookies.get('jwt');
  const userIdStr = cookies.get('id');
  if (!jwt || !userIdStr) throw error(401, 'Unauthorized');
    console.log(jwt, userIdStr);
  const userId = parseInt(userIdStr, 10);
  if (isNaN(userId)) throw error(400, 'Invalid user ID');

  const { name } = await request.json();
  if (!name?.trim()) throw error(400, 'name is required');

  // --- DELETE existing key with same name (e.g. "MCP") ---
  const listRes = await fetch(
    `${STRAPI_URL}/api/api-keys?filters[name][$eq]=${encodeURIComponent(name)}`,
    { headers: { Authorization: `Bearer ${jwt}` } }
  );
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

  const res = await fetch(`${STRAPI_URL}/api/api-keys`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      Authorization:   `Bearer ${jwt}`,   // user's JWT — Strapi policy assigns ownership
    },
    body: JSON.stringify({
      data: {
        name,
        key_hash:   hash,
        key_prefix: prefix,
        users_permissions_user: userId,
      },
    }),
  });
  
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw error(res.status, body?.error?.message ?? 'Strapi error');
  }

  const { data } = await res.json();

  // raw is returned ONCE here and never stored — caller must save it
  return json({ id: data.id, name, prefix, raw }, { status: 201 });
};

// ─── GET — list the authenticated user's keys ─────────────────────

export const GET: RequestHandler = async ({ cookies }) => {
  const jwt  = cookies.get('jwt');
  const userId = cookies.get('id');
  if (!jwt || !userId) throw error(401, 'Unauthorized');

  const res = await fetch(
    `${STRAPI_URL}/api/api-keys?populate=users_permissions_user&fields[0]=name&fields[1]=key_prefix`,
    {
      headers: { Authorization: `Bearer ${jwt}` },
      // The is-owner policy injects ?filters[user][id][$eq] on the Strapi side
    }
  );

  if (!res.ok) throw error(res.status, 'Failed to fetch keys');

  const { data } = await res.json();

  // Strip the user relation — the client has no business seeing it
  const keys = data.map(({ id, attributes: { name, key_prefix } }: any) => ({
    id,
    name,
    key_prefix,
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