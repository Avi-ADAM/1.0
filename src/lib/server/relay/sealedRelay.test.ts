// S3a exit criterion (PLAN_serverless_p2p_data §12): the relay carries a
// space whose data events are ciphertext only. Two devices exchange sealed
// events through the relay log; the test asserts BOTH that they converge
// AND that nothing readable ever sat on the relay ("blind relay" property).

import { describe, it, expect, beforeEach } from 'vitest';
import { chooseAlgorithm, algoParams } from '$lib/crypto/algorithm';
import { signCanonical } from '$lib/crypto/sign';
import { verifySignedObject, type PubKeyResolver } from '$lib/crypto/verify';
import { b64urlEncode } from '$lib/crypto/b64';
import type { JsonValue } from '$lib/crypto/canonical';
import type { IdentityRecord } from '$lib/crypto/identity';
import { ACTIONS, type ConsentEvent } from '$lib/consent/event';
import { KEM_ALGO } from '$lib/space/e2e/kem';
import {
  generateEpochKeyRaw,
  buildEpochPredicate,
  epochStateFromEvents,
  unwrapEpochKey
} from '$lib/space/e2e/epoch';
import { sealEvent, openSealed } from '$lib/space/e2e/seal';
import { relayAppend, relayAppendSealed, relayRead, _resetRelayLogs } from './log';

type TestDevice = {
  identity: IdentityRecord;
  kemPriv: CryptoKey;
  kemPubSpkiB64: string;
};

async function makeDevice(userId: string): Promise<TestDevice> {
  const algo = await chooseAlgorithm();
  const sig = (await crypto.subtle.generateKey(
    algoParams(algo) as Algorithm, true, ['sign', 'verify']
  )) as CryptoKeyPair;
  const sigSpki = await crypto.subtle.exportKey('spki', sig.publicKey);
  const kem = (await crypto.subtle.generateKey(KEM_ALGO, false, ['deriveBits'])) as CryptoKeyPair;
  const kemSpki = await crypto.subtle.exportKey('spki', kem.publicKey);
  return {
    identity: {
      id: 'self', userId, algo,
      privateKey: sig.privateKey, publicKey: sig.publicKey,
      pubSpki: sigSpki, devicePubB64: b64urlEncode(sigSpki), createdAt: Date.now()
    },
    kemPriv: kem.privateKey,
    kemPubSpkiB64: b64urlEncode(kemSpki)
  };
}

async function signEv(
  d: TestDevice,
  action: ConsentEvent['action'],
  subject: { type: string; id: string },
  predicate?: Record<string, unknown>,
  parents: string[] = []
): Promise<ConsentEvent> {
  const body = {
    v: 1 as const,
    actor: d.identity.userId,
    device: d.identity.devicePubB64,
    action, subject, predicate, parents,
    ts: Date.now(),
    nonce: b64urlEncode(crypto.getRandomValues(new Uint8Array(16)).buffer)
  };
  const { sig, id } = await signCanonical(body as unknown as JsonValue, d.identity.privateKey, d.identity.algo);
  return { ...body, sig, id } as ConsentEvent;
}

const SPACE = 'project:sealed-1';
const SECRET_MARKER = 'sodi-beyoter-42'; // the string that must never appear on the relay

beforeEach(() => _resetRelayLogs());

describe('blind relay roundtrip', () => {
  it('sealed space syncs through the relay; relay holds no plaintext payloads', async () => {
    const dana = await makeDevice('dana');
    const avi = await makeDevice('avi');
    const devices = [dana, avi];
    const resolver: PubKeyResolver = async (_a, dev) => {
      const d = devices.find((x) => x.identity.devicePubB64 === dev);
      return d ? { key: d.identity.publicKey, algo: d.identity.algo } : null;
    };

    // Dana starts epoch 0 (plaintext key distribution) and seals a proposal
    // whose predicate contains the secret marker.
    const key0 = generateEpochKeyRaw();
    const recipients = devices.map((d) => ({ device: d.identity.devicePubB64, kemPubSpkiB64: d.kemPubSpkiB64 }));
    const rot0 = await signEv(dana, ACTIONS.epochRotate, { type: 'space', id: SPACE },
      (await buildEpochPredicate(0, 'genesis', key0, recipients)) as unknown as Record<string, unknown>);
    await relayAppend(SPACE, rot0);

    const proposal = await signEv(dana, ACTIONS.tosplitCreate, { type: 'tosplit', id: 'ts1' },
      { note: SECRET_MARKER }, [rot0.id]);
    const sealedProposal = await sealEvent(dana.identity, key0, SPACE, 0, proposal);
    await relayAppendSealed(SPACE, sealedProposal);

    // ── Blind-relay assertion: serialize the ENTIRE relay state; the secret
    //    must not appear anywhere, and no sealed entry exposes event fields.
    const relayState = relayRead(SPACE);
    const dump = JSON.stringify(relayState);
    expect(dump).not.toContain(SECRET_MARKER);
    expect(dump).not.toContain('tosplit.create');
    for (const env of relayState.envelopes) {
      if (env.sealed) expect(env.event).toBeUndefined();
    }

    // Avi pulls: plaintext pass gives him the rotate; he unwraps his epoch
    // key with his KEM private key, then opens the sealed proposal.
    const aviEvents = new Map<string, ConsentEvent>();
    const page = relayRead(SPACE, 0);
    for (const env of page.envelopes) {
      if (env.event) {
        const v = await verifySignedObject(env.event, resolver);
        expect(v.ok).toBe(true);
        aviEvents.set(env.event.id, env.event);
      }
    }
    const es = epochStateFromEvents(aviEvents.values());
    const aviKey = await unwrapEpochKey(es.byEpoch.get(0)!, avi.identity.devicePubB64, avi.kemPriv);
    expect(aviKey).not.toBeNull();

    for (const env of page.envelopes) {
      if (!env.sealed) continue;
      const outer = await verifySignedObject(env.sealed, resolver);
      expect(outer.ok).toBe(true);
      const inner = await openSealed(env.sealed, aviKey!);
      expect(inner).not.toBeNull();
      // inner event carries its own signature — verify like any event
      const iv = await verifySignedObject(inner!, resolver);
      expect(iv.ok).toBe(true);
      aviEvents.set(inner!.id, inner!);
    }

    const got = aviEvents.get(proposal.id);
    expect(got?.predicate?.note).toBe(SECRET_MARKER);

    // Avi answers with a sealed vote; Dana pulls from her cursor and reads it.
    const vote = await signEv(avi, ACTIONS.tosplitVote, { type: 'tosplit', id: 'ts1' },
      { what: true }, [proposal.id]);
    const sealedVote = await sealEvent(avi.identity, aviKey!, SPACE, 0, vote);
    const appended = await relayAppendSealed(SPACE, sealedVote);
    expect(appended.ok).toBe(true);

    const danaPage = relayRead(SPACE, 2); // dana already has seq 1..2
    expect(danaPage.envelopes).toHaveLength(1);
    const danaGot = await openSealed(danaPage.envelopes[0].sealed!, key0);
    expect(danaGot?.id).toBe(vote.id);
    expect(JSON.stringify(relayRead(SPACE))).not.toContain('"what":true');
  });

  it('sealed dedupe shares the seq/byId space with plaintext entries', async () => {
    const dana = await makeDevice('dana');
    const key = generateEpochKeyRaw();
    const inner = await signEv(dana, ACTIONS.tosplitCreate, { type: 'tosplit', id: 'x' });
    const env = await sealEvent(dana.identity, key, SPACE, 0, inner);

    const first = await relayAppendSealed(SPACE, env);
    const dup = await relayAppendSealed(SPACE, env);
    expect(first).toMatchObject({ ok: true, deduped: false });
    expect(dup).toMatchObject({ ok: true, seq: first.seq, deduped: true });
  });

  it('plaintext heads ignore sealed entries (relay cannot see that DAG)', async () => {
    const dana = await makeDevice('dana');
    const key = generateEpochKeyRaw();
    const rot = await signEv(dana, ACTIONS.epochRotate, { type: 'space', id: SPACE },
      (await buildEpochPredicate(0, 'genesis', key,
        [{ device: dana.identity.devicePubB64, kemPubSpkiB64: dana.kemPubSpkiB64 }])) as unknown as Record<string, unknown>);
    await relayAppend(SPACE, rot);

    const inner = await signEv(dana, ACTIONS.tosplitCreate, { type: 'tosplit', id: 'y' }, undefined, [rot.id]);
    await relayAppendSealed(SPACE, await sealEvent(dana.identity, key, SPACE, 0, inner));

    // rot has a sealed child, but the relay can't know that — rot stays a head.
    expect(relayRead(SPACE).heads).toEqual([rot.id]);
    expect(relayRead(SPACE).latestSeq).toBe(2);
  });
});
