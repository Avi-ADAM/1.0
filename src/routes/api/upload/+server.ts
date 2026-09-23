import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { STRAPI_URL } from '$lib/server/strapiUrl.js';
import { checkUpload, PROXY_MAX_BYTES } from '$lib/uploads/policy.js';

/**
 * POST /api/upload
 *
 * Proxies file uploads to Strapi after validating auth.
 * Expects multipart/form-data with a 'files' field.
 * Returns the Strapi upload response (array of uploaded files).
 */
// Guard rails for proxied uploads. The whitelist is shared with the direct
// R2 path (docs/PLAN_RIKMA_SHARED_INFO.md stage 2) — see $lib/uploads/policy.
// The cap is the proxy's own: these bytes pass through this server.

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
      const refusal = checkUpload(file, PROXY_MAX_BYTES);
      if (refusal) {
        throw error(refusal.code === 'size' ? 413 : refusal.code === 'type' ? 415 : 400, refusal.message);
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
