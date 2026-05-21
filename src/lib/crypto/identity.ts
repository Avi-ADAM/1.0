import { algoParams, chooseAlgorithm, type SigAlgo } from './algorithm';
import { idbGet, idbPut } from './keystore';
import { b64urlEncode } from './b64';

export type IdentityRecord = {
  id: 'self';
  userId: string;
  algo: SigAlgo;
  privateKey: CryptoKey;
  publicKey: CryptoKey;
  pubSpki: ArrayBuffer;
  devicePubB64: string;
  createdAt: number;
};

export async function ensureIdentity(userId: string): Promise<IdentityRecord> {
  const existing = await idbGet<IdentityRecord>('identity', 'self');
  if (existing && existing.userId === userId) return existing;

  const algo = await chooseAlgorithm();
  const params = algoParams(algo);
  const kp = (await crypto.subtle.generateKey(
    params as Algorithm,
    false,
    ['sign', 'verify']
  )) as CryptoKeyPair;

  const pubSpki = await crypto.subtle.exportKey('spki', kp.publicKey);
  const devicePubB64 = b64urlEncode(pubSpki);

  const record: IdentityRecord = {
    id: 'self',
    userId,
    algo,
    privateKey: kp.privateKey,
    publicKey: kp.publicKey,
    pubSpki,
    devicePubB64,
    createdAt: Date.now()
  };
  await idbPut('identity', record);
  return record;
}

export async function loadIdentity(): Promise<IdentityRecord | undefined> {
  return idbGet<IdentityRecord>('identity', 'self');
}

export async function importPublicKey(
  spki: ArrayBuffer | Uint8Array,
  algo: SigAlgo
): Promise<CryptoKey> {
  const buf: ArrayBuffer = spki instanceof Uint8Array
    ? spki.buffer.slice(spki.byteOffset, spki.byteOffset + spki.byteLength) as ArrayBuffer
    : spki;
  return crypto.subtle.importKey('spki', buf, algoParams(algo) as AlgorithmIdentifier, true, ['verify']);
}
