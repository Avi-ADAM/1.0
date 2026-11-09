import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { eventRun, eventsLive, loadEvent, loadRegistrations } from '$lib/server/events/store';
import { liveRows, pickLiveSession } from '$lib/events/live';
import { isSignupLink } from '$lib/events/model';

/**
 * The host's screen while the event runs (docs/inprogress/PLAN_EVENTS_WEBINARS.md
 * §6, W4): for one date, who is in the room, who opened an account, who
 * finished setting it up — so the host can call on whoever is stuck by name.
 * Members only (the `[projectId]` layout); the page re-reads itself every 20 s.
 */
export const load: PageServerLoad = async ({ params, parent, fetch, url, setHeaders }) => {
  await parent();
  setHeaders({ 'cache-control': 'private, no-store' });
  const run = eventRun(fetch);
  if (!(await eventsLive(run))) error(404, 'Events are not available yet');
  const event = await loadEvent(run, params.eventId, { withSecrets: false });
  if (!event || event.projectId !== String(params.projectId)) error(404, 'Not found');

  const session = pickLiveSession(event.sessions, new Date(), url.searchParams.get('s'));
  const registrations = await loadRegistrations(run, event.id);
  const live = session ? liveRows(registrations, session.key) : null;

  return {
    event: { id: event.id, title: event.title },
    sessions: event.sessions.filter((s) => s.state !== 'cancelled').map((s) => ({ key: s.key, startsAt: s.startsAt, timezone: s.timezone })),
    session: session ? { key: session.key, startsAt: session.startsAt, durationMin: session.durationMin, timezone: session.timezone } : null,
    rows: live?.rows ?? [],
    counts: live?.counts ?? null,
    // The account columns mean something only when the next step is our signup.
    signupFlow: isSignupLink(event.afterUrl),
    readAt: new Date().toISOString()
  };
};
