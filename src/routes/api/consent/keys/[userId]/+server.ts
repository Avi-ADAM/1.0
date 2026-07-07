import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { consentStore } from '$lib/server/consent/store';

export const GET: RequestHandler = async ({ params, cookies }) => {
  if (!cookies.get('jwt')) throw error(401, 'Unauthorized');
  const keys = await consentStore.getKeysForUser(params.userId!);
  // Strip the cert payload — not all callers need it. Pub key bytes are public.
  return json({
    ok: true,
    keys: keys.map((k) => ({
      userId: k.userId,
      devicePubB64: k.devicePubB64,
      algo: k.algo,
      pubSpkiB64: k.pubSpkiB64,
      label: k.label,
      kemPubSpkiB64: k.kemPubSpkiB64 ?? null,
      revokedAt: k.revokedAt ?? null,
      revokedReason: k.revokedReason ?? null,
      // T7: cert PRESENCE is public; the cert payload itself stays stripped.
      certified: Boolean(k.cert),
      addedAt: k.addedAt
    }))
  });
};
