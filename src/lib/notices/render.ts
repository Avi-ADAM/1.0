/**
 * Turning a notice into words, given a translate function.
 *
 * Kept out of the component so it is testable without a store: a row passes
 * `$t` and the language in. A param that is itself a `{ key }` — "a decision in
 * the rikma X: <the decision's label>" — is resolved first; a number is
 * formatted for the reader's language.
 */

import { termKey, type NoticeParam, type NoticeTerm, type NoticeText } from './types';

export type Translate = (key: string, params?: Record<string, unknown>) => string;

function formatNumber(n: number, lang: string): string {
  try {
    return n.toLocaleString(lang, { maximumFractionDigits: 2 });
  } catch {
    return String(n);
  }
}

/**
 * Words a person wrote — a name, a project, a wish — set inside our sentence.
 *
 * Trimmed: names come out of the DB as typed ("Asus "), and the space then sits
 * between the name and the colon after it. Isolated (FSI … PDI): a Latin name in
 * a Hebrew sentence, or a Hebrew one in English, otherwise drags the neutral
 * punctuation beside it to the wrong side — "Asus :" in the bell.
 */
export const isolate = (s: string): string => {
  const trimmed = s.trim();
  return trimmed ? `⁨${trimmed}⁩` : '';
};

function resolveParam(p: NoticeParam, t: Translate, lang: string): string {
  if (typeof p === 'number') return formatNumber(p, lang);
  if (typeof p === 'string') return isolate(p);
  // Our own label (a nested key) is in the reader's language; only people's words need isolating.
  if ('text' in p) return isolate(p.text);
  return resolveNoticeText(p, t, lang);
}

export function resolveNoticeText(text: NoticeText | null | undefined, t: Translate, lang: string): string {
  if (!text) return '';
  if ('text' in text) return text.text;
  if (!text.params) return t(text.key);
  const params: Record<string, string> = {};
  for (const [name, value] of Object.entries(text.params)) params[name] = resolveParam(value, t, lang);
  return t(text.key, params);
}

export function resolveTerm(term: NoticeTerm, t: Translate, lang: string): string {
  return t(termKey(term.kind), { value: formatNumber(term.value, lang) });
}

/**
 * When the silence clock completes it, in words a person can place: the
 * weekday and time within a week, the date beyond.
 */
export function formatDeadline(iso: string | null | undefined, lang: string, now: number = Date.now()): string {
  if (!iso) return '';
  const at = Date.parse(iso);
  if (!Number.isFinite(at)) return '';
  const withinWeek = at - now < 6 * 24 * 3600_000;
  try {
    return new Intl.DateTimeFormat(lang, withinWeek
      ? { weekday: 'short', hour: '2-digit', minute: '2-digit' }
      : { day: 'numeric', month: 'short' }).format(at);
  } catch {
    return new Date(at).toISOString().slice(0, 16).replace('T', ' ');
  }
}
