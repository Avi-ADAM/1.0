import { webcrypto } from 'node:crypto';
import { algoParams } from '$lib/crypto/algorithm';
import { verifySignedObject, type PubKeyResolver } from '$lib/crypto/verify';
import type { ConsentEvent } from '$lib/consent/event';
import { hasCommitments, verifyCommitments } from '$lib/consent/commitment';
import { consentStore } from './store';
import { b64urlDecode } from '$lib/crypto/b64';

// SvelteKit server runs in Node; ensure crypto.subtle is available globally.
// (Node 18+ exposes it; on older versions we'd fall back to webcrypto.subtle.)
const subtle = (globalThis.crypto?.subtle ?? webcrypto.subtle) as SubtleCrypto;
if (!globalThis.crypto) {
  // @ts-expect-error — augmenting globalThis for verifySignedObject
  globalThis.crypto = webcrypto;
}

export const resolveFromStore: PubKeyResolver = async (actor, devicePubB64) => {
  const stored = await consentStore.getKey(actor, devicePubB64);
  if (!stored) return null;
  if (stored.revokedAt) return null;

  const spkiBytes = b64urlDecode(stored.pubSpkiB64);
  const params = algoParams(stored.algo) as AlgorithmIdentifier;
  const buf = spkiBytes.buffer.slice(
    spkiBytes.byteOffset,
    spkiBytes.byteOffset + spkiBytes.byteLength
  ) as ArrayBuffer;
  const key = await subtle.importKey('spki', buf, params, true, ['verify']);
  return { key, algo: stored.algo };
};

export async function verifyConsentEvent(ev: ConsentEvent) {
  const sig = await verifySignedObject(ev, resolveFromStore);
  if (!sig.ok) return sig;

  // Phase 1.5 — state commitments (PLAN_rikma_as_state_machine §7). Runs in
  // 'available' mode until Phase 3 enforcement: a provably false stateRoot /
  // delta / quorum is rejected; unverifiable claims pass with warnings.
  if (hasCommitments(ev)) {
    const c = await verifyCommitments(ev, {
      getEvent: (id) => consentStore.getEvent(id)
    });
    if (!c.ok) return { ok: false as const, reason: `commitment:${c.reason}` };
  }
  return sig;
}
