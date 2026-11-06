/**
 * The events clock (docs/inprogress/PLAN_EVENTS_WEBINARS.md §5.2, W3).
 *
 *   GET /api/cron/events            (x-cron-secret header or ?key=<CRON_SECRET>)
 *   GET /api/cron/events?dry=1      what would be sent, without claiming or sending
 *
 * Schedule every 5 minutes. Sends reminders (tomorrow, in an hour, we've
 * started), the after mails (thanks / you missed it — marking no-shows), the
 * date-moved and date-cancelled notices, "a seat opened" to whoever comes off
 * a waiting list, and "a new date opened" to who asked to hear about one.
 *
 * Fails closed: it mails people, so no CRON_SECRET means no access
 * (`cronAuth` required mode). Runs as the service account; idempotent — every
 * mail is claimed on the registration before it is sent.
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { checkCron } from '$lib/server/cronAuth.js';
import { eventRun, eventsLive } from '$lib/server/events/store';
import { runEventsCron } from '$lib/server/events/cron';
import { sendMailSafe } from '$lib/server/mailer.js';
import { SITE_ORIGIN } from '$lib/rikmaAddress/rikmaUrl.js';

export const GET: RequestHandler = async ({ request, url, fetch }) => {
  const auth = checkCron(request, url, { required: true });
  if (!auth.ok) return json({ error: auth.error }, { status: auth.status });

  const run = eventRun(fetch);
  if (!(await eventsLive(run))) return json({ skipped: true, reason: 'events schema not live' });

  try {
    const report = await runEventsCron({
      run,
      dry: url.searchParams.get('dry') === '1',
      // Links in a mail must point at the public site, not at whatever host the scheduler called.
      origin: SITE_ORIGIN,
      send: (to, m) =>
        sendMailSafe({
          to,
          subject: m.subject,
          html: m.html,
          text: m.text,
          ...(m.ics
            ? { attachments: [{ filename: 'event.ics', content: m.ics, contentType: `text/calendar; charset=utf-8; method=${m.icsMethod ?? 'PUBLISH'}` }] }
            : {})
        }),
      logLead: async (leadId, body) => {
        const { strapiClient } = await import('$lib/server/actions/index.js');
        const { leadStore, recordActivity } = await import('$lib/server/leads/store');
        await recordActivity(leadStore(strapiClient as any, fetch), { leadId, kind: 'event', direction: 'in', body });
      }
    });
    console.log('[cron/events]', JSON.stringify(report));
    return json(report);
  } catch (e) {
    console.error('[cron/events] run failed:', e);
    return json({ error: (e as Error).message }, { status: 500 });
  }
};
