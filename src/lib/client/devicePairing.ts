// T7 — client half of device pairing / revocation / chain reset
// (PLAN_user_sovereign_consent §Multi-device). Browser-only.
//
// Flow (typable 6-char code, camera-free v1 of the QR plan):
//   NEW device:      openPairingAsNewDevice() → show the code to the user
//   EXISTING device: fetchPendingDevice(code) → user confirms →
//                    approvePairing(code) — signs a DeviceCert locally and
//                    submits it; the server verifies + registers.

import { browser } from '$app/environment';
import { b64urlEncode } from '$lib/crypto/b64';
import { ensureIdentity, loadIdentity } from '$lib/crypto/identity';
import { signCanonical } from '$lib/crypto/sign';
import { signDeviceCert } from '$lib/crypto/deviceCert';
import { ensureKemKeypair } from '$lib/space/e2e/kem';
import type { JsonValue } from '$lib/crypto/canonical';

export type PairingResult<T = Record<string, unknown>> =
  | ({ ok: true; reason?: undefined } & T)
  | { ok: false; reason: string };

function cookieUserId(): string | null {
  if (!browser) return null;
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith('id='))
    ?.split('=')[1] ?? null;
}

async function post(path: string, body: unknown): Promise<Response> {
  return fetch(path, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

/** NEW device: open a pairing session, get the code to show the user. */
export async function openPairingAsNewDevice(): Promise<PairingResult<{ code: string; ttlMs: number }>> {
  const userId = cookieUserId();
  if (!userId) return { ok: false, reason: 'no_session' };
  try {
    const identity = await ensureIdentity(userId);
    const kemPubSpkiB64 = await ensureKemKeypair()
      .then((k) => k.kemPubSpkiB64)
      .catch(() => undefined);
    const res = await post('/api/consent/devices/pair', {
      devicePubB64: identity.devicePubB64,
      algo: identity.algo,
      pubSpkiB64: b64urlEncode(identity.pubSpki),
      label: navigator.userAgent.slice(0, 40),
      kemPubSpkiB64
    });
    const data = await res.json();
    if (!res.ok || !data.ok) return { ok: false, reason: data.reason ?? `http_${res.status}` };
    return { ok: true, code: data.code, ttlMs: data.ttlMs };
  } catch (e) {
    return { ok: false, reason: (e as Error).message };
  }
}

/** EXISTING device: look up the pending device behind a code, for the user to confirm. */
export async function fetchPendingDevice(
  code: string
): Promise<PairingResult<{ device: { devicePubB64: string; label: string; algo: string } }>> {
  try {
    const res = await fetch(
      `/api/consent/devices/pair?code=${encodeURIComponent(code.trim().toUpperCase())}`,
      { credentials: 'include' }
    );
    if (!res.ok) return { ok: false, reason: `http_${res.status}` };
    const data = await res.json();
    return { ok: true, device: data.device };
  } catch (e) {
    return { ok: false, reason: (e as Error).message };
  }
}

/** EXISTING device: sign the DeviceCert for the pending device and submit it. */
export async function approvePairing(code: string): Promise<PairingResult> {
  const userId = cookieUserId();
  if (!userId) return { ok: false, reason: 'no_session' };

  const pendingRes = await fetchPendingDevice(code);
  if (!pendingRes.ok) return pendingRes;

  const identity = await loadIdentity();
  if (!identity || identity.userId !== userId) {
    return { ok: false, reason: 'this_device_has_no_identity' };
  }

  try {
    const cert = await signDeviceCert(identity, {
      userId,
      devicePubKey: pendingRes.device.devicePubB64,
      deviceLabel: pendingRes.device.label
    });
    const res = await post('/api/consent/devices/cert', {
      code: code.trim().toUpperCase(),
      cert
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      return { ok: false, reason: `http_${res.status}: ${detail.slice(0, 120)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: (e as Error).message };
  }
}

/** Sign a generic small object with this device's identity (revoke/protest). */
async function signAdminObject(
  kind: 'deviceRevoke' | 'resetProtest',
  extra: Record<string, unknown>
): Promise<PairingResult<{ signed: Record<string, unknown> }>> {
  const userId = cookieUserId();
  if (!userId) return { ok: false, reason: 'no_session' };
  const identity = await loadIdentity();
  if (!identity || identity.userId !== userId) {
    return { ok: false, reason: 'this_device_has_no_identity' };
  }
  const body = {
    v: 1,
    kind,
    userId,
    actor: userId,
    device: identity.devicePubB64,
    ts: Date.now(),
    nonce: b64urlEncode(crypto.getRandomValues(new Uint8Array(16)).buffer),
    ...extra
  };
  const { sig, id } = await signCanonical(
    body as unknown as JsonValue, identity.privateKey, identity.algo
  );
  return { ok: true, signed: { ...body, sig, id } };
}

/** Revoke a device (this one or another). Signed by the CURRENT device. */
export async function revokeDevice(targetDevicePubB64: string): Promise<PairingResult> {
  const signedRes = await signAdminObject('deviceRevoke', { target: targetDevicePubB64 });
  if (!signedRes.ok) return signedRes;
  const res = await post('/api/consent/devices/revoke', { revoke: signedRes.signed });
  if (!res.ok) return { ok: false, reason: `http_${res.status}` };
  return { ok: true };
}

/** Chain reset — the "lost all my devices" escape hatch (JWT-authenticated). */
export async function requestChainReset(): Promise<PairingResult<{ tofuAvailableAt?: number }>> {
  const res = await post('/api/consent/devices/reset', {});
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) return { ok: false, reason: data.reason ?? `http_${res.status}` };
  return { ok: true, tofuAvailableAt: data.tofuAvailableAt };
}

/** Protest a pending reset from a surviving (reset-revoked) device. */
export async function protestChainReset(): Promise<PairingResult> {
  const signedRes = await signAdminObject('resetProtest', {});
  if (!signedRes.ok) return signedRes;
  const res = await post('/api/consent/devices/reset', {
    cancel: true,
    protest: signedRes.signed
  });
  if (!res.ok) return { ok: false, reason: `http_${res.status}` };
  return { ok: true };
}
