// C0 (PLAN_DISTRIBUTED_EXECUTION) — does this runtime's WebCrypto have the
// post-quantum algorithms C1 (ML-DSA cosig) and C2 (hybrid ML-KEM) need?
//
// Node exposes ML-DSA / ML-KEM in WebCrypto from 24.7; browsers do not yet
// (SPEC §13). The answer decides, at runtime and never silently:
//   - C2: without ML-KEM a device can only take v1 (ECDH) wraps — and says so
//     when it registers, so a sender never downgrades a recipient that knows v2;
//   - C1: without ML-DSA a device cannot add a cosig (it can still verify one
//     only if the verifier side has it — the server, on Node ≥ 24.7).
//
// Detection is by trying, not by version sniffing: a generateKey that throws
// means "no". Memoised per runtime. Never on a hot path.

export type PqCapabilities = { mldsa65: boolean; mlkem768: boolean };

let cached: Promise<PqCapabilities> | null = null;

async function tryGenerate(algorithm: string, usages: string[]): Promise<boolean> {
  try {
    const subtle = globalThis.crypto?.subtle;
    if (!subtle) return false;
    const k = await subtle.generateKey({ name: algorithm } as AlgorithmIdentifier, false, usages as KeyUsage[]);
    return !!k;
  } catch {
    return false;
  }
}

/** What this runtime can do — computed once. */
export function pqCapabilities(): Promise<PqCapabilities> {
  if (!cached) {
    cached = (async () => ({
      mldsa65: await tryGenerate('ML-DSA-65', ['sign', 'verify']),
      // ML-KEM keys take the encapsulate/decapsulate usages (WICG
      // webcrypto-modern-algos); a runtime that knows neither has no ML-KEM.
      mlkem768:
        (await tryGenerate('ML-KEM-768', ['encapsulateBits', 'decapsulateBits'])) ||
        (await tryGenerate('ML-KEM-768', ['encapsulateKey', 'decapsulateKey']))
    }))();
  }
  return cached;
}

/** Tests only. */
export function _resetPqCapabilities(): void {
  cached = null;
}
