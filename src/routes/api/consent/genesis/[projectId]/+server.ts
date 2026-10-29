// T6 — genesis export: the present state of a project as Strapi knows it,
// in the exact shape buildGenesisState consumes (members + hervachti).
//
// `hervachti` here is the member's balance IN THIS RIKMA — what its splits
// paid out ($lib/consent/rikmaBalances) — not User.hervachti, which is one
// number summed over every rikma the user is in (decided 2026-10-30,
// PLAN_DISTRIBUTED_EXECUTION A2). The shadow comparison panel (T2/A3) reads
// the same export, so the import and the check can never disagree on what a
// balance is.
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
import { rikmaSplitBalances } from '$lib/consent/rikmaBalances';
import { fetchRikmaSplitRows } from '$lib/server/consent/rikmaBalancesExport';

import { STRAPI_URL as BASE } from '$lib/server/strapiUrl.js';
function adminToken(): string {
  return String(env.ADMINMONTHER ?? '').replace(/\s+/g, '').replace(/^ADMINMONTHER=/, '');
}

type UserRow = { id: string | number };

async function strapiGet(pathAndQuery: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${BASE}${pathAndQuery}`, {
      headers: { Authorization: `Bearer ${adminToken()}` },
      signal: controller.signal
    });
    if (!res.ok) throw error(502, `strapi ${res.status} ${res.statusText}`);
    return await res.json();
  } catch (e) {
    if ((e as { status?: number }).status) throw e;
    throw error(502, 'strapi unreachable');
  } finally {
    clearTimeout(timer);
  }
}

export const GET: RequestHandler = async ({ params, cookies }) => {
  // JWT gates abuse; the export is only meaningful to members anyway and the
  // genesis itself is decided by their signatures, not by this read.
  if (!cookies.get('jwt')) throw error(401, 'Unauthorized');
  const projectId = params.projectId;
  if (!projectId || !/^\d+$/.test(projectId)) throw error(400, 'bad projectId');
  if (!adminToken()) throw error(503, 'mirror credentials not configured');

  const body = await strapiGet(
    `/api/projects/${projectId}?fields[0]=projectName&populate[user_1s][fields][0]=username`
  );
  const attrs = (body as { data?: { attributes?: Record<string, unknown> } })?.data?.attributes;
  if (!attrs) throw error(404, 'project not found');

  const balances = rikmaSplitBalances(await fetchRikmaSplitRows(projectId, strapiGet));

  // Every member gets a number — 0 when no split of this rikma paid them —
  // so "nothing yet" and "unknown" can never be confused downstream.
  const rows = ((attrs.user_1s as { data?: UserRow[] })?.data ?? []).map((u) => ({
    id: String(u.id),
    hervachti: Number(balances.get(String(u.id)) ?? 0n) / 100
  }));

  return json({
    ok: true,
    projectId,
    projectName: (attrs.projectName as string) ?? null,
    balanceSource: 'rikma-splits',
    members: rows
  });
};
