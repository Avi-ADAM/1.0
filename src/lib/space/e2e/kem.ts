// Key agreement (KEM) primitives for the S3a group-encryption layer.
//
// The signing identity is Ed25519 — a signature key, unusable for key
// agreement. Each device therefore holds a SECOND keypair, ECDH P-256,
// used only to receive wrapped epoch keys. P-256 (not X25519) because it is
// the one agreement curve every WebCrypto implementation ships, matching
// the repo's existing Ed25519→ECDSA-P256 fallback philosophy.
//
// Wrapping is ECIES-shaped and self-contained per recipient:
//   ephemeral ECDH keypair → deriveBits(eph.priv, recipient.pub)
//   → HKDF-SHA256 (fixed info tag) → AES-256-GCM key → encrypt payload.
// The ephemeral PUBLIC key travels with the ciphertext; the ephemeral
// private key is discarded, so only the recipient can reconstruct the KEK.
//
// Pure WebCrypto — runs in browser, SW, and Node (vitest) identically.

import { idbGet, idbPut } from '$lib/crypto/keystore';
import { b64urlEncode, b64urlDecode } from '$lib/crypto/b64';

export const KEM_ALGO = { name: 'ECDH', namedCurve: 'P-256' } as const;
const HKDF_INFO = new TextEncoder().encode('freemates-epoch-wrap-v1');
const WRAP_IV_BYTES = 12;

export type KemRecord = {
  id: 'kem';
  privateKey: CryptoKey;   // non-extractable ECDH P-256
  publicKey: CryptoKey;
  kemPubSpkiB64: string;   // b64url(SPKI) — published to the key registry
  createdAt: number;
};

/** One wrapped payload for one recipient. All fields b64url. */
export type WrappedKey = {
  epk: string;  // ephemeral ECDH public key (SPKI)
  iv: string;
  ct: string;   // AES-GCM ciphertext of the raw payload bytes
};

function toBuf(u8: Uint8Array): ArrayBuffer {
  return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) as ArrayBuffer;
}

/** Lazy per-device KEM keypair, stored beside the signing identity. */
export async function ensureKemKeypair(): Promise<KemRecord> {
  const existing = await idbGet<KemRecord>('identity', 'kem');
  if (existing) return existing;

  const kp = (await crypto.subtle.generateKey(KEM_ALGO, false, [
    'deriveBits'
  ])) as CryptoKeyPair;
  const spki = await crypto.subtle.exportKey('spki', kp.publicKey);
  const record: KemRecord = {
    id: 'kem',
    privateKey: kp.privateKey,
    publicKey: kp.publicKey,
    kemPubSpkiB64: b64urlEncode(spki),
    createdAt: Date.now()
  };
  await idbPut('identity', record);
  return record;
}

export async function importKemPub(kemPubSpkiB64: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('spki', toBuf(b64urlDecode(kemPubSpkiB64)), KEM_ALGO, true, []);
}

async function deriveKek(
  privateKey: CryptoKey,
  publicKey: CryptoKey
): Promise<CryptoKey> {
  const shared = await crypto.subtle.deriveBits({ name: 'ECDH', public: publicKey }, privateKey, 256);
  const hkdfKey = await crypto.subtle.importKey('raw', shared, 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(32), info: HKDF_INFO },
    hkdfKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/** ECIES wrap: only the holder of the recipient's KEM private key can open. */
export async function kemWrap(
  payload: Uint8Array,
  recipientKemPubSpkiB64: string
): Promise<WrappedKey> {
  const recipientPub = await importKemPub(recipientKemPubSpkiB64);
  const eph = (await crypto.subtle.generateKey(KEM_ALGO, true, ['deriveBits'])) as CryptoKeyPair;
  const kek = await deriveKek(eph.privateKey, recipientPub);
  const iv = crypto.getRandomValues(new Uint8Array(WRAP_IV_BYTES));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, kek, toBuf(payload));
  const ephSpki = await crypto.subtle.exportKey('spki', eph.publicKey);
  return { epk: b64urlEncode(ephSpki), iv: b64urlEncode(toBuf(iv)), ct: b64urlEncode(ct) };
}

export async function kemUnwrap(
  wrapped: WrappedKey,
  myKemPrivateKey: CryptoKey
): Promise<Uint8Array | null> {
  try {
    const ephPub = await importKemPub(wrapped.epk);
    const kek = await deriveKek(myKemPrivateKey, ephPub);
    const pt = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: b64urlDecode(wrapped.iv) },
      kek,
      toBuf(b64urlDecode(wrapped.ct))
    );
    return new Uint8Array(pt);
  } catch {
    return null; // wrong key or tampered — indistinguishable by design
  }
}
