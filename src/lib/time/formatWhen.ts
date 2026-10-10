/**
 * formatWhen — "when did this reach me", as one short phrase.
 *
 * The heart already says when something *ends* (the timegrama countdown). This
 * is the other end: when a request was sent, a mission published, a decision
 * opened. Every surface that shows such a moment goes through here, so a card,
 * a list row and a coin cannot disagree about how "yesterday" is written.
 *
 * Near moments read relative, far ones absolute:
 *
 *   under a minute  → "now"              (relative)
 *   under an hour   → "12 min. ago"      (relative)
 *   same day        → "today, 14:30"     (relative)
 *   the day before  → "yesterday, 14:30" (relative)
 *   within 6 days   → "Tue 14:30"        (weekday)
 *   this year       → "Oct 6"            (date)
 *   older           → "Oct 6, 2025"      (date)
 *
 * `mode` is returned because the caller's sentence differs: Hebrew says
 * "נשלחה לפני 12 דק׳" but "נשלחה ב־6 באוק׳", English "sent today" but "sent on
 * Oct 6". Which preposition is the caller's (translation) business; which
 * *kind* of phrase this is, is ours.
 *
 * Everything locale-specific — plural forms, "yesterday", month names, digits —
 * comes from `Intl`, so all five locales are correct without a hand-written
 * grammar. Pure: `now` is passed in (the shared clock in components, a fixed
 * instant in tests), and `timeZone` only exists so tests are deterministic; in
 * the app it is the reader's own.
 */

export type WhenMode = 'relative' | 'weekday' | 'date';

export interface WhenParts {
  /** The short phrase, e.g. "לפני 12 דק׳" or "6 באוק׳". */
  short: string;
  /** Full date and time, for `title`/`aria`: "יום שלישי, 6 באוקטובר 2026 בשעה 14:30". */
  full: string;
  /** ISO 8601, for `<time datetime>`. */
  iso: string;
  mode: WhenMode;
}

export interface FormatWhenOptions {
  timeZone?: string;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
/**
 * A timestamp slightly in the future is clock skew between the server that
 * stamped it and this device, and reads as "now". Anything further ahead is not
 * skew, and gets an absolute date rather than a "now" that would be a lie.
 */
const SKEW = 5 * MINUTE;

function toDate(at: unknown): Date | null {
  if (at === null || at === undefined || at === '') return null;
  if (typeof at !== 'string' && typeof at !== 'number' && !(at instanceof Date)) return null;
  const d = at instanceof Date ? at : new Date(at);
  return Number.isFinite(d.getTime()) ? d : null;
}

/** Calendar day of `d` in `timeZone`, as a day count since the epoch. */
function dayNumber(d: Date, timeZone: string | undefined): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  }).formatToParts(d);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return Math.round(Date.UTC(get('year'), get('month') - 1, get('day')) / 86_400_000);
}

function yearOf(d: Date, timeZone: string | undefined): string {
  return new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric' }).format(d);
}

/**
 * @param at   anything a `Date` accepts; invalid or empty → `null`
 * @param now  epoch milliseconds
 * @param locale a BCP 47 tag — in the app, the `$lang` store
 */
export function formatWhen(
  at: unknown,
  now: number,
  locale: string,
  { timeZone }: FormatWhenOptions = {}
): WhenParts | null {
  const d = toDate(at);
  if (!d) return null;

  const iso = d.toISOString();
  const full = new Intl.DateTimeFormat(locale, {
    timeZone,
    dateStyle: 'full',
    timeStyle: 'short'
  }).format(d);
  const out = (short: string, mode: WhenMode): WhenParts => ({ short, full, iso, mode });

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' });
  const diff = now - d.getTime();

  if (diff < 0 && -diff > SKEW) {
    return out(dateOnly(d, locale, timeZone, now), 'date');
  }
  if (diff < MINUTE) return out(rtf.format(0, 'second'), 'relative');
  if (diff < HOUR) return out(rtf.format(-Math.floor(diff / MINUTE), 'minute'), 'relative');

  const days = dayNumber(new Date(now), timeZone) - dayNumber(d, timeZone);
  const clock = new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: 'numeric',
    minute: '2-digit'
  }).format(d);
  // Arabic separates with its own comma; every other locale here uses ", ".
  const sep = locale.startsWith('ar') ? '، ' : ', ';

  if (days === 0) return out(`${rtf.format(0, 'day')}${sep}${clock}`, 'relative');
  if (days === 1) return out(`${rtf.format(-1, 'day')}${sep}${clock}`, 'relative');
  if (days > 1 && days < 7) {
    const weekday = new Intl.DateTimeFormat(locale, {
      timeZone,
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit'
    }).format(d);
    return out(weekday, 'weekday');
  }
  return out(dateOnly(d, locale, timeZone, now), 'date');
}

function dateOnly(d: Date, locale: string, timeZone: string | undefined, now: number): string {
  const sameYear = yearOf(d, timeZone) === yearOf(new Date(now), timeZone);
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' })
  }).format(d);
}
