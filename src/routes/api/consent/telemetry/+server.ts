import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { appendFile } from 'node:fs/promises';
import { recordShadowReport } from '$lib/server/consent/shadowTelemetry';

/**
 * POST /api/consent/telemetry — one line per shadow-projection snapshot
 * (A3, PLAN_DISTRIBUTED_EXECUTION). The rules live in
 * $lib/server/consent/shadowTelemetry; identity is the signed JWT
 * (locals.uid), never a cookie the client sets.
 *
 * The browser fires and forgets: a refusal never breaks the page.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
  const file = (env.CONSENT_TELEMETRY_FILE || '').trim();
  const outcome = await recordShadowReport(
    {
      uid: locals.uid,
      contentType: request.headers.get('content-type'),
      body: await request.json().catch(() => null)
    },
    { append: file ? (line) => appendFile(file, line) : undefined }
  );
  if (outcome.status !== 200) throw error(outcome.status, outcome.message);
  return json({ ok: true });
};
