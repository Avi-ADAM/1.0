/**
 * Optional website analysis for planning (PLAN_PROJECT_PLANNING_BOARDS §1.2).
 *
 * A rikma whose `publicDescription` is two lines gives the planner almost
 * nothing to work with, and the advice it gets back is generic because the
 * input was. Many of those rikmas do have a site — `linkToWebsite` — that says
 * exactly what they do.
 *
 * So: when the description is thin and a site is on file, the planner may go
 * read it. This is **best-effort and never required** — a slow, blocked or
 * unparseable site degrades to "no site context" and the run continues on the
 * project data alone.
 *
 * Safety, because this is the one place planning touches an arbitrary URL:
 *  - only `http`/`https`, only the default ports;
 *  - loopback / private / link-local / `.local` hosts are refused, so a URL in
 *    the database cannot be used to probe the internal network (SSRF);
 *  - redirects are followed manually, and every hop is re-checked;
 *  - hard caps on time and on bytes read;
 *  - the fetch uses the *global* fetch, never SvelteKit's request-bound one,
 *    which forwards cookies and the internal secret on same-origin calls.
 */

/** How short a description has to be before the site is worth reading. */
export const THIN_DESCRIPTION_CHARS = 240;

/** Wall-clock budget for the whole fetch, including redirects. */
export const SITE_FETCH_TIMEOUT_MS = 6000;

/** Stop reading the body after this much HTML — a landing page is far less. */
export const SITE_MAX_BYTES = 400_000;

/** How much extracted text reaches the prompt. */
export const SITE_MAX_CHARS = 2000;

const MAX_REDIRECTS = 3;

export interface SiteAnalysis {
  /** The URL actually read (after redirects), or the attempted one. */
  url: string;
  ok: boolean;
  title: string;
  /** Cleaned, truncated visible text. Empty when `ok` is false. */
  text: string;
  /** Why it did not work, for logs and for telling the user honestly. */
  error?: string;
}

/**
 * Hosts that must never be fetched: the machine itself, the private ranges an
 * internal service would live on, and cloud metadata endpoints.
 */
function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, '');

  if (!h) return true;
  if (h === 'localhost' || h.endsWith('.localhost')) return true;
  if (h.endsWith('.local') || h.endsWith('.internal') || h.endsWith('.home.arpa')) return true;

  // IPv6 loopback / unique-local / link-local.
  if (h === '::1' || h === '::') return true;
  if (/^f[cd][0-9a-f]{2}:/i.test(h)) return true;
  if (/^fe80:/i.test(h)) return true;

  const v4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [a, b] = v4.slice(1).map(Number);
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true; // link-local + cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // carrier-grade NAT
    if (a >= 224) return true; // multicast / reserved
  }

  return false;
}

/**
 * Turn whatever is stored in `linkToWebsite` into a URL safe to fetch, or null.
 * Members type "example.com" as often as they paste a full URL.
 */
export function normalizeSiteUrl(raw: string | null | undefined): URL | null {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  if (url.port && url.port !== '80' && url.port !== '443') return null;
  if (isBlockedHost(url.hostname)) return null;
  // A bare hostname with no dot is either an intranet name or a typo.
  if (!url.hostname.includes('.') && !url.hostname.includes(':')) return null;

  return url;
}

const DROP_TAGS = /<(script|style|noscript|template|svg|iframe|head)\b[^>]*>[\s\S]*?<\/\1>/gi;

/** `&amp;` → `&`, and the numeric forms, without pulling in a parser. */
function decodeEntities(s: string): string {
  return s
    .replace(/&(?:nbsp|#160);/gi, ' ')
    .replace(/&(?:amp|#38);/gi, '&')
    .replace(/&(?:lt|#60);/gi, '<')
    .replace(/&(?:gt|#62);/gi, '>')
    .replace(/&(?:quot|#34);/gi, '"')
    .replace(/&(?:#39|apos|rsquo|lsquo);/gi, "'")
    .replace(/&(?:ldquo|rdquo|#8220|#8221);/gi, '"')
    .replace(/&(?:mdash|#8212);/gi, '—')
    .replace(/&#(\d+);/g, (_, code) => {
      const n = Number(code);
      return n > 0 && n < 0x10ffff ? String.fromCodePoint(n) : '';
    });
}

function firstMatch(html: string, re: RegExp): string {
  const m = html.match(re);
  return m ? decodeEntities(m[1]).replace(/\s+/g, ' ').trim() : '';
}

/**
 * Extract the readable gist of a page: its title, its meta/OG description, and
 * the headings and paragraphs, in document order.
 *
 * Deliberately regex-based and dependency-free. We are not rendering the page —
 * we only need enough words for a model to understand what the rikma does, and
 * a landing page's headings carry most of that.
 *
 * Exported for testing: this is where malformed real-world HTML lands.
 */
export function htmlToText(html: string, maxChars: number = SITE_MAX_CHARS): string {
  if (!html) return '';

  const head = html.slice(0, 20_000);
  const title = firstMatch(head, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const metaDesc =
    firstMatch(head, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ||
    firstMatch(head, /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i);

  const body = html.replace(DROP_TAGS, ' ').replace(/<!--[\s\S]*?-->/g, ' ');

  const blocks: string[] = [];
  const blockRe = /<(h1|h2|h3|h4|p|li|blockquote)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = blockRe.exec(body)) !== null) {
    const text = decodeEntities(m[2].replace(/<[^>]+>/g, ' '))
      .replace(/\s+/g, ' ')
      .trim();
    // One-word list items are navigation; three words is a sentence fragment
    // worth keeping.
    if (text.length >= 12) blocks.push(text);
    if (blocks.length >= 120) break;
  }

  // A site built entirely of divs yields no blocks — fall back to all text.
  if (blocks.length === 0) {
    const flat = decodeEntities(body.replace(/<[^>]+>/g, ' '))
      .replace(/\s+/g, ' ')
      .trim();
    if (flat) blocks.push(flat);
  }

  const seen = new Set<string>();
  const parts: string[] = [];
  for (const raw of [title, metaDesc, ...blocks]) {
    const line = raw.trim();
    if (!line) continue;
    const key = line.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    parts.push(line);
  }

  const joined = parts.join('\n');
  return joined.length > maxChars ? joined.slice(0, maxChars - 1).trimEnd() + '…' : joined;
}

/** Read the body with a hard byte cap, so a huge page cannot exhaust memory. */
async function readCapped(res: Response, maxBytes: number): Promise<string> {
  const body = res.body;
  if (!body) return (await res.text()).slice(0, maxBytes);

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      chunks.push(value);
      total += value.byteLength;
      if (total >= maxBytes) break;
    }
  } finally {
    await reader.cancel().catch(() => {});
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk.subarray(0, Math.min(chunk.length, total - offset)), offset);
    offset += chunk.byteLength;
    if (offset >= total) break;
  }
  return new TextDecoder('utf-8', { fatal: false }).decode(merged);
}

/**
 * Fetch and summarise a rikma's website. Never throws.
 *
 * @param rawUrl        whatever `linkToWebsite` holds
 * @param options.fetchImpl  injected for tests; defaults to the global fetch
 *   (NOT SvelteKit's request-bound fetch — see the module header)
 */
export async function fetchSiteSummary(
  rawUrl: string | null | undefined,
  options: {
    fetchImpl?: typeof fetch;
    timeoutMs?: number;
    maxBytes?: number;
    maxChars?: number;
  } = {}
): Promise<SiteAnalysis> {
  const url = normalizeSiteUrl(rawUrl);
  if (!url) {
    return { url: String(rawUrl ?? ''), ok: false, title: '', text: '', error: 'unusable-url' };
  }

  const doFetch = options.fetchImpl ?? globalThis.fetch;
  const timeoutMs = options.timeoutMs ?? SITE_FETCH_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let current = url;
    let res: Response | null = null;

    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      res = await doFetch(current.href, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          // Identify honestly; some hosts refuse an empty UA.
          'user-agent': '1lev1-planner/1.0 (+https://1lev1.com)',
          accept: 'text/html,application/xhtml+xml'
        }
      });

      if (res.status < 300 || res.status >= 400) break;

      const location = res.headers.get('location');
      if (!location) break;
      let next: URL | null;
      try {
        next = normalizeSiteUrl(new URL(location, current).href);
      } catch {
        next = null;
      }
      // A redirect into a private address is exactly the SSRF case the host
      // check exists for — re-check every hop, never trust the first one.
      if (!next) {
        return { url: current.href, ok: false, title: '', text: '', error: 'unsafe-redirect' };
      }
      current = next;
      res = null;
    }

    if (!res) {
      return { url: current.href, ok: false, title: '', text: '', error: 'too-many-redirects' };
    }
    if (!res.ok) {
      return { url: current.href, ok: false, title: '', text: '', error: `http-${res.status}` };
    }

    const contentType = res.headers.get('content-type') ?? '';
    if (contentType && !/text\/html|application\/xhtml|text\/plain/i.test(contentType)) {
      return { url: current.href, ok: false, title: '', text: '', error: 'not-html' };
    }

    const html = await readCapped(res, options.maxBytes ?? SITE_MAX_BYTES);
    const text = htmlToText(html, options.maxChars ?? SITE_MAX_CHARS);
    if (!text) {
      return { url: current.href, ok: false, title: '', text: '', error: 'empty' };
    }

    return {
      url: current.href,
      ok: true,
      title: text.split('\n')[0]?.slice(0, 200) ?? '',
      text
    };
  } catch (err) {
    const error = (err as Error)?.name === 'AbortError' ? 'timeout' : 'fetch-failed';
    return { url: url.href, ok: false, title: '', text: '', error };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Should this run read the website?
 *
 * `mode`:
 *  - `'auto'` (default) — only when the project's own text is too thin to plan
 *    from. This is the whole point: extra context where context is missing,
 *    no cost where the rikma already described itself.
 *  - `'always'` — the member ticked the box.
 *  - `'never'` — the member unticked it.
 */
export function shouldAnalyzeSite(
  input: { description?: string | null; linkToWebsite?: string | null },
  mode: 'auto' | 'always' | 'never' = 'auto'
): boolean {
  if (mode === 'never') return false;
  if (!normalizeSiteUrl(input.linkToWebsite)) return false;
  if (mode === 'always') return true;
  return (input.description ?? '').trim().length < THIN_DESCRIPTION_CHARS;
}
