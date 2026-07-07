// T7 — device-registration policy (PLAN_user_sovereign_consent Phase 2).
//
// Pure decision logic, separated from the HTTP route so it's testable:
// given the user's stored keys and the incoming registration, decide
// accept/reject and WHY. The route logs every decision with the
// [device-cert-telemetry] tag — that stream is the evidence for flipping
// DEVICE_CERT_ENFORCE later.
//
// Trust model:
//   - first device            → TOFU (email confirmation is app-level)
//   - same device re-register → ok (bootstrap re-publishes on every login)
//   - subsequent device       → needs a DeviceCert signed by an active
//                               device; in shadow mode an uncertified one is
//                               accepted-and-logged (today's behavior),
//                               under enforcement it is rejected
//   - chain reset             → all keys revoked (revokedReason:'reset');
//                               after RESET_COOLDOWN the next registration
//                               is a fresh TOFU. Within the cooldown nothing
//                               new is accepted — the window exists so a
//                               surviving old device can protest (cancel).
//
// Losing every device is NOT a permanent lockout while the server is still
// an authority (pre-S3): the email-authenticated session can always request
// a reset. After S3/E2E that guarantee moves to T9 (social recovery).

import type { StoredPubKey } from './store';
import { verifyDeviceCert } from '$lib/crypto/deviceCert';
import { resolveFromStore } from './verifyServerSide';

/** Protest window before a chain reset matures into a fresh TOFU. */
export const RESET_COOLDOWN_MS = 48 * 60 * 60 * 1000;

export type RegistrationDecision = {
  allow: boolean;
  /** stable status for telemetry + client messaging */
  status:
    | 'first_device_tofu'
    | 'reregister_ok'
    | 'valid_cert'
    | 'uncertified_shadow'   // accepted only because enforcement is off
    | 'invalid_cert_shadow'  // cert present but bad; accepted, logged loudly
    | 'reset_tofu'           // cooldown matured — fresh first device
    | 'reset_cooldown'       // rejected: protest window still open
    | 'device_revoked'       // rejected: this exact key was revoked
    | 'invalid_cert'         // rejected (enforcement)
    | 'missing_cert';        // rejected (enforcement)
  certReason?: string;
  retryAfterMs?: number;
};

export async function judgeRegistration(opts: {
  existing: StoredPubKey[];
  userId: string;
  devicePubB64: string;
  cert: unknown;
  enforce: boolean;
  now?: number;
}): Promise<RegistrationDecision> {
  const { existing, userId, devicePubB64, cert, enforce } = opts;
  const now = opts.now ?? Date.now();

  const active = existing.filter((k) => !k.revokedAt);
  const same = existing.find((k) => k.devicePubB64 === devicePubB64);

  // Chain-reset accounting: matured ⇒ the store is treated as empty.
  const allRevoked = existing.length > 0 && active.length === 0;
  const latestRevokedAt = existing.reduce(
    (m, k) => Math.max(m, k.revokedAt ?? 0), 0
  );
  const resetMatured = allRevoked && latestRevokedAt + RESET_COOLDOWN_MS <= now;

  if (allRevoked && !resetMatured) {
    return {
      allow: false,
      status: 'reset_cooldown',
      retryAfterMs: latestRevokedAt + RESET_COOLDOWN_MS - now
    };
  }

  if (same) {
    if (same.revokedAt && !resetMatured) {
      return { allow: false, status: 'device_revoked' };
    }
    if (!same.revokedAt) return { allow: true, status: 'reregister_ok' };
    // revoked but reset matured → falls through to reset_tofu below
  }

  if (existing.length === 0) return { allow: true, status: 'first_device_tofu' };
  if (resetMatured) return { allow: true, status: 'reset_tofu' };

  // Subsequent device while active devices exist — the cert question.
  if (cert !== undefined && cert !== null) {
    const v = await verifyDeviceCert(cert, resolveFromStore, {
      userId,
      devicePubKey: devicePubB64
    }, now);
    if (v.ok) return { allow: true, status: 'valid_cert' };
    if (enforce) return { allow: false, status: 'invalid_cert', certReason: v.reason };
    return { allow: true, status: 'invalid_cert_shadow', certReason: v.reason };
  }

  if (enforce) return { allow: false, status: 'missing_cert' };
  return { allow: true, status: 'uncertified_shadow' };
}
