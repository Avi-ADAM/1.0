import { signCanonical } from '$lib/crypto/sign';
import { randomNonceB64 } from '$lib/crypto/b64';
import type { IdentityRecord } from '$lib/crypto/identity';
import type { ConsentEvent, ActionName, Delta } from './event';
import type { QuorumProof } from './quorum';
import { EMIT_FORMAT_V2 } from './emitFormat';
import { deviceFingerprint } from '$lib/crypto/deviceId';

/**
 * The format bits a signer writes (B5): `v`, and `device` as SPKI or
 * deviceId. Decided by emitFormat.ts; the parameter exists for tests.
 */
export async function emitEnvelope(
  devicePubB64: string,
  predicate: Record<string, unknown> | undefined,
  v2: boolean = EMIT_FORMAT_V2
): Promise<{ v: 1 | 2; device: string }> {
  if (!v2) return { v: 1, device: devicePubB64 };
  // A v2 event with a non-boolean `what` is no event (O-6) — refuse to sign one.
  if (predicate && 'what' in predicate && typeof predicate.what !== 'boolean') {
    throw new Error('emitEnvelope: v2 needs a boolean what');
  }
  return { v: 2, device: await deviceFingerprint(devicePubB64) };
}

export type SignableEvent = {
  actor: string;
  action: ActionName;
  subject: { type: string; id: string };
  predicate?: Record<string, unknown>;
  parents?: string[];
  ts?: number;

  // Phase 1.5 — optional state commitments (PLAN_rikma_as_state_machine §2).
  // They ride INSIDE the signed body: tampering any of them breaks the
  // signature, which is what makes the commitment binding.
  parentStateRoots?: string[];
  stateRoot?: string;
  delta?: Delta[];
  quorum?: QuorumProof;
};

export async function buildAndSignEvent(
  identity: IdentityRecord,
  partial: SignableEvent,
  v2: boolean = EMIT_FORMAT_V2
): Promise<ConsentEvent> {
  const env = await emitEnvelope(identity.devicePubB64, partial.predicate, v2);
  const body = {
    v: env.v,
    actor: partial.actor,
    device: env.device,
    action: partial.action,
    subject: partial.subject,
    predicate: partial.predicate,
    parents: partial.parents ?? [],
    ts: partial.ts ?? Date.now(),
    nonce: randomNonceB64(),
    parentStateRoots: partial.parentStateRoots,
    stateRoot: partial.stateRoot,
    delta: partial.delta,
    quorum: partial.quorum
  };
  const { sig, id } = await signCanonical(
    body as unknown as import('$lib/crypto/canonical').JsonValue,
    identity.privateKey,
    identity.algo
  );
  return { ...body, sig, id };
}
