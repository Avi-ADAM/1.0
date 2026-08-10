/**
 * Transport adapters for the archival module (PLAN_OBJECT_ARCHIVAL).
 *
 * The archival logic is written once against `Exec`; these are the two ways it
 * reaches Strapi. Keeping them here (rather than inline at each call site)
 * is what stops the vote path and the cron path from drifting apart.
 */

import { STRAPI_GRAPHQL } from '$lib/server/strapiUrl.js';
import type { Exec } from './gql.js';

/**
 * Run as the acting user. Authorization already happened in the action layer
 * (`projectMember` + the target checks), so this deliberately carries the
 * caller's JWT rather than the admin token.
 */
export function execFromContext(context: {
  jwt?: unknown;
  fetch?: typeof fetch;
}): Exec {
  const f = (context.fetch ?? fetch) as typeof fetch;
  const jwt = context.jwt as string | undefined;

  return async (query: string) => {
    const res = await f(STRAPI_GRAPHQL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
      },
      body: JSON.stringify({ query }),
    });
    return res.json();
  };
}

/**
 * Run as the service account — for the timegrama cron, which matures
 * decisions with no user in the request at all.
 */
export function execFromAdmin(
  sendToAdmin: (query: string, secret: string) => Promise<any>,
  secret: string,
): Exec {
  return (query: string) => sendToAdmin(query, secret);
}
