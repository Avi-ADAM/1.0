/**
 * What a product picture may be — one rule for every way a picture reaches
 * Strapi from the shop tools (the /upload/<token> page, a public URL the
 * server fetches, base64 an agent sends).
 *
 * Narrower than `$lib/uploads/policy` on purpose: that list is for a rikma's
 * documents (PDF, Office, SVG…). A storefront picture is shown to strangers
 * on the public product page, so only the three raster formats every browser
 * draws safely are allowed — no SVG (it can carry script), no GIF.
 *
 * The declared type is never trusted alone: the first bytes must say the same
 * thing (`sniffImage`). A `.jpg` that is really HTML is refused.
 *
 * Browser-safe (no node imports): the upload page uses the same limits to
 * refuse a file before it spends the upload.
 */

export const IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type ImageMime = (typeof IMAGE_MIME)[number];

/**
 * One file through the upload page. The page posts to a serverless function
 * whose request body is capped near 4.5 MB on Vercel, so the page shrinks a
 * phone photo before sending (`UPLOAD_MAX_EDGE`) and the server refuses
 * anything above this.
 */
export const PAGE_MAX_BYTES = 4 * 1024 * 1024;
/** A picture the server downloads itself: the bytes never cross the inbound limit. */
export const URL_MAX_BYTES = 10 * 1024 * 1024;
/** Decoded size of a base64 picture inside an MCP call (the call itself is a request body). */
export const BASE64_MAX_BYTES = 3 * 1024 * 1024;
/** The long edge the page scales a photo down to before upload. */
export const UPLOAD_MAX_EDGE = 2400;

export const SESSION_MAX_FILES = 20;
export const SESSION_DEFAULT_FILES = 10;
export const SESSION_TTL_MINUTES = 60;

export type ImageRefusal = { code: 'type' | 'size' | 'empty' | 'mismatch'; message: string };

/** The format the bytes really are, or null. */
export function sniffImage(bytes: Uint8Array): ImageMime | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  )
    return 'image/png';
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && // R
    bytes[1] === 0x49 && // I
    bytes[2] === 0x46 && // F
    bytes[3] === 0x46 && // F
    bytes[8] === 0x57 && // W
    bytes[9] === 0x45 && // E
    bytes[10] === 0x42 && // B
    bytes[11] === 0x50 // P
  )
    return 'image/webp';
  return null;
}

export function isImageMime(v: unknown): v is ImageMime {
  return (IMAGE_MIME as readonly unknown[]).includes(String(v ?? '').toLowerCase().split(';')[0].trim());
}

const mb = (n: number) => `${Math.round((n / (1024 * 1024)) * 10) / 10}MB`;

/**
 * Null when the bytes may go up; otherwise why not. `declared` is what the
 * sender claimed (a Content-Type, a File.type); when present it must agree
 * with the bytes.
 */
export function checkImage(bytes: Uint8Array, maxBytes: number, declared?: string | null): ImageRefusal | null {
  if (!bytes.length) return { code: 'empty', message: 'The file is empty.' };
  if (bytes.length > maxBytes) {
    return { code: 'size', message: `The picture is ${mb(bytes.length)}; the limit is ${mb(maxBytes)}.` };
  }
  const real = sniffImage(bytes);
  if (!real) return { code: 'type', message: 'Only JPG, PNG or WebP pictures can be uploaded.' };
  const claimed = declared ? String(declared).toLowerCase().split(';')[0].trim().replace(/^image\/jpg$/, 'image/jpeg') : '';
  // `application/octet-stream` and an empty type say nothing; the bytes decide.
  if (claimed && claimed !== 'application/octet-stream' && claimed !== real) {
    if (!isImageMime(claimed)) return { code: 'type', message: 'Only JPG, PNG or WebP pictures can be uploaded.' };
    return { code: 'mismatch', message: `The file says ${claimed} but its content is ${real}.` };
  }
  return null;
}

export function extensionOf(mime: ImageMime): string {
  return mime === 'image/jpeg' ? 'jpg' : mime === 'image/png' ? 'png' : 'webp';
}

/** A file name safe to store: no path, no control characters, the right extension. */
export function safeFileName(raw: unknown, mime: ImageMime): string {
  const base = String(raw ?? '')
    .split(/[\\/]/)
    .pop()!
    .replace(/[\u0000-\u001f<>:"|?*]+/g, '')
    .replace(/\.[a-z0-9]{1,5}$/i, '')
    .trim()
    .slice(0, 80);
  return `${base || 'picture'}.${extensionOf(mime)}`;
}
