import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { strapiClient } from '$lib/server/actions';
import { resolveRikmaFromPath } from '$lib/server/apiPublic/rikmaPath.js';
import { readRikmaIdentity } from '$lib/server/rikmaPublic/loadRikmaPage.js';
import { EVENT_SLUG_RE } from '$lib/events/validate';
import { eventPath } from '$lib/events/model';
import { canRegister, seatsLeft, takenBySession } from '$lib/events/sessions';
import { eventRun, eventsLive, loadEventBySlug, loadSeats } from '$lib/server/events/store';

/**
 * A rikma event's landing page (docs/inprogress/PLAN_EVENTS_WEBINARS.md §3).
 *
 * Public, server-rendered, in the rikma's look. The event is read with the
 * service token and handed to the page through `toEventView` *without*
 * secrets, so no session's join link is ever in this payload (§1.4).
 *
 * A draft or a proposal is shown to the rikma's members only — that is how
 * they read the page they are asked to approve; anyone else gets a 404.
 */
export const load: PageServerLoad = async ({ params, locals, fetch, url }) => {
  const eventSlug = String(params.event ?? '').toLowerCase();
  if (!EVENT_SLUG_RE.test(eventSlug)) error(404, 'Not found');

  const resolved = await resolveRikmaFromPath(params.slug, (qid, vars) => strapiClient.execute(qid, vars), {
    search: url.search,
    address: ({ slug, projectId }) => eventPath({ slug, id: projectId }, eventSlug)
  });
  if (resolved.kind === 'notFound') error(404, 'Not found');
  if (resolved.kind === 'redirect') redirect(301, resolved.location);
  const projectId = resolved.projectId;

  const run = eventRun(fetch);
  if (!(await eventsLive(run))) error(404, 'Not found');

  const event = await loadEventBySlug(run, projectId, eventSlug, { withSecrets: false });
  if (!event || event.archived) error(404, 'Not found');

  const uid = (locals as any).uid ? String((locals as any).uid) : null;
  let isMember = false;
  let projectName = '';
  const base = await strapiClient.execute('getProjectBaseInfo', { pid: projectId }, undefined, fetch).catch(() => null);
  const attrs = base?.data?.project?.data?.attributes;
  projectName = attrs?.projectName ?? '';
  if (uid) isMember = ((attrs?.user_1s?.data ?? []) as any[]).some((u) => String(u.id) === uid);

  const isPublic = event.status === 'published' || event.status === 'closed';
  if (!isPublic && !isMember) error(404, 'Not found');

  const identity = await readRikmaIdentity(projectId);
  const taken = takenBySession(await loadSeats(run, event.id).catch(() => []));
  const sessions = event.sessions
    .filter((s) => s.state !== 'cancelled')
    .map((s) => ({
      ...s,
      open: canRegister(s),
      seatsLeft: seatsLeft(s, taken[s.key] ?? 0),
      taken: taken[s.key] ?? 0
    }));

  return {
    event,
    sessions,
    totalRegistered: Object.values(taken).reduce((a, b) => a + b, 0),
    rikma: { id: projectId, slug: identity?.slug ?? null, name: projectName },
    look: identity?.look ?? null,
    preview: !isPublic,
    isMember,
    registerUrl: `/api/v1/r/${encodeURIComponent(identity?.slug ?? projectId)}/events/${encodeURIComponent(event.slug)}/register`,
    canonical: `${url.origin}${eventPath({ slug: identity?.slug, id: projectId }, event.slug)}`
  };
};
