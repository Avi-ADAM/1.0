// DeviceCert — the trust chain between a user's devices (T7, Phase 2 of
// PLAN_user_sovereign_consent §Multi-device).
//
// Trust model: the FIRST device of a user is trust-on-first-use (TOFU, with
// out-of-band email at the application level). Every SUBSEQUENT device must
// carry a DeviceCert signed by an already-trusted, non-revoked device of the
// same user. The cert rides the exact same sign/verify pipeline as consent
// events (signCanonical / verifySignedObject): `actor` = the userId, `device`
// = the SIGNING (parent) device, so the standard PubKeyResolver finds the
// right key with no special cases.
//
// This module is pure crypto + validation — shared by the client (signing a
// cert during pairing) and the server (verifying at registration). Storage
// policy (grandfathering, enforcement flag, reset cooldown) lives with the
// register route, not here.

import type { DeviceCert } from '$lib/consent/event';
import type { IdentityRecord } from './identity';
import { signCanonical } from './sign';
import { verifySignedObject, type PubKeyResolver, type VerifyResult } from './verify';
import { b64urlEncode } from './b64';
import type { JsonValue } from './canonical';

export type DeviceCertRequest = {
  userId: string;
  /** The NEW device being authorized (its signing pubkey, b64url SPKI). */
  devicePubKey: string;
  deviceLabel: string;
  capabilities?: DeviceCert['capabilities'];
  notBefore?: number;
  notAfter?: number;
};

/**
 * Parent (existing, trusted) device signs a cert for a new device.
 * Refuses to sign for a different user than the parent identity's.
 */
export async function signDeviceCert(
  parent: IdentityRecord,
  req: DeviceCertRequest
): Promise<DeviceCert> {
  if (req.userId !== parent.userId) {
    throw new Error('signDeviceCert: cert userId must match the signing identity');
  }
  const body = {
    v: 1 as const,
    kind: 'deviceCert' as const,
    userId: req.userId,
    devicePubKey: req.devicePubKey,
    deviceLabel: req.deviceLabel,
    capabilities: req.capabilities ?? ['sign' as const],
    notBefore: req.notBefore ?? Date.now(),
    ...(req.notAfter !== undefined ? { notAfter: req.notAfter } : {}),
    parentDevicePubKey: parent.devicePubB64,
    actor: req.userId,
    device: parent.devicePubB64,
    nonce: b64urlEncode(crypto.getRandomValues(new Uint8Array(16)).buffer)
  };
  const { sig, id } = await signCanonical(
    body as unknown as JsonValue,
    parent.privateKey,
    parent.algo
  );
  return { ...body, sig, id } as DeviceCert;
}

export function isDeviceCertShape(x: unknown): x is DeviceCert {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return (
    o.v === 1 &&
    o.kind === 'deviceCert' &&
    typeof o.id === 'string' &&
    typeof o.userId === 'string' &&
    typeof o.devicePubKey === 'string' &&
    typeof o.deviceLabel === 'string' &&
    Array.isArray(o.capabilities) &&
    typeof o.notBefore === 'number' &&
    (o.notAfter === undefined || typeof o.notAfter === 'number') &&
    typeof o.parentDevicePubKey === 'string' &&
    typeof o.actor === 'string' &&
    typeof o.device === 'string' &&
    typeof o.nonce === 'string' &&
    typeof o.sig === 'string'
  );
}

/**
 * Full verification of one cert:
 *   semantic — internal consistency (actor/userId, device/parent aliases,
 *              validity window, no self-cert claiming a different device);
 *   cryptographic — signature by the parent device, resolved through the
 *              standard PubKeyResolver (which already refuses revoked keys).
 *
 * `expected` pins the cert to the registration being judged — a valid cert
 * for some OTHER device/user must not authorize this one.
 */
export async function verifyDeviceCert(
  cert: unknown,
  resolve: PubKeyResolver,
  expected: { userId: string; devicePubKey: string },
  now: number = Date.now()
): Promise<VerifyResult> {
  if (!isDeviceCertShape(cert)) return { ok: false, reason: 'bad_cert_shape' };
  if (cert.userId !== expected.userId) return { ok: false, reason: 'cert_wrong_user' };
  if (cert.devicePubKey !== expected.devicePubKey) {
    return { ok: false, reason: 'cert_wrong_device' };
  }
  if (cert.actor !== cert.userId) return { ok: false, reason: 'cert_actor_mismatch' };
  if (cert.device !== cert.parentDevicePubKey) {
    return { ok: false, reason: 'cert_device_alias_mismatch' };
  }
  if (cert.parentDevicePubKey === cert.devicePubKey) {
    // A self-cert authorizes nothing — the first device is TOFU, not
    // self-certified; a later device signing itself is exactly the attack.
    return { ok: false, reason: 'cert_self_signed' };
  }
  // Clock tolerance: 5 minutes, same spirit as the restime plan's skew budget.
  const SKEW_MS = 5 * 60_000;
  if (cert.notBefore > now + SKEW_MS) return { ok: false, reason: 'cert_not_yet_valid' };
  if (cert.notAfter !== undefined && cert.notAfter < now - SKEW_MS) {
    return { ok: false, reason: 'cert_expired' };
  }
  return verifySignedObject(cert, resolve);
}
