/**
 * Rikma events — webinars, workshops, open meetings
 * (docs/inprogress/PLAN_EVENTS_WEBINARS.md W2).
 *
 *  - saveEvent           a member writes the event (a draft, or edits a public one)
 *  - proposeEvent        a member asks to publish it — directly in a rikma of
 *                        one, otherwise through a `kind: 'event'` Decision
 *  - registerForEvent    a visitor registers (server only — the public endpoint)
 *  - cancelEventRegistration / joinEventSession   the registrant, by token
 *
 * Every Strapi call runs on the service token (the event qids are
 * serviceAdmin-only: a session carries the join link, a registration a
 * person's contact). The member actions pass `projectMember` first; the
 * registrant actions are `access: ['serviceAdmin']`, so no browser reaches them
 * through /api/action — only the routes that hold the token or the form.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { ActionError } from '../errors.js';
import { calcDeadlineMs } from './actionUtils.js';
import { scope, scopeList } from '$lib/realtime/scopes.js';
import { noticeSubject } from '$lib/notices/links';
import { publishProblems, validateEventDraft, validateRegistration } from '$lib/events/validate';
import { toEventView } from '$lib/events/model';
import { admissionFor, canRegister, openSessions, sessionPhase, takenBySession } from '$lib/events/sessions';
import {
  eventData,
  eventsLive,
  loadByToken,
  loadEventBySlug,
  loadEventNode,
  loadSeats,
  mergeSessions,
  newRegistrationToken,
  type Run
} from '$lib/server/events/store';
import { setPublished } from '$lib/server/events/publish';
import { guestRoomLink, openSessionRoom } from '$lib/server/events/room';
import { sendConfirmation } from '$lib/server/events/mail';

const serviceRun = (strapi: any, context: any): Run => (qid, vars) => strapi.execute(qid, vars, undefined, context.fetch);

async function requireLive(run: Run) {
  if (!(await eventsLive(run))) {
    throw new ActionError('UNAVAILABLE', 'Events are not available yet on this server (the schema is not deployed)');
  }
}

/** The stored event as the editor's draft — so a proposal re-checks what is actually saved. */
function draftFromNode(node: any) {
  const view = toEventView(node, { withSecrets: true });
  if (!view) return null;
  return validateEventDraft({
    ...view,
    outcomes: view.outcomes.join('\n'),
    audience: view.audience.join('\n'),
    sessions: view.sessions
  });
}

// ─── saveEvent ──────────────────────────────────────────────────────────────

const saveEvent: ActionExecutionHandler = async (params, context, { strapi }) => {
  const run = serviceRun(strapi, context);
  await requireLive(run);
  const projectId = String(params.projectId);
  const eventId = params.eventId ? String(params.eventId) : null;

  const v = validateEventDraft({ ...(params.draft ?? {}), lang: params.draft?.lang ?? context.lang });
  if (v.ok === false) {
    const bad = v as Extract<typeof v, { ok: false }>;
    throw new ActionError('VALIDATION_FAILED', `Invalid event: ${bad.problem}`, { problem: bad.problem, index: bad.index });
  }
  const draft = v.value;

  let stored: any = null;
  if (eventId) {
    stored = await loadEventNode(run, eventId);
    if (!stored || String(stored.attributes?.project?.data?.id ?? '') !== projectId) {
      throw new ActionError('NOT_FOUND', 'No such event in this rikma');
    }
    // What the members are voting on must not change under them.
    if (stored.attributes?.status === 'proposed') {
      throw new ActionError('UNDER_PROPOSAL', 'The event is waiting for the rikma to approve publishing it');
    }
  }

  const same = await loadEventBySlug(run, projectId, draft.slug);
  if (same && same.id !== eventId) throw new ActionError('SLUG_TAKEN', 'Another event of this rikma uses this address');

  const sessions = mergeSessions(draft, stored);
  const hostIds: string[] = stored
    ? ((stored.attributes?.hosts?.data ?? []) as any[]).map((u) => String(u.id))
    : [String(context.userId)];
  const warnings: string[] = [];
  for (const s of sessions) {
    if (s.room === 'meetings' && !s.pgisha) {
      const id = await openSessionRoom(draft.title, hostIds.length ? hostIds : [String(context.userId)], context.fetch);
      if (id) s.pgisha = id;
      else warnings.push('ROOM_NOT_OPENED');
    }
  }

  const data = eventData(draft, sessions);
  let id = eventId;
  if (eventId) {
    const res = await run('eventUpdate', { id: eventId, data });
    if (!res?.data?.updateRikmaEvent?.data?.id) throw new Error(`eventUpdate failed: ${JSON.stringify(res?.errors ?? 'no answer')}`);
  } else {
    const res = await run('eventCreate', {
      data: {
        ...data,
        project: projectId,
        status: 'draft',
        hosts: [String(context.userId)],
        createdByUser: String(context.userId)
      }
    });
    id = res?.data?.createRikmaEvent?.data?.id != null ? String(res.data.createRikmaEvent.data.id) : null;
    if (!id) throw new Error(`eventCreate failed: ${JSON.stringify(res?.errors ?? 'no answer')}`);
  }

  return {
    eventId: id,
    slug: draft.slug,
    status: stored?.attributes?.status ?? 'draft',
    publishProblems: publishProblems(draft),
    warnings
  };
};

export const saveEventConfig: ActionConfig = {
  key: 'saveEvent',
  description: "Create or edit a rikma event (webinar, workshop, open meeting) — its page, dates and registration form",
  graphqlOperation: saveEvent,
  paramSchema: {
    projectId: { type: 'string', required: true, description: 'The rikma' },
    eventId: { type: 'string', required: false, description: 'The event to edit; omitted ⇒ a new draft' },
    draft: { type: 'object', required: true, description: 'The event as the editor holds it ($lib/events/validate)' }
  },
  access: ['user', 'serviceAdmin'],
  authRules: [
    { type: 'jwt', errorMessage: 'You must be logged in' },
    { type: 'projectMember', config: { projectIdParam: 'projectId' }, errorMessage: 'Only members of the rikma edit its events' }
  ],
  updateStrategy: { type: 'none' },
  realtime: { scopes: (p) => scopeList([scope('project', p.projectId)]) }
};

// ─── proposeEvent ───────────────────────────────────────────────────────────

const proposeEvent: ActionExecutionHandler = async (params, context, { strapi }) => {
  const run = serviceRun(strapi, context);
  await requireLive(run);
  const projectId = String(params.projectId);
  const eventId = String(params.eventId);

  const node = await loadEventNode(run, eventId);
  if (!node || String(node.attributes?.project?.data?.id ?? '') !== projectId) {
    throw new ActionError('NOT_FOUND', 'No such event in this rikma');
  }
  const status = node.attributes?.status;
  if (status === 'published') return { published: true, decisionId: null, unchanged: true };
  if (status === 'proposed') throw new ActionError('UNDER_PROPOSAL', 'A proposal to publish this event is already open');

  const v = draftFromNode(node);
  if (!v || v.ok === false) throw new ActionError('VALIDATION_FAILED', 'The saved event is not valid');
  const problems = publishProblems(v.value);
  if (problems.length) throw new ActionError('NOT_READY', `Not ready to publish: ${problems.join(', ')}`, { problems });

  const base = await strapi.execute('getProjectBaseInfo', { pid: projectId }, undefined, context.fetch);
  const attrs = base?.data?.project?.data?.attributes;
  if (!attrs) throw new ActionError('NOT_FOUND', 'No such rikma');
  const memberCount: number = attrs.user_1s?.data?.length ?? 1;

  if (memberCount <= 1) {
    await setPublished(run, eventId);
    return { published: true, decisionId: null };
  }

  const now = new Date();
  const deadline = new Date(now.getTime() + calcDeadlineMs(attrs.restime ?? 'feh')).toISOString();
  const res = await strapi.execute(
    'eventCreateDecision',
    {
      projectIds: [projectId],
      publishedAt: now.toISOString(),
      decisionName: String(node.attributes?.title ?? 'event').slice(0, 200),
      eventId,
      vots: [{ what: true, users_permissions_user: String(context.userId) }]
    },
    // The service token: the decision links to a rikma-event, a collection the
    // Authenticated role is never granted (every event read is service-side).
    // The proposer is on the decision as its first yes vote.
    undefined,
    context.fetch
  );
  const decisionId = res?.data?.createDecision?.data?.id;
  if (!decisionId) throw new Error(`Could not open the publish proposal: ${JSON.stringify(res?.errors ?? 'no answer')}`);
  await strapi.execute('32createTimeGrama', { whatami: 'decision', decision: decisionId, date: deadline }, context.jwt, context.fetch);
  await run('eventUpdate', { id: eventId, data: { status: 'proposed', decision: String(decisionId) } });

  return { published: false, decisionId: String(decisionId), deadline };
};

export const proposeEventConfig: ActionConfig = {
  key: 'proposeEvent',
  description:
    "Publish a rikma event's page. Applied directly in a one-member rikma; otherwise opens an 'event' Decision that matures on consent or restime silence.",
  graphqlOperation: proposeEvent,
  paramSchema: {
    projectId: { type: 'string', required: true, description: 'The rikma' },
    eventId: { type: 'string', required: true, description: 'The event' }
  },
  access: ['user', 'serviceAdmin'],
  authRules: [
    { type: 'jwt', errorMessage: 'You must be logged in' },
    { type: 'projectMember', config: { projectIdParam: 'projectId' }, errorMessage: 'Only members of the rikma publish its events' }
  ],
  notification: {
    recipients: { type: 'projectMembers', config: { projectIdParam: 'projectId', excludeSender: true } },
    templates: {
      title: {
        he: 'הצעה לפרסם אירוע של הרקמה',
        en: 'A proposal to publish a rikma event',
        ar: 'اقتراح لنشر فعالية للريكما',
        ru: 'Предложение опубликовать событие рикмы',
        es: 'Una propuesta para publicar un evento de la rikma'
      },
      body: {
        he: 'אחד החברים הציע לפרסם דף אירוע בשם הרקמה — אפשר לראות ולאשר בלב',
        en: "A member proposed publishing an event page on the rikma's behalf — see it and approve in your heart",
        ar: 'اقترح أحد الأعضاء نشر صفحة فعالية باسم الريكما — شاهدها ووافق عليها في القلب',
        ru: 'Участник предложил опубликовать страницу события от имени рикмы — посмотрите и одобрите в сердце',
        es: 'Un miembro propuso publicar una página de evento en nombre de la rikma: mírala y apruébala en tu corazón'
      }
    },
    intent: (_p, r) => (r?.decisionId || r?.data?.decisionId ? 'consent' : 'ambient'),
    subject: (p, r) => {
      const id = r?.decisionId ?? r?.data?.decisionId;
      return id ? noticeSubject('decision', id, p.projectId, 'hachla') : null;
    },
    metadata: { type: 'base', url: '/moach/{{projectId}}/votes' }
  },
  updateStrategy: { type: 'none' },
  realtime: { scopes: (p) => scopeList([scope('project', p.projectId)]) }
};

// ─── registerForEvent ───────────────────────────────────────────────────────

const registerForEvent: ActionExecutionHandler = async (params, context, { strapi }) => {
  const run = serviceRun(strapi, context);
  const projectId = String(params.projectId);
  const node = await loadEventNode(run, String(params.eventId));
  const event = toEventView(node, { withSecrets: true });
  if (!event || event.projectId !== projectId || event.status !== 'published' || event.archived) {
    throw new ActionError('NOT_FOUND', 'No such event');
  }

  const v = validateRegistration(params.registration ?? {}, event.form);
  if (v.ok === false) {
    const bad = v as Extract<typeof v, { ok: false }>;
    throw new ActionError('VALIDATION_FAILED', `Invalid registration: ${bad.problem}`, { problem: bad.problem, field: bad.field });
  }
  const reg = v.value;

  const open = openSessions(event.sessions);
  let session = reg.sessionKey ? event.sessions.find((s) => s.key === reg.sessionKey) ?? null : null;
  if (reg.sessionKey && (!session || !canRegister(session))) {
    throw new ActionError('SESSION_CLOSED', 'This date is no longer open for registration');
  }
  // No date picked while dates are open ⇒ the form must say which. No open
  // date at all ⇒ "tell me about the next one": a waiting-list row with no date.
  if (!session && open.length > 0) throw new ActionError('SESSION_REQUIRED', 'Pick a date');

  // The same person for the same date again: the first row, the email again.
  const dup = await run('eventRegistrationFind', { eid: event.id, email: reg.email });
  const existing = ((dup?.data?.eventRegistrations?.data ?? []) as any[]).find(
    (r) => (r?.attributes?.sessionKey ?? null) === (session?.key ?? null) && r?.attributes?.status !== 'cancelled'
  );

  let registrationId: string;
  let token: string;
  let status: string;
  let duplicated = false;
  if (existing) {
    registrationId = String(existing.id);
    token = String(existing.attributes.token);
    status = String(existing.attributes.status);
    duplicated = true;
  } else {
    status = session ? admissionFor(session, takenBySession(await loadSeats(run, event.id))[session.key] ?? 0) : 'waitlist';
    token = newRegistrationToken();
    const now = new Date().toISOString();
    const created = await run('eventRegistrationCreate', {
      data: {
        event: event.id,
        project: projectId,
        sessionKey: session?.key ?? null,
        name: reg.name,
        email: reg.email,
        phone: reg.phone,
        answers: reg.answers,
        token,
        status,
        sent: {},
        consentText: event.consentText,
        consentAt: now,
        utm: reg.utm,
        sourceUrl: reg.sourceUrl,
        ref: reg.ref,
        lang: reg.lang ?? context.lang ?? null
      }
    });
    const id = created?.data?.createEventRegistration?.data?.id;
    // The only step whose failure fails the request (§1.2).
    if (!id) throw new Error(`eventRegistrationCreate failed: ${JSON.stringify(created?.errors ?? 'no answer')}`);
    registrationId = String(id);
  }

  const warnings: string[] = [];

  // The person is a lead of the rikma (§1.1). createLead runs as a host — a
  // member, as its projectMember rule needs — on the service token, and
  // opens no task: the event itself is the work.
  if (!duplicated) {
    const hostId = event.hosts[0]?.id;
    if (hostId) {
      try {
        const { actionService } = await import('../index.js');
        const details: Record<string, string | number | boolean> = { event: event.slug };
        if (session) details.session = session.startsAt;
        for (const [k, val] of Object.entries(reg.answers)) details[`q_${k}`] = val;
        const lead: any = await actionService.executeAction(
          'createLead',
          {
            projectId,
            name: reg.name,
            email: reg.email,
            ...(reg.phone ? { phone: reg.phone } : {}),
            details,
            source: 'event',
            sourceLabel: event.title.slice(0, 200),
            ...(reg.sourceUrl ? { sourceUrl: reg.sourceUrl } : {}),
            ...(reg.utm ? { utm: reg.utm } : {}),
            externalId: `event-registration:${registrationId}`,
            consent: { text: event.consentText ?? 'Registered for a rikma event', at: new Date().toISOString() },
            lang: reg.lang ?? 'he',
            openTask: false
          },
          { userId: hostId, jwt: context.jwt, lang: context.lang ?? 'he', fetch: context.fetch }
        );
        const leadId = lead?.data?.leadId;
        if (lead?.success && leadId) await run('eventRegistrationUpdate', { id: registrationId, data: { lead: String(leadId) } });
        else warnings.push(`lead:${lead?.error?.code ?? 'error'}`);
      } catch (e) {
        console.warn('[registerForEvent] lead not recorded for registration', registrationId, e);
        warnings.push('lead:error');
      }
    } else {
      warnings.push('lead:noHost');
    }
  }

  // The confirmation, with the calendar file. A failure is a warning: the
  // registrant already sees their page, which has everything the mail has.
  if (session && params.origin) {
    const pageUrl = `${String(params.origin).replace(/\/+$/, '')}/e/${token}`;
    const sent = await sendConfirmation(reg.email, {
      event,
      session,
      name: reg.name,
      lang: reg.lang,
      pageUrl,
      waitlist: status === 'waitlist',
      registrationId
    });
    if (sent.ok) {
      await run('eventRegistrationUpdate', { id: registrationId, data: { sent: { confirm: new Date().toISOString() } } }).catch(() => null);
    } else {
      warnings.push('mail:failed');
    }
  }

  return { registrationId, token, status, duplicated, warnings };
};

export const registerForEventConfig: ActionConfig = {
  key: 'registerForEvent',
  description: 'Register a visitor for a date of a published rikma event (server only — the public registration endpoint)',
  graphqlOperation: registerForEvent,
  paramSchema: {
    projectId: { type: 'string', required: true, description: 'The rikma' },
    eventId: { type: 'string', required: true, description: 'The event' },
    registration: { type: 'object', required: true, description: 'name, email, phone?, sessionKey, answers, consent, lang, sourceUrl, ref, utm' },
    origin: { type: 'string', required: false, description: 'This site’s origin, for the links in the email' }
  },
  access: ['serviceAdmin'],
  authRules: [],
  updateStrategy: { type: 'none' },
  realtime: { scopes: (p) => scopeList([scope('project', p.projectId)]) }
};

// ─── the registrant, by token ───────────────────────────────────────────────

const cancelEventRegistration: ActionExecutionHandler = async (params, context, { strapi }) => {
  const run = serviceRun(strapi, context);
  const found = await loadByToken(run, String(params.token ?? ''));
  if (!found) throw new ActionError('NOT_FOUND', 'No such registration');
  if (found.registration.status === 'cancelled') return { status: 'cancelled', unchanged: true, projectId: found.event.projectId };
  await run('eventRegistrationUpdate', { id: found.registration.id, data: { status: 'cancelled' } });
  return { status: 'cancelled', projectId: found.event.projectId };
};

export const cancelEventRegistrationConfig: ActionConfig = {
  key: 'cancelEventRegistration',
  description: "Cancel a registration to a rikma event, by the registrant's own token",
  graphqlOperation: cancelEventRegistration,
  paramSchema: { token: { type: 'string', required: true, description: "The registrant's token" } },
  access: ['serviceAdmin'],
  authRules: [],
  updateStrategy: { type: 'none' },
  realtime: { scopes: (_p, r) => scopeList([scope('project', r?.projectId ?? r?.data?.projectId)]) }
};

/**
 * The "join" button: where the registrant goes now, and that they came.
 * Before the window opens, or for a cancelled row, it answers without a link.
 */
const joinEventSession: ActionExecutionHandler = async (params, context, { strapi }) => {
  const run = serviceRun(strapi, context);
  const found = await loadByToken(run, String(params.token ?? ''));
  if (!found) throw new ActionError('NOT_FOUND', 'No such registration');
  const { registration, event } = found;
  if (registration.status === 'cancelled' || registration.status === 'waitlist') {
    return { url: null, reason: registration.status, projectId: event.projectId };
  }
  const session = event.sessions.find((s) => s.key === registration.sessionKey);
  if (!session) return { url: null, reason: 'noSession', projectId: event.projectId };
  const phase = sessionPhase(session);
  if (phase !== 'joinable') return { url: null, reason: phase, projectId: event.projectId };

  const url =
    session.room === 'meetings'
      ? session.pgishaId
        ? guestRoomLink(session.pgishaId, registration.email, event.title)
        : null
      : session.externalUrl ?? null;
  if (!url) return { url: null, reason: 'roomNotReady', projectId: event.projectId };

  if (!registration.joinedAt) {
    await run('eventRegistrationUpdate', {
      id: registration.id,
      data: { joinedAt: new Date().toISOString(), status: 'attended' }
    }).catch((e) => console.warn('[joinEventSession] could not mark attendance', e));
  }
  return { url, reason: null, projectId: event.projectId };
};

export const joinEventSessionConfig: ActionConfig = {
  key: 'joinEventSession',
  description: "The registrant's way into the room: records attendance and returns the link while the session is on",
  graphqlOperation: joinEventSession,
  paramSchema: { token: { type: 'string', required: true, description: "The registrant's token" } },
  access: ['serviceAdmin'],
  authRules: [],
  updateStrategy: { type: 'none' },
  realtime: { scopes: (_p, r) => scopeList([scope('project', r?.projectId ?? r?.data?.projectId)]) }
};
