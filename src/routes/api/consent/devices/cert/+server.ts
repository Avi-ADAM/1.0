import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { consentStore, type StoredPubKey } from '$lib/server/consent/store';
import { verifyDeviceCert } from '$lib/crypto/deviceCert';
import { resolveFromStore } from '$lib/server/consent/verifyServerSide';
import { findPairing, closePairing } from '$lib/server/consent/pairing';
import type { DeviceCert } from '$lib/consent/event';

// T7 pairing — step 2: the EXISTING device submits the DeviceCert it signed.
//
// POST body:
//   { code, cert }  — completes a pairing session: verifies the cert against
//                     the pending device's key material, registers the new
//                     key WITH the cert attached, closes the session.
//   { cert }        — attaches a cert to an ALREADY-registered key (the
//                     shadow-mode upgrade path: devices that TOFU'd before
//                     enforcement get certified retroactively).
export const POST: RequestHandler = async ({ request, cookies }) => {
  if (!cookies.get('jwt')) throw error(401, 'Unauthorized');
  const userId = cookies.get('id');
  if (!userId) throw error(401, 'no user id in session');

  const body = await request.json().catch(() => null);
  const { code, cert } = (body ?? {}) as { code?: unknown; cert?: unknown };
  if (!cert || typeof cert !== 'object') throw error(400, 'cert required');
  const certObj = cert as DeviceCert;
  if (certObj.userId !== userId) throw error(403, 'cert userId must match session');

  // Path A — completing a pairing session.
  if (typeof code === 'string') {
    const p = findPairing(userId, code);
    if (!p) throw error(404, 'no such pairing (expired?)');

    const v = await verifyDeviceCert(cert, resolveFromStore, {
      userId,
      devicePubKey: p.devicePubB64
    });
    if (!v.ok) throw error(403, `cert rejected: ${v.reason}`);

    const stored: StoredPubKey = {
      userId,
      devicePubB64: p.devicePubB64,
      algo: p.algo,
      pubSpkiB64: p.pubSpkiB64,
      label: certObj.deviceLabel || p.label,
      cert: certObj,
      kemPubSpkiB64: p.kemPubSpkiB64,
      addedAt: Date.now()
    };
    await consentStore.putKey(stored);
    closePairing(code);
    console.info('[device-cert-telemetry]', {
      userId, status: 'paired', device: p.devicePubB64.slice(0, 12)
    });
    return json({ ok: true, paired: true, devicePubB64: p.devicePubB64 });
  }

  // Path B — retro-certifying an existing key.
  const existing = await consentStore.getKey(userId, certObj.devicePubKey);
  if (!existing) throw error(404, 'no such registered device');
  if (existing.revokedAt) throw error(403, 'device is revoked');

  const v = await verifyDeviceCert(cert, resolveFromStore, {
    userId,
    devicePubKey: existing.devicePubB64
  });
  if (!v.ok) throw error(403, `cert rejected: ${v.reason}`);

  await consentStore.putKey({ ...existing, cert: certObj });
  console.info('[device-cert-telemetry]', {
    userId, status: 'retro_certified', device: existing.devicePubB64.slice(0, 12)
  });
  return json({ ok: true, paired: false, devicePubB64: existing.devicePubB64 });
};
