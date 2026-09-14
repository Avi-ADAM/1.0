/**
 * One opaque URL parameter for an agent-prepared form.
 *
 * The prepare tools (`createProjectTool`, `prepareMissionTool`) used to put
 * every field in its own query param. Those URLs are handed to an agent, which
 * hands them to a human — and anything on the way that decodes the link once
 * (a markdown renderer, an agent "tidying" it) turns every `%26` in the text
 * back into `&`. The first `&` inside an HTML description then ends that
 * parameter, and a `#` (from `&#39;`) turns the rest of the query into a hash:
 * the description arrived empty and every field after it was gone, with no
 * error anywhere.
 *
 * A draft is now JSON → deflate-raw → base64url, behind a version prefix. That
 * alphabet has no `&`, `#`, `%` or `+`, so decoding the URL any number of times
 * leaves it intact, and compression keeps a long Hebrew description well inside
 * proxy limits. What comes out of `decodeDraftParam` is untrusted `unknown` —
 * each form's own `sanitize…` decides what to keep.
 *
 * Isomorphic: `CompressionStream`, `btoa` and `atob` exist in Node 22 and in
 * every browser the site supports.
 */

/** Version prefix, so the format can change without misreading old links. */
const PREFIX = 'd1.';

/**
 * Longest `draft` value a tool will hand out. nginx's default request line
 * buffer is 8KB; this leaves room for the path and the other headers. A draft
 * over it is refused at the tool, loudly, instead of failing at the proxy.
 */
export const MAX_DRAFT_PARAM = 6000;

/** Where the tools point an agent outside the site — it cannot open a relative link. */
export const SITE_ORIGIN = 'https://1lev1.com';

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream) {
  const out = new Blob([bytes as Uint8Array<ArrayBuffer>]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/** Any JSON-able value → the value of a `draft` query parameter. */
export async function encodeDraftParam(value: unknown): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(value));
  return PREFIX + toBase64Url(await pipe(json, new CompressionStream('deflate-raw')));
}

/** A `draft` query parameter → the parsed JSON, or `null` if it cannot be read. Never throws. */
export async function decodeDraftParam(param: string | null | undefined): Promise<unknown | null> {
  const raw = String(param ?? '').trim();
  if (!raw.startsWith(PREFIX) || !/^[A-Za-z0-9_-]+$/.test(raw.slice(PREFIX.length))) return null;
  try {
    const bytes = await pipe(fromBase64Url(raw.slice(PREFIX.length)), new DecompressionStream('deflate-raw'));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

const ENTITIES: Record<string, string> = {
  lt: '<',
  gt: '>',
  amp: '&',
  quot: '"',
  apos: "'",
  nbsp: ' '
};

/**
 * A description field is HTML. An agent that HTML-escaped it (`&lt;p&gt;…`)
 * would get the markup shown to the member as literal text — so a string with
 * no real tag but with escaped ones is unescaped once. Anything that already
 * has a tag is left exactly as written.
 */
export function normalizeDraftHtml(html: string): string {
  if (!html) return '';
  if (/<[a-z!/]/i.test(html) || !/&lt;\/?[a-z]/i.test(html)) return html;
  return html.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, ref: string) => {
    if (ref[0] === '#') {
      const code =
        ref[1] === 'x' || ref[1] === 'X' ? parseInt(ref.slice(2), 16) : parseInt(ref.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[ref.toLowerCase()] ?? m;
  });
}

/** A trimmed, capped, non-empty string — or `undefined`. */
export function draftString(v: unknown, max: number): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined;
}

/** A de-duplicated list of trimmed, capped, non-empty strings — or `undefined` when empty. */
export function draftStringList(v: unknown, maxItem: number, maxItems: number): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const list = [
    ...new Set(v.map((x) => draftString(x, maxItem)).filter((x): x is string => !!x))
  ].slice(0, maxItems);
  return list.length ? list : undefined;
}
