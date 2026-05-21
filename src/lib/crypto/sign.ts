import { signParams, type SigAlgo } from './algorithm';
import { canonicalize, canonicalBytes, type JsonValue } from './canonical';
import { b64urlEncode } from './b64';

export type Unsigned<T> = Omit<T, 'id' | 'sig'>;

export async function signCanonical(
  body: JsonValue,
  privateKey: CryptoKey,
  algo: SigAlgo
): Promise<{ sig: string; id: string }> {
  const bodyBytes = canonicalBytes(body);
  const sigBuf = await crypto.subtle.sign(signParams(algo) as Algorithm, privateKey, bodyBytes);
  const sig = b64urlEncode(sigBuf);

  // id = sha256 of canonical(body + sig). This binds the id to the signature,
  // so any tamper of either invalidates it.
  const withSig = { ...(body as Record<string, JsonValue>), sig };
  const idBuf = await crypto.subtle.digest('SHA-256', canonicalBytes(withSig));
  const id = b64urlEncode(idBuf);
  return { sig, id };
}

export function bodyForSigning<T extends { id?: string; sig?: string }>(ev: T): JsonValue {
  const { id: _id, sig: _sig, ...rest } = ev;
  void _id;
  void _sig;
  return rest as unknown as JsonValue;
}

export function bodyWithSig<T extends { id?: string; sig: string }>(ev: T): JsonValue {
  const { id: _id, ...rest } = ev;
  void _id;
  return rest as unknown as JsonValue;
}

export { canonicalize };
