/**
 * extractWish — run the concierge agent and normalise its output.
 *
 * Wraps `getConciergeAgent().generate()` with defensive JSON parsing (LLMs love
 * to wrap JSON in ```json fences) and shape validation, so callers always get a
 * well-formed `WishExtraction` even when the model misbehaves.
 */

import { getConciergeAgent } from './conciergeAgent';

export interface WishItem {
  name: string;
  imp: 'must' | 'nice';
}
export interface WishSkill {
  name: string;
}
export interface WishHint {
  kind: 'question' | 'suggestion';
  text: string;
}

/** Wish group kinds the composer offers besides 'solo'. */
export const GROUP_KINDS = [
  'group_purchase',
  'group_trip',
  'community_event',
  'public_renovation',
  'recurring_subscription'
] as const;
export type GroupKind = (typeof GROUP_KINDS)[number];

/**
 * The practical details the writer stated in the text — what the composer's
 * "details" squares hold. Every field is empty unless the text said it; the
 * composer only ever fills a square the writer has not set by hand.
 */
export interface WishDetails {
  dateFrom: string; // YYYY-MM-DD | ''
  dateTo: string; // YYYY-MM-DD | ''
  budget: number | null;
  currency: string; // ISO 4217 | ''
  place: string;
  online: boolean | null;
  groupKind: GroupKind | '';
}

export const EMPTY_DETAILS: WishDetails = {
  dateFrom: '',
  dateTo: '',
  budget: null,
  currency: '',
  place: '',
  online: null,
  groupKind: ''
};

export interface WishExtraction {
  missions: WishItem[];
  resources: WishItem[];
  skills: WishSkill[];
  categories: string[];
  titleSuggestion: string;
  hints: WishHint[];
  /** Absent on extractions rebuilt from a saved wish (refreshWishMatches). */
  details?: WishDetails;
}

export const EMPTY_EXTRACTION: WishExtraction = {
  missions: [],
  resources: [],
  skills: [],
  categories: [],
  titleSuggestion: '',
  hints: [],
  details: { ...EMPTY_DETAILS }
};

/**
 * Strip ```json fences / stray prose and return the first JSON object found.
 *
 * Exported because every "ask the model for JSON" caller needs the same
 * defensive parse (see `src/lib/server/planning/`).
 */
export function coerceJson(raw: string): unknown {
  if (!raw) return null;
  let s = raw.trim();
  // Remove leading/trailing code fences.
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  try {
    return JSON.parse(s);
  } catch {
    // Fall back to the first {...} block.
    const start = s.indexOf('{');
    const end = s.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(s.slice(start, end + 1));
      } catch {
        /* ignore */
      }
    }
    return null;
  }
}

function asImp(v: unknown): 'must' | 'nice' {
  return v === 'must' ? 'must' : 'nice';
}

function normItems(arr: unknown, max: number): WishItem[] {
  if (!Array.isArray(arr)) return [];
  const out: WishItem[] = [];
  for (const it of arr) {
    const name =
      typeof it === 'string'
        ? it
        : typeof (it as any)?.name === 'string'
          ? (it as any).name
          : '';
    const clean = name.trim();
    if (clean) out.push({ name: clean, imp: asImp((it as any)?.imp) });
    if (out.length >= max) break;
  }
  return out;
}

function normStrings(arr: unknown, max: number): string[] {
  if (!Array.isArray(arr)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const it of arr) {
    const s = (typeof it === 'string' ? it : (it as any)?.name ?? '').trim();
    const key = s.toLowerCase();
    if (s && !seen.has(key)) {
      seen.add(key);
      out.push(s);
    }
    if (out.length >= max) break;
  }
  return out;
}

function normHints(arr: unknown, max: number): WishHint[] {
  if (!Array.isArray(arr)) return [];
  const out: WishHint[] = [];
  for (const it of arr) {
    const text = (typeof it === 'string' ? it : (it as any)?.text ?? '').trim();
    if (!text) continue;
    const kind = (it as any)?.kind === 'question' ? 'question' : 'suggestion';
    out.push({ kind, text });
    if (out.length >= max) break;
  }
  return out;
}

/** A real calendar day as YYYY-MM-DD, or ''. */
function asIsoDay(v: unknown): string {
  const s = typeof v === 'string' ? v.trim() : '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return '';
  const d = new Date(`${s}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s ? '' : s;
}

/** Same day, one year on. */
function nextYear(iso: string): string {
  return `${Number(iso.slice(0, 4)) + 1}${iso.slice(4)}`;
}

export function normDetails(raw: unknown, today = israelDay()): WishDetails {
  const d = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  let dateFrom = asIsoDay(d.dateFrom);
  let dateTo = asIsoDay(d.dateTo);
  if (!dateFrom && dateTo) dateFrom = dateTo;
  if (dateFrom && !dateTo) dateTo = dateFrom;
  if (dateTo < dateFrom) [dateFrom, dateTo] = [dateTo, dateFrom];
  // "In March", written in September, means next March — the model is told so
  // and still answers with this year's. A wish is never for a finished period.
  if (dateTo && dateTo < today) {
    dateFrom = asIsoDay(nextYear(dateFrom)) || dateFrom;
    dateTo = asIsoDay(nextYear(dateTo)) || dateTo; // Feb 29 → stays, and is dropped below
    if (dateTo < today) dateFrom = dateTo = '';
  }

  const n = typeof d.budget === 'string' ? Number(d.budget.replace(/[^\d.]/g, '')) : d.budget;
  const budget =
    typeof n === 'number' && Number.isFinite(n) && n > 0 && n < 100_000_000 ? Math.round(n) : null;
  const cur = typeof d.currency === 'string' ? d.currency.trim().toUpperCase() : '';

  return {
    dateFrom,
    dateTo,
    budget,
    currency: budget != null && /^[A-Z]{3}$/.test(cur) ? cur : '',
    place: typeof d.place === 'string' ? d.place.trim().slice(0, 120) : '',
    online: typeof d.online === 'boolean' ? d.online : null,
    groupKind: (GROUP_KINDS as readonly string[]).includes(d.groupKind as string)
      ? (d.groupKind as GroupKind)
      : ''
  };
}

/** Today as YYYY-MM-DD on the platform's clock. */
function israelDay(now = new Date()): string {
  return now.toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' });
}

/** The "Today" line, so the model can resolve "next Friday" to a real day. */
export function todayLine(now = new Date()): string {
  const weekday = now.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Asia/Jerusalem' });
  return `Today: ${israelDay(now)} (${weekday})`;
}

export async function extractWish(
  text: string,
  apiKey?: string
): Promise<WishExtraction> {
  const trimmed = (text ?? '').trim();
  if (trimmed.length < 20) return { ...EMPTY_EXTRACTION };

  const agent = getConciergeAgent(apiKey);
  const result = await agent.generate([
    { role: 'user', content: `${todayLine()}\n\nWish text:\n"${trimmed}"` }
  ]);

  const parsed = coerceJson(result?.text ?? '') as Record<string, unknown> | null;
  if (!parsed || typeof parsed !== 'object') {
    console.warn('[extractWish] unparseable model output:', result?.text);
    return { ...EMPTY_EXTRACTION };
  }

  return {
    missions: normItems(parsed.missions, 5),
    resources: normItems(parsed.resources, 4),
    skills: normStrings(parsed.skills, 6).map((name) => ({ name })),
    categories: normStrings(parsed.categories, 3),
    titleSuggestion:
      typeof parsed.titleSuggestion === 'string'
        ? parsed.titleSuggestion.trim().slice(0, 120)
        : '',
    hints: normHints(parsed.hints, 3),
    details: normDetails(parsed.details)
  };
}
