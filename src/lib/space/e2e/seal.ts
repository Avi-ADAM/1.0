// Sealed envelopes — what the relay stores once a Space goes E2E (S3a).
//
// A sealed envelope wraps one signed ConsentEvent:
//
//   inner:  the ConsentEvent, canonical-JSON bytes, AES-256-GCM encrypted
//           under the Space's epoch key. AAD binds the plaintext header
//           (spaceId/epoch/actor/device), so a ciphertext cannot be replayed
//           under a different header without failing decryption.
//   outer:  a plaintext header + Ed25519 signature by the sender's device.
//           The relay verifies ONLY this outer signature (anti-spam) — it
//           reads spaceId, epoch, sender, sizes, timestamps. Metadata, not
//           content. That is exactly the honesty line of the plan (§4).
//
// The envelope deliberately matches the { id, sig, actor, device } contract
// of verifySignedObject, so client and relay verify it with the very same
// function used for consent events — no second verification pipeline.
//
// Recipients verify outer sig → decrypt → then ingest the INNER event
// through the normal pipeline (signature verify + dedupe + commitments).
// A malicious group member cannot forge someone else's inner event: sealing
// proves epoch membership, the inner signature proves authorship.

import { canonicalBytes, type JsonValue } from '$lib/crypto/canonical';
import { b64urlEncode, b64urlDecode, randomNonceB64 } from '$lib/crypto/b64';
import { signCanonical } from '$lib/crypto/sign';
import type { IdentityRecord } from '$lib/crypto/identity';
import { isConsentEventShape, type ConsentEvent } from '$lib/consent/event';
import { importEpochKey } from './epoch';

export type SealedEnvelope = {
  v: 1;
  kind: 'sealed';
  id: string;
  actor: string;      // sender userId
  device: string;     // sender signing device (outer-sig lookup)
  spaceId: string;
  epoch: number;
  iv: string;         // b64url, 12 bytes
  ct: string;         // b64url AES-GCM ciphertext of canonical(inner event)
  ts: number;
  nonce: string;
  sig: string;        // device signature over the outer body
};

const IV_BYTES = 12;

function aadFor(env: Pick<SealedEnvelope, 'spaceId' | 'epoch' | 'actor' | 'device'>): Uint8Array {
  return canonicalBytes({
    actor: env.actor,
    device: env.device,
    epoch: env.epoch,
    kind: 'sealed',
    spaceId: env.spaceId
  });
}

function toBuf(u8: Uint8Array): ArrayBuffer {
  return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) as ArrayBuffer;
}

export async function sealEvent(
  identity: IdentityRecord,
  epochKeyRaw: Uint8Array,
  spaceId: string,
  epoch: number,
  event: ConsentEvent
): Promise<SealedEnvelope> {
  const key = await importEpochKey(epochKeyRaw);
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const header = { spaceId, epoch, actor: identity.userId, device: identity.devicePubB64 };
  const ctBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: toBuf(aadFor(header)) },
    key,
    toBuf(canonicalBytes(event as unknown as JsonValue))
  );

  const body = {
    v: 1 as const,
    kind: 'sealed' as const,
    actor: identity.userId,
    device: identity.devicePubB64,
    spaceId,
    epoch,
    iv: b64urlEncode(toBuf(iv)),
    ct: b64urlEncode(ctBuf),
    ts: Date.now(),
    nonce: randomNonceB64()
  };
  const { sig, id } = await signCanonical(
    body as unknown as JsonValue,
    identity.privateKey,
    identity.algo
  );
  return { ...body, sig, id };
}

/**
 * Decrypt and parse the inner event. Null on wrong key / tamper / garbage.
 * Does NOT verify the outer or inner signatures — the caller runs the outer
 * through verifySignedObject and the inner through ingestEvent.
 */
export async function openSealed(
  env: SealedEnvelope,
  epochKeyRaw: Uint8Array
): Promise<ConsentEvent | null> {
  try {
    const key = await importEpochKey(epochKeyRaw);
    const pt = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: b64urlDecode(env.iv), additionalData: toBuf(aadFor(env)) },
      key,
      toBuf(b64urlDecode(env.ct))
    );
    const parsed = JSON.parse(new TextDecoder().decode(pt));
    return isConsentEventShape(parsed) ? (parsed as ConsentEvent) : null;
  } catch {
    return null;
  }
}

export function isSealedEnvelopeShape(x: unknown): x is SealedEnvelope {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return (
    o.v === 1 &&
    o.kind === 'sealed' &&
    typeof o.id === 'string' &&
    typeof o.actor === 'string' &&
    typeof o.device === 'string' &&
    typeof o.spaceId === 'string' &&
    typeof o.epoch === 'number' &&
    typeof o.iv === 'string' &&
    typeof o.ct === 'string' &&
    typeof o.ts === 'number' &&
    typeof o.nonce === 'string' &&
    typeof o.sig === 'string'
  );
}
