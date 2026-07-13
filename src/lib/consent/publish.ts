import { browser } from '$app/environment';
import { b64urlEncode } from '$lib/crypto/b64';
import { ensureIdentity, type IdentityRecord } from '$lib/crypto/identity';
import { ensureKemKeypair } from '$lib/space/e2e/kem';
import { idbAdd } from '$lib/crypto/keystore';
import type { ConsentEvent } from './event';
import { buildAndSignEvent, type SignableEvent } from './signEvent';

// Lightweight orchestrator used directly from UI code. It:
// 1. ensures the local identity exists (lazy bootstrap)
// 2. registers the device pubkey with the server mirror if not yet known
// 3. signs the event locally
// 4. ships it to the mirror at /api/consent/events
// 5. on network failure, queues to IDB and returns ok:false so callers don't block

let pubkeyPublished = false;

/**
 * Best-effort, once-per-session device-key registration with the mirror.
 * Exported for the space-routed shadow path (shadowSign → replica.publish):
 * the relay verifies signatures server-side against the key registry, so the
 * key must be registered before the first push, same as the direct path.
 */
export async function ensurePubkeyRegistered(identity: IdentityRecord): Promise<void> {
  return publishPubkey(identity);
}

async function publishPubkey(identity: IdentityRecord) {
  if (pubkeyPublished) return;
  if (!browser) return;
  try {
    const pubSpkiB64 = b64urlEncode(identity.pubSpki);
    const kemPubSpkiB64 = await ensureKemKeypair()
      .then((k) => k.kemPubSpkiB64)
      .catch(() => undefined);
    const res = await fetch('/api/consent/keys/register', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: identity.userId,
        devicePubB64: identity.devicePubB64,
        algo: identity.algo,
        pubSpkiB64,
        kemPubSpkiB64,
        label: navigator.userAgent.slice(0, 40)
      })
    });
    if (res.ok) pubkeyPublished = true;
  } catch {
    // best-effort; the event POST will fail until the key is published
  }
}

export type PublishResult =
  | { ok: true; event: ConsentEvent; reason?: undefined }
  | { ok: false; reason: string; event: ConsentEvent };

export async function signAndPublish(
  userId: string,
  partial: SignableEvent
): Promise<PublishResult> {
  const identity = await ensureIdentity(userId);
  await publishPubkey(identity);

  const event = await buildAndSignEvent(identity, { ...partial, actor: userId });

  if (!browser) return { ok: false, reason: 'not_browser', event };

  try {
    const res = await fetch('/api/consent/events', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event })
    });
    if (!res.ok) {
      await idbAdd('pendingSync', event);
      return { ok: false, reason: `http_${res.status}`, event };
    }
    return { ok: true, event };
  } catch (e) {
    await idbAdd('pendingSync', event);
    return { ok: false, reason: 'network_' + (e as Error).message, event };
  }
}
