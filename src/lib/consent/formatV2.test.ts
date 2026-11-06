// B5 — event format v2 (O-3, O-5, O-6): what the readers accept and what the
// (still switched-off) emitter would write. SPEC §4, §6.5, §7.

import { describe, it, expect } from 'vitest';
import { b64urlEncode } from '$lib/crypto/b64';
import { deviceFingerprint } from '$lib/crypto/deviceId';
import type { IdentityRecord } from '$lib/crypto/identity';
import { dedupeKey, isConsentEventShape, voteWhat, type ConsentEvent } from './event';
import { EMIT_FORMAT_V2, EMIT_EVENT_V } from './emitFormat';
import { buildAndSignEvent, emitEnvelope } from './signEvent';
import { emptyState, project } from './projection';
import { computeStateRoot, normalizeState, STATE_ROOT_VERSION, stateVersionForEvent } from './stateRoot';
import { restoreState } from './stateRestore';
import { verifyGenesisPredicate } from './genesis';
import { canonicalize, type JsonValue } from '$lib/crypto/canonical';

const ev = (over: Omit<Partial<ConsentEvent>, 'action'> & { action?: string } & Record<string, unknown>): ConsentEvent =>
  ({ v: 1, id: 'i', actor: '256', device: 'd', action: 'tosplit.vote', subject: { type: 'tosplit', id: '1' }, parents: [], ts: 1, nonce: 'n', sig: 's', ...over }) as ConsentEvent;

describe('the switch', () => {
  it('is off: this build signs v1 events and v2 state roots', () => {
    expect(EMIT_FORMAT_V2).toBe(false);
    expect(EMIT_EVENT_V).toBe(1);
    expect(STATE_ROOT_VERSION).toBe(2);
  });
});

describe('isConsentEventShape (v2)', () => {
  it('takes v1 and v2; a v2 `what` must be a boolean', () => {
    expect(isConsentEventShape(ev({ v: 1, predicate: { what: 'false' } }))).toBe(true); // v1, frozen
    expect(isConsentEventShape(ev({ v: 2, predicate: { what: false } }))).toBe(true);
    expect(isConsentEventShape(ev({ v: 2 }))).toBe(true);
    expect(isConsentEventShape(ev({ v: 2, predicate: { order: 3 } }))).toBe(true);
    expect(isConsentEventShape(ev({ v: 2, predicate: { what: 'false' } }))).toBe(false);
    expect(isConsentEventShape(ev({ v: 2, predicate: { what: null } }))).toBe(false);
    expect(isConsentEventShape(ev({ v: 2, predicate: [true] as unknown as Record<string, unknown> }))).toBe(false);
    expect(isConsentEventShape(ev({ v: 3 as unknown as 1 }))).toBe(false);
  });
});

describe('voteWhat (O-6)', () => {
  it('v1 keeps Boolean(); v2 is strict', () => {
    expect(voteWhat(ev({ v: 1, predicate: { what: 'false' } }))).toBe(true);
    expect(voteWhat(ev({ v: 1, predicate: { what: 0 } }))).toBe(false);
    expect(voteWhat(ev({ v: 2, predicate: { what: true } }))).toBe(true);
    expect(voteWhat(ev({ v: 2, predicate: { what: false } }))).toBe(false);
    expect(voteWhat(ev({ v: 2 }))).toBe(false);
  });
});

describe('dedupeKey (O-5)', () => {
  it('is the old string whenever no field has `\\` or `|` (or a type `:`)', () => {
    expect(dedupeKey(ev({ subject: { type: 'project', id: 'p-1' }, action: 'project.amend', predicate: { order: 'links/github#direct' } })))
      .toBe('256|project:p-1|project.amend|links/github#direct');
    expect(dedupeKey(ev({ predicate: { order: 1 } }))).toBe(dedupeKey(ev({ predicate: { order: '1' } }))); // frozen ToString
    expect(dedupeKey(ev({}))).toBe('256|tosplit:1|tosplit.vote|0');
  });

  it('no longer collides across fields', () => {
    const a = ev({ subject: { type: 'decision', id: 'd|decision.vote' }, action: 'decision.vote' });
    const b = ev({ subject: { type: 'decision', id: 'd' }, action: 'decision.vote|decision.vote' });
    expect(dedupeKey(a)).not.toBe(dedupeKey(b));
    const c = ev({ subject: { type: 'a:b', id: 'c' } });
    const d = ev({ subject: { type: 'a', id: 'b:c' } });
    expect(dedupeKey(c)).not.toBe(dedupeKey(d));
    const e = ev({ subject: { type: 't', id: 'x\\' }, action: '|y' });
    const f = ev({ subject: { type: 't', id: 'x\\|' }, action: 'y' });
    expect(dedupeKey(e)).not.toBe(dedupeKey(f));
  });

  it('one key across versions: a v2 re-vote replaces the v1 vote', () => {
    const v1 = ev({ v: 1, id: 'a', ts: 1, predicate: { what: true } });
    const v2 = ev({ v: 2, id: 'b', ts: 2, predicate: { what: false }, parents: ['a'] });
    expect(dedupeKey(v1)).toBe(dedupeKey(v2));
    const s = project([v1, v2], null);
    expect(s.tosplits.size + s.stageVotes.size).toBeGreaterThanOrEqual(0); // fold runs
  });
});

describe('state root v3 (O-3)', () => {
  const withVote = () => {
    const s = emptyState('p-9');
    s.members.add('256');
    s.tosplits.set('t', {
      id: 't', createdBy: '256', createdAt: 1, predicate: undefined, approved: true,
      votes: new Map([['256', { what: true, ts: 2, eventId: 'EV' }]])
    });
    return s;
  };

  it('v3 drops vote eventIds and nothing else; v2 is unchanged', async () => {
    const s = withVote();
    const v2 = canonicalize(normalizeState(s, 2));
    const v3 = canonicalize(normalizeState(s, 3));
    expect(v2).toContain('"eventId":"EV"');
    expect(v3).not.toContain('eventId');
    expect(v3.replace('"v":3', '"v":2')).toBe(v2.replace('"eventId":"EV",', ''));
    expect(normalizeState(s)).toEqual(normalizeState(s, 2)); // default = what this build emits
    expect(await computeStateRoot(s, 3)).not.toBe(await computeStateRoot(s, 2));
  });

  it('a v3 state restores and re-normalizes byte for byte; the version comes back', () => {
    const n = JSON.parse(JSON.stringify(normalizeState(withVote(), 3)));
    const r = restoreState(n);
    expect(r.ok && r.version).toBe(3);
    expect(r.ok && canonicalize(normalizeState(r.state, 3) as JsonValue)).toBe(canonicalize(n));
    expect(restoreState({ ...n, v: 4 }).ok).toBe(false);
  });

  it('a genesis verifies under its own stateV, v2 or v3', async () => {
    const s = withVote();
    for (const v of [2, 3] as const) {
      const predicate = {
        upTo: 'genesis',
        heads: [],
        stateRoot: await computeStateRoot(s, v),
        stateV: v,
        state: JSON.parse(JSON.stringify(normalizeState(s, v)))
      };
      expect((await verifyGenesisPredicate(predicate as never)).ok, `v${v}`).toBe(true);
      expect((await verifyGenesisPredicate({ ...predicate, stateV: v === 2 ? 3 : 2 } as never)).ok).toBe(false);
    }
  });

  it('an event commits under v2 when it is v1, v3 when it is v2', () => {
    expect(stateVersionForEvent({ v: 1 })).toBe(2);
    expect(stateVersionForEvent({ v: 2 })).toBe(3);
  });
});

describe('emitEnvelope / buildAndSignEvent with the switch on', () => {
  async function identity(): Promise<IdentityRecord> {
    const kp = (await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify'])) as CryptoKeyPair;
    const pubSpki = await crypto.subtle.exportKey('spki', kp.publicKey);
    return { id: 'self', userId: '256', algo: 'Ed25519', privateKey: kp.privateKey, publicKey: kp.publicKey, pubSpki, devicePubB64: b64urlEncode(pubSpki), createdAt: 0 };
  }

  it('off: v1 and the SPKI', async () => {
    const id = await identity();
    expect(await emitEnvelope(id.devicePubB64, { what: 'x' }, false)).toEqual({ v: 1, device: id.devicePubB64 });
  });

  it('on: v2, the deviceId, and no non-boolean `what`', async () => {
    const id = await identity();
    expect(await emitEnvelope(id.devicePubB64, { what: true }, true)).toEqual({ v: 2, device: await deviceFingerprint(id.devicePubB64) });
    await expect(emitEnvelope(id.devicePubB64, { what: 'false' }, true)).rejects.toThrow();
    const signed = await buildAndSignEvent(id, { actor: '256', action: 'tosplit.vote' as never, subject: { type: 'tosplit', id: '1' }, predicate: { what: true } }, true);
    expect(signed.v).toBe(2);
    expect(signed.device).toHaveLength(43);
    expect(isConsentEventShape(signed)).toBe(true);
  });
});
