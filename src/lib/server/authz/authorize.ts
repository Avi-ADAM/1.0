/**
 * Central authorization decision for proxy operations.
 *
 * Operation strings:
 *   send:<qid>          — a GraphQL query/mutation via /api/send (whitelist qids.js)
 *   action:<actionKey>  — a Unified Action via /api/action or /api/v1/actions
 *
 * Two layers:
 *   1. This module — STATIC, principal-kind × operation, answered from the
 *      manifests (qidsAccess.js / ActionConfig.access) without touching Strapi.
 *      Cheap and synchronous, also powers the introspection endpoint.
 *   2. Entity-level rules — ActionService's authRules and the inline guards in
 *      /api/send (ownership, membership). Those still run AFTER this layer;
 *      when they exist the static answer is 'conditional', not 'allowed'.
 *
 * Rollout is controlled by AUTHZ_MODE (dynamic env):
 *   off      — compute nothing, never block
 *   log      — compute + log denials, never block (default; shadow mode)
 *   enforce  — denials return 403
 * API-key traffic is ALWAYS enforced regardless of mode: that path was
 * deny-by-default before this layer existed, so shadow mode would loosen it.
 *
 * See docs/PLAN_API_PERMISSIONS.md.
 */

import { env } from '$env/dynamic/private';
import { getAction } from '$lib/server/actions/registry.js';
import { qidsAccess } from '../../../routes/api/send/qidsAccess.js';
import type { AuthzDecision, Principal, PrincipalKind } from './types.js';

/** Actions that predate the `access` field keep today's reachability. */
export const DEFAULT_ACTION_ACCESS: PrincipalKind[] = ['user', 'serviceAdmin'];

export type AuthzMode = 'off' | 'log' | 'enforce';

export function getAuthzMode(): AuthzMode {
  const mode = env.AUTHZ_MODE;
  return mode === 'enforce' || mode === 'off' ? mode : 'log';
}

function denied(reason: string): AuthzDecision {
  return { result: 'denied', reason };
}

/** True when a scope list imposes no restriction. */
function unrestricted(list: string[] | undefined): boolean {
  return !list || list.length === 0 || list.includes('*');
}

/**
 * Static decision: may this principal run this operation at all?
 * Does not evaluate entity-level rules — returns 'conditional' when such
 * rules exist and the principal is otherwise allowed.
 */
export function authorizeOperation(principal: Principal, op: string): AuthzDecision {
  const sep = op.indexOf(':');
  if (sep <= 0 || sep === op.length - 1) {
    return denied(`Malformed operation "${op}" — expected send:<qid> or action:<actionKey>`);
  }
  const ns = op.slice(0, sep);
  const key = op.slice(sep + 1);

  let allow: PrincipalKind[];
  let hasEntityRules = false;

  if (ns === 'send') {
    const entry = (qidsAccess as Record<string, { allow: PrincipalKind[] }>)[key];
    if (!entry) return denied(`Unknown qid "${key}"`);
    allow = entry.allow;
  } else if (ns === 'action') {
    const config = getAction(key);
    if (!config) return denied(`Unknown action "${key}"`);
    allow = config.access ?? DEFAULT_ACTION_ACCESS;
    hasEntityRules = (config.authRules ?? []).some((r) => r.type !== 'jwt');
  } else {
    return denied(`Unknown operation namespace "${ns}"`);
  }

  if (!allow.includes(principal.kind)) {
    return denied(`Principal kind "${principal.kind}" is not allowed to run ${op}`);
  }

  // API-key op scopes narrow further than the manifest
  if (principal.kind === 'apiKey' && !unrestricted(principal.scopes?.ops)) {
    if (!principal.scopes!.ops!.includes(op)) {
      return denied(`API key scope does not include ${op}`);
    }
  }

  if (hasEntityRules) {
    return { result: 'conditional', reason: 'Entity-level authRules are evaluated at execution time' };
  }
  return { result: 'allowed' };
}

/**
 * Project-scope check for API keys (params-dependent, so separate from the
 * static decision). A key scoped to specific projects may only run operations
 * whose params name one of those projects.
 */
export function checkApiKeyProjectScope(
  principal: Principal,
  params: Record<string, any> | undefined
): AuthzDecision {
  if (principal.kind !== 'apiKey') return { result: 'allowed' };
  const projects = principal.scopes?.projects;
  if (unrestricted(projects)) return { result: 'allowed' };

  const pid = params?.projectId ?? params?.pid ?? params?.project;
  if (pid == null || pid === '') {
    return denied(
      'This API key is limited to specific projects; the operation params must include projectId'
    );
  }
  if (!projects!.map(String).includes(String(pid))) {
    return denied(`API key is not scoped to project ${pid}`);
  }
  return { result: 'allowed' };
}

/**
 * Enforcement wrapper used by the endpoints.
 * Returns blocked:true only when the caller should respond 403.
 */
export function applyAuthz(opts: {
  principal: Principal;
  op: string;
  params?: Record<string, any>;
  mode?: AuthzMode;
}): { blocked: boolean; decision: AuthzDecision } {
  const { principal, op, params } = opts;
  const mode = opts.mode ?? getAuthzMode();

  if (mode === 'off' && principal.kind !== 'apiKey') {
    return { blocked: false, decision: { result: 'allowed' } };
  }

  let decision = authorizeOperation(principal, op);
  if (decision.result !== 'denied' && principal.kind === 'apiKey') {
    const scopeDecision = checkApiKeyProjectScope(principal, params);
    if (scopeDecision.result === 'denied') decision = scopeDecision;
  }

  if (decision.result !== 'denied') return { blocked: false, decision };

  // API keys: always enforce (pre-existing deny-by-default path).
  if (principal.kind === 'apiKey' || mode === 'enforce') {
    return { blocked: true, decision };
  }

  console.warn(
    `[authz-shadow] denied ${op} principal=${principal.kind}` +
      ` uid=${principal.userId ?? '-'} reason=${decision.reason}`
  );
  return { blocked: false, decision };
}
