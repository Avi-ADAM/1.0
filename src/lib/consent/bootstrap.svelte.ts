// Idempotent consent-identity bootstrap with reactive status.
//
// Runs once per logged-in user. Creates a non-extractable Ed25519 keypair in
// IndexedDB if one doesn't exist, then publishes the public key to the
// /api/consent/keys/register endpoint. Both steps are best-effort: failures
// don't break the app, they just leave the status visible in the UI.
//
// Exposed as a reactive module-level store via Svelte 5 runes ($state). Any
// component can import { consentStatus } and observe the current state.

import { browser } from '$app/environment';
import { b64urlEncode } from '$lib/crypto/b64';
import { ensureIdentity, loadIdentity, type IdentityRecord } from '$lib/crypto/identity';

export type ConsentStatusKind =
  | 'idle'              // bootstrap hasn't been attempted yet
  | 'creating'          // generating keypair in IDB
  | 'registering'       // publishing pubkey to /api/consent/keys/register
  | 'ready'             // keypair exists AND server knows it
  | 'local-only'        // keypair exists but pubkey not yet published
  | 'unsupported'       // WebCrypto / IndexedDB unavailable
  | 'error';            // ran but failed; reason carries the cause

export type ConsentStatus = {
  kind: ConsentStatusKind;
  userId: string | null;
  devicePubB64: string | null;
  algo: 'Ed25519' | 'ECDSA-P256' | null;
  createdAt: number | null;
  reason?: string;
};

const initial: ConsentStatus = {
  kind: 'idle',
  userId: null,
  devicePubB64: null,
  algo: null,
  createdAt: null
};

export const consentStatus = $state<ConsentStatus>({ ...initial });

let bootstrapPromise: Promise<ConsentStatus> | null = null;
let pubkeyPublishedFor: string | null = null;

function isSupported(): boolean {
  return browser
    && typeof indexedDB !== 'undefined'
    && typeof crypto !== 'undefined'
    && !!crypto.subtle;
}

function setStatus(patch: Partial<ConsentStatus>) {
  Object.assign(consentStatus, patch);
}

async function publishPubkey(identity: IdentityRecord): Promise<boolean> {
  if (pubkeyPublishedFor === identity.userId) return true;
  try {
    const pubSpkiB64 = b64urlEncode(identity.pubSpki);
    const res = await fetch('/api/consent/keys/register', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: identity.userId,
        devicePubB64: identity.devicePubB64,
        algo: identity.algo,
        pubSpkiB64,
        label: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 40) : 'unknown'
      })
    });
    if (res.ok) {
      pubkeyPublishedFor = identity.userId;
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function bootstrapConsentIdentity(userId: string): Promise<ConsentStatus> {
  if (!isSupported()) {
    setStatus({ kind: 'unsupported', userId });
    return Promise.resolve({ ...consentStatus });
  }
  if (!userId) {
    return Promise.resolve({ ...consentStatus });
  }
  if (bootstrapPromise && consentStatus.userId === userId) {
    return bootstrapPromise;
  }

  bootstrapPromise = (async () => {
    try {
      const existing = await loadIdentity();
      if (existing && existing.userId === userId) {
        setStatus({
          kind: 'registering',
          userId,
          devicePubB64: existing.devicePubB64,
          algo: existing.algo,
          createdAt: existing.createdAt
        });
        const ok = await publishPubkey(existing);
        setStatus({ kind: ok ? 'ready' : 'local-only' });
        return { ...consentStatus };
      }

      // No identity yet → create it.
      setStatus({ kind: 'creating', userId });
      const identity = await ensureIdentity(userId);
      setStatus({
        kind: 'registering',
        userId,
        devicePubB64: identity.devicePubB64,
        algo: identity.algo,
        createdAt: identity.createdAt
      });
      const ok = await publishPubkey(identity);
      setStatus({ kind: ok ? 'ready' : 'local-only' });
      return { ...consentStatus };
    } catch (e) {
      setStatus({ kind: 'error', userId, reason: (e as Error).message });
      return { ...consentStatus };
    }
  })();

  return bootstrapPromise;
}

export function resetConsentStatus() {
  bootstrapPromise = null;
  pubkeyPublishedFor = null;
  Object.assign(consentStatus, initial);
}
