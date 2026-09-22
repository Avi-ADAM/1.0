/**
 * Displaying shifts — always in the plan's own time zone, never the viewer's.
 *
 * A shift at the rikma's shop opens at 11:00 where the shop is. A member
 * travelling abroad who saw "09:00" would come two hours early; a member who
 * saw "13:00" would miss it. So every date and time on a shift screen is
 * formatted with `timeZone` set to the plan's.
 */

const cache = new Map<string, Intl.DateTimeFormat>();
function fmt(locale: string, timeZone: string, opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}|${timeZone}|${JSON.stringify(opts)}`;
  let f = cache.get(key);
  if (!f) {
    try {
      f = new Intl.DateTimeFormat(locale, { timeZone, ...opts });
    } catch {
      f = new Intl.DateTimeFormat('en', { timeZone, ...opts });
    }
    cache.set(key, f);
  }
  return f;
}

/** "YYYY-MM-DD" of an instant in the plan's zone — the key shifts are grouped by. */
export function localDateKey(iso: string, timeZone: string): string {
  const parts = fmt('en-CA', timeZone, { year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** "11:00–15:00" (24h, locale digits). */
export function timeRange(startIso: string, endIso: string, timeZone: string, locale: string): string {
  const f = fmt(locale, timeZone, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  return `${f.format(new Date(startIso))}–${f.format(new Date(endIso))}`;
}

/** "Sun 4 Oct" / "יום א׳, 4 באוק׳". */
export function dayLabel(dateKey: string, locale: string): string {
  // Noon UTC of that calendar date lands on the same date in every zone we serve.
  const noon = new Date(`${dateKey}T12:00:00Z`);
  return fmt(locale, 'UTC', { weekday: 'short', day: 'numeric', month: 'short' }).format(noon);
}

/** "4 Oct, 21:00" — for deadlines (draft, close). */
export function moment(iso: string, timeZone: string, locale: string): string {
  return fmt(locale, timeZone, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso));
}

/** Every local date from `start` (inclusive) to `end` (exclusive) — the columns of a cycle. */
export function daysOf(startIso: string, endIso: string, timeZone: string): string[] {
  const first = localDateKey(startIso, timeZone);
  const last = localDateKey(new Date(new Date(endIso).getTime() - 1).toISOString(), timeZone);
  const out: string[] = [];
  const d = new Date(`${first}T12:00:00Z`);
  for (let i = 0; i < 62; i++) {
    const key = d.toISOString().slice(0, 10);
    out.push(key);
    if (key >= last) break;
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}
