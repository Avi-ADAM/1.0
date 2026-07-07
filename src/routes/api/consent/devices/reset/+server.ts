import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { consentStore } from '$lib/server/consent/store';
import { RESET_COOLDOWN_MS } from '$lib/server/consent/devicePolicy';
import { verifySignedObject } from '$lib/crypto/verify';
// Side-effect import: injects Node webcrypto into globalThis for verify paths.
import '$lib/server/consent/verifyServerSide';

// POST /api/consent/devices/reset — T7 chain reset (the "lost every device"
// escape hatch, possible only while the server is still an authority, i.e.
// pre-S3; after E2E this moves to T9 social recovery).
//
//   { }                → request a reset: every key of the session user is
//                        revoked with reason 'reset'. After RESET_COOLDOWN
//                        the next registration is a fresh TOFU (devicePolicy).
//   { cancel, protest }→ a surviving old device PROTESTS during the cooldown:
//                        `protest` is a signed object from one of the
//                        reset-revoked keys; keys revoked by the reset are
//                        restored. This is what makes a stolen-session reset
//                        loud and reversible instead of a silent takeover.
//
// Auth: JWT session (email login) — deliberately NOT a device signature for
// the request path: the requester's whole problem is having no device.
export const POST: RequestHandler = async ({ request, cookies }) => {
  if (!cookies.get('jwt')) throw error(401, 'Unauthorized');
  const userId = cookies.get('id');
  if (!userId) throw error(401, 'no user id in session');

  const body = (await request.json().catch(() => ({}))) as {
    cancel?: unknown;
    protest?: unknown;
  };

  const keys = await consentStore.getKeysForUser(userId);

  if (body.cancel === true) {
    // Protest path — must be signed by one of the keys the reset revoked.
    const protest = body.protest as
      | { id: string; sig: string; actor: string; device: string; kind?: string; ts?: number }
      | undefined;
    if (!protest || protest.actor !== userId || protest.kind !== 'resetProtest') {
      throw error(400, 'protest object required');
    }
    const signerKey = keys.find(
      (k) => k.devicePubB64 === protest.device && k.revokedReason === 'reset'
    );
    if (!signerKey) throw error(403, 'protest must come from a reset-revoked device');

    // The signer is revoked, so resolveFromStore would refuse it — resolve
    // through a one-off resolver that accepts exactly this stored key.
    const v = await verifySignedObject(protest, async (actor, device) => {
      if (actor !== userId || device !== signerKey.devicePubB64) return null;
      return resolveStored(signerKey.pubSpkiB64, signerKey.algo);
    });
    if (!v.ok) throw error(403, `bad protest signature: ${v.reason}`);

    let restored = 0;
    for (const k of keys) {
      if (k.revokedReason !== 'reset') continue;
      await consentStore.putKey({ ...k, revokedAt: undefined, revokedReason: undefined });
      restored++;
    }
    console.info('[device-cert-telemetry]', { userId, status: 'reset_cancelled', restored });
    return json({ ok: true, cancelled: true, restored });
  }

  // Request path — revoke everything with reason 'reset'.
  const active = keys.filter((k) => !k.revokedAt);
  if (active.length === 0 && keys.length > 0) {
    return json({ ok: false, reason: 'reset_already_pending' }, { status: 409 });
  }
  const now = Date.now();
  for (const k of active) {
    await consentStore.putKey({ ...k, revokedAt: now, revokedReason: 'reset' });
  }
  console.info('[device-cert-telemetry]', {
    userId, status: 'reset_requested', revoked: active.length
  });
  return json({
    ok: true,
    revoked: active.length,
    cooldownMs: RESET_COOLDOWN_MS,
    tofuAvailableAt: now + RESET_COOLDOWN_MS
  });
};

async function resolveStored(pubSpkiB64: string, algo: 'Ed25519' | 'ECDSA-P256') {
  const { b64urlDecode } = await import('$lib/crypto/b64');
  const { algoParams } = await import('$lib/crypto/algorithm');
  const spki = b64urlDecode(pubSpkiB64);
  const buf = spki.buffer.slice(spki.byteOffset, spki.byteOffset + spki.byteLength) as ArrayBuffer;
  const key = await crypto.subtle.importKey(
    'spki', buf, algoParams(algo) as AlgorithmIdentifier, true, ['verify']
  );
  return { key, algo };
}
