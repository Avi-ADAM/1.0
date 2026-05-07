import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

/**
 * POST /api/upload
 *
 * Proxies file uploads to Strapi after validating auth.
 * Expects multipart/form-data with a 'files' field.
 * Returns the Strapi upload response (array of uploaded files).
 */
export const POST: RequestHandler = async ({ request, cookies, fetch }) => {
  const jwt = cookies.get('jwt');

  if (!jwt) {
    throw error(401, 'Authentication required. Please log in.');
  }

  try {
    // Clone the incoming form data so we can forward it to Strapi
    const formData = await request.formData();

    const baseUrl = import.meta.env.VITE_URL;
    const strapiUploadUrl = `${baseUrl}/api/upload`;

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
