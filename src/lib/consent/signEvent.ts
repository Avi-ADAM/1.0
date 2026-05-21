import { signCanonical } from '$lib/crypto/sign';
import { randomNonceB64 } from '$lib/crypto/b64';
import type { IdentityRecord } from '$lib/crypto/identity';
import type { ConsentEvent, ActionName } from './event';

export type SignableEvent = {
  actor: string;
  action: ActionName;
  subject: { type: string; id: string };
  predicate?: Record<string, unknown>;
  parents?: string[];
  ts?: number;
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
    nonce: randomNonceB64()
  };
  const { sig, id } = await signCanonical(
    body as unknown as import('$lib/crypto/canonical').JsonValue,
    identity.privateKey,
    identity.algo
  );
  return { ...body, sig, id };
}
