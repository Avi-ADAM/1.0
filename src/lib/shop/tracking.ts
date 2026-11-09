/**
 * A parcel's tracking number — kept on the order, with no new column.
 *
 * It rides in the order's `note`, one line that starts with {@link TRACKING_MARK}
 * (the note already carries the rikma's own facts the same way: "בוטל: …", the
 * arranged-payment line). Putting it in the `shipping` JSON would tie it to the
 * day that column is deployed and to orders that have a shipping record at all;
 * the note works for every order today.
 *
 * Pure and client-safe: the order screen reads it (`readTracking`), the
 * `setOrderTracking` / `markOrderShipped` actions write it (`withTracking`), and
 * the customer's "shipped" mail quotes it.
 */

export interface Tracking {
  /** "DHL", "דואר ישראל" — free text, may be absent. */
  carrier: string | null;
  /** What the buyer types into the carrier's site. */
  number: string;
  /** A tracking page, when the seller pasted one. http(s) only. */
  url: string | null;
}

/** The marker a tracking line starts with. Changing it orphans every stored line. */
export const TRACKING_MARK = 'מעקב משלוח:';

const SEP = ' · ';
const MAX_CARRIER = 40;
const MAX_NUMBER = 60;
const MAX_URL = 300;

/** One line of plain text: no control characters, no separator, bounded. */
function tidy(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .split(SEP.trim())
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

/** A link a seller may share with a buyer: http(s) only — never `javascript:` or `data:`. */
export function safeUrl(value: unknown): string | null {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw || raw.length > MAX_URL) return null;
  try {
    const u = new URL(raw);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : null;
  } catch {
    return null;
  }
}

/**
 * What a seller typed → what is stored, or null when there is no number.
 * A tracking link pasted into the number field is moved to `url`.
 */
export function cleanTracking(input: { carrier?: unknown; number?: unknown; url?: unknown }): Tracking | null {
  let number = tidy(input.number, MAX_URL);
  let url = safeUrl(input.url);
  if (!url) {
    const pasted = safeUrl(number);
    if (pasted) {
      url = pasted;
      number = '';
    }
  }
  number = number.slice(0, MAX_NUMBER);
  if (!number) return null;
  const carrier = tidy(input.carrier, MAX_CARRIER) || null;
  return { carrier, number, url };
}

/** The note line for a tracking: `מעקב משלוח: DHL · 123456 · https://…`. */
export function trackingLine(t: Tracking): string {
  return [TRACKING_MARK, [t.carrier, t.number, t.url].filter(Boolean).join(SEP)].join(' ');
}

/** The tracking in a note (the last such line wins), or null. */
export function readTracking(note: string | null | undefined): Tracking | null {
  if (!note) return null;
  const lines = note.split(/\r?\n/).filter((l) => l.trimStart().startsWith(TRACKING_MARK));
  const line = lines[lines.length - 1];
  if (!line) return null;
  const body = line.trimStart().slice(TRACKING_MARK.length).trim();
  if (!body) return null;
  const parts = body.split(SEP).map((p) => p.trim()).filter(Boolean);
  if (!parts.length) return null;
  const last = parts[parts.length - 1];
  const url = safeUrl(last);
  const rest = url ? parts.slice(0, -1) : parts;
  if (!rest.length) return null;
  const number = rest[rest.length - 1];
  const carrier = rest.length > 1 ? rest[0] : null;
  return { carrier, number, url };
}

/**
 * The note with its tracking replaced (or removed when `t` is null). Every
 * other line is kept as it was; the tracking line goes last.
 */
export function withTracking(note: string | null | undefined, t: Tracking | null): string | null {
  const kept = (note ?? '')
    .split(/\r?\n/)
    .filter((l) => !l.trimStart().startsWith(TRACKING_MARK))
    .join('\n')
    .trim();
  const parts = [kept, t ? trackingLine(t) : ''].filter(Boolean);
  return parts.length ? parts.join('\n') : null;
}

export function sameTracking(a: Tracking | null, b: Tracking | null): boolean {
  if (!a || !b) return a === b;
  return a.carrier === b.carrier && a.number === b.number && a.url === b.url;
}
