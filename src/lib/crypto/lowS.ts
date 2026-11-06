// ECDSA-P256 low-S normalisation (SPEC_CONSENT_FORMAT §3, O-2).
//
// An ECDSA signature (r, s) and its mirror (r, n − s) verify against the same
// key and message. WebCrypto returns either one at random, and the event id
// is SHA-256 over the body WITH its signature — so one signing act could
// surface under two ids. The SIGNER therefore always emits the low form
// (s ≤ n/2, as Bitcoin's BIP-62 and Ethereum's EIP-2 do). The VERIFIER is
// not changed: events already signed with a high S stay valid forever
// (HANDOFF invariant 1).
//
// Signatures are IEEE P1363: 32-byte r ‖ 32-byte s, big-endian — not DER.

/** The order of the P-256 group. */
export const P256_N = 0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551n;
const HALF_N = P256_N >> 1n;

function toBig(bytes: Uint8Array): bigint {
  let x = 0n;
  for (const b of bytes) x = (x << 8n) | BigInt(b);
  return x;
}

function to32(x: bigint): Uint8Array {
  const out = new Uint8Array(32);
  for (let i = 31; i >= 0; i--) {
    out[i] = Number(x & 0xffn);
    x >>= 8n;
  }
  return out;
}

/** The `s` half of a 64-byte P1363 signature, as an integer. */
export function p256S(sig: Uint8Array): bigint {
  if (sig.length !== 64) throw new Error('p256_sig_not_p1363');
  return toBig(sig.subarray(32));
}

export function isLowS(sig: Uint8Array): boolean {
  return p256S(sig) <= HALF_N;
}

/** The same signature with s replaced by n − s (low ↔ high). */
export function mirrorS(sig: Uint8Array): Uint8Array {
  const s = p256S(sig);
  const out = new Uint8Array(64);
  out.set(sig.subarray(0, 32), 0);
  out.set(to32(P256_N - s), 32);
  return out;
}

/** Returns the low-S form; a signature already low comes back unchanged (a copy). */
export function normalizeLowS(sig: Uint8Array): Uint8Array {
  return isLowS(sig) ? new Uint8Array(sig) : mirrorS(sig);
}
