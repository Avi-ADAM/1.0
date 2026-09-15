import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { githubAppConfig, githubWebhookSecret } from '$lib/server/github/config.js';

/**
 * GET /api/v1/github/status — is the GitHub App configured on the API instance?
 *
 * The secrets live only on api.1lev1.com. A page rendered on Vercel asks here
 * (its relative `/api/*` fetch is re-pointed at the API by `handleFetch`) to
 * decide whether to show the connect button. Booleans only — nothing secret.
 */
export const GET: RequestHandler = async () => {
  return json({ configured: githubAppConfig() !== null, webhook: githubWebhookSecret() !== null });
};
