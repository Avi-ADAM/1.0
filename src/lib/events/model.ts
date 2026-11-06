/**
 * Rikma events — webinars, workshops, open meetings
 * (docs/inprogress/PLAN_EVENTS_WEBINARS.md). Pure: shared by the public page, the
 * registration action, the member editor and the tests.
 *
 * A Strapi row becomes an `EventView` here and nowhere else, so no screen
 * reads `attributes.x.data`. The view has two shapes on purpose: the public
 * one never carries a session's `externalUrl` (§1.4 — the join link travels
 * only by email and through the registrant's own `/e/<token>` page).
 */

export const EVENT_KINDS = ['webinar', 'workshop', 'meetup', 'openHouse'] as const;
export type EventKind = (typeof EVENT_KINDS)[number];

export const EVENT_STATUSES = ['draft', 'proposed', 'published', 'closed'] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const ROOMS = ['external', 'meetings'] as const;
export type Room = (typeof ROOMS)[number];

export const SESSION_STATES = ['open', 'full', 'cancelled', 'done'] as const;
export type SessionState = (typeof SESSION_STATES)[number];

export const REGISTRATION_STATUSES = ['registered', 'waitlist', 'cancelled', 'attended', 'noShow'] as const;
export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];

export interface AgendaItem {
  minutes: number | null;
  title: string;
  desc: string | null;
}

export interface FaqItem {
  q: string;
  a: string;
}

/** An extra question on the registration form (§4.2). */
export interface FormField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'checkbox';
  options?: string[];
  required?: boolean;
}

export interface SessionView {
  key: string;
  startsAt: string;
  durationMin: number;
  timezone: string;
  capacity: number | null;
  room: Room;
  state: SessionState;
  recordingUrl: string | null;
  /** Only in the member / registrant shape — never on the public page. */
  externalUrl?: string | null;
  pgishaId?: string | null;
}

export interface HostView {
  id: string;
  name: string;
  pic: string | null;
}

export interface EventView {
  id: string;
  projectId: string | null;
  slug: string;
  kind: EventKind;
  title: string;
  tagline: string | null;
  description: string | null;
  outcomes: string[];
  audience: string[];
  agenda: AgendaItem[];
  faq: FaqItem[];
  sessions: SessionView[];
  cover: string | null;
  hosts: HostView[];
  form: FormField[];
  consentText: string | null;
  afterUrl: string | null;
  status: EventStatus;
  decisionId: string | null;
  archived: boolean;
  lang: string | null;
}

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);
const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const oneOf = <T extends string>(list: readonly T[], v: unknown, fallback: T): T =>
  (list as readonly string[]).includes(String(v)) ? (v as T) : fallback;

/** One line per item; blank lines dropped. The editor writes them the same way. */
export function lines(v: unknown): string[] {
  return String(v ?? '')
    .split('\n')
    .map((l) => l.replace(/^\s*[-•*]\s*/, '').trim())
    .filter(Boolean);
}

/** The form definition as stored (json), cleaned — anything malformed is dropped, not trusted. */
export function parseForm(raw: unknown): FormField[] {
  const list = Array.isArray(raw) ? raw : [];
  const out: FormField[] = [];
  const seen = new Set<string>();
  for (const f of list) {
    const key = str(f?.key);
    const label = str(f?.label);
    if (!key || !label || !/^[a-z][a-zA-Z0-9_]{0,31}$/.test(key) || seen.has(key)) continue;
    const type = f?.type === 'select' || f?.type === 'checkbox' ? f.type : 'text';
    const field: FormField = { key, label: label.slice(0, 200), type };
    if (type === 'select') {
      const options = (Array.isArray(f?.options) ? f.options : []).map(str).filter((o: string | null): o is string => !!o);
      if (options.length === 0) continue;
      field.options = options.slice(0, 20).map((o: string) => o.slice(0, 100));
    }
    if (f?.required === true) field.required = true;
    seen.add(key);
    out.push(field);
    if (out.length >= MAX_FORM_FIELDS) break;
  }
  return out;
}

export const MAX_FORM_FIELDS = 5;

export function toSessionView(s: any, withSecrets: boolean): SessionView | null {
  const key = str(s?.key);
  const startsAt = str(s?.startsAt);
  if (!key || !startsAt || Number.isNaN(Date.parse(startsAt))) return null;
  const view: SessionView = {
    key,
    startsAt,
    durationMin: num(s?.durationMin) ?? 60,
    timezone: str(s?.timezone) ?? 'Asia/Jerusalem',
    capacity: num(s?.capacity),
    room: oneOf(ROOMS, s?.room, 'external'),
    state: oneOf(SESSION_STATES, s?.state, 'open'),
    recordingUrl: str(s?.recordingUrl)
  };
  if (withSecrets) {
    view.externalUrl = str(s?.externalUrl);
    view.pgishaId = s?.pgisha?.data?.id != null ? String(s.pgisha.data.id) : null;
  }
  return view;
}

/**
 * A Strapi `rikmaEvent` node → the view.
 *
 * @param withSecrets include each session's join link and room — only for a
 *   member of the rikma or for the registrant's own page.
 */
export function toEventView(node: any, { withSecrets = false } = {}): EventView | null {
  const a = node?.attributes;
  if (!a || node?.id == null) return null;
  const sessions = ((a.sessions ?? []) as any[])
    .map((s) => toSessionView(s, withSecrets))
    .filter((s): s is SessionView => !!s)
    .sort((x, y) => Date.parse(x.startsAt) - Date.parse(y.startsAt));
  return {
    id: String(node.id),
    projectId: a.project?.data?.id != null ? String(a.project.data.id) : null,
    slug: str(a.slug) ?? String(node.id),
    kind: oneOf(EVENT_KINDS, a.kind, 'webinar'),
    title: str(a.title) ?? '',
    tagline: str(a.tagline),
    description: str(a.description),
    outcomes: lines(a.outcomes),
    audience: lines(a.audience),
    agenda: ((a.agenda ?? []) as any[])
      .map((i) => ({ minutes: num(i?.minutes), title: str(i?.title) ?? '', desc: str(i?.desc) }))
      .filter((i) => i.title),
    faq: ((a.faq ?? []) as any[]).map((i) => ({ q: str(i?.q) ?? '', a: str(i?.a) ?? '' })).filter((i) => i.q && i.a),
    sessions,
    cover: str(a.cover?.data?.attributes?.url),
    hosts: ((a.hosts?.data ?? []) as any[]).map((u) => ({
      id: String(u.id),
      name: str(u?.attributes?.username) ?? '',
      pic: str(u?.attributes?.profilePic?.data?.attributes?.formats?.thumbnail?.url) ?? str(u?.attributes?.profilePic?.data?.attributes?.url)
    })),
    form: parseForm(a.form),
    consentText: str(a.consentText),
    afterUrl: str(a.afterUrl),
    status: oneOf(EVENT_STATUSES, a.status, 'draft'),
    decisionId: a.decision?.data?.id != null ? String(a.decision.data.id) : null,
    archived: a.lifecycle === 'archived' || a.lifecycle === 'released',
    lang: str(a.lang)
  };
}

export interface RegistrationView {
  id: string;
  eventId: string | null;
  sessionKey: string | null;
  name: string;
  email: string;
  phone: string | null;
  answers: Record<string, string | boolean>;
  status: RegistrationStatus;
  joinedAt: string | null;
  createdAt: string | null;
  leadId: string | null;
  lang: string | null;
}

export function toRegistrationView(node: any): RegistrationView | null {
  const a = node?.attributes;
  if (!a || node?.id == null) return null;
  const answers: Record<string, string | boolean> = {};
  if (a.answers && typeof a.answers === 'object' && !Array.isArray(a.answers)) {
    for (const [k, v] of Object.entries(a.answers)) {
      if (typeof v === 'string' || typeof v === 'boolean') answers[k] = v;
    }
  }
  return {
    id: String(node.id),
    eventId: a.event?.data?.id != null ? String(a.event.data.id) : null,
    sessionKey: str(a.sessionKey),
    name: str(a.name) ?? '',
    email: str(a.email) ?? '',
    phone: str(a.phone),
    answers,
    status: oneOf(REGISTRATION_STATUSES, a.status, 'registered'),
    joinedAt: str(a.joinedAt),
    createdAt: str(a.createdAt),
    leadId: a.lead?.data?.id != null ? String(a.lead.data.id) : null,
    lang: str(a.lang)
  };
}

/**
 * An event's public page: `/r/<rikma>/e/<event>`. A rikma with no address yet
 * is reached by its id there too (`resolveRikmaFromPath` takes both).
 */
export function eventPath(rikma: { slug?: string | null; id: string | number }, eventSlug: string): string {
  return `/r/${encodeURIComponent(String(rikma.slug || rikma.id))}/e/${encodeURIComponent(eventSlug)}`;
}
