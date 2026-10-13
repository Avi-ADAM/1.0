/**
 * The sittings behind an hours approval — what a voter is really asked to sign.
 *
 * A saved timer files one number ("3:45 hours") but it was measured from
 * intervals: Tuesday 09:10–11:40, Wednesday 20:00–21:15. The card shows them
 * all, and a member who does not accept the claim can point at the ones they
 * dispute instead of arguing with a total. Disputing a sitting takes its hours
 * off the counter and writes it into the counter's note — the note is still the
 * whole record (`encodeCounter` in ./rounds.ts), so no new field is needed and
 * every surface that already prints counters prints these too.
 *
 * Pure on purpose: the lev card, the vote page and the server notice read the
 * same rules from here.
 */

import { roundHours, hoursOfMs } from '$lib/timers/precision.js';

export interface RawInterval {
  start?: string | null;
  stop?: string | null;
}

export interface Session {
  start: string;
  stop: string;
  hours: number;
}

/** `2.5` → `2:30` — how long something ran, the way people say it. */
export function hoursClock(hours: unknown): string {
  const minutes = Math.round((Number(hours) || 0) * 60);
  const sign = minutes < 0 ? '-' : '';
  const m = Math.abs(minutes);
  return `${sign}${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
}

/**
 * The closed sittings, oldest first. A running one (no stop) is not part of any
 * claim — the save closes every interval before it files the hours — so one
 * that slipped through is left out rather than measured up to now.
 */
export function claimSessions(intervals: RawInterval[] | null | undefined): Session[] {
  return (intervals ?? [])
    .filter((iv): iv is { start: string; stop: string } => !!iv?.start && !!iv?.stop)
    .map((iv) => {
      const ms = new Date(iv.stop).getTime() - new Date(iv.start).getTime();
      return { start: iv.start, stop: iv.stop, hours: Number.isFinite(ms) && ms > 0 ? hoursOfMs(ms) : 0 };
    })
    .filter((s) => s.hours > 0)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

/** Hours of every sitting not disputed — the counter this dispute adds up to. */
export function hoursWithout(sessions: Session[], disputed: Iterable<number>): number {
  const out = new Set(disputed);
  return roundHours(sessions.reduce((sum, s, i) => (out.has(i) ? sum : sum + s.hours), 0));
}

/** `Tue 14 Oct 09:10–11:40 (2:30)` in the reader's locale. */
export function sessionLabel(s: Session, locale: string): string {
  const start = new Date(s.start);
  const stop = new Date(s.stop);
  const day = start.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });
  const time = (d: Date) => d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  const sameDay = start.toDateString() === stop.toDateString();
  const end = sameDay ? time(stop) : `${stop.toLocaleDateString(locale, { day: 'numeric', month: 'short' })} ${time(stop)}`;
  return `${day} ${time(start)}–${end} (${hoursClock(s.hours)})`;
}

/**
 * The counter's note: the member's own words, then one line per disputed
 * sitting. Their words come first — a list of times without a reason is a veto
 * in disguise, and `refuseCounter` checks the words, not the list.
 */
export function disputeNote(
  note: string,
  sessions: Session[],
  disputed: Iterable<number>,
  locale: string,
  maxLength: number = MAX_NOTE
): string {
  const out = new Set(disputed);
  const picked = sessions.filter((_, i) => out.has(i));
  const words = note.trim();
  const lines = picked.map((s) => `✗ ${sessionLabel(s, locale)}`);
  const join = (ls: string[]) => [words, ...ls].filter(Boolean).join('\n');
  // The note rides in a vote's `why`, a 255-char column: past the room, the
  // newest sittings fold into one line with their count and hours.
  let shown = lines.length;
  while (shown > 0 && join(foldTail(lines, picked, shown)).length > maxLength) shown--;
  return join(foldTail(lines, picked, shown));
}

/** Room left for the note once `encodeCounter` has put `⇄ 1000→999.75 | ` in front of it. */
export const MAX_NOTE = 230;

function foldTail(lines: string[], picked: Session[], shown: number): string[] {
  if (shown >= lines.length) return lines;
  const rest = picked.slice(shown);
  const hours = rest.reduce((sum, s) => sum + s.hours, 0);
  return [...lines.slice(0, shown), `✗ +${rest.length} (${hoursClock(hours)})`];
}
