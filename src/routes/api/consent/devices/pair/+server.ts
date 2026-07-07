import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { openPairing, findPairing, PAIRING_TTL_MS } from '$lib/server/consent/pairing';

// T7 pairing — step 1 of the QR/code flow (PLAN_user_sovereign_consent
// §Multi-device; a typable code instead of a camera for v1).
//
// POST — the NEW device opens a session with its full key material and gets
//        a 6-char code to show the user.
// GET ?code= — the EXISTING device (same user session) fetches the pending
//        device to display for confirmation before signing the DeviceCert.
export const POST: RequestHandler = async ({ request, cookies }) => {
  if (!cookies.get('jwt')) throw error(401, 'Unauthorized');
  const userId = cookies.get('id');
  if (!userId) throw error(401, 'no user id in session');

  const body = await request.json().catch(() => null);
  const { devicePubB64, algo, pubSpkiB64, label, kemPubSpkiB64 } = (body ?? {}) as {
    devicePubB64?: unknown; algo?: unknown; pubSpkiB64?: unknown;
    label?: unknown; kemPubSpkiB64?: unknown;
  };
  if (typeof devicePubB64 !== 'string' ||
      (algo !== 'Ed25519' && algo !== 'ECDSA-P256') ||
      typeof pubSpkiB64 !== 'string' ||
      typeof label !== 'string') {
    throw error(400, 'bad shape');
  }

  const session = openPairing({
    userId,
    devicePubB64,
    algo,
    pubSpkiB64,
    label,
    kemPubSpkiB64: typeof kemPubSpkiB64 === 'string' ? kemPubSpkiB64 : undefined
  });
  return json({ ok: true, code: session.code, ttlMs: PAIRING_TTL_MS });
};

export const GET: RequestHandler = async ({ url, cookies }) => {
  if (!cookies.get('jwt')) throw error(401, 'Unauthorized');
  const userId = cookies.get('id');
  if (!userId) throw error(401, 'no user id in session');

  const code = url.searchParams.get('code') ?? '';
  if (!/^[A-Za-z0-9]{6}$/.test(code)) throw error(400, 'bad code');

  const p = findPairing(userId, code);
  if (!p) throw error(404, 'no such pairing (expired?)');
  return json({
    ok: true,
    device: {
      devicePubB64: p.devicePubB64,
      label: p.label,
      algo: p.algo,
      openedAt: p.createdAt
    }
  });
};
