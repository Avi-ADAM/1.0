import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { appendFile } from 'node:fs/promises';
import { validateAttempt } from '$lib/p2p/telemetry.js';

/**
 * POST /api/v1/p2p/telemetry — one line per open attempt
 * (docs/PLAN_P2P_PILOT.md §3).
 *
 * Signed-in members only (the numbers are about members' devices), shape
 * enforced by `validateAttempt`, which also strips anything not in the shape.
 * Written as a `[p2p-pilot-telemetry]` log line — the same convention as the
 * other shadow telemetry — and, when P2P_TELEMETRY_FILE is set, appended as
 * JSONL for `scripts/p2p-pilot-report.mjs`.
 *
 * Never fails the caller's open: the browser fires and forgets.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.uid) throw error(401, 'Sign in first');
  const type = request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
  if (type !== 'application/json') throw error(415, 'Expected application/json');

  const attempt = validateAttempt(await request.json().catch(() => null));
  if (!attempt) throw error(400, 'Malformed attempt');

  const line = JSON.stringify({ at: new Date().toISOString(), ...attempt });
  console.log(`[p2p-pilot-telemetry] ${line}`);

  const file = (env.P2P_TELEMETRY_FILE || '').trim();
  if (file) {
    await appendFile(file, line + '\n').catch((e) => console.error('[p2p/telemetry] append failed', e));
  }
  return json({ ok: true });
};
