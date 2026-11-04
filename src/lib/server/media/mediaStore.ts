/**
 * Putting a product picture into Strapi's media library, from the three
 * places one can come from (the upload page, a public URL, base64 from an
 * agent) — after `$lib/media/imagePolicy` has looked at the bytes.
 *
 * Strapi is only the store here: the upload plugin's own REST endpoint
 * (`POST /api/upload`) on the service token, no custom controller. The token
 * never leaves the server, which is why every caller is fenced before it gets
 * here (MCP guard: rikma member; the page: a signed, unexpired session whose
 * user is still a member).
 */

import { lookup } from 'node:dns/promises';
import { STRAPI_URL } from '$lib/server/strapiUrl.js';
import { adminToken } from '$lib/server/adminToken.js';
import { isBlockedHost } from '$lib/server/planning/siteContext.js';
import {
  BASE64_MAX_BYTES,
  URL_MAX_BYTES,
  checkImage,
  safeFileName,
  sniffImage,
  type ImageMime
} from '$lib/media/imagePolicy.js';

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface StoredMedia {
  uploadId: string;
  url: string;
  fileName: string;
  mime: string | null;
  width: number | null;
  height: number | null;
  sizeKb: number | null;
}

export class MediaRefused extends Error {
  constructor(
    public code: 'type' | 'size' | 'empty' | 'mismatch' | 'url' | 'fetch' | 'store' | 'limit',
    message: string
  ) {
    super(message);
    this.name = 'MediaRefused';
  }
}

const n = (v: unknown): number | null => (v == null || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));

export function storedOf(row: any): StoredMedia | null {
  const a = row?.attributes ?? row;
  const id = row?.id ?? a?.id;
  if (id == null || !a?.url) return null;
  return {
    uploadId: String(id),
    url: String(a.url),
    fileName: String(a.name ?? ''),
    mime: a.mime ? String(a.mime) : null,
    width: n(a.width),
    height: n(a.height),
    sizeKb: n(a.size)
  };
}

/** Upload checked bytes; the stored file. */
export async function storeImage(args: {
  bytes: Uint8Array;
  mime: ImageMime;
  fileName: string;
  caption?: string | null;
  fetch?: FetchLike;
}): Promise<StoredMedia> {
  const form = new FormData();
  const name = safeFileName(args.fileName, args.mime);
  form.append('files', new Blob([args.bytes as Uint8Array<ArrayBuffer>], { type: args.mime }), name);
  form.append('fileInfo', JSON.stringify({ name, caption: args.caption ?? null, alternativeText: name.replace(/\.[a-z]+$/, '') }));
  const doFetch = args.fetch ?? fetch;
  const res = await doFetch(`${STRAPI_URL}/api/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken()}` },
    body: form
  });
  if (!res.ok) {
    console.error('[mediaStore] Strapi upload failed:', res.status, await res.text().catch(() => ''));
    throw new MediaRefused('store', 'The picture could not be stored right now. Try again shortly.');
  }
  const out = await res.json().catch(() => null);
  const stored = storedOf(Array.isArray(out) ? out[0] : null);
  if (!stored) throw new MediaRefused('store', 'The picture could not be stored right now. Try again shortly.');
  return stored;
}

/** Check, then store. Throws MediaRefused with a sentence the user can act on. */
export async function storeCheckedImage(args: {
  bytes: Uint8Array;
  declaredMime?: string | null;
  fileName: string;
  maxBytes: number;
  caption?: string | null;
  fetch?: FetchLike;
}): Promise<StoredMedia> {
  const refusal = checkImage(args.bytes, args.maxBytes, args.declaredMime);
  if (refusal) throw new MediaRefused(refusal.code, refusal.message);
  return storeImage({ bytes: args.bytes, mime: sniffImage(args.bytes)!, fileName: args.fileName, caption: args.caption, fetch: args.fetch });
}

// ── base64 ──────────────────────────────────────────────────────────────────

/** `data:image/png;base64,…` or bare base64 → bytes and the declared type. */
export function decodeBase64Image(raw: string): { bytes: Uint8Array; declared: string | null } {
  const s = String(raw ?? '').trim();
  const m = /^data:([^;,]+)?(?:;[^,]*)?;base64,(.*)$/is.exec(s);
  const body = (m ? m[2] : s).replace(/\s+/g, '');
  if (!body || !/^[A-Za-z0-9+/_-]+={0,2}$/.test(body)) {
    throw new MediaRefused('type', 'The base64 text is not valid. Send the picture as base64 (optionally a data: URL).');
  }
  // Refuse before decoding something huge: 4 chars carry 3 bytes.
  if (Math.floor((body.length * 3) / 4) > BASE64_MAX_BYTES + 3) {
    throw new MediaRefused('size', `Base64 pictures are limited to ${BASE64_MAX_BYTES / (1024 * 1024)}MB. For a bigger one, use a public URL or createUploadSession.`);
  }
  return { bytes: new Uint8Array(Buffer.from(body, 'base64')), declared: m?.[1] ?? null };
}

// ── a public URL (SSRF-safe) ────────────────────────────────────────────────

const MAX_REDIRECTS = 3;
const FETCH_TIMEOUT_MS = 15_000;

function isBlockedAddress(address: string): boolean {
  // `::ffff:10.0.0.1` is an IPv4 address in IPv6 clothing.
  const v4mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(address);
  return isBlockedHost(v4mapped ? v4mapped[1] : address);
}

type Resolver = (host: string) => Promise<string[]>;
const dnsResolver: Resolver = async (host) => (await lookup(host, { all: true })).map((r) => r.address);

/**
 * A URL that may be fetched: http(s), default port, a public host — by name
 * and by every address the name resolves to (a public name pointing at
 * 10.0.0.5 is the classic way past a name-only check). Null when not.
 */
export async function safePublicUrl(raw: string, resolve: Resolver = dnsResolver): Promise<URL | null> {
  let url: URL;
  try {
    url = new URL(String(raw ?? '').trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  if (url.username || url.password) return null;
  if (url.port && url.port !== '80' && url.port !== '443') return null;
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (isBlockedHost(host)) return null;
  if (!host.includes('.') && !host.includes(':')) return null;
  try {
    const addresses = await resolve(host);
    if (!addresses.length || addresses.some(isBlockedAddress)) return null;
  } catch {
    return null;
  }
  return url;
}

async function readCapped(res: Response, maxBytes: number): Promise<Uint8Array> {
  const declared = Number(res.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new MediaRefused('size', `The picture at that URL is larger than ${maxBytes / (1024 * 1024)}MB.`);
  }
  const reader = res.body?.getReader();
  if (!reader) return new Uint8Array(await res.arrayBuffer());
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > maxBytes) {
      await reader.cancel().catch(() => {});
      throw new MediaRefused('size', `The picture at that URL is larger than ${maxBytes / (1024 * 1024)}MB.`);
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let at = 0;
  for (const c of chunks) {
    out.set(c, at);
    at += c.length;
  }
  return out;
}

/** Download a picture from a public URL; every redirect hop is re-checked. */
export async function fetchPublicImage(
  raw: string,
  opts: { fetch?: FetchLike; resolve?: Resolver; maxBytes?: number } = {}
): Promise<{ bytes: Uint8Array; declared: string | null; fileName: string }> {
  const doFetch = opts.fetch ?? fetch;
  let current = await safePublicUrl(raw, opts.resolve);
  if (!current) {
    throw new MediaRefused('url', 'That URL cannot be fetched: it must be a public http(s) address (no internal hosts, no custom ports).');
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      let res: Response;
      try {
        res = await doFetch(current.href, {
          method: 'GET',
          redirect: 'manual',
          signal: controller.signal,
          headers: { 'user-agent': '1lev1-media/1.0 (+https://1lev1.com)', accept: 'image/jpeg,image/png,image/webp' }
        });
      } catch {
        throw new MediaRefused('fetch', 'The picture could not be downloaded from that URL.');
      }
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get('location');
        const next = location ? await safePublicUrl(new URL(location, current).href, opts.resolve) : null;
        if (!next) throw new MediaRefused('url', 'That URL redirects somewhere that cannot be fetched.');
        current = next;
        continue;
      }
      if (!res.ok) throw new MediaRefused('fetch', `The URL answered ${res.status}; the picture was not downloaded.`);
      const bytes = await readCapped(res, opts.maxBytes ?? URL_MAX_BYTES);
      const fileName = decodeURIComponent(current.pathname.split('/').pop() || 'picture');
      return { bytes, declared: res.headers.get('content-type'), fileName };
    }
    throw new MediaRefused('url', 'That URL redirects too many times.');
  } finally {
    clearTimeout(timer);
  }
}
