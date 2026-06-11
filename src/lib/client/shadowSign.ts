// Shadow-signing orchestrator (PLAN_action_migration_vs_p2p §6.3, Phase 1).
//
// When an action has a `consentSpec`, the user's tab also signs a parallel
// ConsentEvent and ships it to the mirror at /api/consent/events. The signed
// event is independent of the action's Strapi mutation — Phase 1 doesn't
// enforce linkage; it just establishes the shadow chain.
//
// Phase 1.5 will start enforcing that no consent-bearing action lands without
// a valid signature; Phase 2 will swap the action's storage path entirely.
// Until then: belt + suspenders. Both happen.

import { browser } from '$app/environment';
import type { ConsentSpec } from '$lib/server/actions/types';
import type { ConsentEvent, ActionName } from '$lib/consent/event';

export type SignableConsentEvent = {
  action: ActionName;
  subject: { type: string; id: string };
  predicate?: Record<string, unknown>;
  parents?: string[];
};

/**
 * Pure derivation: action params + spec → ConsentEvent template (no signature).
 * Exported separately so we can unit-test the mapping without needing a
 * CryptoKey, IndexedDB, or fetch.
 *
 * Returns `null` when the spec's action deriver decides this invocation
 * should NOT emit a consent event (e.g., addVote with type='pend' but Phase 1
 * only covers tosplit). The caller treats null as "shadow-skip".
 */
export function deriveConsentEventFromAction(
  spec: ConsentSpec,
  params: Record<string, unknown>
): SignableConsentEvent | null {
  const actionName = typeof spec.action === 'function' ? spec.action(params) : spec.action;
  if (actionName === null) return null;

  const subjectType =
    typeof spec.subjectType === 'function' ? spec.subjectType(params) : spec.subjectType;

  const rawSubjectId = params[spec.subjectIdParam];
  if (rawSubjectId === undefined || rawSubjectId === null) {
    throw new Error(`deriveConsentEventFromAction: missing subject id param ${spec.subjectIdParam}`);
  }
  const subjectId = String(rawSubjectId);

  let predicate: Record<string, unknown>;
  if (spec.predicateFromParams) {
    predicate = spec.predicateFromParams(params);
  } else {
    // Default: copy params, drop the subject id (it lives in subject.id, no
    // need to duplicate). Keep userId out — actor is bound at sign time from
    // the session, not from the payload.
    const copy: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(params)) {
      if (k === spec.subjectIdParam) continue;
      if (k === 'userId') continue;
      copy[k] = v;
    }
    predicate = copy;
  }

  return {
    action: actionName as ActionName,
    subject: { type: subjectType, id: subjectId },
    predicate,
    parents: spec.parentsFromParams ? spec.parentsFromParams(params) : []
  };
}

export type ShadowSignResult =
  | { ok: true; event: ConsentEvent }
  | { ok: false; reason: string };

/**
 * Sign and ship a shadow ConsentEvent for the given action.
 *
 * Lazy-imports `signAndPublish` so this module stays SSR-safe (the publish
 * path touches browser-only APIs like IndexedDB and crypto.subtle).
 *
 * Returns `{ ok: false, reason: 'not_browser' }` on the server — the caller
 * should ignore that branch silently in SSR contexts.
 */
export async function signActionShadow(
  userId: string,
  spec: ConsentSpec,
  params: Record<string, unknown>
): Promise<ShadowSignResult> {
  if (!browser) return { ok: false, reason: 'not_browser' };
  if (!userId) return { ok: false, reason: 'no_user_id' };

  let template: SignableConsentEvent | null;
  try {
    template = deriveConsentEventFromAction(spec, params);
  } catch (e) {
    return { ok: false, reason: 'derive_failed: ' + (e as Error).message };
  }
  if (template === null) return { ok: false, reason: 'skipped' };

  try {
    const { signAndPublish } = await import('$lib/consent/publish');
    const res = await signAndPublish(userId, {
      actor: userId,
      action: template.action,
      subject: template.subject,
      predicate: template.predicate,
      parents: template.parents
    });
    if (!res.ok) return { ok: false, reason: 'publish_failed:' + res.reason };
    return { ok: true, event: res.event };
  } catch (e) {
    return { ok: false, reason: 'sign_threw: ' + (e as Error).message };
  }
}
