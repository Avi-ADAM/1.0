/**
 * Where a session stands in time, and whether one more person fits
 * (docs/inprogress/PLAN_EVENTS_WEBINARS.md §3.2, §4.3). Pure.
 */

import type { SessionView } from './model';

/** The "join" button opens this long before the start (§4.3). */
export const JOIN_OPENS_MIN = 15;

export type SessionPhase = 'cancelled' | 'upcoming' | 'joinable' | 'ended';

export function sessionEndsAt(s: Pick<SessionView, 'startsAt' | 'durationMin'>): number {
  return Date.parse(s.startsAt) + s.durationMin * 60_000;
}

/**
 * `joinable` from JOIN_OPENS_MIN before the start until the end — and a
 * little after, because a webinar always runs over.
 */
export function sessionPhase(s: Pick<SessionView, 'startsAt' | 'durationMin' | 'state'>, now: Date = new Date()): SessionPhase {
  if (s.state === 'cancelled') return 'cancelled';
  const t = now.getTime();
  const start = Date.parse(s.startsAt);
  if (t < start - JOIN_OPENS_MIN * 60_000) return 'upcoming';
  if (t <= sessionEndsAt(s) + 30 * 60_000 && s.state !== 'done') return 'joinable';
  return 'ended';
}

export function seatsLeft(s: Pick<SessionView, 'capacity'>, taken: number): number | null {
  return s.capacity == null ? null : Math.max(0, s.capacity - taken);
}

/** Registration is open until the session starts (a late joiner gets in through the join window). */
export function canRegister(s: Pick<SessionView, 'startsAt' | 'state'>, now: Date = new Date()): boolean {
  return (s.state === 'open' || s.state === 'full') && Date.parse(s.startsAt) > now.getTime();
}

/** The status a new registration gets: a full session puts the person on its waiting list (§1.6 — never "no"). */
export function admissionFor(s: Pick<SessionView, 'capacity' | 'state'>, taken: number): 'registered' | 'waitlist' {
  if (s.state === 'full') return 'waitlist';
  const left = seatsLeft(s, taken);
  return left === null || left > 0 ? 'registered' : 'waitlist';
}

/** Sessions a visitor can still pick, earliest first. */
export function openSessions<T extends Pick<SessionView, 'startsAt' | 'state'>>(sessions: T[], now: Date = new Date()): T[] {
  return sessions
    .filter((s) => canRegister(s, now))
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
}

/** Count the places taken per session — waitlisted and cancelled rows hold no seat. */
export function takenBySession(regs: Array<{ sessionKey: string | null; status: string }>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of regs) {
    if (!r.sessionKey) continue;
    if (r.status === 'registered' || r.status === 'attended' || r.status === 'noShow') {
      out[r.sessionKey] = (out[r.sessionKey] ?? 0) + 1;
    }
  }
  return out;
}
