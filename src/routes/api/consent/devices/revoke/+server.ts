import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { consentStore } from '$lib/server/consent/store';
import { verifySignedObject } from '$lib/crypto/verify';
import { resolveFromStore } from '$lib/server/consent/verifyServerSide';

// T7 — revoke a device key (PLAN_user_sovereign_consent: "כל מכשיר מאושר
// יכול לחתום device.revoke").
//
// POST body: { revoke: <signed object> } where the signed object is
//   { v:1, kind:'deviceRevoke', userId, target: <devicePubB64>,
//     actor, device, ts, nonce, id, sig }
// signed by an ACTIVE device of the same user (self-revoke allowed — a
// device may retire itself). The JWT session gates spam; the signature is
// the authority, so a stolen session alone cannot revoke devices.
export const POST: RequestHandler = async ({ request, cookies }) => {
  if (!cookies.get('jwt')) throw error(401, 'Unauthorized');
  const userId = cookies.get('id');
  if (!userId) throw error(401, 'no user id in session');

  const body = await request.json().catch(() => null);
  const revoke = (body as { revoke?: unknown })?.revoke as
    | { kind?: string; userId?: string; target?: string;
        actor: string; device: string; id: string; sig: string }
    | undefined;

  if (!revoke || revoke.kind !== 'deviceRevoke' ||
      revoke.userId !== userId || revoke.actor !== userId ||
      typeof revoke.target !== 'string') {
    throw error(400, 'bad revoke shape');
  }

  // Signature by an active (non-revoked) device — resolveFromStore enforces.
  const v = await verifySignedObject(revoke, resolveFromStore);
  if (!v.ok) throw error(403, `bad revoke signature: ${v.reason}`);

  const target = await consentStore.getKey(userId, revoke.target);
  if (!target) throw error(404, 'no such device');
  if (target.revokedAt) return json({ ok: true, alreadyRevoked: true });

  await consentStore.putKey({ ...target, revokedAt: Date.now(), revokedReason: 'manual' });
  console.info('[device-cert-telemetry]', {
    userId,
    status: 'device_revoked_manual',
    target: revoke.target.slice(0, 12),
    by: revoke.device.slice(0, 12)
  });
  return json({ ok: true });
};
