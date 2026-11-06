/**
 * Which email a registration is owed right now
 * (docs/inprogress/PLAN_EVENTS_WEBINARS.md §5.2, W3). Pure — the cron asks it
 * once per registration per run and sends at most one mail, the most urgent.
 *
 * `registration.sent` is the memory that makes this idempotent:
 *
 *   confirm      when the confirmation went out
 *   confirmedAs  'registered' | 'waitlist' — what that confirmation said
 *   startsAt     the session time the registrant was last told
 *   seq          the calendar SEQUENCE they hold (bumped on every move)
 *   d1 h1 live after cancelled   when each of those went out
 *   offered      session keys a "notify me" row was already told about
 *
 * A mail is *claimed* (the patch is written) before it is sent, so two runs
 * that overlap cannot both send it. A claim whose send then fails is lost, on
 * purpose: one missing reminder is better than a reminder sent twice a minute.
 */

import { JOIN_OPENS_MIN, sessionEndsAt } from './sessions';

export type MailKind =
  | 'cancelled'
  | 'moved'
  | 'promoted'
  | 'confirm'
  | 'live'
  | 'h1'
  | 'd1'
  | 'thanks'
  | 'missed'
  | 'newDate';

export interface SentLog {
  confirm?: string;
  confirmedAs?: 'registered' | 'waitlist';
  startsAt?: string;
  seq?: number;
  d1?: string | null;
  h1?: string | null;
  live?: string;
  after?: string;
  cancelled?: string;
  offered?: string[];
}

export interface PlanRegistration {
  status: string;
  sessionKey: string | null;
  joinedAt: string | null;
  createdAt: string | null;
  sent: SentLog;
}

export interface PlanSession {
  key: string;
  startsAt: string;
  durationMin: number;
  state: string;
}

export interface PlannedMail {
  kind: MailKind;
  /** Merged into `registration.sent` (the claim). */
  sent: SentLog;
  /** A status the registration moves to with this mail (`noShow`). */
  status?: string;
}

const MIN = 60_000;
const HOUR = 60 * MIN;

/** Windows, wide enough that a run every 5–10 minutes never misses one. */
export const WINDOWS = Object.freeze({
  /** "Tomorrow": from 26h to 3h before the start. */
  d1: [26 * HOUR, 3 * HOUR] as const,
  /** "In an hour": from 75 to 10 minutes before. */
  h1: [75 * MIN, 10 * MIN] as const,
  /** "We've started": from the start to 20 minutes in, only to who has not walked in. */
  liveUntil: 20 * MIN,
  /** After: from an hour after the end, for three days. */
  afterFrom: 1 * HOUR,
  afterUntil: 3 * 24 * HOUR
});

export function parseSent(raw: unknown): SentLog {
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as SentLog) : {};
}

const HOLDING = new Set(['registered', 'attended']);

/**
 * The one mail due for a registration of a dated session, or null.
 * `notifyMe` rows (no session) go through `planNewDate` instead.
 */
export function planMail(reg: PlanRegistration, session: PlanSession, now: Date = new Date()): PlannedMail | null {
  const t = now.getTime();
  const start = Date.parse(session.startsAt);
  const end = sessionEndsAt(session);
  const sent = reg.sent ?? {};
  const isoNow = now.toISOString();
  const seq = sent.seq ?? 0;

  if (reg.status === 'cancelled' || reg.status === 'noShow') return null;

  // 1. The date was cancelled — everyone still holding a place or waiting hears it once.
  if (session.state === 'cancelled') {
    if (sent.cancelled) return null;
    return { kind: 'cancelled', sent: { cancelled: isoNow, seq: seq + 1 } };
  }

  const upcoming = t < start;

  // 2. The date moved — what they were told is not what is true any more.
  //    Their reminders are owed again for the new time.
  if (upcoming && sent.startsAt && sent.startsAt !== session.startsAt && (sent.confirm || sent.confirmedAs)) {
    return { kind: 'moved', sent: { startsAt: session.startsAt, seq: seq + 1, d1: null, h1: null } };
  }

  // 3. A seat opened and they were moved off the waiting list.
  if (upcoming && reg.status === 'registered' && sent.confirmedAs === 'waitlist') {
    return { kind: 'promoted', sent: { confirmedAs: 'registered', startsAt: session.startsAt } };
  }

  // 4. The confirmation never went out (the mail failed at registration).
  if (upcoming && !sent.confirm) {
    return {
      kind: 'confirm',
      sent: { confirm: isoNow, confirmedAs: reg.status === 'waitlist' ? 'waitlist' : 'registered', startsAt: session.startsAt }
    };
  }

  if (reg.status === 'waitlist') return null;

  // 5. "We've started" — the one that brings people back. Not to who is already in.
  if (t >= start && t <= start + WINDOWS.liveUntil && !reg.joinedAt && !sent.live) {
    return { kind: 'live', sent: { live: isoNow } };
  }

  // A confirmation sent shortly before is a reminder already.
  const confirmedAt = sent.confirm ? Date.parse(sent.confirm) : 0;

  // 6. "In an hour".
  if (t >= start - WINDOWS.h1[0] && t < start - WINDOWS.h1[1] && !sent.h1 && confirmedAt < start - 2 * HOUR) {
    return { kind: 'h1', sent: { h1: isoNow } };
  }

  // 7. "Tomorrow".
  if (t >= start - WINDOWS.d1[0] && t < start - WINDOWS.d1[1] && !sent.d1 && confirmedAt < start - 24 * HOUR) {
    return { kind: 'd1', sent: { d1: isoNow } };
  }

  // 8. After: thanks to who came, "you missed it" to who did not (and that is recorded).
  if (t >= end + WINDOWS.afterFrom && t <= end + WINDOWS.afterUntil && !sent.after && HOLDING.has(reg.status)) {
    const came = reg.status === 'attended' || !!reg.joinedAt;
    return came
      ? { kind: 'thanks', sent: { after: isoNow } }
      : { kind: 'missed', sent: { after: isoNow }, status: 'noShow' };
  }

  return null;
}

/** A "tell me about the next date" row: owed one mail per new open date. */
export function planNewDate(
  reg: PlanRegistration,
  openSessionKeys: string[],
  now: Date = new Date()
): PlannedMail | null {
  if (reg.sessionKey || reg.status !== 'waitlist') return null;
  const offered = new Set(reg.sent?.offered ?? []);
  const fresh = openSessionKeys.filter((k) => !offered.has(k));
  if (fresh.length === 0) return null;
  void now;
  return { kind: 'newDate', sent: { offered: [...offered, ...fresh] } };
}

/**
 * Who comes off the waiting list of one session: the earliest waiting rows,
 * as many as there are free seats (all of them when the session has no cap).
 * Only for a session still ahead and open.
 */
export function promotions<T extends { id: string; status: string; sessionKey: string | null; createdAt: string | null }>(
  session: PlanSession & { capacity: number | null },
  regs: T[],
  now: Date = new Date()
): T[] {
  if (session.state !== 'open' && session.state !== 'full') return [];
  if (Date.parse(session.startsAt) - JOIN_OPENS_MIN * MIN <= now.getTime()) return [];
  const mine = regs.filter((r) => r.sessionKey === session.key);
  const taken = mine.filter((r) => HOLDING.has(r.status)).length;
  const waiting = mine
    .filter((r) => r.status === 'waitlist')
    .sort((a, b) => Date.parse(a.createdAt ?? '') - Date.parse(b.createdAt ?? ''));
  const free = session.capacity == null ? waiting.length : Math.max(0, session.capacity - taken);
  return waiting.slice(0, free);
}

/** The order a run works in when it cannot send everything at once. */
export const URGENCY: MailKind[] = ['cancelled', 'moved', 'live', 'promoted', 'confirm', 'h1', 'd1', 'newDate', 'thanks', 'missed'];
