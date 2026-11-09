/**
 * Reading and writing rikma events (docs/inprogress/PLAN_EVENTS_WEBINARS.md).
 *
 * Every call runs under the service token: the event qids are serviceAdmin
 * only, because a session row carries the join link and a registration a
 * person's email and phone. A caller must already have checked membership
 * (the moach layout, an action's projectMember rule) or hold the
 * registrant's own token.
 */

import { randomBytes } from 'node:crypto';
import { toEventView, toRegistrationView, type EventView, type RegistrationView } from '$lib/events/model';
import type { EventDraft } from '$lib/events/validate';

type FetchFn = typeof globalThis.fetch;

export type Run = (qid: string, vars: Record<string, unknown>) => Promise<any>;

/**
 * A runner on the service token for loaders and endpoints. The action system
 * is imported lazily: its configs import this module, so a top-level import
 * would be a cycle (the actions' own handlers pass their client instead).
 */
export function eventRun(fetchFn?: FetchFn): Run {
  return async (qid, vars) => {
    const { strapiClient } = await import('$lib/server/actions');
    return strapiClient.execute(qid, vars, undefined, fetchFn);
  };
}

/** 32 random bytes, url-safe — the registrant's key to their own page. */
export function newRegistrationToken(): string {
  return randomBytes(32).toString('base64url');
}

/** True once the collections are deployed. Every screen degrades to "not available yet" until then. */
export async function eventsLive(run: Run): Promise<boolean> {
  try {
    const res = await run('eventsSchemaLive', {});
    return !res?.errors && Array.isArray(res?.data?.rikmaEvents?.data);
  } catch {
    return false;
  }
}

export async function loadEvent(run: Run, eventId: string, opts = { withSecrets: true }): Promise<EventView | null> {
  const res = await run('eventById', { id: String(eventId) });
  return toEventView(res?.data?.rikmaEvent?.data, opts);
}

/** The raw node — the writers need the stored session rows (pgisha, state) to merge into. */
export async function loadEventNode(run: Run, eventId: string): Promise<any | null> {
  const res = await run('eventById', { id: String(eventId) });
  return res?.data?.rikmaEvent?.data ?? null;
}

export async function loadEventBySlug(run: Run, projectId: string, slug: string, opts = { withSecrets: false }) {
  const res = await run('eventBySlug', { pid: String(projectId), slug });
  return toEventView(res?.data?.rikmaEvents?.data?.[0], opts);
}

export async function loadProjectEvents(run: Run, projectId: string, opts = { withSecrets: false }): Promise<EventView[]> {
  const res = await run('eventsOfProject', { pid: String(projectId) });
  return ((res?.data?.rikmaEvents?.data ?? []) as any[])
    .map((n) => toEventView(n, opts))
    .filter((e): e is EventView => !!e);
}

export async function loadSeats(run: Run, eventId: string): Promise<Array<{ sessionKey: string | null; status: string }>> {
  const res = await run('eventSeats', { eid: String(eventId) });
  return ((res?.data?.eventRegistrations?.data ?? []) as any[]).map((r) => ({
    sessionKey: r?.attributes?.sessionKey ?? null,
    status: r?.attributes?.status ?? 'registered'
  }));
}

export async function loadRegistrations(run: Run, eventId: string): Promise<RegistrationView[]> {
  const res = await run('eventRegistrationsOfEvent', { eid: String(eventId) });
  return ((res?.data?.eventRegistrations?.data ?? []) as any[])
    .map(toRegistrationView)
    .filter((r): r is RegistrationView => !!r);
}

export interface TokenRegistration {
  registration: RegistrationView;
  event: EventView;
  projectSlug: string | null;
  projectName: string | null;
}

export async function loadByToken(run: Run, token: string): Promise<TokenRegistration | null> {
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) return null;
  const res = await run('eventRegistrationByToken', { token });
  const node = res?.data?.eventRegistrations?.data?.[0];
  const registration = toRegistrationView(node);
  const eventNode = node?.attributes?.event?.data;
  const event = toEventView(eventNode, { withSecrets: true });
  if (!registration || !event) return null;
  const project = eventNode?.attributes?.project?.data?.attributes;
  return {
    registration,
    event,
    projectSlug: project?.slug ?? null,
    projectName: project?.projectName ?? null
  };
}

/**
 * The stored session rows for a draft: a session keeps what the editor does
 * not own — its meeting room and a state the system set (`done`) — by key.
 */
export function mergeSessions(draft: EventDraft, storedNode: any | null): Array<Record<string, unknown>> {
  const stored = new Map<string, any>();
  for (const s of (storedNode?.attributes?.sessions ?? []) as any[]) if (s?.key) stored.set(s.key, s);
  return draft.sessions.map((s) => {
    const prev = stored.get(s.key);
    const pgisha = prev?.pgisha?.data?.id != null ? String(prev.pgisha.data.id) : null;
    return {
      key: s.key,
      startsAt: s.startsAt,
      durationMin: s.durationMin,
      timezone: s.timezone,
      capacity: s.capacity,
      room: s.room,
      externalUrl: s.externalUrl,
      recordingUrl: s.recordingUrl,
      state: prev?.state === 'done' ? 'done' : s.state,
      ...(pgisha ? { pgisha } : {})
    };
  });
}

/** The event row as Strapi takes it. */
export function eventData(draft: EventDraft, sessions: Array<Record<string, unknown>>): Record<string, unknown> {
  return {
    slug: draft.slug,
    kind: draft.kind,
    title: draft.title,
    tagline: draft.tagline,
    description: draft.description,
    outcomes: draft.outcomes,
    audience: draft.audience,
    agenda: draft.agenda,
    faq: draft.faq,
    sessions,
    form: draft.form,
    consentText: draft.consentText,
    afterUrl: draft.afterUrl,
    lang: draft.lang
  };
}
