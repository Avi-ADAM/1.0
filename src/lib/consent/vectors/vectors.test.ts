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
import { buildVectors, VECTOR_FILES, unhex, type VectorSet } from './build';
import { canonicalize, type JsonValue } from '$lib/crypto/canonical';
import { verifySignedObject, type PubKeyResolver } from '$lib/crypto/verify';
import { importPublicKey } from '$lib/crypto/identity';
import { b64urlDecode, b64urlEncode } from '$lib/crypto/b64';
import type { SigAlgo } from '$lib/crypto/algorithm';
import { verifyDeviceCert } from '$lib/crypto/deviceCert';
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
    keys.set(k.spki, { key: await importPublicKey(b64urlDecode(k.spki), algo), algo });
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

  it('the device cert also passes the T7 semantic checks', async () => {
    const cert = (vectors.signatures.valid as Obj[]).find((v) => v.name === 'device-cert')!.object as DeviceCert;
    const res = await verifyDeviceCert(cert, resolver, { userId: cert.userId, devicePubKey: cert.devicePubKey }, cert.notBefore);
    expect(res).toEqual({ ok: true });
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
