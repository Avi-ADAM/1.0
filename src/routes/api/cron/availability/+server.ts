/**
 * The meeting-availability clock.
 *
 *   GET /api/cron/availability?key=<CRON_SECRET>
 *
 * Switches off every pgishauser that is still "available" past its
 * `availableUntil` — people mark themselves free and forget, and meetings get
 * set up around someone who is not there. Each one goes through the
 * `toggleOnline` action (as that member, with `autoExpired`), so the meeting's
 * own `available` flag is recomputed, the other participants hear about it and
 * the member is told it was switched off for them.
 *
 * A row that is on with no `availableUntil` at all was switched on before this
 * clock existed: it gets the default hour from now rather than being cut off
 * the moment this ships.
 *
 * Schedule it every 5 minutes. Idempotent: a row it switched off is no longer
 * `available`, and a row it gave an hour is no longer missing its time.
 *
 * Runs as the service account — there is no user in a cron request.
 */
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import { actionService, strapiClient } from '$lib/server/actions/index.js';
import { normalizeAdminToken } from '$lib/server/adminToken.js';
import { availableUntilFrom } from '$lib/server/actions/configs/toggleOnline';

export const GET: RequestHandler = async ({ url, fetch }) => {
  const secret = env.CRON_SECRET || '';
  // Same guard as the other cron endpoints: enforced whenever a secret is configured.
  if (secret && url.searchParams.get('key') !== secret) {
    return json({ error: 'unauthorized' }, { status: 401 });
  }
  const jwt = normalizeAdminToken(env.ADMINMONTHER ?? '');
  const now = new Date();

  try {
    const res = await strapiClient.execute('availabilityToExpire', { now: now.toISOString() }, jwt, fetch);
    const rows: any[] = res?.data?.pgishausers?.data ?? [];

    const expired: string[] = [];
    const granted: string[] = [];
    const errors: { id: string; error: string }[] = [];

    for (const pu of rows) {
      const until = pu.attributes?.availableUntil;
      const user = pu.attributes?.users_permissions_user?.data;
      const meetingId = pu.attributes?.pgishas?.data?.[0]?.id;
      try {
        if (!until) {
          await strapiClient.execute(
            '22setOnline',
            { id: pu.id, online: true, until: availableUntilFrom(undefined, now.getTime()) },
            jwt,
            fetch
          );
          granted.push(String(pu.id));
          continue;
        }
        if (!user?.id || !meetingId) {
          // Nobody to act as, or no meeting to recompute: just switch the row off.
          await strapiClient.execute('22setOnline', { id: pu.id, online: false, until: null }, jwt, fetch);
        } else {
          const result: any = await actionService.executeAction(
            'toggleOnline',
            { status: false, meetingId: String(meetingId), autoExpired: true },
            { userId: String(user.id), jwt, lang: user.attributes?.lang === 'en' ? 'en' : 'he', fetch } as any
          );
          if (!result?.success) throw new Error(String(result?.error?.message ?? result?.error ?? 'toggleOnline failed'));
        }
        expired.push(String(pu.id));
      } catch (e) {
        errors.push({ id: String(pu.id), error: (e as Error).message });
      }
    }

    console.log(
      `[cron/availability] expired ${expired.length}, granted ${granted.length}, errors ${errors.length}`
    );
    return json({ expired, granted, errors });
  } catch (e) {
    // Before 1.0b deploys `availableUntil` the query itself fails — nothing to expire.
    console.error('[cron/availability] run failed:', e);
    return json({ error: (e as Error).message }, { status: 500 });
  }
};
