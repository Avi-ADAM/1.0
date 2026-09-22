/**
 * How the shift store reaches Strapi.
 *
 * The same shape as `archive/exec.ts`, with one addition: GraphQL variables.
 * `pattern`, `quotaSnapshot` and `balanceCache` are JSON whose keys are user
 * ids — "12" is not a GraphQL name, so those objects cannot be written as
 * inline literals and must travel as variables.
 *
 * Two transports, one store:
 *   asUser    — actions and page loads. Carries the member's JWT; the
 *               Authenticated role governs what it may touch.
 *   asService — the cron (materialize, draft, close) and the timegrama, which
 *               act with no user in the request.
 * The global server `fetch` is patched in hooks.server.js to stamp the
 * `x-strapi-gate` secret, so both pass nginx.
 */

import { env } from '$env/dynamic/private';
import { STRAPI_GRAPHQL } from '$lib/server/strapiUrl.js';

export type ShiftExec = (query: string, variables?: Record<string, unknown>) => Promise<any>;

async function post(f: typeof fetch, token: string | undefined, query: string, variables?: Record<string, unknown>) {
  const res = await f(STRAPI_GRAPHQL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(variables ? { query, variables } : { query })
  });
  // A missing role permission on a new collection answers 403 with a non-JSON
  // body; say so instead of failing on JSON.parse (see 1.0b CLAUDE.md).
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Strapi ${res.status} ${res.statusText} — ${body.slice(0, 300) || '(empty body)'}`);
  }
  return res.json();
}

export function asUser(context: { jwt?: unknown; fetch?: typeof fetch }): ShiftExec {
  const f = (context.fetch ?? fetch) as typeof fetch;
  const jwt = context.jwt ? String(context.jwt) : undefined;
  return (query, variables) => post(f, jwt, query, variables);
}

export function asService(f: typeof fetch = fetch): ShiftExec {
  const token = env.ADMINMONTHER;
  if (!token) throw new Error('[shifts] ADMINMONTHER is not configured — the service transport cannot run');
  return (query, variables) => post(f, token, query, variables);
}

/** Run a document; throw with the GraphQL error text when it fails. */
export async function run(exec: ShiftExec, query: string, label: string, variables?: Record<string, unknown>) {
  const res = await exec(query, variables);
  if (res?.errors?.length) throw new Error(`[shifts:${label}] ${JSON.stringify(res.errors).slice(0, 800)}`);
  return res?.data ?? null;
}

/** A GraphQL string literal. */
export const q = (v: unknown) => JSON.stringify(String(v ?? ''));
