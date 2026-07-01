import { signCanonical } from '$lib/crypto/sign';
import { randomNonceB64 } from '$lib/crypto/b64';
import type { IdentityRecord } from '$lib/crypto/identity';
import type { ConsentEvent, ActionName, Delta } from './event';
import type { QuorumProof } from './quorum';

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
  partial: SignableEvent
): Promise<ConsentEvent> {
  const body = {
    v: 1 as const,
    actor: partial.actor,
    device: identity.devicePubB64,
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
