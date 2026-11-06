import type { PageServerLoad } from './$types';
import { rtKey } from '$lib/realtime/scopes.js';
import { eventRun, eventsLive, loadProjectEvents, loadSeats } from '$lib/server/events/store';
import { takenBySession } from '$lib/events/sessions';
import { eventPath } from '$lib/events/model';
import { readRikmaIdentity } from '$lib/server/rikmaPublic/loadRikmaPage.js';

/**
 * The rikma's events tab (docs/inprogress/PLAN_EVENTS_WEBINARS.md §7). Membership is
 * enforced by the `[projectId]` layout; the event qids are service-only, so
 * they are read here after `parent()`.
 */
export const load: PageServerLoad = async ({ params, parent, fetch, depends }) => {
  depends(rtKey(`project:${params.projectId}`));
  await parent();
  const run = eventRun(fetch);
  if (!(await eventsLive(run))) return { available: false, events: [] };

  const [events, identity] = await Promise.all([
    loadProjectEvents(run, params.projectId, { withSecrets: true }),
    readRikmaIdentity(params.projectId)
  ]);
  const rows = await Promise.all(
    events
      .filter((e) => !e.archived)
      .map(async (e) => {
        const seats = await loadSeats(run, e.id).catch(() => []);
        const taken = takenBySession(seats);
        const now = Date.now();
        const next = e.sessions.find((s) => s.state !== 'cancelled' && Date.parse(s.startsAt) > now) ?? null;
        return {
          id: e.id,
          title: e.title,
          kind: e.kind,
          status: e.status,
          nextStartsAt: next?.startsAt ?? null,
          nextTimezone: next?.timezone ?? null,
          sessions: e.sessions.length,
          registered: Object.values(taken).reduce((a, b) => a + b, 0),
          waitlist: seats.filter((r) => r.status === 'waitlist').length,
          href: eventPath({ slug: identity?.slug, id: params.projectId }, e.slug)
        };
      })
  );
  return { available: true, events: rows };
};
