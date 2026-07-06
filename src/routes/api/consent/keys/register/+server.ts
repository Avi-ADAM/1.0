import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { consentStore, type StoredPubKey } from '$lib/server/consent/store';

// POST /api/consent/keys/register
// body: { userId, devicePubB64, algo, pubSpkiB64, label, cert? }
//
// First device for a user is accepted on first-touch (TOFU) — out-of-band email
// confirmation is expected at the application level. Subsequent devices must
// include a DeviceCert signed by an existing trusted device (verification is
// added in Phase 2).
export const POST: RequestHandler = async ({ request, cookies }) => {
  if (!cookies.get('jwt')) throw error(401, 'Unauthorized');
  const userId = cookies.get('id');
  if (!userId) throw error(401, 'no user id in session');

  const body = await request.json();
  if (!body || body.userId !== userId) {
    throw error(403, 'userId in body must match session');
  }
  const { devicePubB64, algo, pubSpkiB64, label, cert, kemPubSpkiB64 } = body as {
    devicePubB64?: unknown; algo?: unknown; pubSpkiB64?: unknown;
    label?: unknown; cert?: unknown; kemPubSpkiB64?: unknown;
  };
  if (typeof devicePubB64 !== 'string' ||
      (algo !== 'Ed25519' && algo !== 'ECDSA-P256') ||
      typeof pubSpkiB64 !== 'string' ||
      typeof label !== 'string') {
    throw error(400, 'bad shape');
  }

  // Phase 2 will verify `cert` chain here.
  const stored: StoredPubKey = {
    userId,
    devicePubB64,
    algo,
    pubSpkiB64,
    label,
    cert: cert as StoredPubKey['cert'],
    kemPubSpkiB64: typeof kemPubSpkiB64 === 'string' ? kemPubSpkiB64 : undefined,
    addedAt: Date.now()
  };
  await consentStore.putKey(stored);
  return json({ ok: true });
};
