/**
 * Gemini with Google Search grounding as an external search provider
 * (docs/inprogress/PLAN_CONCIERGE_EXTERNAL_SOURCES.md §4.1, E0).
 *
 * One `generateContent` call per need with the `google_search` tool. The
 * model writes one line per business it found; the response's
 * `groundingMetadata.groundingChunks` lists the pages Google actually
 * returned. **The golden rule (§9.1):** a line survives only when its domain
 * is one of those chunks — whatever the model wrote without a source behind
 * it is thrown away, so it cannot invent a business.
 *
 * Chunk URIs are Google redirect links; the real address is read from the
 * redirect's `Location` header (a request to Google, never to the target
 * site). When that fails the card links the domain's home page.
 *
 * REST rather than the AI SDK: the grounding metadata is the whole point, and
 * the raw response states it without an adapter in between.
 */

import type { ExternalQuery, ExternalSearchProvider, RawExternalResult } from './index';

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
// A grounded answer runs several searches of its own — 20s+ is normal.
const SEARCH_TIMEOUT_MS = 45_000;
const RESOLVE_TIMEOUT_MS = 4_000;
const MAX_LINES = 6;

const LANGUAGE_NAMES: Record<string, string> = {
  he: 'Hebrew',
  en: 'English',
  ru: 'Russian',
  ar: 'Arabic',
  es: 'Spanish'
};

export function buildPrompt(q: ExternalQuery): string {
  const lang = LANGUAGE_NAMES[q.language] ?? 'Hebrew';
  const where = q.locationLabel
    ? `serving the area of "${q.locationLabel}"`
    : 'available online or anywhere in the country';
  const what =
    q.kind === 'resource'
      ? 'places to rent, borrow or buy'
      : q.kind === 'product'
        ? 'places that sell'
        : 'businesses or independent professionals that provide';
  return [
    `Search the web for ${what}: "${q.need}", ${where}.`,
    `Find up to ${MAX_LINES} real, specific providers (a business, a studio, a professional) — not directories, listicles, marketplaces or news articles.`,
    'Skip anything adult, illegal or unsafe.',
    `Answer ONLY with one line per provider, no intro and no other text, in exactly this format:`,
    'name | domain | one short factual sentence of what they offer | price as published, or - | town, or -',
    `Write the name, the sentence and the town in ${lang}. The domain must be the provider's own website domain, like example.co.il.`,
    'Only list a provider whose website you actually found in the search results. Never guess a domain.'
  ].join('\n');
}

export interface GroundingChunk {
  web?: { uri?: string; title?: string };
}

export interface GeminiResponse {
  candidates?: {
    content?: { parts?: { text?: string }[] };
    groundingMetadata?: { groundingChunks?: GroundingChunk[] };
  }[];
}

/** `https://www.x.co.il/a` / `www.x.co.il` / `X.co.il` → `x.co.il`. */
export function bareDomain(s: string | null | undefined): string | null {
  const v = String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, '')
    .replace(/[/?#].*$/, '')
    .replace(/^www\./, '')
    .replace(/\.$/, '');
  return /^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/.test(v) ? v : null;
}

function sameSite(a: string, b: string): boolean {
  return a === b || a.endsWith(`.${b}`) || b.endsWith(`.${a}`);
}

export interface GroundedLine {
  title: string;
  domain: string;
  snippet: string | null;
  price: string | null;
  locationLabel: string | null;
  /** The chunk that proves it — its `uri` is the link to resolve. */
  chunk: { uri: string; domain: string };
}

/**
 * The model's lines, kept only when a grounding chunk backs their domain.
 * Pure — the parsing half of the provider, tested without a network.
 */
export function groundedLines(res: GeminiResponse): GroundedLine[] {
  const cand = res?.candidates?.[0];
  const text = (cand?.content?.parts ?? []).map((p) => p?.text ?? '').join('');
  const chunks = (cand?.groundingMetadata?.groundingChunks ?? [])
    .map((c) => ({ uri: c?.web?.uri ?? '', domain: bareDomain(c?.web?.title) ?? bareDomain(c?.web?.uri) }))
    .filter((c): c is { uri: string; domain: string } => !!c.uri && !!c.domain);
  if (chunks.length === 0) return [];

  const out: GroundedLine[] = [];
  const used = new Set<string>();
  for (const line of text.split('\n')) {
    const cells = line
      .replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '')
      .split('|')
      .map((c) => c.trim());
    if (cells.length < 2) continue;
    const domain = bareDomain(cells[1]);
    if (!domain || used.has(domain)) continue;
    const chunk = chunks.find((c) => sameSite(c.domain, domain));
    if (!chunk) continue; // not in the search results ⇒ not real enough to show
    used.add(domain);
    const cell = (i: number) => {
      const v = (cells[i] ?? '').replace(/^[-–—]$/, '').trim();
      return v || null;
    };
    out.push({
      title: cells[0] || domain,
      domain,
      snippet: cell(2),
      price: cell(3),
      locationLabel: cell(4),
      chunk
    });
    if (out.length >= MAX_LINES) break;
  }
  return out;
}

async function withTimeout<T>(ms: number, run: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms);
  try {
    return await run(ctl.signal);
  } finally {
    clearTimeout(timer);
  }
}

/** The page behind a grounding redirect, without ever fetching the page. */
export async function resolveRedirect(
  uri: string,
  domain: string,
  fetchFn: typeof fetch = fetch
): Promise<string> {
  const home = `https://${domain}/`;
  if (bareDomain(uri) && !/vertexaisearch|grounding-api-redirect/.test(uri)) return uri;
  try {
    const location = await withTimeout(RESOLVE_TIMEOUT_MS, async (signal) => {
      const res = await fetchFn(uri, { method: 'GET', redirect: 'manual', signal });
      return res.headers.get('location');
    });
    const target = location ? bareDomain(location) : null;
    // Only trust a redirect that lands where the chunk said it would.
    return location && target && sameSite(target, domain) && /^https?:\/\//.test(location)
      ? location
      : home;
  } catch {
    return home;
  }
}

export function geminiGroundingProvider(opts: {
  apiKey: string;
  model: string;
  fetchFn?: typeof fetch;
}): ExternalSearchProvider {
  const fetchFn = opts.fetchFn ?? fetch;
  return {
    id: 'gemini',
    available: () => !!opts.apiKey,
    async search(q: ExternalQuery): Promise<RawExternalResult[]> {
      const res = await withTimeout(SEARCH_TIMEOUT_MS, (signal) =>
        fetchFn(`${ENDPOINT}/${encodeURIComponent(opts.model)}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': opts.apiKey },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: buildPrompt(q) }] }],
            tools: [{ google_search: {} }],
            generationConfig: { temperature: 0.2 }
          }),
          signal
        })
      );
      if (!res.ok) throw new Error(`Gemini search HTTP ${res.status}`);
      const lines = groundedLines((await res.json()) as GeminiResponse);
      return Promise.all(
        lines.map(async (l) => ({
          url: await resolveRedirect(l.chunk.uri, l.domain, fetchFn),
          title: l.title,
          snippet: l.snippet,
          price: l.price,
          locationLabel: l.locationLabel
        }))
      );
    }
  };
}
