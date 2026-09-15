import { env } from '$env/dynamic/private';

// Frontend origins allowed to call /api/* cross-origin (the api.1lev1.com
// instance serving browsers that load the app from Vercel). Cookies ride along
// because *.1lev1.com is same-site; CORS is what un-blocks the JS response.
// Override with CORS_ALLOWED_ORIGINS (comma-separated) in the runtime .env.
//
// The same list decides where a flow that leaves for another site (GitHub) may
// send the member back to — see src/routes/api/v1/github/.
export const DEFAULT_CORS_ORIGINS = [
  'https://www.1lev1.com',
  'https://1lev1.com',
  'https://app.1lev1.com',
  // dev: hosts-file alias dev.1lev1.com → 127.0.0.1 keeps cookies same-site
  'http://dev.1lev1.com:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

export function allowedCorsOrigins() {
  const fromEnv = (env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  return fromEnv.length ? fromEnv : DEFAULT_CORS_ORIGINS;
}

/**
 * Is `value` exactly one of the frontend origins — no path, no lookalike host?
 *
 * @param {string | null | undefined} value
 * @returns {boolean}
 */
export function isAllowedFrontendOrigin(value) {
  if (!value) return false;
  let origin;
  try {
    origin = new URL(value).origin;
  } catch {
    return false;
  }
  return origin === value.replace(/\/+$/, '') && allowedCorsOrigins().includes(origin);
}
