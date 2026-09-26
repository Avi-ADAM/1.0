/**
 * GET /api/cron/assistant-cleanup?key=<CRON_SECRET>
 * (docs/inprogress/PLAN_AI_SIGNUP_CONCIERGE.md §5.4, M13)
 *
 * An agent-prepared signup that nobody finished leaves a `pending` session with
 * someone's name, email and words in it, and no owner. After `claimExpiresAt`
 * (14 days) it is deleted — it was never anybody's, and keeping personal text
 * nobody can see or claim has no purpose. Daily is plenty.
 *
 * Only `pending` rows past their claim date: a claimed session is its owner's
 * and is never touched here.
 */

import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import { strapiClient } from '$lib/server/actions/index.js';

export const GET: RequestHandler = async ({ url, fetch }) => {
  const secret = env.CRON_SECRET || '';
  // Same guard as the other cron endpoints: enforced whenever a secret is configured.
  if (secret && url.searchParams.get('key') !== secret) {
    return json({ error: 'unauthorized' }, { status: 401 });
  }

  const before = new Date().toISOString();
  let deleted = 0;
  const errors: string[] = [];
  // Pages of 100 until nothing expired is left (bounded, in case deletes fail).
  for (let round = 0; round < 20; round++) {
    const res = await strapiClient.execute('369listExpiredPendingAssistant', { before }, undefined, fetch);
    const ids: string[] = (res?.data?.assistantSessions?.data ?? []).map((n: any) => String(n.id));
    if (!ids.length) break;
    let progressed = false;
    for (const id of ids) {
      try {
        await strapiClient.execute('380deleteAssistantSession', { id }, undefined, fetch);
        deleted++;
        progressed = true;
      } catch (e) {
        errors.push(`${id}: ${(e as Error).message}`);
      }
    }
    if (!progressed) break;
  }

  console.log(`[cron/assistant-cleanup] deleted ${deleted} expired pending sessions, ${errors.length} errors`);
  return json({ deleted, errors: errors.slice(0, 10) });
};
