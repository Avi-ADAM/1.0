/**
 * A mission's timer **sessions** — every stretch of work that was actually
 * clocked, with its start time, its stop time and who ran it. Pure, no I/O.
 *
 * The rest of the app summarises: `howmanyhoursalready` is a month-less
 * counter, `monter` is one row per month, `groupTimersByMonth` is one row per
 * Timer entity per month. None of them can answer "when did this work happen?"
 * — and a member reading a claim of 37 hours has no way to check it against
 * their own week. This module unrolls the same data one level further: one row
 * per `timers { start stop }` component, which is the smallest thing the
 * platform ever records.
 *
 * Two deliberate differences from `recurring/missionMonths.ts`:
 *  - a session that crosses midnight is **not** split; it is filed under the
 *    day it started on and flagged (`crossesDay`), because it is one sitting.
 *    The monthly ledger splits by month precisely because hours are *paid* per
 *    month; a log is read per sitting.
 *  - a running session (no `stop`) is measured up to `nowMs` and marked
 *    `running`, so the log shows the timer that is going right now.
 */

import { segmentsFromTimers } from '$lib/recurring/missionMonths.js';

const HOUR_MS = 3_600_000;

/** How the rikma sees the Timer the session belongs to. */
export type SessionState = 'running' | 'approved' | 'saved' | 'open';

export type SessionUser = {
  id: string;
  username: string;
  /** Raw Strapi url, still relative — hosts run it through their own resolver. */
  avatar: string;
};

export type TimerSession = {
  /** Stable across re-renders: the Timer id plus the segment's place in it. */
  key: string;
  timerId: string;
  /** ISO, as stored. */
  start: string;
  /** ISO, or null while the session is still running. */
  stop: string | null;
  startMs: number;
  /** `nowMs` while running, so the row can be measured and sorted. */
  stopMs: number;
  hours: number;
  running: boolean;
  /** The session ended on a later calendar day than it started. */
  crossesDay: boolean;
  /** `YYYY-MM-DD`, local time, of the session's **start**. */
  dayKey: string;
  user: SessionUser | null;
  state: SessionState;
  /** `saveText` — what the member said they did. */
  note: string;
  /** `acts` the timer was filed against, by name. */
  acts: string[];
  /** The segment came from a pre-component Timer (entity `start`/`finnish`). */
  legacy: boolean;
};

export type SessionDay = {
  /** `YYYY-MM-DD`, local. */
  key: string;
  /** Midnight of the day, for locale formatting. */
  date: Date;
  hours: number;
  /** Newest session first. */
  sessions: TimerSession[];
};

export type SessionsResult = {
  /** Every session, newest first. */
  sessions: TimerSession[];
  /** Newest day first. */
  days: SessionDay[];
  /** Hours across every session, the running one included. */
  totalHours: number;
  /** A session is running right now. */
  running: boolean;
};

/** `YYYY-MM-DD` in local time — never through `toISOString()`, which is UTC. */
export function dayKeyOf(value: Date | number): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

/** The state badge a Timer entity earns, in the order the member cares about. */
export function timerState(attrs: any): SessionState {
  if (attrs?.isActive) return 'running';
  if (attrs?.appruved) return 'approved';
  if (attrs?.saved) return 'saved';
  return 'open';
}

function userOf(attrs: any): SessionUser | null {
  const data = attrs?.users_permissions_user?.data;
  if (!data) return null;
  return {
    id: String(data.id ?? ''),
    username: data.attributes?.username ?? '',
    avatar: data.attributes?.profilePic?.data?.attributes?.url ?? ''
  };
}

/**
 * Flatten Strapi Timer entities into one row per recorded stretch of work.
 *
 * `segmentsFromTimers` already decides which record of a Timer to believe (its
 * `timers` components when it has them, its own `start`/`finnish` otherwise) —
 * reuse it per timer so the log can never disagree with the monthly ledger
 * about *which* segments exist, only about how they are grouped.
 */
export function buildTimerSessions(
  timers: any[] | null | undefined,
  nowMs: number = Date.now()
): SessionsResult {
  const sessions: TimerSession[] = [];

  for (const timer of Array.isArray(timers) ? timers : []) {
    const attrs = timer?.attributes ?? timer ?? {};
    const timerId = String(timer?.id ?? attrs?.id ?? '');
    const legacy = !(Array.isArray(attrs.timers) && attrs.timers.length > 0);
    const state = timerState(attrs);
    const user = userOf(attrs);
    const note = typeof attrs.saveText === 'string' ? attrs.saveText.trim() : '';
    const acts = (attrs.acts?.data ?? [])
      .map((act: any) => act?.attributes?.shem)
      .filter((name: unknown): name is string => typeof name === 'string' && name.length > 0);

    segmentsFromTimers([timer]).forEach((seg, index) => {
      if (!seg?.start) return;
      const startMs = new Date(seg.start).getTime();
      if (!Number.isFinite(startMs)) return;

      const running = !seg.stop;
      const parsedStop = seg.stop ? new Date(seg.stop).getTime() : nowMs;
      const stopMs = Number.isFinite(parsedStop) ? parsedStop : nowMs;
      // A stop before its start is corrupt data, not a negative session: show
      // the row (it is real, logged time the member may want to fix) at zero.
      const hours = stopMs > startMs ? (stopMs - startMs) / HOUR_MS : 0;
      const dayKey = dayKeyOf(startMs);

      sessions.push({
        key: `${timerId}-${index}`,
        timerId,
        start: seg.start,
        stop: seg.stop ?? null,
        startMs,
        stopMs,
        hours,
        running,
        crossesDay: dayKey !== dayKeyOf(stopMs),
        dayKey,
        user,
        // The Timer's flag describes the whole entity; only the segment with no
        // stop is the one actually ticking.
        state: state === 'running' && !running ? 'open' : state,
        note,
        acts,
        legacy
      });
    });
  }

  sessions.sort((a, b) => b.startMs - a.startMs);

  const byDay = new Map<string, TimerSession[]>();
  for (const session of sessions) {
    byDay.set(session.dayKey, [...(byDay.get(session.dayKey) ?? []), session]);
  }

  const days: SessionDay[] = [...byDay.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, list]) => {
      const [y, m, d] = key.split('-').map(Number);
      return {
        key,
        date: new Date(y, (m || 1) - 1, d || 1),
        hours: list.reduce((sum, s) => sum + s.hours, 0),
        sessions: list
      };
    });

  return {
    sessions,
    days,
    totalHours: sessions.reduce((sum, s) => sum + s.hours, 0),
    running: sessions.some((s) => s.running)
  };
}
