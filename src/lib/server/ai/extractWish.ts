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

export interface WishExtraction {
  missions: WishItem[];
  resources: WishItem[];
  skills: WishSkill[];
  categories: string[];
  titleSuggestion: string;
  hints: WishHint[];
}

export const EMPTY_EXTRACTION: WishExtraction = {
  missions: [],
  resources: [],
  skills: [],
  categories: [],
  titleSuggestion: '',
  hints: []
};

/** Strip ```json fences / stray prose and return the first JSON object found. */
function coerceJson(raw: string): unknown {
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

export async function extractWish(
  text: string,
  apiKey?: string
): Promise<WishExtraction> {
  const trimmed = (text ?? '').trim();
  if (trimmed.length < 20) return { ...EMPTY_EXTRACTION };

  const agent = getConciergeAgent(apiKey);
  const result = await agent.generate([
    { role: 'user', content: `Wish text:\n"${trimmed}"` }
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
    hints: normHints(parsed.hints, 3)
  };
}
