/**
 * The shop's clock (PLAN_SHOP_OPERATIONS §5.2).
 *
 *   GET /api/cron/orders?key=<CRON_SECRET>
 *
 * Lapses arranged orders whose payment did not arrive by their `expiresAt`
 * (`expireArrangedOrders`) and tells each storefront (`order.statusChanged`).
 * Schedule it hourly, next to /api/cron/shifts. Idempotent: a lapsed order is
 * no longer `pendingPayment`, so the next pass does not see it.
 *
 * Runs as the service account — there is no user in a cron request.
 */
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import { ordersSchemaLive, strapiRun } from '$lib/server/apiPublic/catalog.js';
import { expireArrangedOrders } from '$lib/server/shop/arrangedExpiry.js';
import { onOrderChanged } from '$lib/server/webhooks/orderEvents.js';
import { strapiClient } from '$lib/server/actions/index.js';

export const GET: RequestHandler = async ({ url, fetch }) => {
  const secret = env.CRON_SECRET || '';
  // Same guard as the other cron endpoints: enforced whenever a secret is configured.
  if (secret && url.searchParams.get('key') !== secret) {
    return json({ error: 'unauthorized' }, { status: 401 });
  }
  const run = strapiRun(fetch);
  if (!(await ordersSchemaLive(run))) return json({ skipped: true, reason: 'orders schema not live' });

  try {
    const report = await expireArrangedOrders(run);
    await Promise.all(
      report.lapsed.map((o) =>
        onOrderChanged({
          actionKey: 'expireOrder',
          params: { projectId: o.projectId },
          result: { changed: true, orderRef: o.ref },
          context: { userId: '', jwt: undefined, lang: 'he', fetch } as any,
          strapi: strapiClient as any
        }).catch((e) => console.warn('[cron/orders] webhook failed', o.ref, e))
      )
    );
    console.log(`[cron/orders] lapsed ${report.lapsed.length}, skipped ${report.skipped}, errors ${report.errors.length}`);
    return json(report);
  } catch (e) {
    console.error('[cron/orders] run failed:', e);
    return json({ error: (e as Error).message }, { status: 500 });
  }
};
