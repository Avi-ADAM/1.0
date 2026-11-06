import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { eventRun, eventsLive, loadByToken } from '$lib/server/events/store';
import { buildIcs } from '$lib/events/ics';

/** The calendar file for one registration — the same UID the confirmation email carried. */
export const GET: RequestHandler = async ({ params, fetch, url }) => {
  const run = eventRun(fetch);
  if (!(await eventsLive(run))) error(404, 'Not found');
  const found = await loadByToken(run, params.token);
  const session = found?.event.sessions.find((s) => s.key === found.registration.sessionKey);
  if (!found || !session) error(404, 'Not found');
  const ics = buildIcs({
    uid: `event-registration-${found.registration.id}@1lev1.com`,
    title: found.event.title,
    description: found.event.tagline,
    startsAt: session.startsAt,
    durationMin: session.durationMin,
    url: `${url.origin}/e/${params.token}`,
    cancel: found.registration.status === 'cancelled' || session.state === 'cancelled'
  });
  return new Response(ics, {
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      'content-disposition': 'attachment; filename="event.ics"',
      'cache-control': 'private, no-store'
    }
  });
};
