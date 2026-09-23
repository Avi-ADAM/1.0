/**
 * What a member may upload — one list for both upload paths.
 *
 * `/api/upload` (the Strapi → Cloudinary proxy, 15 MB, used by profile photos
 * and every stage-1 document) and `/api/v1/space-docs/upload-url` (direct to
 * the private R2 bucket, stage 2 of docs/PLAN_RIKMA_SHARED_INFO.md) used to be
 * one list that only the proxy knew. Two copies of a whitelist drift, and the
 * one that drifts looser is the one nobody notices — so it lives here, and the
 * browser imports it too to refuse a file before it has spent the upload.
 *
 * Deliberately no executables and no `application/octet-stream`: an unknown
 * type is exactly what a whitelist exists to refuse.
 */

export const ALLOWED_MIME: ReadonlySet<string> = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.oasis.opendocument.presentation',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/x-zip-compressed'
]);

/** The proxy's cap: the body passes through our server on its way to Strapi. */
export const PROXY_MAX_BYTES = 15 * 1024 * 1024;

/**
 * The direct-to-R2 cap. The bytes never touch our server, so the proxy's
 * limit does not apply; this one is about not letting a single upload become
 * the rikma's whole storage bill. Overridable per deployment
 * (`SPACE_DOCS_MAX_MB`), and reported to the page so the hint is honest.
 */
export const DIRECT_MAX_BYTES_DEFAULT = 100 * 1024 * 1024;

export type UploadRefusal = { code: 'type' | 'size' | 'empty'; message: string };

/** Null when the file may go up; otherwise why not. */
export function checkUpload(
  file: { type?: string; size?: number; name?: string },
  maxBytes: number
): UploadRefusal | null {
  const size = Number(file.size ?? 0);
  if (!Number.isFinite(size) || size <= 0) {
    return { code: 'empty', message: `File "${file.name ?? ''}" is empty` };
  }
  if (size > maxBytes) {
    return {
      code: 'size',
      message: `File "${file.name ?? ''}" exceeds the ${Math.round(maxBytes / (1024 * 1024))}MB limit`
    };
  }
  if (!ALLOWED_MIME.has(String(file.type ?? ''))) {
    return { code: 'type', message: `Unsupported file type: ${file.type || 'unknown'}` };
  }
  return null;
}
