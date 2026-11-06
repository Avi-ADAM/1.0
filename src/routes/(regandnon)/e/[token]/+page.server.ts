import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { eventRun, eventsLive, loadByToken } from '$lib/server/events/store';
import { eventPath } from '$lib/events/model';
import { sessionPhase } from '$lib/events/sessions';
import { googleCalendarUrl, outlookCalendarUrl } from '$lib/events/ics';
import { adminToken } from '$lib/server/adminToken.js';

/**
 * "My registration" — the registrant's own page (docs/inprogress/PLAN_EVENTS_WEBINARS.md
 * §4.3). No account: the token in the URL is the key, and every email links
 * here instead of to the room itself. The room link is never in this payload
 * either — "join" is a separate request that opens it only while the session
 * is on (`./join`).
 */
export const load: PageServerLoad = async ({ params, fetch, url, setHeaders }) => {
  setHeaders({ 'cache-control': 'private, no-store', 'x-robots-tag': 'noindex' });
  const run = eventRun(fetch);
  if (!(await eventsLive(run))) error(404, 'Not found');
  const found = await loadByToken(run, params.token);
  if (!found) error(404, 'Not found');
  const { registration, event, projectSlug, projectName } = found;

  const session = event.sessions.find((s) => s.key === registration.sessionKey) ?? null;
  const pageUrl = `${url.origin}/e/${params.token}`;
  const calendar = session
    ? {
        google: googleCalendarUrl({ title: event.title, description: event.tagline, startsAt: session.startsAt, durationMin: session.durationMin, url: pageUrl }),
        outlook: outlookCalendarUrl({ title: event.title, description: event.tagline, startsAt: session.startsAt, durationMin: session.durationMin, url: pageUrl })
      }
    : null;

  return {
    token: params.token,
    justRegistered: url.searchParams.get('new') === '1',
    registration: {
      name: registration.name,
      status: registration.status,
      joinedAt: registration.joinedAt
    },
    event: {
      title: event.title,
      tagline: event.tagline,
      kind: event.kind,
      afterUrl: event.afterUrl,
      hosts: event.hosts
    },
    session: session
      ? {
          startsAt: session.startsAt,
          durationMin: session.durationMin,
          timezone: session.timezone,
          state: session.state,
          room: session.room,
          recordingUrl: session.recordingUrl,
          phase: sessionPhase(session)
        }
      : null,
    calendar,
    eventUrl: event.projectId ? eventPath({ slug: projectSlug, id: event.projectId }, event.slug) : null,
    rikmaName: projectName
  };
};

export const actions: Actions = {
  cancel: async ({ params, fetch, locals }) => {
    const { actionService } = await import('$lib/server/actions/index.js');
    const res: any = await actionService.executeAction(
      'cancelEventRegistration',
      { token: params.token },
      { userId: '', jwt: adminToken(), lang: (locals as any).lang ?? 'he', fetch }
    );
    if (!res?.success) return fail(res?.error?.code === 'NOT_FOUND' ? 404 : 500, { problem: 'error' });
    return { cancelled: true };
  }
};
