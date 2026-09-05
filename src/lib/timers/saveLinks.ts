/**
 * The links a member attaches when they save a timer — the "here is what I
 * did" that a sentence cannot carry: a PR, a document, a design, a recording.
 *
 * Pure, no I/O, so the dialog, the server action and every reader agree on one
 * shape. `Timer.saveLinks` is a Strapi `String`, i.e. a 255-char column, and
 * there is no repeatable component to put URLs in — so the list is stored as
 * one newline-separated string and this module owns both directions of that.
 *
 * Two rules the callers must not re-invent:
 *  - **only `http(s)`**. These URLs are rendered as links other members click;
 *    a `javascript:` or `data:` URL in that position is an attack, not a note.
 *    A bare `example.com/x` is a typo, not a protocol choice, so it is promoted
 *    to `https://` rather than dropped.
 *  - **the column decides the cap**. Serializing is lossy by design: links that
 *    do not fit are refused *before* the write, so a member is told rather than
 *    silently having the last one cut in half by the database.
 */

/** What `Timer.saveLinks` can hold, minus the newline separators. */
export const SAVE_LINKS_MAX_CHARS = 250;

/** More than a handful stops being evidence and starts being a bookmark bar. */
export const SAVE_LINKS_MAX = 5;

/** A single URL longer than this cannot share the column with anything else. */
export const SAVE_LINK_MAX_CHARS = 240;

/**
 * One stored string → the list of links.
 *
 * Splits on newlines *and* on whitespace, because a member pasting two URLs
 * into one line is the same intent as pressing enter between them.
 */
export function parseSaveLinks(raw: unknown): string[] {
  if (typeof raw !== 'string' || !raw.trim()) return [];
  return raw
    .split(/[\s,]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * A single candidate → the URL that will be stored, or `null` when it is not
 * one. `https://` is added to a scheme-less host so `1lev1.com/x` works, but
 * nothing else is guessed: an unparseable string is refused.
 */
export function normalizeSaveLink(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > SAVE_LINK_MAX_CHARS) return null;

  // A scheme-less string is only promoted when it actually looks like a host —
  // `mailto:x` and `javascript:alert(1)` both carry a colon and must not be
  // turned into `https://javascript:alert(1)`.
  const withScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  if (!url.hostname) return null;
  return url.toString();
}

/**
 * A list of candidates → the links that will be stored: normalized, de-duped,
 * order preserved, capped by count and by the column's width.
 */
export function normalizeSaveLinks(input: unknown): string[] {
  const candidates = Array.isArray(input) ? input : parseSaveLinks(input);
  const kept: string[] = [];
  let used = 0;

  for (const candidate of candidates) {
    if (kept.length >= SAVE_LINKS_MAX) break;
    const link = normalizeSaveLink(candidate);
    if (!link || kept.includes(link)) continue;
    // +1 for the newline this link needs once it is not the first.
    const cost = link.length + (kept.length ? 1 : 0);
    if (used + cost > SAVE_LINKS_MAX_CHARS) continue;
    kept.push(link);
    used += cost;
  }

  return kept;
}

/** The list → the one string `Timer.saveLinks` stores. */
export function serializeSaveLinks(links: unknown): string {
  return normalizeSaveLinks(links).join('\n');
}

/**
 * The label a link is shown under: its host plus the last path segment, which
 * is what tells `…/pull/482` apart from `…/pull/91` in a list.
 */
export function saveLinkLabel(link: string): string {
  try {
    const url = new URL(link);
    const host = url.hostname.replace(/^www\./, '');
    const last = url.pathname.split('/').filter(Boolean).pop();
    return last ? `${host}/${decodeURIComponent(last)}` : host;
  } catch {
    return link;
  }
}
