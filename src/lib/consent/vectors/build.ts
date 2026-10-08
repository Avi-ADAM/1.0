// Builds the cross-language test vectors in spec/consent-v1/ (the contract of
// docs/SPEC_CONSENT_FORMAT.md). Everything here runs THROUGH the reference
// TS implementation — signCanonical, project, computeStateRoot, normalizeState
// — so the files freeze exactly what this codebase produces today. A second
// implementation (Rust/WASM) is conformant when it reproduces them.
//
// Deterministic by construction: keys are derived from
// sha256("1lev1-consent-v1/<label>"), nonces / IVs / ephemeral keys the same
// way, timestamps are literals, and Ed25519 signatures are deterministic
// (RFC 8032). The one exception is ECDSA-P256, whose WebCrypto signatures are
// randomized: that signature is frozen — reused from `previous` when its body
// is unchanged — and checked by verification only.
//
// Hand-written expectations (the canonical strings, the RFC 8032 vector) are
// asserted here before anything is returned: a builder that disagrees with
// them throws instead of writing a wrong contract.

import { createECDH } from 'node:crypto';
import { canonicalize, type JsonValue } from '$lib/crypto/canonical';
import { signCanonical, bodyForSigning, bodyWithSig } from '$lib/crypto/sign';
import { b64urlEncode } from '$lib/crypto/b64';
import type { ConsentEvent } from '$lib/consent/event';
import { project, topoSort, emptyState } from '$lib/consent/projection';
import { dedupeKey } from '$lib/consent/event';
import { computeStateRoot, normalizeState } from '$lib/consent/stateRoot';
import { computeHeads } from '$lib/space/protocol';
import { keyCommitment } from '$lib/space/e2e/epoch';

export const VECTOR_FILES = ['canonical', 'signatures', 'events', 'e2e'] as const;
export type VectorFile = (typeof VECTOR_FILES)[number];
export type VectorSet = Record<VectorFile, Record<string, unknown>>;

const LABEL_PREFIX = '1lev1-consent-v1/';
const enc = new TextEncoder();

// ── byte helpers ────────────────────────────────────────────────────────────

function toBuf(u8: Uint8Array): ArrayBuffer {
  return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) as ArrayBuffer;
}

export function hex(u8: Uint8Array | ArrayBuffer): string {
  const v = u8 instanceof Uint8Array ? u8 : new Uint8Array(u8);
  return [...v].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function unhex(s: string): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(new ArrayBuffer(s.length / 2));
  for (let i = 0; i < out.length; i++) out[i] = parseInt(s.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

async function sha256(bytes: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', toBuf(bytes)));
}

/** sha256("1lev1-consent-v1/<label>") — the derivation every seed/nonce/IV uses. */
export async function derive(label: string): Promise<Uint8Array> {
  return sha256(enc.encode(LABEL_PREFIX + label));
}

function assertEq(actual: unknown, expected: unknown, what: string): void {
  if (actual !== expected) {
    throw new Error(`vectors: ${what}\n  expected ${String(expected)}\n  actual   ${String(actual)}`);
  }
}

// ── keys ────────────────────────────────────────────────────────────────────

// PKCS#8 wrapper of a raw 32-byte Ed25519 seed (RFC 8410).
const PKCS8_ED25519_PREFIX = '302e020100300506032b657004220420';

export type EdKey = {
  label: string;
  seedHex: string;
  publicKeyHex: string;
  spki: string; // b64url(SPKI DER) — the `device` value
  privateKey: CryptoKey;
  publicKey: CryptoKey;
};

export async function edKeyFromSeed(label: string, seed: Uint8Array): Promise<EdKey> {
  const pkcs8 = concat(unhex(PKCS8_ED25519_PREFIX), seed);
  const privateKey = await crypto.subtle.importKey('pkcs8', toBuf(pkcs8), { name: 'Ed25519' }, true, ['sign']);
  const jwk = await crypto.subtle.exportKey('jwk', privateKey);
  const publicKey = await crypto.subtle.importKey(
    'jwk',
    { kty: 'OKP', crv: 'Ed25519', x: jwk.x },
    { name: 'Ed25519' },
    true,
    ['verify']
  );
  const spkiBuf = await crypto.subtle.exportKey('spki', publicKey);
  const raw = await crypto.subtle.exportKey('raw', publicKey);
  return {
    label,
    seedHex: hex(seed),
    publicKeyHex: hex(raw),
    spki: b64urlEncode(spkiBuf),
    privateKey,
    publicKey
  };
}

async function edKey(label: string): Promise<EdKey> {
  return edKeyFromSeed(label, await derive('ed25519/' + label));
}

type P256Material = { dHex: string; x: string; y: string; spki: string };

/** P-256 scalar d from a label; x/y from node's ECDH (WebCrypto cannot derive them). */
async function p256Material(label: string): Promise<P256Material> {
  const d = await derive('p256/' + label);
  const ecdh = createECDH('prime256v1');
  ecdh.setPrivateKey(Buffer.from(d));
  const pub = new Uint8Array(ecdh.getPublicKey()); // 04 ‖ x ‖ y
  const x = b64urlEncode(pub.slice(1, 33));
  const y = b64urlEncode(pub.slice(33, 65));
  const pubKey = await crypto.subtle.importKey(
    'jwk',
    { kty: 'EC', crv: 'P-256', x, y },
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['verify']
  );
  return { dHex: hex(d), x, y, spki: b64urlEncode(await crypto.subtle.exportKey('spki', pubKey)) };
}

function p256Jwk(m: P256Material): JsonWebKey {
  return { kty: 'EC', crv: 'P-256', x: m.x, y: m.y, d: b64urlEncode(unhex(m.dHex)) };
}

// ── canonical.json ──────────────────────────────────────────────────────────

type CanonCase = { name: string; note?: string; input: string; canonical: string };
type CanonReject = { name: string; note: string; input: string };

// `input` is JSON TEXT: the parse step is part of the contract (numbers parse
// to IEEE-754 doubles, escapes resolve before NFC). `canonical` is hand-written.
const CANON_CASES: CanonCase[] = [
  { name: 'key-order-basic', input: '{"b":1,"a":2}', canonical: '{"a":2,"b":1}' },
  {
    name: 'key-order-utf16-not-utf8',
    note: 'U+1F600 is the surrogate pair D83D DE00, which sorts BEFORE U+E000 in UTF-16; in UTF-8 byte order it would sort after.',
    input: String.raw`{"":1,"😀":2}`,
    canonical: '{"\u{1F600}":2,"":1}'
  },
  {
    name: 'key-order-case-digits-empty',
    note: 'Plain code-unit order: no numeric ordering of integer-like keys, uppercase before lowercase.',
    input: '{"a":1,"B":2,"10":3,"9":4,"":5}',
    canonical: '{"":5,"10":3,"9":4,"B":2,"a":1}'
  },
  { name: 'whitespace-removed', input: '{ "a" : [ 1 , 2 ] ,\n "b" : { } }', canonical: '{"a":[1,2],"b":{}}' },
  { name: 'array-order-preserved', input: '[3,1,2]', canonical: '[3,1,2]' },
  {
    name: 'nested',
    input: '{"z":{"y":[{"b":null,"a":true}],"x":false}}',
    canonical: '{"z":{"x":false,"y":[{"a":true,"b":null}]}}'
  },
  {
    name: 'numbers-ecmascript',
    note: 'Every number is an IEEE-754 double, printed by ECMAScript Number::toString. 9007199254740993 is not representable and parses to ...992 — a parser that keeps exact integers (serde_json u64) is non-conformant.',
    input: '[0,-0,1,-1,1.5,0.1,1e21,1e20,1e-7,1e-6,5e-324,1.7976931348623157e308,9007199254740993,0.30000000000000004,123456789012345680000,100,1E2]',
    canonical: '[0,0,1,-1,1.5,0.1,1e+21,100000000000000000000,1e-7,0.000001,5e-324,1.7976931348623157e+308,9007199254740992,0.30000000000000004,123456789012345680000,100,100]'
  },
  {
    name: 'string-escapes',
    note: 'Only " \\ and U+0000–U+001F are escaped (short forms for \\b \\t \\n \\f \\r, lowercase \\u00xx otherwise). "/", DEL and U+2028 are emitted raw.',
    input: String.raw`"\u0000\u0007\b\t\n\f\r\u001f\"\\\/\u007f é"`,
    canonical: String.raw`"\u0000\u0007\b\t\n\f\r\u001f\"\\/` + '\u007f é"'
  },
  {
    name: 'nfc-string',
    note: 'e + U+0301 COMBINING ACUTE becomes U+00E9 (ours — RFC 8785 has no normalization step).',
    input: String.raw`"café"`,
    canonical: '"café"'
  },
  {
    name: 'nfc-key-sorted-after-normalization',
    note: 'The key is normalized to U+00E9 first and THEN sorted, so it lands after "f".',
    input: String.raw`{"é":1,"f":2}`,
    canonical: '{"f":2,"é":1}'
  },
  {
    name: 'hebrew-and-emoji',
    input: '{"name":"רקמה \u{1F3A8}","n":[]}',
    canonical: '{"n":[],"name":"רקמה \u{1F3A8}"}'
  },
  {
    name: 'unicode-escapes-resolved',
    input: String.raw`"רקמה"`,
    canonical: '"רקמה"'
  }
];

const CANON_REJECTS: CanonReject[] = [
  { name: 'lone-high-surrogate', note: 'Not representable in strict UTF-8.', input: String.raw`"\ud800"` },
  { name: 'lone-low-surrogate-in-key', note: 'Keys are held to the same rule.', input: String.raw`{"\udc00":1}` },
  {
    name: 'nfc-duplicate-keys',
    note: 'U+00E9 and e+U+0301 normalize to the same key.',
    input: String.raw`{"é":1,"é":2}`
  },
  { name: 'non-finite-number', note: '1e400 overflows to Infinity.', input: '1e400' }
];

async function buildCanonical(): Promise<Record<string, unknown>> {
  const cases = [];
  for (const c of CANON_CASES) {
    const got = canonicalize(JSON.parse(c.input) as JsonValue);
    assertEq(got, c.canonical, `canonical case ${c.name}`);
    cases.push({ ...c, sha256: b64urlEncode(toBuf(await sha256(enc.encode(got)))) });
  }
  for (const r of CANON_REJECTS) {
    let threw = false;
    try {
      canonicalize(JSON.parse(r.input) as JsonValue);
    } catch {
      threw = true;
    }
    if (!threw) throw new Error(`vectors: canonical reject case ${r.name} was accepted`);
  }
  return {
    about: 'Canonical JSON (SPEC_CONSENT_FORMAT §2). Parse `input` as JSON text, canonicalize, compare to `canonical`; sha256 is b64url(SHA-256(UTF-8(canonical))). Every `rejects` entry must fail (at parse or at canonicalization).',
    cases,
    rejects: CANON_REJECTS
  };
}

// ── signed objects ──────────────────────────────────────────────────────────

type Obj = Record<string, unknown>;

function strip(o: Obj): Obj {
  const out: Obj = {};
  for (const [k, v] of Object.entries(o)) if (v !== undefined) out[k] = v;
  return out;
}

async function signWith(body: Obj, key: CryptoKey, algo: 'Ed25519' | 'ECDSA-P256'): Promise<Obj> {
  const clean = strip(body);
  const { sig, id } = await signCanonical(clean as JsonValue, key, algo);
  return { ...clean, sig, id };
}

function describeSigned(o: Obj): Obj {
  return {
    canonicalBody: canonicalize(bodyForSigning(o as { id: string; sig: string })),
    canonicalBodyWithSig: canonicalize(bodyWithSig(o as { id: string; sig: string }))
  };
}

// RFC 8032 §7.1 TEST 1 — the independent anchor that pins the Ed25519
// key-import path (seed → public key → signature) to the standard.
const RFC8032_TEST1 = {
  seedHex: '9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60',
  publicKeyHex: 'd75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a',
  messageHex: '',
  signatureHex:
    'e5564300c360ac729086e2cc806e828a84877f1eb8e5d974d873e065224901555fb8821590a33bacc61e39701cf9b46bd25bf5f0595bbe24655141438e7a100b'
};

const ACTORS = ['alice', 'bob', 'carol'] as const;
type Actor = (typeof ACTORS)[number];
const userId = (a: Actor) => `u-${a}`;

const T0 = 1_760_000_000_000;

async function nonceFor(label: string): Promise<string> {
  return b64urlEncode(toBuf((await derive('nonce/' + label)).slice(0, 16)));
}

/** Flip a zero padding bit in the last b64url char: same bytes to atob, a different string. */
function nonCanonicalB64(s: string): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const last = alphabet.indexOf(s[s.length - 1]);
  return s.slice(0, -1) + alphabet[last | 1];
}

async function buildSignatures(
  keys: Record<string, EdKey>,
  firstEvent: Obj,
  previous: Obj | undefined
): Promise<Record<string, unknown>> {
  // RFC 8032 anchor.
  const rfc = await edKeyFromSeed('rfc8032-test1', unhex(RFC8032_TEST1.seedHex));
  assertEq(rfc.publicKeyHex, RFC8032_TEST1.publicKeyHex, 'RFC 8032 public key');
  const rfcSig = hex(await crypto.subtle.sign({ name: 'Ed25519' }, rfc.privateKey, new Uint8Array(0)));
  assertEq(rfcSig, RFC8032_TEST1.signatureHex, 'RFC 8032 signature');

  // A minimal, non-event signed object: the pipeline is shape-agnostic.
  const minimal = await signWith(
    { v: 1, actor: 'u-alice', device: keys.alice.spki, note: 'שלום', n: 1.5 },
    keys.alice.privateKey,
    'Ed25519'
  );

  // DeviceCert: alice's laptop authorizes her phone (T7).
  const certBody = {
    v: 1,
    kind: 'deviceCert',
    userId: 'u-alice',
    devicePubKey: keys['alice-phone'].spki,
    deviceLabel: 'טלפון',
    capabilities: ['sign'],
    notBefore: T0,
    parentDevicePubKey: keys.alice.spki,
    actor: 'u-alice',
    device: keys.alice.spki,
    nonce: await nonceFor('deviceCert/alice-phone')
  };
  const deviceCert = await signWith(certBody, keys.alice.privateKey, 'Ed25519');

  // ECDSA-P256 (the fallback algorithm; iOS Secure Enclave's only curve).
  const dave = await p256Material('dave');
  const daveBody = strip({
    v: 1,
    actor: 'u-dave',
    device: dave.spki,
    action: 'project.join',
    subject: { type: 'project', id: 'p-1' },
    parents: [],
    ts: T0,
    nonce: await nonceFor('p256/dave')
  });
  const prevP256 = (previous?.valid as Obj[] | undefined)?.find((v) => v.name === 'ecdsa-p256-event')?.object as
    | Obj
    | undefined;
  let p256Event: Obj;
  if (prevP256 && canonicalize(bodyForSigning(prevP256 as { id: string; sig: string })) === canonicalize(daveBody as JsonValue)) {
    p256Event = prevP256; // frozen: ECDSA signatures are randomized
  } else {
    const priv = await crypto.subtle.importKey('jwk', p256Jwk(dave), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
    p256Event = await signWith(daveBody, priv, 'ECDSA-P256');
  }

  const tamperedPredicate = { ...firstEvent, predicate: { settings: { name: 'זיוף', restime: 172800000 } } };
  const badId = { ...firstEvent, id: b64urlEncode(toBuf(await derive('not-the-id'))) };
  const badSigEncoding = { ...firstEvent, sig: nonCanonicalB64(firstEvent.sig as string) };
  // A real key that is deliberately absent from `keys` below.
  const unknownDevice = { ...firstEvent, device: (await edKey('mallory')).spki };
  const loneSurrogate = { ...minimal, note: '\ud800' };
  const nfcDuplicate = { ...minimal, note: { 'é': 1, 'é': 2 } };
  const otherSigner = { ...minimal, sig: (deviceCert.sig as string) };

  return {
    about: 'Signed objects (SPEC_CONSENT_FORMAT §3). Resolve `device` against `keys`; every `valid` object must verify, every `invalid` one must fail with the given reason class. Ed25519 objects must also be reproduced byte-for-byte by re-signing their body.',
    rfc8032: RFC8032_TEST1,
    keys: [
      ...Object.values(keys).map((k) => ({
        label: k.label,
        alg: 'Ed25519',
        seedHex: k.seedHex,
        publicKeyHex: k.publicKeyHex,
        spki: k.spki
      })),
      { label: 'dave', alg: 'ECDSA-P256', dHex: dave.dHex, spki: dave.spki }
    ],
    valid: [
      { name: 'minimal-object', alg: 'Ed25519', object: minimal, ...describeSigned(minimal) },
      { name: 'consent-event', alg: 'Ed25519', object: firstEvent, ...describeSigned(firstEvent) },
      { name: 'device-cert', alg: 'Ed25519', object: deviceCert, ...describeSigned(deviceCert) },
      {
        name: 'ecdsa-p256-event',
        alg: 'ECDSA-P256',
        note: 'Signature is frozen (ECDSA is randomized): verify only. IEEE P1363 r‖s, 64 bytes — not DER.',
        object: p256Event,
        ...describeSigned(p256Event)
      }
    ],
    invalid: [
      { name: 'tampered-predicate', reason: 'bad_signature', object: tamperedPredicate },
      { name: 'wrong-id', reason: 'bad_id', object: badId },
      { name: 'non-canonical-sig-encoding', reason: 'bad_sig_encoding', note: 'Decodes to the same 64 bytes under a lenient decoder; must still be rejected.', object: badSigEncoding },
      { name: 'unknown-device', reason: 'unknown_or_revoked_device', object: unknownDevice },
      { name: 'signature-by-another-object', reason: 'bad_signature', object: otherSigner },
      { name: 'lone-surrogate-in-body', reason: 'non_canonical_body', object: loneSurrogate },
      { name: 'nfc-duplicate-keys-in-body', reason: 'non_canonical_body', object: nfcDuplicate }
    ]
  };
}

// ── events.json — scenarios folded through the projection ───────────────────

type Step = {
  label: string;
  actor: Actor;
  action: string;
  subject: [string, string];
  predicate?: Obj;
  t: number; // ms after T0
  parents?: string[]; // labels (or literal ids prefixed "!"); default: the previous step
  commit?: boolean; // carry parentStateRoots + stateRoot (SPEC §7.3)
};

type Scenario = { name: string; projectId: string | null; description: string; steps: Step[]; genesis?: boolean };

const SCENARIOS: Scenario[] = [
  {
    name: 'rikma-lifecycle',
    projectId: 'p-1',
    description:
      'Three members, one of every category-A entity, ties, a merge, a branch, dedupe, redaction, money as strings, an action with no reducer, and a final event that commits to its parent and resulting state roots.',
    steps: [
      { label: 's01', actor: 'alice', action: 'project.create', subject: ['project', 'p-1'], predicate: { settings: { name: 'רקמת דוגמה', restime: 172800000 } }, t: 0, parents: [] },
      { label: 's02', actor: 'bob', action: 'project.join', subject: ['project', 'p-1'], t: 1000, parents: ['s01'] },
      { label: 's03', actor: 'carol', action: 'project.join', subject: ['project', 'p-1'], t: 1000, parents: ['s01'] },
      { label: 's04', actor: 'alice', action: 'mission.create', subject: ['mission', 'm-1'], predicate: { name: 'עיצוב לוגו 🎨', hours: 12.5, perhour: 80, stageIds: ['pendm-7'] }, t: 10_000, parents: ['s02', 's03'] },
      { label: 's05', actor: 'alice', action: 'pendm.vote', subject: ['pendm', 'pendm-7'], predicate: { what: true, order: 1 }, t: 20_000 },
      { label: 's06', actor: 'bob', action: 'pendm.vote', subject: ['pendm', 'pendm-7'], predicate: { what: true, order: 1 }, t: 21_000 },
      // JS truthiness: the STRING "false" is a yes (SPEC §6.4).
      { label: 's07', actor: 'carol', action: 'pendm.vote', subject: ['pendm', 'pendm-7'], predicate: { what: 'false', order: 1 }, t: 22_000 },
      // start and stop share a dedupe key (no `order`) — only the stop survives (SPEC §6.2).
      { label: 's08', actor: 'bob', action: 'time.tick', subject: ['mission', 'm-1'], predicate: { op: 'start' }, t: 30_000 },
      { label: 's09', actor: 'bob', action: 'time.tick', subject: ['mission', 'm-1'], predicate: { op: 'stop', sessionMs: 5_400_000 }, t: 5_430_000 },
      { label: 's10', actor: 'bob', action: 'mission.complete', subject: ['mission', 'm-1'], predicate: { hoursDone: 12.5, why: 'נמסר ללקוחה' }, t: 6_000_000 },
      { label: 's11', actor: 'bob', action: 'payload.redact', subject: ['mission', 'm-1'], predicate: {}, t: 6_100_000 },
      { label: 's12', actor: 'alice', action: 'mission.approve', subject: ['mission', 'm-1'], predicate: { payee: 'u-bob', amount: { amount: '100000', code: 'ILS' } }, t: 7_000_000 },
      { label: 's13', actor: 'alice', action: 'forum.create', subject: ['forum', 'f-1'], predicate: { kind: 'mission' }, t: 7_100_000 },
      // Stored NON-normalized: signatures and roots see the NFC form (SPEC §2.2).
      { label: 's14', actor: 'bob', action: 'message.post', subject: ['message', 'msg-2'], predicate: { forumId: 'f-1', body: 'שלום 👋 café' }, t: 7_200_000 },
      // Branch off s13, same ts as s14: messages order by (ts, id).
      { label: 's15', actor: 'carol', action: 'message.post', subject: ['message', 'msg-1'], predicate: { forumId: 'f-1', body: 'תודה!' }, t: 7_200_000, parents: ['s13'] },
      { label: 's16', actor: 'carol', action: 'payload.redact', subject: ['message', 'msg-1'], predicate: {}, t: 7_300_000, parents: ['s14', 's15'] },
      { label: 's17', actor: 'alice', action: 'sale.record', subject: ['sale', 's-1'], predicate: { holder: 'u-bob', holderStatus: 'open', decisionId: 'd-1', total: 350, quantity: 1, kindOf: 'logo', saleDate: '2026-10-01' }, t: 8_000_000 },
      { label: 's18', actor: 'alice', action: 'decision.create', subject: ['decision', 'd-1'], predicate: { kind: 'saleClaim', ref: 's-1' }, t: 8_000_001 },
      { label: 's19', actor: 'bob', action: 'proposal.counter', subject: ['decision', 'd-1'], predicate: { order: 2, total: 300 }, t: 8_100_000 },
      { label: 's20', actor: 'alice', action: 'decision.vote', subject: ['decision', 'd-1'], predicate: { what: true, order: 2 }, t: 8_200_000 },
      { label: 's21', actor: 'alice', action: 'tosplit.create', subject: ['tosplit', 'ts-1'], predicate: { total: { amount: '35000', code: 'ILS' } }, t: 9_000_000 },
      // Re-vote: same dedupe key, the later ts wins.
      { label: 's22', actor: 'alice', action: 'tosplit.vote', subject: ['tosplit', 'ts-1'], predicate: { what: false }, t: 9_100_000 },
      { label: 's23', actor: 'alice', action: 'tosplit.vote', subject: ['tosplit', 'ts-1'], predicate: { what: true }, t: 9_200_000 },
      { label: 's24', actor: 'bob', action: 'tosplit.vote', subject: ['tosplit', 'ts-1'], predicate: { what: true }, t: 9_300_000 },
      { label: 's25', actor: 'carol', action: 'tosplit.vote', subject: ['tosplit', 'ts-1'], predicate: { what: 1 }, t: 9_400_000 },
      { label: 's26', actor: 'alice', action: 'haluka.create', subject: ['haluka', 'h-1'], predicate: { from: 'u-alice', to: 'u-bob', tosplitId: 'ts-1', amount: 120.5, code: 'ILS' }, t: 10_000_000 },
      // " 12050 " parses (ECMAScript StringToBigInt trims); "12.5" does not and is skipped (SPEC §6.4).
      { label: 's27', actor: 'alice', action: 'haluka.approve', subject: ['haluka', 'h-1'], predicate: { hervachDeltas: [{ member: 'u-alice', amount: { amount: '-12050', code: 'ILS' } }, { member: 'u-carol', amount: { amount: ' 12050 ', code: 'ILS' } }, { member: 'u-bob', amount: { amount: '12.5', code: 'ILS' } }] }, t: 10_100_000 },
      { label: 's28', actor: 'bob', action: 'haluka.confirm', subject: ['haluka', 'h-1'], predicate: {}, t: 10_200_000 },
      { label: 's29', actor: 'carol', action: 'member.away', subject: ['user', 'u-carol'], predicate: { until: T0 + 1_000_000_000 }, t: 11_000_000 },
      { label: 's30', actor: 'alice', action: 'project.amend', subject: ['project', 'p-1'], predicate: { path: 'restime', value: 86400000 }, t: 12_000_000 },
      { label: 's31', actor: 'bob', action: 'pgisha.create', subject: ['pgisha', 'g-1'], predicate: { date: '2026-11-01', name: 'פגישת צוות' }, t: 13_000_000 },
      { label: 's32', actor: 'carol', action: 'pgisha.approve', subject: ['pgisha', 'g-1'], predicate: {}, t: 13_100_000, parents: ['s31'] },
      // No reducer: entity state untouched, but asOf still advances (SPEC §6.3).
      { label: 's33', actor: 'alice', action: 'epoch.grant', subject: ['space', 'project:p-1'], predicate: { epoch: 0, wraps: {} }, t: 13_200_000, parents: ['s31'] },
      // Merges the two heads and commits to both parent roots and its own
      // resulting root. Deliberately NOT a vote: vote reducers write ev.id
      // into the state, and ev.id is a hash over the signed stateRoot — a
      // vote can never commit to its own root (SPEC §7.3, open item O-3). And
      // quorum-free, so strict-mode verification needs no QuorumProof.
      { label: 's34', actor: 'bob', action: 'member.away', subject: ['user', 'u-bob'], predicate: { until: T0 + 900_000_000 }, t: 14_000_000, parents: ['s32', 's33'], commit: true }
    ]
  },
  {
    name: 'dedupe-tostring-and-dangling',
    projectId: null,
    description:
      'order 1 and order "1" are the SAME dedupe key (ECMAScript ToString); a dangling parent is ignored for ordering; equal ts ties break by id. No members, so votes approve only if every recorded vote is yes.',
    steps: [
      { label: 'b01', actor: 'alice', action: 'decision.vote', subject: ['decision', 'd-9'], predicate: { what: true, order: 1 }, t: 1000, parents: [] },
      { label: 'b02', actor: 'alice', action: 'decision.vote', subject: ['decision', 'd-9'], predicate: { what: false, order: '1' }, t: 2000, parents: ['b01'] },
      { label: 'b03', actor: 'bob', action: 'decision.vote', subject: ['decision', 'd-9'], predicate: { what: true }, t: 500, parents: ['!missing-parent-id'] },
      { label: 'b04', actor: 'carol', action: 'decision.vote', subject: ['decision', 'd-9'], predicate: { what: true, order: 1 }, t: 2000, parents: [] }
    ]
  },
  {
    name: 'genesis-snapshot',
    projectId: 'p-2',
    genesis: true,
    description:
      'T6 migration: a parentless snapshot.commit with upTo:"genesis" carries a normalized state inline; members and balances merge into the fold, the snapshot mark itself stays out of the state root.',
    steps: [
      // predicate filled in by the builder (needs the genesis state's root)
      { label: 'c01', actor: 'alice', action: 'snapshot.commit', subject: ['project', 'p-2'], t: 0, parents: [] },
      { label: 'c02', actor: 'carol', action: 'project.join', subject: ['project', 'p-2'], t: 5000 }
    ]
  }
];

async function genesisPredicate(): Promise<Obj> {
  const g = emptyState('p-2');
  g.members.add('u-alice');
  g.members.add('u-bob');
  g.balances.set('u-alice', 250000n);
  g.balances.set('u-bob', -1n);
  g.settings.set('name', 'רקמה מיובאת');
  g.asOf = T0 - 1;
  return { upTo: 'genesis', stateRoot: await computeStateRoot(g), state: normalizeState(g) as unknown as Obj };
}

/** Ancestor closure inside the scenario (dangling ids are skipped). */
function closureOf(roots: string[], byId: Map<string, ConsentEvent>): ConsentEvent[] {
  const out = new Map<string, ConsentEvent>();
  const stack = [...roots];
  while (stack.length) {
    const id = stack.pop()!;
    if (out.has(id)) continue;
    const ev = byId.get(id);
    if (!ev) continue;
    out.set(id, ev);
    stack.push(...ev.parents);
  }
  return [...out.values()];
}

async function buildScenario(sc: Scenario, keys: Record<string, EdKey>): Promise<Obj> {
  const events: ConsentEvent[] = [];
  const idOf = new Map<string, string>();
  const labels: Record<string, string> = {};
  const byId = new Map<string, ConsentEvent>();

  for (let i = 0; i < sc.steps.length; i++) {
    const st = sc.steps[i];
    const parentLabels = st.parents ?? (i > 0 ? [sc.steps[i - 1].label] : []);
    const parents = parentLabels.map((l) => (l.startsWith('!') ? l.slice(1) : idOf.get(l)!));
    const predicate = sc.genesis && st.label === 'c01' ? await genesisPredicate() : st.predicate;
    const key = keys[st.actor];
    const body: Obj = {
      v: 1,
      actor: userId(st.actor),
      device: key.spki,
      action: st.action,
      subject: { type: st.subject[0], id: st.subject[1] },
      predicate,
      parents,
      ts: T0 + st.t,
      nonce: await nonceFor(`${sc.name}/${st.label}`)
    };
    if (st.commit) {
      const roots: string[] = [];
      for (const p of parents) roots.push(await computeStateRoot(project(closureOf([p], byId), sc.projectId)));
      body.parentStateRoots = roots;
      // The event's own id is unknowable before signing; the placeholder is
      // harmless only because this step's reducer never reads ev.id.
      const draft = { ...strip(body), id: '', sig: '' } as unknown as ConsentEvent;
      body.stateRoot = await computeStateRoot(project([...closureOf(parents, byId), draft], sc.projectId));
    }
    const ev = (await signWith(body, key.privateKey, 'Ed25519')) as unknown as ConsentEvent;
    events.push(ev);
    byId.set(ev.id, ev);
    idOf.set(st.label, ev.id);
    labels[ev.id] = st.label;
  }

  // Expected outputs — all from the reference implementation.
  const ordered = topoSort(events);
  const kept = new Map<string, ConsentEvent>();
  for (const e of ordered) {
    const k = dedupeKey(e);
    const cur = kept.get(k);
    if (!cur || e.ts > cur.ts) kept.set(k, e);
  }
  const applied = ordered.filter((e) => kept.get(dedupeKey(e)) === e);

  const steps = [];
  for (let i = 0; i < applied.length; i++) {
    const prefix = applied.slice(0, i + 1);
    steps.push({ id: applied[i].id, label: labels[applied[i].id], rootAfter: await computeStateRoot(project(prefix, sc.projectId)) });
  }
  const finalState = project(events, sc.projectId);

  return {
    name: sc.name,
    description: sc.description,
    projectId: sc.projectId,
    labels,
    events,
    expect: {
      topoOrder: ordered.map((e) => e.id),
      dedupeKeys: Object.fromEntries(events.map((e) => [e.id, dedupeKey(e)])),
      applied: applied.map((e) => e.id),
      heads: computeHeads(events),
      steps,
      normalizedState: normalizeState(finalState),
      stateRoot: await computeStateRoot(finalState)
    }
  };
}

// ── e2e.json ────────────────────────────────────────────────────────────────

const HKDF_INFO = 'freemates-epoch-wrap-v1';
const KC_TAG = 'freemates-epoch-kc-v1';

async function buildE2e(keys: Record<string, EdKey>, inner: Obj): Promise<Record<string, unknown>> {
  const epochKey = await derive('epoch-key/project:p-1/0');

  // Key commitment, recomputed independently of keyCommitment().
  const kc = b64urlEncode(toBuf(await sha256(concat(enc.encode(KC_TAG), epochKey))));
  assertEq(await keyCommitment(epochKey), kc, 'epoch key commitment');

  // Sealed envelope with a fixed IV / ts / nonce.
  const header = { spaceId: 'project:p-1', epoch: 0, actor: 'u-alice', device: keys.alice.spki };
  const aad = canonicalize({ actor: header.actor, device: header.device, epoch: header.epoch, kind: 'sealed', spaceId: header.spaceId });
  const iv = (await derive('seal-iv/project:p-1/0')).slice(0, 12);
  const aesKey = await crypto.subtle.importKey('raw', toBuf(epochKey), { name: 'AES-GCM' }, false, ['encrypt']);
  const plaintext = canonicalize(inner as JsonValue);
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: toBuf(iv), additionalData: toBuf(enc.encode(aad)) }, aesKey, toBuf(enc.encode(plaintext)));
  const envelope = await signWith(
    {
      v: 1,
      kind: 'sealed',
      actor: header.actor,
      device: header.device,
      spaceId: header.spaceId,
      epoch: header.epoch,
      iv: b64urlEncode(toBuf(iv)),
      ct: b64urlEncode(ct),
      ts: T0 + 60_000,
      nonce: await nonceFor('sealed/0')
    },
    keys.alice.privateKey,
    'Ed25519'
  );

  // KEM wrap (ECIES over ECDH P-256) with a fixed ephemeral key.
  const recipient = await p256Material('kem-recipient');
  const eph = await p256Material('kem-ephemeral');
  const ecdhParams = { name: 'ECDH', namedCurve: 'P-256' };
  const ephPriv = await crypto.subtle.importKey('jwk', p256Jwk(eph), ecdhParams, false, ['deriveBits']);
  const recipientPub = await crypto.subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', x: recipient.x, y: recipient.y }, ecdhParams, true, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: recipientPub }, ephPriv, 256));
  const hkdfKey = await crypto.subtle.importKey('raw', toBuf(shared), 'HKDF', false, ['deriveBits']);
  const kek = new Uint8Array(
    await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(32), info: enc.encode(HKDF_INFO) }, hkdfKey, 256)
  );
  const wrapIv = (await derive('kem-iv/kem-recipient')).slice(0, 12);
  const kekKey = await crypto.subtle.importKey('raw', toBuf(kek), { name: 'AES-GCM' }, false, ['encrypt']);
  const wrapCt = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: toBuf(wrapIv) }, kekKey, toBuf(epochKey));

  return {
    about: 'Group encryption (SPEC_CONSENT_FORMAT §9). All binary fields b64url unless suffixed Hex.',
    epochKey: {
      rawHex: hex(epochKey),
      keyCommitment: { tag: KC_TAG, value: kc, formula: 'b64url(SHA-256(UTF-8(tag) ‖ rawKey))' }
    },
    sealed: {
      epochKeyHex: hex(epochKey),
      aad,
      plaintext,
      inner,
      envelope,
      note: 'AES-256-GCM, 12-byte IV, 16-byte tag appended to ct, AAD = UTF-8(aad). The outer envelope is a signed object (§3).'
    },
    kemWrap: {
      recipient: { dHex: recipient.dHex, x: recipient.x, y: recipient.y, spki: recipient.spki },
      ephemeral: { dHex: eph.dHex, spki: eph.spki },
      sharedSecretHex: hex(shared),
      hkdf: { hash: 'SHA-256', saltHex: hex(new Uint8Array(32)), info: HKDF_INFO, lengthBits: 256 },
      kekHex: hex(kek),
      payloadHex: hex(epochKey),
      wrapped: { epk: eph.spki, iv: b64urlEncode(toBuf(wrapIv)), ct: b64urlEncode(wrapCt) }
    }
  };
}

// ── entry point ─────────────────────────────────────────────────────────────

export async function buildKeys(): Promise<Record<string, EdKey>> {
  const keys: Record<string, EdKey> = {};
  for (const a of ACTORS) keys[a] = await edKey(a);
  keys['alice-phone'] = await edKey('alice-phone');
  return keys;
}

export async function buildVectors(previous?: Partial<VectorSet>): Promise<VectorSet> {
  const keys = await buildKeys();
  const scenarios = [];
  for (const sc of SCENARIOS) scenarios.push(await buildScenario(sc, keys));
  const firstEvent = (scenarios[0].events as unknown as Obj[])[0];

  const header = (file: string) => ({
    format: '1lev1-consent-vectors',
    version: 1,
    file,
    spec: 'docs/SPEC_CONSENT_FORMAT.md',
    generator: 'src/lib/consent/vectors/build.ts (npm run vectors:consent)',
    keyDerivation: `seed = SHA-256(UTF-8("${LABEL_PREFIX}" + label)); Ed25519 labels "ed25519/<name>", P-256 "p256/<name>", nonces "nonce/<...>" (first 16 bytes)`
  });

  return {
    canonical: { ...header('canonical'), ...(await buildCanonical()) },
    signatures: { ...header('signatures'), ...(await buildSignatures(keys, firstEvent, previous?.signatures)) },
    events: {
      ...header('events'),
      about: 'Projection + state root (SPEC_CONSENT_FORMAT §5–§8). Verify every event (§3), fold them in any input order, and reproduce `expect`. `steps[i].rootAfter` is the root after folding applied[0..i] — use it to find the first divergence.',
      stateRootVersion: 2,
      scenarios
    },
    e2e: { ...header('e2e'), ...(await buildE2e(keys, firstEvent)) }
  };
}
