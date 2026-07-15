import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { STRAPI_URL } from '$env/static/private';

/**
 * POST /api/upload
 *
 * Proxies file uploads to Strapi after validating auth.
 * Expects multipart/form-data with a 'files' field.
 * Returns the Strapi upload response (array of uploaded files).
 */
// Guard rails for proxied uploads. Keep in sync with the Strapi provider limits.
const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15 MB per file
const ALLOWED_MIME = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]);

export const POST: RequestHandler = async ({ request, cookies, fetch }) => {
  const jwt = cookies.get('jwt');

  if (!jwt) {
    throw error(401, 'Authentication required. Please log in.');
  }

  try {
    // Clone the incoming form data so we can forward it to Strapi
    const formData = await request.formData();

    // ── Validate every uploaded file before forwarding (size + MIME whitelist) ──
    const files = formData.getAll('files').filter((v): v is File => v instanceof File);
    if (files.length === 0) {
      throw error(400, 'No files provided');
    }
    for (const file of files) {
      if (file.size > MAX_FILE_BYTES) {
        throw error(413, `File "${file.name}" exceeds the ${MAX_FILE_BYTES / (1024 * 1024)}MB limit`);
      }
      if (!ALLOWED_MIME.has(file.type)) {
        throw error(415, `Unsupported file type: ${file.type || 'unknown'}`);
      }
    }

    const strapiUploadUrl = `${STRAPI_URL}/api/upload`;

    const response = await fetch(strapiUploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `bearer ${jwt}`
      },
      body: formData
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Strapi upload failed:', response.status, text);
      throw error(response.status, 'Upload to Strapi failed');
    }

    const data = await response.json();
    return json(data);
  } catch (e) {
    if (e && typeof e === 'object' && 'status' in e && 'body' in e) {
      throw e;
    }
    console.error('Unexpected error in upload endpoint:', e);
    throw error(500, e instanceof Error ? e.message : 'Upload failed');
  }
};
