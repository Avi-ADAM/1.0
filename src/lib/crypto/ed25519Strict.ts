// B3 (O-1, PLAN_DISTRIBUTED_EXECUTION) — one Ed25519 verification rule for
// every implementation.
//
// Ed25519 libraries disagree at the edges ("Taming the many EdDSAs", Chalkias
// et al. 2020): Node/OpenSSL (and BoringSSL, libsodium) use the cofactorless
// equation and compare R as bytes, ZIP-215 uses the cofactored one, dalek's
// verify_strict rejects small-order keys and R. A signature that passes in one
// and fails in another splits a rikma. So the rule is written down here, and
// checked BEFORE crypto.subtle.verify, which then only decides the equation:
//
//   1. the public key A: canonical (y < p, no "−0"), on the curve, and in the
//      prime-order subgroup ([L]A = O). That excludes the small-order keys
//      (with which R = O, S = 0 verifies EVERY message under OpenSSL — a
//      universal forgery) and the mixed-order ones (a torsion component makes
//      cofactored and cofactorless disagree). Honest keys always pass.
//   2. S < L (OpenSSL already refuses S ≥ L; written down so a port does too).
//   3. R is not the identity encoding: with A in the prime-order subgroup the
//      cofactorless check makes [S]B − [k]A a prime-order point, so the
//      identity is the only small-order R that can verify — dalek refuses it,
//      OpenSSL accepts it.
//   4. the equation is cofactorless with R compared as bytes (RFC 8032
//      §5.1.7 as OpenSSL implements it) — crypto.subtle.verify.
//
// SPEC_CONSENT_FORMAT §3. Pure BigInt; a key's verdict is memoised.

import { b64urlDecode } from './b64';

const P = (1n << 255n) - 19n;
export const ED25519_L = (1n << 252n) + 27742317777372353535851937790883648493n;

const mod = (a: bigint) => {
  const r = a % P;
  return r < 0n ? r + P : r;
};
function pow(b: bigint, e: bigint): bigint {
  let r = 1n;
  b = mod(b);
  while (e > 0n) {
    if (e & 1n) r = (r * b) % P;
    b = (b * b) % P;
    e >>= 1n;
  }
  return r;
}
const inv = (a: bigint) => pow(a, P - 2n);
const D = mod(-121665n * inv(121666n));
const D2 = mod(2n * D);
const SQRT_M1 = pow(2n, (P - 1n) / 4n);

type Ext = { X: bigint; Y: bigint; Z: bigint; T: bigint };
const O: Ext = { X: 0n, Y: 1n, Z: 1n, T: 0n };

/** Unified addition on −x² + y² = 1 + d·x²·y² (extended coordinates). */
function add(p: Ext, q: Ext): Ext {
  const a = mod((p.Y - p.X) * (q.Y - q.X));
  const b = mod((p.Y + p.X) * (q.Y + q.X));
  const c = mod(p.T * D2 * q.T);
  const d = mod(p.Z * 2n * q.Z);
  const e = b - a, f = d - c, g = d + c, h = b + a;
  return { X: mod(e * f), Y: mod(g * h), Z: mod(f * g), T: mod(e * h) };
}
function mul(p: Ext, n: bigint): Ext {
  let r = O;
  let q = p;
  while (n > 0n) {
    if (n & 1n) r = add(r, q);
    q = add(q, q);
    n >>= 1n;
  }
  return r;
}
const isIdentity = (p: Ext) => p.X === 0n && mod(p.Y - p.Z) === 0n;

function leToBig(b: Uint8Array): bigint {
  let n = 0n;
  for (let i = b.length - 1; i >= 0; i--) n = (n << 8n) | BigInt(b[i]);
  return n;
}

export type Ed25519PointStatus = 'ok' | 'bad_length' | 'non_canonical' | 'not_on_curve' | 'small_order' | 'mixed_order';

/** Decode a 32-byte point, strictly (RFC 8032 §5.1.3 plus canonical y and no −0). */
function decode(raw: Uint8Array): Ext | Exclude<Ed25519PointStatus, 'ok' | 'small_order' | 'mixed_order'> {
  if (raw.length !== 32) return 'bad_length';
  const n = leToBig(raw);
  const sign = n >> 255n;
  const y = n & ((1n << 255n) - 1n);
  if (y >= P) return 'non_canonical';
  const y2 = mod(y * y);
  const u = mod(y2 - 1n);
  const v = mod(D * y2 + 1n);
  const v3 = mod(v * v * v);
  let x = mod(u * v3 * pow(u * v3 * v3 * v, (P - 5n) / 8n));
  const vx2 = mod(v * x * x);
  if (vx2 === u) {
    // root found
  } else if (vx2 === mod(-u)) {
    x = mod(x * SQRT_M1);
  } else {
    return 'not_on_curve';
  }
  if (x === 0n && sign === 1n) return 'non_canonical'; // "−0"
  if ((x & 1n) !== sign) x = P - x;
  return { X: x, Y: y, Z: 1n, T: mod(x * y) };
}

const memo = new Map<string, Ed25519PointStatus>();

/** Rule 1: may this be an Ed25519 public key? */
export function ed25519KeyStatus(raw: Uint8Array): Ed25519PointStatus {
  const memoKey = Array.from(raw, (b) => b.toString(16).padStart(2, '0')).join('');
  const hit = memo.get(memoKey);
  if (hit) return hit;
  const pt = decode(raw);
  let status: Ed25519PointStatus;
  if (typeof pt === 'string') status = pt;
  else if (isIdentity(mul(pt, 8n))) status = 'small_order';
  else if (!isIdentity(mul(pt, ED25519_L))) status = 'mixed_order';
  else status = 'ok';
  if (memo.size >= 1024) memo.clear();
  memo.set(memoKey, status);
  return status;
}

const IDENTITY_ENCODING = (() => {
  const b = new Uint8Array(32);
  b[0] = 1;
  return b;
})();

export type Ed25519SigStatus = 'ok' | 'bad_length' | 'non_canonical_s' | 'identity_r';

/** Rules 2 and 3, on the 64-byte R‖S. */
export function ed25519SigStatus(sig: Uint8Array): Ed25519SigStatus {
  if (sig.length !== 64) return 'bad_length';
  if (leToBig(sig.subarray(32)) >= ED25519_L) return 'non_canonical_s';
  if (sig.subarray(0, 32).every((b, i) => b === IDENTITY_ENCODING[i])) return 'identity_r';
  return 'ok';
}

const SPKI_PREFIX = [0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x03, 0x21, 0x00];

/** The raw 32-byte key of an Ed25519 SPKI, or null when it is not one. */
export function ed25519RawFromSpki(spki: Uint8Array): Uint8Array | null {
  if (spki.length !== 44) return null;
  for (let i = 0; i < SPKI_PREFIX.length; i++) if (spki[i] !== SPKI_PREFIX[i]) return null;
  return spki.slice(12);
}

/** Registration gate: an Ed25519 SPKI (b64url) that rule 1 accepts. */
export function ed25519SpkiAcceptable(spkiB64: string): boolean {
  try {
    const raw = ed25519RawFromSpki(b64urlDecode(spkiB64));
    return raw !== null && ed25519KeyStatus(raw) === 'ok';
  } catch {
    return false;
  }
}

/** Rules 1–4 on raw bytes — the reference verifier the edge vectors run against. */
export async function ed25519VerifyStrict(
  rawKey: Uint8Array,
  sig: Uint8Array,
  msg: Uint8Array
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const keyStatus = ed25519KeyStatus(rawKey);
  if (keyStatus !== 'ok') return { ok: false, reason: 'weak_key:' + keyStatus };
  const sigStatus = ed25519SigStatus(sig);
  if (sigStatus !== 'ok') return { ok: false, reason: 'bad_signature:' + sigStatus };
  const buf = (b: Uint8Array) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
  const key = await crypto.subtle.importKey('raw', buf(rawKey), { name: 'Ed25519' }, false, ['verify']);
  const ok = await crypto.subtle.verify({ name: 'Ed25519' }, key, buf(sig), buf(msg));
  return ok ? { ok: true } : { ok: false, reason: 'bad_signature' };
}

// ── vector construction only (never on a verify path) ──────────────────────

function encode(p: Ext): Uint8Array {
  const zi = inv(p.Z);
  const x = mod(p.X * zi);
  let n = mod(p.Y * zi) | ((x & 1n) << 255n);
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    out[i] = Number(n & 0xffn);
    n >>= 8n;
  }
  return out;
}

const BASE = decode(
  Uint8Array.from({ length: 32 }, (_, i) => (i === 0 ? 0x58 : 0x66))
) as Ext;

/** encode([n]B). */
export function ed25519BaseMul(n: bigint): Uint8Array {
  return encode(mul(BASE, n));
}

/** encode(A + (0, −1)): the key with an order-2 component added. */
export function ed25519AddOrder2(raw: Uint8Array): Uint8Array {
  const pt = decode(raw);
  if (typeof pt === 'string') throw new Error('ed25519AddOrder2: ' + pt);
  return encode({ X: mod(-pt.X), Y: mod(-pt.Y), Z: pt.Z, T: pt.T });
}

export const ed25519LeToBig = leToBig;
