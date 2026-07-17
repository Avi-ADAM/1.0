/**
 * Server-only direct-to-Strapi GraphQL call, authenticated with the
 * admin/service token. This is the counterpart of $lib/send/sendTo.svelte's
 * cookie-JWT proxy branch — it exists for genuine server contexts (cron
 * routes, timegrama finalizers) that need to act with elevated permissions
 * rather than the requesting user's session. Never import this from a
 * .svelte component that reaches the client bundle.
 */
import { STRAPI_URL } from '$lib/server/strapiUrl.js';

const HTTP_ST_ENDPOINT = STRAPI_URL;

export async function SendToAdmin(dat, token) {
  const ep = HTTP_ST_ENDPOINT + '/graphql';
  const bearer1 = 'bearer' + ' ' + token;
  const response = await fetch(ep, {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify({ query: dat || {} }),
    headers: {
      'Content-Type': 'application/json',
      Authorization: bearer1
    }
  });
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const res = isJson ? await response.json() : await response.text();
  return res;
}
