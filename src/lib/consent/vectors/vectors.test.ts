// The cross-language contract (spec/consent-v1/*.json, SPEC_CONSENT_FORMAT §10).
//
// Normal runs READ the files and hold the reference implementation to them:
//   1. freeze  — rebuilding the vectors from this codebase reproduces the files
//                byte for byte. A failure here means a change altered signed
//                bytes, ids or state roots: that breaks every existing
//                signature/commitment AND every other implementation. Bump a
//                version (STATE_ROOT_VERSION, event `v`) instead of
//                regenerating.
//   2. replay  — the files' own claims hold when checked through the public
//                verify / ingest / projection / e2e entry points, the way a
//                consumer of the files would use them.
//
// Regenerate deliberately with `npm run vectors:consent`
// (WRITE_CONSENT_VECTORS=1), then review the diff like any contract change.

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildVectors, VECTOR_FILES, unhex, deltaStateFromJson, type VectorSet } from './build';
import { verifyQuorum, type QuorumProof } from '$lib/consent/quorum';
import { checkDeltas } from '$lib/consent/deltaCheck';
import { compareIds } from '$lib/consent/ids';
import type { Delta } from '$lib/consent/event';
import { canonicalize, type JsonValue } from '$lib/crypto/canonical';
import { verifySignedObject, type PubKeyResolver } from '$lib/crypto/verify';
import { importPublicKey } from '$lib/crypto/identity';
import { b64urlDecode, b64urlEncode } from '$lib/crypto/b64';
import { isLowS, normalizeLowS } from '$lib/crypto/lowS';
import type { SigAlgo } from '$lib/crypto/algorithm';
import { verifyDeviceCert } from '$lib/crypto/deviceCert';
import { deviceFingerprint, isDeviceFingerprint } from '$lib/crypto/deviceId';
import { ed25519VerifyStrict } from '$lib/crypto/ed25519Strict';
import type { ConsentEvent, DeviceCert } from '$lib/consent/event';
import { project } from '$lib/consent/projection';
import { computeStateRoot } from '$lib/consent/stateRoot';
import { verifyCommitments } from '$lib/consent/commitment';
import { openSealed, type SealedEnvelope } from '$lib/space/e2e/seal';
import { kemUnwrap } from '$lib/space/e2e/kem';
import { keyCommitment } from '$lib/space/e2e/epoch';

const DIR = resolve(process.cwd(), 'spec/consent-v1');
const fileOf = (name: string) => resolve(DIR, `${name}.json`);

type Obj = Record<string, any>;

function readAll(): Partial<VectorSet> {
  const out: Partial<VectorSet> = {};
  for (const f of VECTOR_FILES) {
    if (existsSync(fileOf(f))) out[f] = JSON.parse(readFileSync(fileOf(f), 'utf8'));
  }
  return out;
}

let vectors: VectorSet;
let resolver: PubKeyResolver;

beforeAll(async () => {
  if (process.env.WRITE_CONSENT_VECTORS === '1') {
    const built = await buildVectors(readAll());
    mkdirSync(DIR, { recursive: true });
    for (const f of VECTOR_FILES) writeFileSync(fileOf(f), JSON.stringify(built[f], null, 2) + '\n', 'utf8');
  }
  const onDisk = readAll();
  for (const f of VECTOR_FILES) {
    if (!onDisk[f]) throw new Error(`spec/consent-v1/${f}.json missing — run npm run vectors:consent`);
  }
  vectors = onDisk as VectorSet;

  const keys = new Map<string, { key: CryptoKey; algo: SigAlgo }>();
  for (const k of vectors.signatures.keys as Obj[]) {
    const algo = k.alg as SigAlgo;
    const entry = { key: await importPublicKey(b64urlDecode(k.spki), algo), algo };
    keys.set(k.spki, entry);
    // B4: a device may be named by its deviceId (SPEC §1).
    if (typeof k.deviceId === 'string') keys.set(k.deviceId, entry);
  }
  resolver = async (_actor, device) => keys.get(device) ?? null;
}, 60_000);

describe('consent vectors — freeze', () => {
  it('the reference implementation reproduces every vector file exactly', async () => {
    const rebuilt = JSON.parse(JSON.stringify(await buildVectors(vectors)));
    for (const f of VECTOR_FILES) expect(rebuilt[f], `${f}.json`).toEqual(vectors[f]);
  }, 60_000);
});

describe('consent vectors — canonical.json', () => {
  it('every case canonicalizes to the stated string and hash', async () => {
    for (const c of vectors.canonical.cases as Obj[]) {
      const got = canonicalize(JSON.parse(c.input) as JsonValue);
      expect(got, c.name).toBe(c.canonical);
      const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(got));
      expect(b64urlEncode(h), c.name).toBe(c.sha256);
    }
  });

  it('every reject case fails', () => {
    for (const r of vectors.canonical.rejects as Obj[]) {
      expect(() => canonicalize(JSON.parse(r.input) as JsonValue), r.name).toThrow();
    }
  });
});

describe('consent vectors — signatures.json', () => {
  it('the RFC 8032 anchor holds', async () => {
    const r = vectors.signatures.rfc8032 as Obj;
    const pub = await crypto.subtle.importKey('raw', unhex(r.publicKeyHex), { name: 'Ed25519' }, false, ['verify']);
    const ok = await crypto.subtle.verify({ name: 'Ed25519' }, pub, unhex(r.signatureHex), unhex(r.messageHex));
    expect(ok).toBe(true);
  });

  it('every valid object verifies, and its canonical forms match', async () => {
    for (const v of vectors.signatures.valid as Obj[]) {
      const res = await verifySignedObject(v.object, resolver);
      expect(res, v.name).toEqual({ ok: true });
      const { id: _i, sig: _s, ...body } = v.object;
      expect(canonicalize(body), v.name).toBe(v.canonicalBody);
    }
  });

  it('the high-S mirror verifies, and normalising it gives the low-S sig (O-2)', () => {
    const v = (vectors.signatures.valid as Obj[]).find((x) => x.name === 'ecdsa-p256-high-s-event')!;
    const high = b64urlDecode((v.object as Obj).sig as string);
    expect(isLowS(high)).toBe(false);
    const low = b64urlDecode(v.lowSSig as string);
    expect(isLowS(low)).toBe(true);
    expect(b64urlEncode(normalizeLowS(high))).toBe(v.lowSSig);
    // r is shared: one signing act, two encodings.
    expect(low.subarray(0, 32)).toEqual(high.subarray(0, 32));
  });

  it('the device cert also passes the T7 semantic checks', async () => {
    const cert = (vectors.signatures.valid as Obj[]).find((v) => v.name === 'device-cert')!.object as DeviceCert;
    const res = await verifyDeviceCert(cert, resolver, { userId: cert.userId, devicePubKey: cert.devicePubKey }, cert.notBefore);
    expect(res).toEqual({ ok: true });
  });

  it('every deviceId is the SHA-256 of its SPKI, and only a deviceId reads as one (O-7)', async () => {
    for (const k of vectors.signatures.keys as Obj[]) {
      expect(k.deviceId, k.label).toBe(await deviceFingerprint(k.spki));
      expect(isDeviceFingerprint(k.deviceId), k.label).toBe(true);
      expect(isDeviceFingerprint(k.spki), k.label).toBe(false);
    }
    const nonCanonical = (vectors.signatures.invalid as Obj[]).find((v) => v.name === 'device-id-non-canonical-spelling')!;
    expect(isDeviceFingerprint((nonCanonical.object as Obj).device)).toBe(false);
  });

  it('a cert naming its parent by deviceId passes the T7 checks too', async () => {
    const cert = (vectors.signatures.valid as Obj[]).find((v) => v.name === 'device-cert-by-device-id')!.object as DeviceCert;
    expect(isDeviceFingerprint(cert.device)).toBe(true);
    const res = await verifyDeviceCert(cert, resolver, { userId: cert.userId, devicePubKey: cert.devicePubKey }, cert.notBefore);
    expect(res).toEqual({ ok: true });
  });

  it('every Ed25519 edge triple gets the verdict of SPEC §3 rules 1–4 (O-1)', async () => {
    const edges = vectors.signatures.ed25519Edge as Obj[];
    expect(edges.length).toBeGreaterThanOrEqual(7);
    for (const e of edges) {
      const res = await ed25519VerifyStrict(unhex(e.publicKeyHex), unhex(e.signatureHex), unhex(e.messageHex));
      if (e.expect === 'accept') expect(res, e.name).toEqual({ ok: true });
      else expect(res, e.name).toEqual({ ok: false, reason: e.reason });
    }
  });

  it('every invalid object fails with its stated reason', async () => {
    for (const v of vectors.signatures.invalid as Obj[]) {
      const res = await verifySignedObject(v.object, resolver);
      expect(res.ok, v.name).toBe(false);
      expect(res.reason?.split(':')[0], v.name).toBe(v.reason);
    }
  });
});

describe('consent vectors — events.json', () => {
  it('every scenario event verifies', async () => {
    for (const sc of vectors.events.scenarios as Obj[]) {
      for (const ev of sc.events as ConsentEvent[]) {
        expect(await verifySignedObject(ev, resolver), `${sc.name} ${sc.labels[ev.id]}`).toEqual({ ok: true });
      }
    }
  });

  it('folding reproduces the state root — in any input order', async () => {
    for (const sc of vectors.events.scenarios as Obj[]) {
      const events = sc.events as ConsentEvent[];
      const forward = project(events, sc.projectId);
      expect(await computeStateRoot(forward), sc.name).toBe(sc.expect.stateRoot);
      const reversed = project([...events].reverse(), sc.projectId);
      expect(await computeStateRoot(reversed), `${sc.name} reversed`).toBe(sc.expect.stateRoot);
    }
  });

  it('events carrying commitments pass verifyCommitments in strict mode', async () => {
    let seen = 0;
    for (const sc of vectors.events.scenarios as Obj[]) {
      const byId = new Map((sc.events as ConsentEvent[]).map((e) => [e.id, e]));
      for (const ev of sc.events as ConsentEvent[]) {
        if (ev.stateRoot === undefined) continue;
        seen++;
        const res = await verifyCommitments(ev, { getEvent: (id) => byId.get(id), mode: 'strict', projectId: sc.projectId });
        expect(res.ok, sc.labels[ev.id]).toBe(true);
        expect(res.ok && res.checked).toEqual(expect.arrayContaining(['parentStateRoots', 'stateRoot']));
        // ...and a forged root is refused like a bad signature.
        const forged = { ...ev, stateRoot: sc.expect.stateRoot === ev.stateRoot ? 'x' : sc.expect.stateRoot };
        const bad = await verifyCommitments(forged, { getEvent: (id) => byId.get(id), mode: 'strict', projectId: sc.projectId });
        expect(bad.ok).toBe(false);
      }
    }
    expect(seen).toBeGreaterThan(0);
  });
});

describe('consent vectors — e2e.json', () => {
  it('the key commitment matches', async () => {
    const e = vectors.e2e.epochKey as Obj;
    expect(await keyCommitment(unhex(e.rawHex))).toBe(e.keyCommitment.value);
  });

  it('the sealed envelope verifies outside and opens to the inner event', async () => {
    const s = vectors.e2e.sealed as Obj;
    expect(await verifySignedObject(s.envelope, resolver)).toEqual({ ok: true });
    const inner = await openSealed(s.envelope as SealedEnvelope, unhex(s.epochKeyHex));
    expect(inner).toEqual(s.inner);
    expect(canonicalize(inner as unknown as JsonValue)).toBe(s.plaintext);
  });

  it('a sealed envelope moved to another space does not open', async () => {
    const s = vectors.e2e.sealed as Obj;
    const moved = { ...s.envelope, spaceId: 'project:p-other' } as SealedEnvelope;
    expect(await openSealed(moved, unhex(s.epochKeyHex))).toBeNull();
  });

  it('the KEM-wrapped key unwraps with the recipient key', async () => {
    const k = vectors.e2e.kemWrap as Obj;
    const priv = await crypto.subtle.importKey(
      'jwk',
      { kty: 'EC', crv: 'P-256', x: k.recipient.x, y: k.recipient.y, d: b64urlEncode(unhex(k.recipient.dHex)) },
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      ['deriveBits']
    );
    const raw = await kemUnwrap(k.wrapped, priv);
    expect(raw && Array.from(raw)).toEqual(Array.from(unhex(k.payloadHex)));
  });
});

describe('consent vectors — quorum.json (O-4)', () => {
  it('every vote is a valid signed event', async () => {
    for (const [name, v] of Object.entries(vectors.quorum.votes as Obj)) {
      expect(await verifySignedObject(v, resolver), name).toEqual({ ok: true });
    }
  });

  it('every quorum case reproduces its verdict and reason', () => {
    const events = new Map<string, ConsentEvent>(
      Object.values(vectors.quorum.votes as Record<string, ConsentEvent>).map((e) => [e.id, e])
    );
    for (const c of vectors.quorum.quorum as Obj[]) {
      const res = verifyQuorum(c.proof as QuorumProof, {
        eligibleMembers: new Set(c.eligibleMembers as string[]),
        events,
        voteAction: vectors.quorum.voteAction as string,
        ...(c.memberWeights
          ? { memberWeights: new Map(Object.entries(c.memberWeights as Record<string, string>).map(([m, w]) => [m, BigInt(w)])) }
          : {})
      });
      const got = res.ok ? { ok: true, agreers: [...res.agreers].sort(compareIds) } : { ok: false, reason: res.reason };
      expect(got, c.name).toEqual(c.expect);
    }
  });

  it('every rule kind has a passing and a failing case', () => {
    const byKind = new Map<string, Set<boolean>>();
    for (const c of vectors.quorum.quorum as Obj[]) {
      const k = (c.proof as QuorumProof).rule.kind;
      if (!byKind.has(k)) byKind.set(k, new Set());
      byKind.get(k)!.add((c.expect as Obj).ok as boolean);
    }
    for (const kind of ['unanimous', 'majority', 'k-of-n', 'agreers-only', 'timeout', 'weighted-unanimous-positive', 'weighted-threshold']) {
      expect([...(byKind.get(kind) ?? [])].sort(), kind).toEqual([false, true]);
    }
  });

  it('every delta case reproduces its verdict and reason', () => {
    for (const c of vectors.quorum.deltas as Obj[]) {
      const res = checkDeltas(deltaStateFromJson(c.before), deltaStateFromJson(c.after), c.deltas as Delta[]);
      expect(res, c.name).toEqual(c.expect);
    }
  });
});
