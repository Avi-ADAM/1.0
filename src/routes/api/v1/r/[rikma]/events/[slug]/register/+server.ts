import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { resolveRikmaFromPath } from '$lib/server/apiPublic/rikmaPath.js';
import { strapiRun } from '$lib/server/apiPublic/catalog.js';
import { checkRateLimit, clientIpOf } from '$lib/server/apiPublic/http.js';
import { EVENT_SLUG_RE } from '$lib/events/validate';
import { eventRun, eventsLive, loadEventBySlug } from '$lib/server/events/store';
import { adminToken } from '$lib/server/adminToken.js';

/**
 * `POST /api/v1/r/{rikma}/events/{slug}/register` — a visitor registers for a
 * date of a published event (docs/inprogress/PLAN_EVENTS_WEBINARS.md §4.1).
 *
 * Anonymous, from the event page on this site — so the same defences as a
 * public lead form (PLAN_LEADS §5.2): a per-IP limit, a honeypot that answers
 * a bot as if it had worked, and an answer that tells nothing about anyone
 * else's registration. Answered in place, never redirected.
 *
 * The write itself is the `registerForEvent` action (serviceAdmin only), run
 * here with the service token: the visitor has no account.
 */

const PER_IP_PER_HOUR = 10;
const MAX_BODY = 16_000;

const STATUS_OF: Record<string, number> = {
  VALIDATION_FAILED: 400,
  SESSION_REQUIRED: 400,
  SESSION_CLOSED: 409,
  NOT_FOUND: 404
};

export const POST: RequestHandler = async ({ params, request, fetch, url, locals }) => {
  const ip = clientIpOf(request);
  if (!checkRateLimit(`event-register:${ip}`, PER_IP_PER_HOUR, 3600_000).allowed) {
    return json({ ok: false, code: 'RATE_LIMITED', problem: 'rateLimited' }, { status: 429 });
  }

  const slug = String(params.slug ?? '').toLowerCase();
  if (!EVENT_SLUG_RE.test(slug)) return json({ ok: false, code: 'NOT_FOUND', problem: 'notFound' }, { status: 404 });

  const raw = await request.text();
  if (raw.length > MAX_BODY) return json({ ok: false, code: 'TOO_LARGE', problem: 'error' }, { status: 413 });
  let body: any;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ ok: false, code: 'BAD_JSON', problem: 'error' }, { status: 400 });
  }

  // A filled honeypot is a bot: tell it that it worked, and store nothing.
  if (typeof body?.website === 'string' && body.website.trim() !== '') {
    return json({ ok: true, token: null, status: 'registered' }, { status: 201 });
  }

  const resolved = await resolveRikmaFromPath(params.rikma, strapiRun(fetch), { move: false });
  if (resolved.kind !== 'ok') return json({ ok: false, code: 'NOT_FOUND', problem: 'notFound' }, { status: 404 });

  const run = eventRun(fetch);
  if (!(await eventsLive(run))) return json({ ok: false, code: 'UNAVAILABLE', problem: 'error' }, { status: 503 });
  const event = await loadEventBySlug(run, resolved.projectId, slug);
  if (!event || event.status !== 'published' || event.archived) {
    return json({ ok: false, code: 'NOT_FOUND', problem: 'notFound' }, { status: 404 });
  }

  const { actionService } = await import('$lib/server/actions/index.js');
  const res: any = await actionService.executeAction(
    'registerForEvent',
    {
      projectId: resolved.projectId,
      eventId: event.id,
      registration: {
        name: body?.name,
        email: body?.email,
        phone: body?.phone,
        sessionKey: body?.sessionKey,
        answers: body?.answers,
        consent: body?.consent === true,
        lang: body?.lang ?? (locals as any).lang,
        sourceUrl: body?.sourceUrl,
        ref: body?.ref,
        utm: body?.utm
      },
      origin: url.origin
    },
    { userId: '', jwt: adminToken(), lang: (locals as any).lang ?? 'he', fetch }
  );

  if (!res?.success) {
    const code = String(res?.error?.code ?? 'ERROR');
    const problem = res?.error?.details?.problem ?? (code === 'SESSION_CLOSED' ? 'sessionClosed' : code === 'SESSION_REQUIRED' ? 'session' : 'error');
    if (!STATUS_OF[code]) console.error('[events/register] failed:', res?.error);
    return json({ ok: false, code, problem }, { status: STATUS_OF[code] ?? 500 });
  }
  const d = res.data ?? {};
  return json({ ok: true, token: d.token, status: d.status }, { status: d.duplicated ? 200 : 201 });
};
