// Client-side PubKeyResolver backed by the peerKeys IDB store, with a
// network fill from /api/consent/keys/[userId]. Peer verification happens
// locally (the point of the whole design) — the server only supplies bytes,
// and a wrong key simply fails signature verification.

import { browser } from '$app/environment';
import { idbGet, idbPut } from '$lib/crypto/keystore';
import { algoParams, type SigAlgo } from '$lib/crypto/algorithm';
import { b64urlDecode } from '$lib/crypto/b64';
import type { PubKeyResolver } from '$lib/crypto/verify';

type CachedPeerKey = {
  devicePubKey: string;   // IDB keyPath ('peerKeys' store)
  userId: string;
  algo: SigAlgo;
  pubSpkiB64: string;
  kemPubSpkiB64: string | null;   // S3a: peer's key-agreement key
  revokedAt: number | null;
  fetchedAt: number;
};

const imported = new Map<string, { key: CryptoKey; algo: SigAlgo }>();
const misses = new Map<string, number>(); // devicePubB64 -> last miss ts
const MISS_TTL_MS = 60_000;

async function importSpki(algo: SigAlgo, pubSpkiB64: string) {
  const spki = b64urlDecode(pubSpkiB64);
  const buf = spki.buffer.slice(spki.byteOffset, spki.byteOffset + spki.byteLength) as ArrayBuffer;
  const key = await crypto.subtle.importKey(
    'spki',
    buf,
    algoParams(algo) as AlgorithmIdentifier,
    true,
    ['verify']
  );
  return { key, algo };
}

async function fetchAndCache(userId: string): Promise<void> {
  const res = await fetch(`/api/consent/keys/${encodeURIComponent(userId)}`, {
    credentials: 'include'
  });
  if (!res.ok) return;
  const body = await res.json();
  for (const k of body?.keys ?? []) {
    await idbPut('peerKeys', {
      devicePubKey: k.devicePubB64,
      userId: k.userId,
      algo: k.algo,
      pubSpkiB64: k.pubSpkiB64,
      kemPubSpkiB64: k.kemPubSpkiB64 ?? null,
      revokedAt: k.revokedAt ?? null,
      fetchedAt: Date.now()
    } satisfies CachedPeerKey);
  }
}

export const resolvePeerKey: PubKeyResolver = async (actor, devicePubB64) => {
  if (!browser) return null;

  const hit = imported.get(devicePubB64);
  if (hit) return hit;

  let cached = await idbGet<CachedPeerKey>('peerKeys', devicePubB64);
  if (!cached) {
    // Negative cache so a flood of events from an unknown device doesn't
    // hammer the keys endpoint.
    const lastMiss = misses.get(devicePubB64);
    if (lastMiss && Date.now() - lastMiss < MISS_TTL_MS) return null;
    try {
      await fetchAndCache(actor);
    } catch {
      // offline — fall through to whatever IDB has
    }
    cached = await idbGet<CachedPeerKey>('peerKeys', devicePubB64);
    if (!cached) {
      misses.set(devicePubB64, Date.now());
      return null;
    }
  }

  if (cached.userId !== actor || cached.revokedAt) return null;

  const entry = await importSpki(cached.algo, cached.pubSpkiB64);
  imported.set(devicePubB64, entry);
  return entry;
};

/**
 * Assemble the recipient list for an epoch rotation: every active device of
 * every listed member that has published a KEM key. Devices without one
 * (pre-E2E clients) are returned in `missing` — the caller decides whether
 * to proceed (they'll be locked out of the epoch until they upgrade and a
 * member re-wraps for them).
 */
export async function fetchKemRecipients(userIds: string[]): Promise<{
  recipients: Array<{ device: string; kemPubSpkiB64: string }>;
  missing: Array<{ userId: string; device: string }>;
}> {
  const recipients: Array<{ device: string; kemPubSpkiB64: string }> = [];
  const missing: Array<{ userId: string; device: string }> = [];
  for (const userId of userIds) {
    const res = await fetch(`/api/consent/keys/${encodeURIComponent(userId)}`, {
      credentials: 'include'
    });
    if (!res.ok) continue;
    const body = await res.json();
    for (const k of body?.keys ?? []) {
      if (k.revokedAt) continue;
      if (typeof k.kemPubSpkiB64 === 'string' && k.kemPubSpkiB64) {
        recipients.push({ device: k.devicePubB64, kemPubSpkiB64: k.kemPubSpkiB64 });
      } else {
        missing.push({ userId, device: k.devicePubB64 });
      }
    }
  }
  return { recipients, missing };
}
