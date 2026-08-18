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
    // A permission failure and a closed nginx gate both answer with a status
    // and a non-JSON body, and `res.json()` on its own turned either one into
    // an unrelated parse error — which is how a missing role permission on a
    // freshly added collection reads as "Unexpected token < in JSON".
    // 403 in particular has two very different causes worth telling apart:
    // Strapi (the Authenticated role lacks find/create/update on the
    // collection) or the gate in front of it (no `x-strapi-gate`).
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(
        `Strapi ${res.status} ${res.statusText} — ${body.slice(0, 300) || '(empty body)'}`,
      );
    }
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
