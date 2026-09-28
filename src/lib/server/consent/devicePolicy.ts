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
// a reset. After S3/E2E that guarantee moves to T9 (social recovery):
//   - recovery attempt        → the device asks explicitly (`recovery`
//                               thunk); k guardian vouches + a quiet 24h
//                               protest window register it with no cert and
//                               no reset cooldown ('recovered_by_guardians').
//                               The route then retires every other key.
//   - reset while guardians   → under RECOVERY_ENFORCE a matured reset no
//     are set                   longer TOFUs a user who named guardians: the
//                               server may not overrule the people they
//                               chose. In shadow it still TOFUs, and says so.

import type { StoredPubKey } from './store';
import type { RecoveryCheck } from '$lib/consent/recovery';
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
    | 'missing_cert'         // rejected (enforcement)
    | 'recovered_by_guardians'     // T9b: k vouches + protest window passed
    | 'recovery_pending'           // rejected: protest window still open
    | 'recovery_not_vouched'       // rejected: no (or not enough) live vouches
    | 'reset_blocked_by_guardians';// rejected: RECOVERY_ENFORCE, user has guardians
  certReason?: string;
  retryAfterMs?: number;
  /** T9 shadow telemetry: a reset TOFU'd a user who has guardians. */
  guardiansShadow?: boolean;
};

export async function judgeRegistration(opts: {
  existing: StoredPubKey[];
  userId: string;
  devicePubB64: string;
  cert: unknown;
  enforce: boolean;
  now?: number;
  /**
   * T9b — set only when the device ASKS to register through recovery. The
   * everyday login re-publish never pays for the event lookup.
   */
  recovery?: () => Promise<RecoveryCheck>;
  /** T9b — does the user have a guardian set in force? Asked only on reset_tofu. */
  hasGuardians?: () => Promise<boolean>;
  /** RECOVERY_ENFORCE — guardians replace the server's reset authority. */
  recoveryEnforce?: boolean;
}): Promise<RegistrationDecision> {
  const { existing, userId, devicePubB64, cert, enforce } = opts;
  const now = opts.now ?? Date.now();

  // An explicit recovery attempt is judged on the vouches alone: it is the
  // path for a user whose keys are all lost, revoked, or mid-reset.
  if (opts.recovery) {
    const r = await opts.recovery();
    if (r.ok && r.matured) return { allow: true, status: 'recovered_by_guardians' };
    if (r.ok) {
      return { allow: false, status: 'recovery_pending', retryAfterMs: r.readyAt - now };
    }
    return { allow: false, status: 'recovery_not_vouched', certReason: r.reason };
  }

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
  if (resetMatured) {
    const guarded = opts.hasGuardians ? await opts.hasGuardians() : false;
    if (guarded && opts.recoveryEnforce) return { allow: false, status: 'reset_blocked_by_guardians' };
    return { allow: true, status: 'reset_tofu', guardiansShadow: guarded || undefined };
  }

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
