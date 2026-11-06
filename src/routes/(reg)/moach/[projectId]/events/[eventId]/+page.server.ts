import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { rtKey } from '$lib/realtime/scopes.js';
import { eventRun, eventsLive, loadEvent, loadRegistrations } from '$lib/server/events/store';
import { eventPath } from '$lib/events/model';
import { publishProblems, validateEventDraft } from '$lib/events/validate';
import { takenBySession } from '$lib/events/sessions';
import { readRikmaIdentity } from '$lib/server/rikmaPublic/loadRikmaPage.js';

/**
 * One event of the rikma: the editor, the publish step and who registered
 * (docs/inprogress/PLAN_EVENTS_WEBINARS.md §7). `eventId = new` opens an empty draft.
 * Members only (the `[projectId]` layout); the payload carries join links and
 * registrants' contacts, which is why it is never cached or shared.
 */
export const load: PageServerLoad = async ({ params, parent, fetch, depends, setHeaders }) => {
  depends(rtKey(`project:${params.projectId}`));
  await parent();
  setHeaders({ 'cache-control': 'private, no-store' });
  const run = eventRun(fetch);
  if (!(await eventsLive(run))) error(404, 'Events are not available yet');

  const identity = await readRikmaIdentity(params.projectId);
  const rikma = { id: params.projectId, slug: identity?.slug ?? null };

  if (params.eventId === 'new') {
    return { isNew: true, event: null, registrations: [], taken: {}, problems: [], rikma, pageHref: null };
  }

  const event = await loadEvent(run, params.eventId, { withSecrets: true });
  if (!event || event.projectId !== String(params.projectId)) error(404, 'Not found');
  const registrations = await loadRegistrations(run, event.id);
  const v = validateEventDraft({
    ...event,
    outcomes: event.outcomes.join('\n'),
    audience: event.audience.join('\n')
  });
  return {
    isNew: false,
    event,
    registrations,
    taken: takenBySession(registrations),
    problems: v.ok ? publishProblems(v.value) : [],
    rikma,
    pageHref: eventPath(rikma, event.slug)
  };
};
