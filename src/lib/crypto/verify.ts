import { signParams, type SigAlgo } from './algorithm';
import { canonicalBytes } from './canonical';
import { b64urlDecode, b64urlEncode } from './b64';
import { bodyForSigning, bodyWithSig } from './sign';

export type VerifyResult =
  | { ok: true; reason?: undefined }
  | { ok: false; reason: string };

export type PubKeyResolver = (actor: string, devicePubB64: string) =>
  Promise<{ key: CryptoKey; algo: SigAlgo } | null>;

export async function verifySignedObject<T extends { id: string; sig: string; actor: string; device: string }>(
  ev: T,
  resolve: PubKeyResolver
): Promise<VerifyResult> {
  const match = await resolve(ev.actor, ev.device);
  if (!match) return { ok: false, reason: 'unknown_or_revoked_device' };

  let sigBytes: Uint8Array<ArrayBuffer>;
  try {
    sigBytes = b64urlDecode(ev.sig) as Uint8Array<ArrayBuffer>;
  } catch {
    return { ok: false, reason: 'bad_sig_encoding' };
  }
  // Only the one canonical spelling of these bytes (unpadded, zero trailing
  // bits). atob is lenient, strict decoders (Rust's base64) are not — and the
  // sig string feeds the id, so a second spelling would be the same signature
  // under a second id. SPEC_CONSENT_FORMAT §1.
  if (b64urlEncode(sigBytes) !== ev.sig) return { ok: false, reason: 'bad_sig_encoding' };

  const body = bodyForSigning(ev);
  let bodyBytes: Uint8Array<ArrayBuffer>;
  try {
    bodyBytes = canonicalBytes(body);
  } catch (e) {
    // Lone surrogate / NFC key collision / non-finite number: a body only
    // this implementation could hash. SPEC_CONSENT_FORMAT §2.
    return { ok: false, reason: 'non_canonical_body: ' + (e as Error).message };
  }

  let ok: boolean;
  try {
    ok = await crypto.subtle.verify(signParams(match.algo) as Algorithm, match.key, sigBytes, bodyBytes);
  } catch (e) {
    return { ok: false, reason: 'verify_threw: ' + (e as Error).message };
  }
  if (!ok) return { ok: false, reason: 'bad_signature' };

  // bodyWithSig only adds the (already canonical-checked) sig string, so this
  // cannot throw where canonicalBytes(body) above did not.
  const idBuf = await crypto.subtle.digest('SHA-256', canonicalBytes(bodyWithSig(ev)));
  const expectedId = b64urlEncode(idBuf);
  if (expectedId !== ev.id) return { ok: false, reason: 'bad_id' };

  return { ok: true };
}
