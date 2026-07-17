// T6 — genesis export: the present state of a project as Strapi knows it,
// in the exact shape buildGenesisState consumes (members + hervachti).
//
// This endpoint is read-only and advisory: the proposer builds and SIGNS the
// genesis from one export; voters fetch a fresh export to compare against
// what was signed (diffGenesisAgainstExport). The signature chain — not this
// endpoint — is what the migration rests on.
//
// Strapi access mirrors strapiMirror.ts: admin token, v4 REST, 5s timeout.

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

import { STRAPI_URL as BASE } from '$lib/server/strapiUrl.js';
function adminToken(): string {
  return String(env.ADMINMONTHER ?? '').replace(/\s+/g, '').replace(/^ADMINMONTHER=/, '');
}

type UserRow = { id: string | number; attributes?: { hervachti?: number | null } };

export const GET: RequestHandler = async ({ params, cookies }) => {
  // JWT gates abuse; the export is only meaningful to members anyway and the
  // genesis itself is decided by their signatures, not by this read.
  if (!cookies.get('jwt')) throw error(401, 'Unauthorized');
  const projectId = params.projectId;
  if (!projectId || !/^\d+$/.test(projectId)) throw error(400, 'bad projectId');
  if (!adminToken()) throw error(503, 'mirror credentials not configured');

  const qs = 'fields[0]=projectName&populate[user_1s][fields][0]=hervachti';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  let body: unknown;
  try {
    const res = await fetch(`${BASE}/api/projects/${projectId}?${qs}`, {
      headers: { Authorization: `Bearer ${adminToken()}` },
      signal: controller.signal
    });
    if (!res.ok) throw error(502, `strapi ${res.status}, ${res.statusText}, ${res}`);
    body = await res.json();
    console.log("genesis", body)
  } catch (e) {
    if ((e as { status?: number }).status) throw e;
    throw error(502, 'strapi unreachable');
  } finally {
    clearTimeout(timer);
  }

  const attrs = (body as { data?: { attributes?: Record<string, unknown> } })?.data?.attributes;
  if (!attrs) throw error(404, 'project not found');

  const rows = ((attrs.user_1s as { data?: UserRow[] })?.data ?? []).map((u) => ({
    id: String(u.id),
    hervachti: u.attributes?.hervachti ?? null
  }));

  return json({
    ok: true,
    projectId,
    projectName: (attrs.name as string) ?? null,
    members: rows
  });
};
