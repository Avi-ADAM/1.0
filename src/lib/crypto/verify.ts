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

  const body = bodyForSigning(ev);
  const bodyBytes = canonicalBytes(body);

  let ok: boolean;
  try {
    ok = await crypto.subtle.verify(signParams(match.algo) as Algorithm, match.key, sigBytes, bodyBytes);
  } catch (e) {
    return { ok: false, reason: 'verify_threw: ' + (e as Error).message };
  }
  if (!ok) return { ok: false, reason: 'bad_signature' };

  const idBuf = await crypto.subtle.digest('SHA-256', canonicalBytes(bodyWithSig(ev)));
  const expectedId = b64urlEncode(idBuf);
  if (expectedId !== ev.id) return { ok: false, reason: 'bad_id' };

  return { ok: true };
}
