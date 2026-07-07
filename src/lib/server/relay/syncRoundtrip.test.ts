// End-to-end shape of S2a without HTTP: two replicas with real Ed25519
// identities sync a space through the relay log using the heads/diff
// protocol. This is the "שני מכשירים מסתנכרנים דרך relay בלי GraphQL" exit
// criterion of PLAN_serverless_p2p_data §12, minus the wire.

import { describe, it, expect, beforeEach } from 'vitest';
import { chooseAlgorithm, algoParams } from '$lib/crypto/algorithm';
import { signCanonical } from '$lib/crypto/sign';
import { b64urlEncode } from '$lib/crypto/b64';
import type { JsonValue } from '$lib/crypto/canonical';
import type { ConsentEvent } from '$lib/consent/event';
import { ACTIONS } from '$lib/consent/event';
import { computeHeads, computeDiff, sameHeads } from '$lib/space/protocol';
import { project } from '$lib/consent/projection';
import { consentStore } from '$lib/server/consent/store';
import { verifyConsentEvent } from '$lib/server/consent/verifyServerSide';
import { relayAppend, relayRead, _resetRelayLogs } from './log';

type Identity = {
  userId: string;
  devicePubB64: string;
  privateKey: CryptoKey;
  algo: Awaited<ReturnType<typeof chooseAlgorithm>>;
};

async function bootstrapIdentity(userId: string): Promise<Identity> {
  const algo = await chooseAlgorithm();
  const kp = (await crypto.subtle.generateKey(
    algoParams(algo) as Algorithm, true, ['sign', 'verify']
  )) as CryptoKeyPair;
  const spki = await crypto.subtle.exportKey('spki', kp.publicKey);
  const devicePubB64 = b64urlEncode(spki);
  await consentStore.putKey({
    userId,
    devicePubB64,
    algo,
    pubSpkiB64: devicePubB64,
    label: 'test-device',
    addedAt: Date.now()
  });
  return { userId, devicePubB64, privateKey: kp.privateKey, algo };
}

async function sign(
  who: Identity,
  action: (typeof ACTIONS)[keyof typeof ACTIONS],
  subject: { type: string; id: string },
  parents: string[],
  predicate?: Record<string, unknown>
): Promise<ConsentEvent> {
  const body = {
    v: 1 as const,
    actor: who.userId,
    device: who.devicePubB64,
    action,
    subject,
    predicate,
    parents,
    ts: Date.now(),
    nonce: b64urlEncode(crypto.getRandomValues(new Uint8Array(16)).buffer)
  };
  const { sig, id } = await signCanonical(body as unknown as JsonValue, who.privateKey, who.algo);
  return { ...body, sig, id } as ConsentEvent;
}

/** A replica = local event map + the two protocol moves against the relay. */
function makeReplica() {
  const local = new Map<string, ConsentEvent>();
  return {
    local,
    add(ev: ConsentEvent) { local.set(ev.id, ev); },
    async pushToRelay(spaceId: string) {
      const relayState = relayRead(spaceId, Number.MAX_SAFE_INTEGER);
      for (const ev of computeDiff(local.values(), relayState.heads)) {
        const v = await verifyConsentEvent(ev);
        expect(v.ok).toBe(true);
        const r = await relayAppend(spaceId, ev);
        expect(r.ok).toBe(true);
      }
    },
    async pullFromRelay(spaceId: string, since = 0) {
      const page = relayRead(spaceId, since);
      for (const { event } of page.envelopes) {
        const v = await verifyConsentEvent(event);
        if (v.ok) local.set(event.id, event);
      }
      return page.latestSeq;
    }
  };
}

const SPACE = 'project:roundtrip-1';

beforeEach(() => _resetRelayLogs());

describe('two replicas converge through the relay', () => {
  it('create on A, vote on B, both project the same approved tosplit', async () => {
    const dana = await bootstrapIdentity('user-dana');
    const avi = await bootstrapIdentity('user-avi');
    const A = makeReplica();
    const B = makeReplica();

    // Membership + proposal happen on device A while B is offline.
    const joinDana = await sign(dana, ACTIONS.projectJoin, { type: 'project', id: 'p1' }, []);
    const joinAvi = await sign(avi, ACTIONS.projectJoin, { type: 'project', id: 'p1' }, [joinDana.id]);
    const create = await sign(dana, ACTIONS.tosplitCreate, { type: 'tosplit', id: 'ts9' }, [joinAvi.id]);
    const voteDana = await sign(dana, ACTIONS.tosplitVote, { type: 'tosplit', id: 'ts9' }, [create.id], { what: true });
    for (const e of [joinDana, joinAvi, create, voteDana]) A.add(e);
    await A.pushToRelay(SPACE);

    // B comes online, pulls, votes, pushes.
    const seq = await B.pullFromRelay(SPACE);
    expect(B.local.size).toBe(4);
    const voteAvi = await sign(avi, ACTIONS.tosplitVote, { type: 'tosplit', id: 'ts9' },
      computeHeads(B.local.values()), { what: true });
    B.add(voteAvi);
    await B.pushToRelay(SPACE);

    // A resumes from its cursor — pulls only the new vote.
    const page = relayRead(SPACE, seq);
    expect(page.envelopes.map((e) => e.event.id)).toEqual([voteAvi.id]);
    await A.pullFromRelay(SPACE, seq);

    // Convergence: same sets, same heads, same projection.
    expect([...A.local.keys()].sort()).toEqual([...B.local.keys()].sort());
    expect(sameHeads(computeHeads(A.local.values()), computeHeads(B.local.values()))).toBe(true);

    const stateA = project([...A.local.values()], 'p1');
    const stateB = project([...B.local.values()], 'p1');
    expect(stateA.members).toEqual(new Set(['user-dana', 'user-avi']));
    expect(stateA.tosplits.get('ts9')?.approved).toBe(true);
    expect(stateB.tosplits.get('ts9')?.approved).toBe(true);
  });

  it('a tampered event is rejected on pull and never enters the replica', async () => {
    const dana = await bootstrapIdentity('user-dana2');
    const A = makeReplica();
    const good = await sign(dana, ACTIONS.projectJoin, { type: 'project', id: 'p2' }, []);
    A.add(good);
    await A.pushToRelay(SPACE + 'x');

    // Simulate a malicious relay mutating a stored event.
    const page = relayRead(SPACE + 'x');
    const tampered = { ...page.envelopes[0].event, actor: 'user-mallory' };
    _resetRelayLogs();
    await consentStore.putKey({
      userId: 'user-mallory',
      devicePubB64: tampered.device,
      algo: dana.algo,
      pubSpkiB64: dana.devicePubB64,
      label: 'stolen',
      addedAt: Date.now()
    });
    await relayAppend(SPACE + 'x', tampered as ConsentEvent);

    const B = makeReplica();
    await B.pullFromRelay(SPACE + 'x');
    expect(B.local.size).toBe(0); // signature verify failed → dropped
  });

  it('offline divergence: both sides create, one exchange reconciles', async () => {
    const dana = await bootstrapIdentity('user-dana3');
    const avi = await bootstrapIdentity('user-avi3');
    const A = makeReplica();
    const B = makeReplica();
    const space = 'project:diverge-1';

    const root = await sign(dana, ACTIONS.projectJoin, { type: 'project', id: 'p3' }, []);
    A.add(root); B.add(root);

    // Both go offline and extend the DAG independently.
    A.add(await sign(dana, ACTIONS.tosplitCreate, { type: 'tosplit', id: 'tA' }, [root.id]));
    B.add(await sign(avi, ACTIONS.projectJoin, { type: 'project', id: 'p3' }, [root.id]));

    await A.pushToRelay(space);
    await B.pushToRelay(space);
    await A.pullFromRelay(space);
    await B.pullFromRelay(space);

    expect([...A.local.keys()].sort()).toEqual([...B.local.keys()].sort());
    expect(computeHeads(A.local.values()).length).toBe(2); // true fork, both tips kept
  });
});
