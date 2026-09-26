/**
 * POST /api/assistant/prepare-signup — an agent prepares a signup for someone
 * without an account (docs/inprogress/PLAN_AI_SIGNUP_CONCIERGE.md §5.1). The same thing
 * the public MCP tool `prepareSignup` does, for agents that speak HTTP.
 *
 * Returns only the links; the person does everything that matters on them.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { strapiClient } from '$lib/server/actions/index.js';
import { prepareSignup } from '$lib/server/assistant/prepareSignup.js';
import { takePrepare } from '$lib/server/assistant/publicQuota.js';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request, fetch, getClientAddress }) => {
  if (env.ASSISTANT_MCP_ENABLED !== 'true') return json({ ok: false, reason: 'disabled' }, { status: 404 });

  const quota = takePrepare(getClientAddress());
  if (!quota.ok) {
    return json({ ok: false, reason: 'rate-limited' }, { status: 429, headers: { 'Retry-After': String(quota.retryAfterSeconds ?? 60) } });
  }

  const body = await request.json().catch(() => null);
  try {
    const result = await prepareSignup(body, { strapi: strapiClient, fetch });
    return json({ ok: true, ...result });
  } catch (e) {
    return json({ ok: false, reason: e instanceof Error ? e.message : 'invalid' }, { status: 400 });
  }
};
