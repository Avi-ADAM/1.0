/**
 * What a member may save as an event, and what a visitor may send as a
 * registration (docs/inprogress/PLAN_EVENTS_WEBINARS.md §2, §4). Pure — the action
 * re-runs it on the server; the editor runs it to say what is wrong before
 * anything is sent.
 */

import { suggestSlug } from '$lib/rikmaAddress/slug.js';
import { normalizeEmail } from '$lib/leads/dedupe';
import { EVENT_KINDS, MAX_FORM_FIELDS, ROOMS, SESSION_STATES, lines, parseForm, type FormField, type EventKind } from './model';

export const EVENT_LIMITS = Object.freeze({
  title: 160,
  tagline: 240,
  description: 8000,
  listText: 2000,
  agendaItems: 12,
  faqItems: 12,
  sessions: 12,
  consentText: 1000,
  url: 1000,
  name: 120,
  email: 254,
  phone: 40,
  answer: 1000
});

export const EVENT_SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/;

/** An event's address inside its rikma: `/r/<rikma>/e/<slug>`. ASCII, like the rikma's own address. */
export function normalizeEventSlug(raw: unknown): string {
  return String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_.]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');
}

/** A slug for a new event — transliterated from the title, or the kind and the date. */
export function suggestEventSlug(title: string, kind: EventKind, now: Date = new Date()): string {
  const fromTitle = normalizeEventSlug(suggestSlug(title));
  if (fromTitle.length >= 3) return fromTitle.slice(0, 40).replace(/-+$/, '');
  return `${kind.toLowerCase()}-${now.toISOString().slice(0, 10)}`;
}

/** A short stable id for a session; registrations point at it. */
export function newSessionKey(random: () => number = Math.random): string {
  let s = '';
  for (let i = 0; i < 8; i++) s += 'abcdefghijkmnpqrstuvwxyz23456789'[Math.floor(random() * 32)];
  return s;
}

const clip = (v: unknown, max: number): string | null => {
  const s = typeof v === 'string' ? v.trim() : '';
  return s ? s.slice(0, max) : null;
};

export function isHttpUrl(v: unknown): boolean {
  if (typeof v !== 'string' || !v.trim()) return false;
  try {
    const u = new URL(v.trim());
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

/** A link the page may send a person to: http(s), or a path on this site. */
function isSafeLink(v: unknown): boolean {
  if (typeof v !== 'string') return false;
  const s = v.trim();
  return isHttpUrl(s) || (s.startsWith('/') && !s.startsWith('//'));
}

export interface SessionInput {
  key: string;
  startsAt: string;
  durationMin: number;
  timezone: string;
  capacity: number | null;
  room: (typeof ROOMS)[number];
  externalUrl: string | null;
  recordingUrl: string | null;
  state: (typeof SESSION_STATES)[number];
}

export interface EventDraft {
  slug: string;
  kind: EventKind;
  title: string;
  tagline: string | null;
  description: string | null;
  outcomes: string | null;
  audience: string | null;
  agenda: Array<{ minutes: number | null; title: string; desc: string | null }>;
  faq: Array<{ q: string; a: string }>;
  sessions: SessionInput[];
  form: FormField[];
  consentText: string | null;
  afterUrl: string | null;
  lang: string | null;
}

export type DraftProblem =
  | 'title'
  | 'slug'
  | 'kind'
  | 'sessionDate'
  | 'sessionDuration'
  | 'sessionCapacity'
  | 'sessionLink'
  | 'tooManySessions'
  | 'afterUrl'
  | 'recordingUrl';

export type DraftResult = { ok: true; value: EventDraft } | { ok: false; problem: DraftProblem; index?: number };

/**
 * The draft as the member typed it → the shape that is stored. Saving a
 * draft is lenient (no session yet is fine); `publishProblems` is the strict
 * check that runs before an event goes public.
 */
export function validateEventDraft(input: any): DraftResult {
  const title = clip(input?.title, EVENT_LIMITS.title);
  if (!title) return { ok: false, problem: 'title' };
  const kind = (EVENT_KINDS as readonly string[]).includes(input?.kind) ? (input.kind as EventKind) : null;
  if (!kind) return { ok: false, problem: 'kind' };
  const slug = normalizeEventSlug(input?.slug) || suggestEventSlug(title, kind);
  if (!EVENT_SLUG_RE.test(slug)) return { ok: false, problem: 'slug' };

  const rawSessions = Array.isArray(input?.sessions) ? input.sessions : [];
  if (rawSessions.length > EVENT_LIMITS.sessions) return { ok: false, problem: 'tooManySessions' };
  const sessions: SessionInput[] = [];
  const keys = new Set<string>();
  for (let i = 0; i < rawSessions.length; i++) {
    const s = rawSessions[i];
    const startsAt = typeof s?.startsAt === 'string' ? s.startsAt.trim() : '';
    const t = Date.parse(startsAt);
    if (!startsAt || Number.isNaN(t)) return { ok: false, problem: 'sessionDate', index: i };
    const durationMin = Number(s?.durationMin ?? 60);
    if (!Number.isInteger(durationMin) || durationMin < 5 || durationMin > 1440) {
      return { ok: false, problem: 'sessionDuration', index: i };
    }
    const capRaw = s?.capacity;
    const capacity = capRaw === null || capRaw === undefined || capRaw === '' ? null : Number(capRaw);
    if (capacity !== null && (!Number.isInteger(capacity) || capacity < 1 || capacity > 100000)) {
      return { ok: false, problem: 'sessionCapacity', index: i };
    }
    const room = s?.room === 'meetings' ? 'meetings' : 'external';
    const externalUrl = clip(s?.externalUrl, EVENT_LIMITS.url);
    if (externalUrl && !isHttpUrl(externalUrl)) return { ok: false, problem: 'sessionLink', index: i };
    const recordingUrl = clip(s?.recordingUrl, EVENT_LIMITS.url);
    if (recordingUrl && !isHttpUrl(recordingUrl)) return { ok: false, problem: 'recordingUrl', index: i };
    let key = typeof s?.key === 'string' && /^[a-z0-9]{4,16}$/.test(s.key) ? s.key : newSessionKey();
    while (keys.has(key)) key = newSessionKey();
    keys.add(key);
    sessions.push({
      key,
      startsAt: new Date(t).toISOString(),
      durationMin,
      timezone: clip(s?.timezone, 64) ?? 'Asia/Jerusalem',
      capacity,
      room,
      externalUrl,
      recordingUrl,
      state: (SESSION_STATES as readonly string[]).includes(s?.state) ? s.state : 'open'
    });
  }
  sessions.sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));

  const afterUrl = clip(input?.afterUrl, EVENT_LIMITS.url);
  if (afterUrl && !isSafeLink(afterUrl)) return { ok: false, problem: 'afterUrl' };

  const listText = (v: unknown) => {
    const l = lines(v);
    return l.length ? l.join('\n').slice(0, EVENT_LIMITS.listText) : null;
  };

  return {
    ok: true,
    value: {
      slug,
      kind,
      title,
      tagline: clip(input?.tagline, EVENT_LIMITS.tagline),
      description: clip(input?.description, EVENT_LIMITS.description),
      outcomes: listText(input?.outcomes),
      audience: listText(input?.audience),
      agenda: (Array.isArray(input?.agenda) ? input.agenda : [])
        .map((i: any) => ({
          minutes: Number.isFinite(Number(i?.minutes)) && i?.minutes !== '' && i?.minutes != null ? Math.max(0, Math.round(Number(i.minutes))) : null,
          title: clip(i?.title, 200) ?? '',
          desc: clip(i?.desc, 1000)
        }))
        .filter((i: { title: string }) => i.title)
        .slice(0, EVENT_LIMITS.agendaItems),
      faq: (Array.isArray(input?.faq) ? input.faq : [])
        .map((i: any) => ({ q: clip(i?.q, 300) ?? '', a: clip(i?.a, 2000) ?? '' }))
        .filter((i: { q: string; a: string }) => i.q && i.a)
        .slice(0, EVENT_LIMITS.faqItems),
      sessions,
      form: parseForm(input?.form).slice(0, MAX_FORM_FIELDS),
      consentText: clip(input?.consentText, EVENT_LIMITS.consentText),
      afterUrl,
      lang: clip(input?.lang, 8)
    }
  };
}

export type PublishProblem = 'noFutureSession' | 'missingLink' | 'noConsentText';

/**
 * What still stands between a saved draft and a public page. A session in a
 * Zoom-type room needs its link before anyone can be told how to join.
 */
export function publishProblems(draft: EventDraft, now: Date = new Date()): PublishProblem[] {
  const problems: PublishProblem[] = [];
  const future = draft.sessions.filter((s) => s.state !== 'cancelled' && Date.parse(s.startsAt) > now.getTime());
  if (future.length === 0) problems.push('noFutureSession');
  if (future.some((s) => s.room === 'external' && !s.externalUrl)) problems.push('missingLink');
  if (!draft.consentText) problems.push('noConsentText');
  return problems;
}

export interface RegistrationInput {
  name: string;
  email: string;
  phone: string | null;
  sessionKey: string | null;
  answers: Record<string, string | boolean>;
  consent: boolean;
  lang: string | null;
  sourceUrl: string | null;
  ref: string | null;
  utm: Record<string, string> | null;
}

export type RegistrationProblem = 'name' | 'email' | 'phone' | 'consent' | 'answer' | 'session';

export type RegistrationResult =
  | { ok: true; value: RegistrationInput }
  | { ok: false; problem: RegistrationProblem; field?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const UTM_KEYS = ['source', 'medium', 'campaign', 'term', 'content'];

/** A visitor's registration, checked against the event's own form. */
export function validateRegistration(input: any, form: FormField[]): RegistrationResult {
  const name = clip(input?.name, EVENT_LIMITS.name);
  if (!name) return { ok: false, problem: 'name' };
  const email = normalizeEmail(clip(input?.email, EVENT_LIMITS.email));
  if (!email || !EMAIL_RE.test(email)) return { ok: false, problem: 'email' };
  const phone = clip(input?.phone, EVENT_LIMITS.phone);
  if (phone && !/^[+\d][\d\s\-().]{5,}$/.test(phone)) return { ok: false, problem: 'phone' };
  if (input?.consent !== true) return { ok: false, problem: 'consent' };

  const answers: Record<string, string | boolean> = {};
  const raw = input?.answers && typeof input.answers === 'object' ? input.answers : {};
  for (const f of form) {
    const v = raw[f.key];
    if (f.type === 'checkbox') {
      const on = v === true || v === 'true' || v === 'on';
      if (f.required && !on) return { ok: false, problem: 'answer', field: f.key };
      answers[f.key] = on;
      continue;
    }
    const s = clip(v, EVENT_LIMITS.answer);
    if (f.type === 'select' && s && !(f.options ?? []).includes(s)) return { ok: false, problem: 'answer', field: f.key };
    if (f.required && !s) return { ok: false, problem: 'answer', field: f.key };
    if (s) answers[f.key] = s;
  }

  let utm: Record<string, string> | null = null;
  if (input?.utm && typeof input.utm === 'object') {
    for (const k of UTM_KEYS) {
      const v = clip(input.utm[k], 120);
      if (v) (utm ??= {})[k] = v;
    }
  }

  const sessionKey = typeof input?.sessionKey === 'string' && input.sessionKey ? input.sessionKey : null;
  if (sessionKey && !/^[a-z0-9]{4,16}$/.test(sessionKey)) return { ok: false, problem: 'session' };

  return {
    ok: true,
    value: {
      name,
      email,
      phone,
      sessionKey,
      answers,
      consent: true,
      lang: clip(input?.lang, 8),
      sourceUrl: isHttpUrl(input?.sourceUrl) ? String(input.sourceUrl).slice(0, EVENT_LIMITS.url) : null,
      ref: clip(input?.ref, 120),
      utm
    }
  };
}
