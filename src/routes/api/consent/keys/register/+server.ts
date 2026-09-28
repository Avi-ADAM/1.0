import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { consentStore, type StoredPubKey } from '$lib/server/consent/store';
import { judgeRegistration } from '$lib/server/consent/devicePolicy';
import {
  recoveryCheckFor,
  effectiveSetFor,
  closeRecoverySessionsFor
} from '$lib/server/consent/recovery';
import { notifyRecovery } from '$lib/server/consent/recoveryNotify';
import { deviceFingerprint, type RecoveryCheck } from '$lib/consent/recovery';

// POST /api/consent/keys/register
// body: { userId, devicePubB64, algo, pubSpkiB64, label, cert?, kemPubSpkiB64?, recovery? }
//
// T7 (Phase 2): the DeviceCert chain is now VERIFIED. Policy lives in
// devicePolicy.ts — first device is TOFU, a subsequent device needs a cert
// signed by an active device. While DEVICE_CERT_ENFORCE !== '1' we run in
// shadow: uncertified/invalid registrations are accepted exactly like before
// but every decision is logged with [device-cert-telemetry] — that stream is
// the evidence for flipping enforcement. Chain reset (all keys revoked) makes
// the next registration a fresh TOFU after the protest cooldown.
//
// T9b: `recovery: true` asks to register through guardian recovery. The
// decision is re-derived from the signed vouches (never from the recovery
// session), and on success every OTHER key of the user is retired as lost
// ('reset') — whoever holds the old devices, the guardians just said this one
// is the user's. [recovery-telemetry] logs it.
export const POST: RequestHandler = async ({ request, cookies, locals }) => {
  if (!cookies.get('jwt')) throw error(401, 'Unauthorized');
  const userId = locals.uid || undefined;
  if (!userId) throw error(401, 'no user id in session');

  const body = await request.json();
  if (!body || body.userId !== userId) {
    throw error(403, 'userId in body must match session');
  }
  const { devicePubB64, algo, pubSpkiB64, label, cert, kemPubSpkiB64, recovery } = body as {
    devicePubB64?: unknown; algo?: unknown; pubSpkiB64?: unknown;
    label?: unknown; cert?: unknown; kemPubSpkiB64?: unknown; recovery?: unknown;
  };
  if (typeof devicePubB64 !== 'string' ||
      (algo !== 'Ed25519' && algo !== 'ECDSA-P256') ||
      typeof pubSpkiB64 !== 'string' ||
      typeof label !== 'string') {
    throw error(400, 'bad shape');
  }
  const viaRecovery = recovery === true;
  if (viaRecovery && (typeof kemPubSpkiB64 !== 'string' || !kemPubSpkiB64)) {
    throw error(400, 'recovery needs the KEM key the guardians vouched for');
  }

  let recoveryResult: RecoveryCheck | undefined;
  const existing = await consentStore.getKeysForUser(userId);
  const decision = await judgeRegistration({
    existing,
    userId,
    devicePubB64,
    cert,
    enforce: env.DEVICE_CERT_ENFORCE === '1',
    recovery: viaRecovery
      ? async () => (recoveryResult = await recoveryCheckFor(userId, {
          devicePubKey: devicePubB64,
          kemPubSpkiB64: kemPubSpkiB64 as string
        }))
      : undefined,
    hasGuardians: async () => Boolean(await effectiveSetFor(userId)),
    recoveryEnforce: env.RECOVERY_ENFORCE === '1'
  });

  // Telemetry — the exit criterion for enforcement is a period where nothing
  // but first_device_tofu / reregister_ok / valid_cert shows up here.
  console.info('[device-cert-telemetry]', {
    userId,
    device: devicePubB64.slice(0, 12),
    status: decision.status,
    certReason: decision.certReason,
    guardiansShadow: decision.guardiansShadow
  });
  if (viaRecovery) {
    console.info('[recovery-telemetry]', {
      userId,
      device: devicePubB64.slice(0, 12),
      status: decision.status,
      reason: decision.certReason,
      retryAfterMs: decision.retryAfterMs
    });
  }

  if (!decision.allow) {
    return json(
      {
        ok: false,
        reason: decision.status,
        certReason: decision.certReason,
        retryAfterMs: decision.retryAfterMs
      },
      { status: 403 }
    );
  }

  const prior = existing.find((k) => k.devicePubB64 === devicePubB64);
  const stored: StoredPubKey = {
    userId,
    devicePubB64,
    algo,
    pubSpkiB64,
    label,
    // Keep a previously attached cert when the re-register body has none.
    cert: (cert as StoredPubKey['cert']) ?? prior?.cert,
    kemPubSpkiB64: typeof kemPubSpkiB64 === 'string' ? kemPubSpkiB64 : prior?.kemPubSpkiB64,
    recovery: prior?.recovery,
    addedAt: prior?.addedAt ?? Date.now()
  };

  if (decision.status === 'recovered_by_guardians' && recoveryResult?.ok) {
    const now = Date.now();
    stored.recovery = { setId: recoveryResult.setId, vouchers: recoveryResult.vouchers, at: now };
    // A recovered device is active again even if it was once revoked.
    stored.revokedAt = undefined;
    stored.revokedReason = undefined;
    let retired = 0;
    for (const k of existing) {
      if (k.devicePubB64 === devicePubB64 || k.revokedAt) continue;
      await consentStore.putKey({ ...k, revokedAt: now, revokedReason: 'reset' });
      retired++;
    }
    await consentStore.putKey(stored);
    closeRecoverySessionsFor(userId);
    console.info('[recovery-telemetry]', { userId, status: 'recovery_completed', retired });
    void notifyRecovery(userId, 'recoveryCompleted', {
      fingerprint: await deviceFingerprint(devicePubB64, stored.kemPubSpkiB64 ?? '')
    });
    return json({ ok: true, status: decision.status, retired });
  }

  await consentStore.putKey(stored);
  return json({ ok: true, status: decision.status });
};
