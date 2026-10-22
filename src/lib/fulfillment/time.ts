/**
 * Wall-clock time in the shop's zone (PLAN_SHOP_OPERATIONS A2: `waveAt`, the
 * dispatch day, reminders).
 *
 * A wave "at 16:00" is 16:00 in Israel whatever the server's zone is, and a
 * day is the shop's day: 01:00 in Israel is still yesterday in UTC — the same
 * reason `nextDispatchOf` (shipping.ts) formats in the zone. Pure, no
 * dependency beyond `Intl`.
 */

export const SHOP_TIME_ZONE = 'Asia/Jerusalem';

const pad = (n: number) => String(n).padStart(2, '0');

/** `HH:MM` → minutes after midnight, or null when it is not a time of day. */
export function parseHHMM(v: unknown): number | null {
  if (typeof v !== 'string') return null;
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(v.trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/** Minutes after midnight → `HH:MM`. */
export function formatHHMM(minutes: number): string {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

/** The zone's calendar day (`YYYY-MM-DD`) and minute of the day at `ms`. */
export function zonedParts(ms: number, timeZone = SHOP_TIME_ZONE): { day: string; minutes: number } {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    }).formatToParts(new Date(ms));
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
    return { day: `${get('year')}-${get('month')}-${get('day')}`, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
  } catch {
    const d = new Date(ms);
    return { day: d.toISOString().slice(0, 10), minutes: d.getUTCHours() * 60 + d.getUTCMinutes() };
  }
}

/** `YYYY-MM-DD` + n days. */
export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** The instant (ms) that reads `day` at `minutes` on the zone's clock. */
export function zonedToUtcMs(day: string, minutes: number, timeZone = SHOP_TIME_ZONE): number {
  const naive = Date.parse(`${day}T00:00:00Z`) + minutes * 60_000;
  // The zone's offset at a moment, from how that moment reads there.
  const offsetAt = (ms: number) => {
    const p = zonedParts(ms, timeZone);
    return Date.parse(`${p.day}T00:00:00Z`) + p.minutes * 60_000 - Math.floor(ms / 60_000) * 60_000;
  };
  const first = naive - offsetAt(naive);
  // Once more across a DST edge: the offset at the answer is the one that counts.
  const second = naive - offsetAt(first);
  return second;
}
