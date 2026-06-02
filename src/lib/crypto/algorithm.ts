// Detect best available signature algorithm at runtime.
// Ed25519 is preferred. Falls back to ECDSA P-256 on older browsers.

export type SigAlgo = 'Ed25519' | 'ECDSA-P256';

export function algoParams(algo: SigAlgo): EcKeyImportParams | Algorithm {
  return algo === 'Ed25519'
    ? { name: 'Ed25519' }
    : { name: 'ECDSA', namedCurve: 'P-256' };
}

export function signParams(algo: SigAlgo): AlgorithmIdentifier | EcdsaParams {
  return algo === 'Ed25519'
    ? { name: 'Ed25519' }
    : { name: 'ECDSA', hash: 'SHA-256' };
}

let cached: SigAlgo | null = null;

export async function chooseAlgorithm(): Promise<SigAlgo> {
  if (cached) return cached;
  try {
    await crypto.subtle.generateKey({ name: 'Ed25519' }, false, ['sign', 'verify']);
    cached = 'Ed25519';
  } catch {
    cached = 'ECDSA-P256';
  }
  return cached;
}

export function resetAlgorithmCache() {
  cached = null;
}
