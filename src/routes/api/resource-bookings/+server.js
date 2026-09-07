/**
 * Operational endpoint for the resource-booking rollout
 * (docs/PLAN_RESOURCE_CALENDAR.md §8) — the two steps between
 * `RESOURCE_BOOKINGS=shadow` and `RESOURCE_BOOKINGS=enforce`:
 *
 *   GET /api/resource-bookings?op=compare            what the two gates say
 *   GET /api/resource-bookings?op=backfill&dry=1     what a backfill would write
 *   GET /api/resource-bookings?op=backfill           write it
 *
 * Key-gated exactly like /api/monthi, with the same secret: it walks every
 * grant on the platform and writes ledger rows, which is not something a path
 * guess should be able to trigger. Send `x-monthi-key`, or `?key=` for a
 * plain scheduler.
 *
 * `compare` is read-only and safe to run at any time — it is the report that
 * decides whether the flip is safe.
 */

import { SendToAdmin } from '$lib/server/sendToAdmin.js';
import { execFromAdmin } from '$lib/server/archive/exec.js';
import { runBackfill, runComparison } from '$lib/server/resources/backfill.js';
import { bookingMode } from '$lib/server/resources/bookingStore.js';
// Server-only secret — never exposed to the client bundle (no VITE_ prefix).
import { env } from '$env/dynamic/private';

/** Length-independent comparison, so the key cannot be probed byte by byte. */
function secretMatches(given, expected) {
  if (typeof given !== 'string' || typeof expected !== 'string' || !expected) return false;
  if (given.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < given.length; i++) diff |= given.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function flag(url, name) {
  return ['1', 'true', 'yes'].includes((url?.searchParams?.get(name) ?? '').toLowerCase());
}

export async function GET({ url, request }) {
  const key =
    request?.headers?.get('x-monthi-key') ?? url?.searchParams?.get('key') ?? '';
  if (!secretMatches(key, env.ADMINMONTHER)) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const op = (url?.searchParams?.get('op') ?? 'compare').toLowerCase();
  const exec = execFromAdmin(SendToAdmin, env.ADMINMONTHER);

  try {
    if (op === 'compare') {
      const limit = Number(url?.searchParams?.get('limit') ?? 200);
      return json(await runComparison(exec, { limit: Number.isFinite(limit) ? limit : 200 }));
    }

    if (op === 'backfill') {
      const dry = flag(url, 'dry');
      // Writing rows while the flag is `off` would fill the ledger for a
      // system that neither reads nor maintains it — the rows would go stale
      // from the first grant made after the run. `?force=1` is there for a
      // deliberate rehearsal, not for the real pass.
      if (bookingMode() === 'off' && !dry && !flag(url, 'force')) {
        return json(
          {
            error: 'RESOURCE_BOOKINGS=off',
            hint: 'Set RESOURCE_BOOKINGS=shadow before backfilling, or pass &dry=1 to rehearse.'
          },
          409
        );
      }
      return json(await runBackfill(exec, { dry, includePlan: flag(url, 'plan') }));
    }

    return json({ error: `Unknown op "${op}"`, ops: ['compare', 'backfill'] }, 400);
  } catch (e) {
    console.error('[resource-bookings]', e);
    const message = e instanceof Error ? e.message : String(e);
    // The API token carries its own permission list, separate from the
    // Authenticated role, and a Custom token does not pick up a newly added
    // collection. That is one Strapi screen away and reads as an opaque
    // "Forbidden access" until somebody says so out loud.
    const hint = /Forbidden access/i.test(message)
      ? 'Strapi → Settings → API Tokens → the token this server uses → allow find/findOne/create/update on resource-booking (the Authenticated role is a different list).'
      : undefined;
    return json({ error: message, hint }, 500);
  }
}
