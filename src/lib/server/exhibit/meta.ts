/**
 * What a team member (and Claude, through `getLeadTool`) needs to know about a
 * fair visitor's draft before getting back to them (PLAN_EXHIBITION_MODE §9,
 * G1) — computed on the server from the draft itself, never from what the
 * browser claims.
 *
 *  - where the idea came from (`ideaSource`), so the team knows how rough the
 *    draft is: a ready template, a live assistant draft, or the nearest
 *    template answering the visitor's own words;
 *  - the visitor's own words, when they typed an idea;
 *  - the plan, one line per part.
 *
 * The first two only the stand knows, so it sends them when it keeps the
 * draft and they ride in the session's `sourceText`, in a fixed form this
 * module both writes and reads.
 */
import type { AssistantItem } from '$lib/assistant/types';

export const IDEA_SOURCE_RE = /^(?:ai|(?:template|nearest):[a-z]{2,20})$/;
export const MAX_WORDS = 300;
export const MAX_PLAN = 1500;

export interface ExhibitMeta {
  source: string | null;
  words: string | null;
}

/** Only well-formed values pass; anything else is simply not recorded. */
export function cleanMeta(raw: unknown): ExhibitMeta {
  const m = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const source = typeof m.source === 'string' && IDEA_SOURCE_RE.test(m.source) ? m.source : null;
  const words =
    typeof m.words === 'string' && m.words.trim() ? m.words.replace(/\s+/g, ' ').trim().slice(0, MAX_WORDS) : null;
  return { source, words };
}

const HEAD = 'Built at the 1lev1 exhibition stand: ';

export function exhibitSourceText(name: string, meta: ExhibitMeta): string {
  return [
    HEAD + name,
    ...(meta.source ? [`source: ${meta.source}`] : []),
    ...(meta.words ? [`visitor wrote: ${meta.words}`] : [])
  ].join('\n');
}

export function parseExhibitSourceText(text: string | null | undefined): ExhibitMeta {
  const lines = String(text ?? '').split('\n');
  const pick = (prefix: string) => lines.find((l) => l.startsWith(prefix))?.slice(prefix.length).trim() || null;
  const source = pick('source: ');
  return { source: source && IDEA_SOURCE_RE.test(source) ? source : null, words: pick('visitor wrote: ') };
}

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/**
 * One line per part, the way a person reads a plan:
 *   "mission: Paint the wall · 60h × 100 = 6000 · open"
 *   "resource: Paint · 1800 · me"
 *   "product: Neighborhood art tours"
 * Cut to `max` characters on a line boundary, with how many were left out.
 */
export function planSummary(items: readonly AssistantItem[], max: number = MAX_PLAN): string {
  const lines: string[] = [];
  for (const i of items) {
    if (i.status === 'dropped') continue;
    const s = i.spec ?? {};
    const who = s.holder === 'me' ? 'me' : 'open';
    if (i.group === 'rikmaMissions') {
      const h = num(s.hours);
      const r = num(s.ratePerHour);
      const money = h && r ? ` · ${h}h × ${r} = ${h * r}` : h ? ` · ${h}h` : '';
      lines.push(`mission: ${i.label}${money} · ${who}`);
    } else if (i.group === 'rikmaResources') {
      const p = num(s.price);
      lines.push(`resource: ${i.label}${p ? ` · ${p}` : ''} · ${who}`);
    } else if (i.group === 'products') {
      lines.push(`product: ${i.label}`);
    }
  }
  let out = '';
  for (let k = 0; k < lines.length; k++) {
    const next = out ? `${out}\n${lines[k]}` : lines[k];
    const rest = lines.length - k - 1;
    if (next.length > max - (rest ? 20 : 0)) {
      return `${out}\n… +${lines.length - k} more`.trim();
    }
    out = next;
  }
  return out;
}
