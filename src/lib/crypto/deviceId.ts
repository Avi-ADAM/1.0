// B4 (O-7, PLAN_DISTRIBUTED_EXECUTION) — a device named by its fingerprint.
//
// `device` on a signed object is the signing device's SPKI, b64url. An
// Ed25519 SPKI is 44 bytes; an ML-DSA-65 one is 1,974 — about 2.6KB on every
// event. The short name is
//
//   deviceId(spki) = b64url(SHA-256(SPKI DER))         — 43 characters
//
// and a verifier takes both forms, forever (SPEC_CONSENT_FORMAT §1, §13). The
// forms cannot be confused: no SPKI is 32 bytes long (Ed25519's is 44, P-256's
// 91), so a 43-character canonical b64url string of 32 bytes is a fingerprint
// and anything else is an SPKI.
//
// This module only lets readers resolve the short form. Signers keep emitting
// the SPKI until a separate switch (the key must reach the registry before an
// event names it by hash — a fingerprint alone cannot be verified).

import { b64urlDecode, b64urlEncode } from './b64';

export const DEVICE_ID_LENGTH = 43;
const B64URL = /^[A-Za-z0-9_-]+$/;

/** True when `device` is the fingerprint form (not an SPKI). */
export function isDeviceFingerprint(device: unknown): device is string {
  if (typeof device !== 'string' || device.length !== DEVICE_ID_LENGTH || !B64URL.test(device)) return false;
  try {
    const bytes = b64urlDecode(device);
    // The one canonical spelling only (zero trailing bits), as for `sig`.
    return bytes.length === 32 && b64urlEncode(bytes) === device;
  } catch {
    return false;
  }
}

const memo = new Map<string, string>();
const MEMO_LIMIT = 4096;

/** b64url(SHA-256(SPKI DER)) of a b64url SPKI. */
export async function deviceFingerprint(spkiB64: string): Promise<string> {
  const hit = memo.get(spkiB64);
  if (hit) return hit;
  const der = b64urlDecode(spkiB64);
  const buf = der.buffer.slice(der.byteOffset, der.byteOffset + der.byteLength) as ArrayBuffer;
  const fp = b64urlEncode(await crypto.subtle.digest('SHA-256', buf));
  if (memo.size >= MEMO_LIMIT) memo.clear();
  memo.set(spkiB64, fp);
  return fp;
}

/** Does `device` (either form) name the device whose SPKI is `spkiB64`? */
export async function sameDevice(device: string, spkiB64: string): Promise<boolean> {
  if (device === spkiB64) return true;
  if (!isDeviceFingerprint(device)) return false;
  try {
    return (await deviceFingerprint(spkiB64)) === device;
  } catch {
    return false; // an undecodable stored key names nothing
  }
}

/** The candidate `device` (either form) names: an exact SPKI match first. */
export async function findDevice<T>(
  device: string,
  candidates: Iterable<T>,
  spkiOf: (c: T) => string
): Promise<T | undefined> {
  const list = [...candidates];
  const exact = list.find((c) => spkiOf(c) === device);
  if (exact || !isDeviceFingerprint(device)) return exact;
  for (const c of list) if (await sameDevice(device, spkiOf(c))) return c;
  return undefined;
}
