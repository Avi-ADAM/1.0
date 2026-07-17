/**
 * Permission introspection — "may THIS token run THAT operation?"
 *
 * Answers from the same static authorization layer the proxy endpoints
 * enforce (src/lib/server/authz/), without executing anything.
 *
 * GET  /api/permissions
 *   → { principal, ops: string[] } — every operation the calling token may
 *     run (send:<qid> + action:<actionKey>). 'conditional' ops are included:
 *     they are reachable, subject to entity-level rules at execution time.
 *
 * POST /api/permissions
 *   Body: { ops: string[] }  (max 100)
 *   → { principal, results: { [op]: { result: 'allowed'|'denied'|'conditional',
 *                                     reason? } } }
 *
 * Authentication: the caller's own credentials — httpOnly cookies (user) or
 * Authorization: Bearer 1lev1_… (API key). Anonymous callers get 401 rather
 * than a wall of "denied" (avoids operation-name enumeration).
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import {
  resolveCookiePrincipal,
  resolveApiKeyPrincipal
} from '$lib/server/authz/principal.js';
import { authorizeOperation } from '$lib/server/authz/authorize.js';
import type { Principal } from '$lib/server/authz/types.js';
import { qidsAccess } from '../send/qidsAccess.js';
import { getAllActionKeys } from '$lib/server/actions/registry.js';
// Register action configurations
import '$lib/server/actions/configs/index.js';

const MAX_OPS_PER_CHECK = 100;

async function resolveCaller(request: Request, cookies: { get(name: string): string | undefined }): Promise<Principal> {
  const authHeader = request.headers.get('Authorization');
  if (authHeader) {
    const principal = await resolveApiKeyPrincipal(authHeader);
    if (principal) return principal;
    // A presented-but-invalid key must not fall back to cookies
    throw error(401, 'Invalid or expired API key');
  }
  const principal = resolveCookiePrincipal(cookies);
  if (principal.kind === 'anonymous') {
    throw error(401, 'Authentication required');
  }
  return principal;
}

export const GET: RequestHandler = async ({ request, cookies }) => {
  const principal = await resolveCaller(request, cookies);

  const ops: string[] = [];
  for (const qid of Object.keys(qidsAccess)) {
    const op = `send:${qid}`;
    if (authorizeOperation(principal, op).result !== 'denied') ops.push(op);
  }
  for (const key of getAllActionKeys()) {
    const op = `action:${key}`;
    if (authorizeOperation(principal, op).result !== 'denied') ops.push(op);
  }

  return json({ principal: principal.kind, ops });
};

export const POST: RequestHandler = async ({ request, cookies }) => {
  const principal = await resolveCaller(request, cookies);

  let body: any;
  try {
    body = await request.json();
  } catch {
    throw error(400, 'Invalid JSON body');
  }

  const ops = body?.ops;
  if (!Array.isArray(ops) || ops.length === 0 || ops.some((o) => typeof o !== 'string')) {
    throw error(400, 'Body must be { ops: string[] }');
  }
  if (ops.length > MAX_OPS_PER_CHECK) {
    throw error(400, `Too many ops — max ${MAX_OPS_PER_CHECK} per request`);
  }

  const results: Record<string, { result: string; reason?: string }> = {};
  for (const op of ops) {
    const decision = authorizeOperation(principal, op);
    results[op] = decision.reason
      ? { result: decision.result, reason: decision.reason }
      : { result: decision.result };
  }

  return json({ principal: principal.kind, results });
};
