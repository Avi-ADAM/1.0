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

/**
 * Pure derivation: which rikma does this shadow event belong to?
 * Specs may declare `projectIdFromParams`; the fallback covers the common
 * call-site convention (`params.projectId`, or `params.pid` on older actions).
 * Null = no project context — the event stays on the mirror-only path.
 */
export function deriveProjectIdFromAction(
  spec: ConsentSpec,
  params: Record<string, unknown>
): string | null {
  const raw = spec.projectIdFromParams
    ? spec.projectIdFromParams(params)
    : (params.projectId ?? params.pid);
  if (raw === undefined || raw === null || raw === '') return null;
  return String(raw);
}

export type ShadowSignResult =
  | { ok: true; event: ConsentEvent; reason?: undefined }
  | { ok: false; reason: string };

/**
 * Convenience wrapper for the common case: read the user id from the `id`
 * cookie, sign in the background, swallow any failure. Most action call
 * sites just want this one-liner after their executeAction succeeded.
 *
 * Returns a Promise that always resolves (never rejects). On success it
 * carries the signed event; on failure, the reason.
 */
export function shadowSignFromCookie(
  spec: ConsentSpec,
  params: Record<string, unknown>
): Promise<ShadowSignResult> {
  if (!browser) return Promise.resolve({ ok: false, reason: 'not_browser' });
  const cookieValueId = document.cookie
    .split('; ')
    .find((row) => row.startsWith('id='))
    ?.split('=')[1];
  if (!cookieValueId) return Promise.resolve({ ok: false, reason: 'no_cookie_id' });
  return signActionShadow(String(cookieValueId), spec, params).catch(
    (e: unknown) => ({ ok: false, reason: 'threw:' + (e as Error).message })
  );
}

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

  // Space-routed path (the distributed backup, HANDOFF T2↔T4 bridge): when
  // the event has a project context and the space layer is enabled, publish
  // it into the project's Space instead of POSTing the mirror directly —
  // relayAppend write-throughs to consentStore, so one pipe feeds both
  // stores, and the T1 socket wakes every subscribed replica.
  const projectId = deriveProjectIdFromAction(spec, params);
  if (projectId) {
    try {
      const { spaceSyncEnabled } = await import('$lib/space/spaceStore.svelte');
      if (spaceSyncEnabled()) {
        return await publishViaSpace(userId, projectId, template);
      }
    } catch (e) {
      console.warn('[shadow-sign] space route unavailable, using mirror path', e);
    }
  }

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

/**
 * Sign + apply locally + push into the project's Space (relay log).
 *
 * Local-first: replica.publish persists the signed event to IDB and the
 * space index BEFORE the network push, so a failed push is never data loss —
 * the next sync()'s computeDiff re-offers it to the relay.
 *
 * An E2E space (state.epoch >= 0) routes through publishSealed — plaintext
 * must never leave the device there (HANDOFF invariant 5); falling back to
 * the plaintext mirror POST would be a privacy leak, so a sealed failure is
 * reported as-is rather than "recovered".
 */
async function publishViaSpace(
  userId: string,
  projectId: string,
  template: SignableConsentEvent
): Promise<ShadowSignResult> {
  const [{ openSpace }, { spaceIdForProject }, { ensureIdentity }, { ensurePubkeyRegistered }] =
    await Promise.all([
      import('$lib/space/spaceStore.svelte'),
      import('$lib/space/protocol'),
      import('$lib/crypto/identity'),
      import('$lib/consent/publish')
    ]);

  // The relay verifies signatures server-side against the key registry —
  // the device key must be registered before its first push.
  const identity = await ensureIdentity(userId);
  await ensurePubkeyRegistered(identity);

  const replica = openSpace(spaceIdForProject(projectId));
  await replica.hydrate();

  const partial = {
    action: template.action,
    subject: template.subject,
    predicate: template.predicate,
    // Spec-declared parents win; otherwise undefined lets replica.publish
    // link to the current local heads, keeping the space a connected DAG.
    parents: template.parents && template.parents.length > 0 ? template.parents : undefined
  };

  const res =
    replica.state.epoch >= 0
      ? await replica.publishSealed(userId, partial)
      : await replica.publish(userId, partial);

  if (!res.ok) return { ok: false, reason: 'space_publish:' + (res.reason ?? 'unknown') };
  return { ok: true, event: res.event };
}
