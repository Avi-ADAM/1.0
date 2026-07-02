import { describe, it, expect, beforeEach } from 'vitest';
import { chooseAlgorithm, algoParams } from '$lib/crypto/algorithm';
import { signCanonical } from '$lib/crypto/sign';
import { b64urlEncode } from '$lib/crypto/b64';
import { consentStore } from './store';
import { verifyConsentEvent } from './verifyServerSide';
import type { ConsentEvent } from '$lib/consent/event';

async function bootstrapIdentity(userId: string, label = 'test') {
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
    pubSpkiB64: devicePubB64, // SPKI bytes; reusing the b64 encoding
    label,
    addedAt: Date.now()
  });
  return { algo, kp, devicePubB64 };
}

async function buildEvent(
  identity: Awaited<ReturnType<typeof bootstrapIdentity>>,
  partial: { actor: string; action: string; subject: { type: string; id: string }; predicate?: Record<string, unknown>; parents?: string[]; ts?: number }
): Promise<ConsentEvent> {
  const body = {
    v: 1 as const,
    actor: partial.actor,
    device: identity.devicePubB64,
    action: partial.action,
    subject: partial.subject,
    predicate: partial.predicate,
    parents: partial.parents ?? [],
    ts: partial.ts ?? Date.now(),
    nonce: b64urlEncode(crypto.getRandomValues(new Uint8Array(16)))
  };
  const { sig, id } = await signCanonical(
    body as unknown as import('$lib/crypto/canonical').JsonValue,
    identity.kp.privateKey,
    identity.algo
  );
  return { ...body, sig, id } as ConsentEvent;
}

describe('end-to-end consent flow (server-side store)', () => {
  beforeEach(() => consentStore._reset());

  it('registers a key, accepts a signed event, retrieves it', async () => {
    const id = await bootstrapIdentity('user-A');
    const ev = await buildEvent(id, {
      actor: 'user-A',
      action: 'tosplit.create',
      subject: { type: 'tosplit', id: 'ts-XYZ' },
      predicate: { halukas: [] }
    });

    const v = await verifyConsentEvent(ev);
    expect(v.ok).toBe(true);

    await consentStore.putEvent(ev);
    const got = await consentStore.getEvent(ev.id);
    expect(got?.id).toBe(ev.id);

    const list = await consentStore.eventsForSubject('tosplit', 'ts-XYZ');
    expect(list.length).toBe(1);
  });

  it('rejects an event signed by an unregistered device', async () => {
    const id = await bootstrapIdentity('user-A');
    const ev = await buildEvent(id, {
      actor: 'user-B', // mismatched actor — no key registered for user-B
      action: 'tosplit.create',
      subject: { type: 'tosplit', id: 'ts-XYZ' }
    });
    const v = await verifyConsentEvent(ev);
    expect(v.ok).toBe(false);
  });

  it('rejects an event whose body was tampered after signing', async () => {
    const id = await bootstrapIdentity('user-A');
    const ev = await buildEvent(id, {
      actor: 'user-A',
      action: 'tosplit.create',
      subject: { type: 'tosplit', id: 'ts-XYZ' }
    });
    const tampered: ConsentEvent = { ...ev, ts: ev.ts + 1 };
    const v = await verifyConsentEvent(tampered);
    expect(v.ok).toBe(false);
  });

  it('two members vote on a tosplit — both verify independently', async () => {
    const a = await bootstrapIdentity('user-A');
    const b = await bootstrapIdentity('user-B');
    const createEv = await buildEvent(a, {
      actor: 'user-A',
      action: 'tosplit.create',
      subject: { type: 'tosplit', id: 'ts-1' },
      predicate: { halukas: [{ to: 'user-B', amount: 100 }] }
    });
    const voteA = await buildEvent(a, {
      actor: 'user-A',
      action: 'tosplit.vote',
      subject: { type: 'tosplit', id: 'ts-1' },
      predicate: { what: true },
      parents: [createEv.id]
    });
    const voteB = await buildEvent(b, {
      actor: 'user-B',
      action: 'tosplit.vote',
      subject: { type: 'tosplit', id: 'ts-1' },
      predicate: { what: true },
      parents: [createEv.id]
    });
    for (const ev of [createEv, voteA, voteB]) {
      const v = await verifyConsentEvent(ev);
      expect(v.ok, `event ${ev.action} should verify`).toBe(true);
      await consentStore.putEvent(ev);
    }
    const list = await consentStore.eventsForSubject('tosplit', 'ts-1');
    expect(list.length).toBe(3);
  });

  it('rejects a signed event whose stateRoot commitment is false', async () => {
    const id = await bootstrapIdentity('user-A');
    const createEv = await buildEvent(id, {
      actor: 'user-A',
      action: 'tosplit.create',
      subject: { type: 'tosplit', id: 'ts-2' }
    });
    expect((await verifyConsentEvent(createEv)).ok).toBe(true);
    await consentStore.putEvent(createEv);

    // Properly signed, but commits to a root that doesn't recompute — the
    // Phase 1.5 layer must reject it even though the signature is valid.
    const body = {
      v: 1 as const,
      actor: 'user-A',
      device: id.devicePubB64,
      action: 'tosplit.vote',
      subject: { type: 'tosplit' as const, id: 'ts-2' },
      predicate: { what: true },
      parents: [createEv.id],
      ts: Date.now(),
      nonce: b64urlEncode(crypto.getRandomValues(new Uint8Array(16))),
      stateRoot: 'forged-root-that-cannot-recompute'
    };
    const { sig, id: evId } = await signCanonical(
      body as unknown as import('$lib/crypto/canonical').JsonValue,
      id.kp.privateKey,
      id.algo
    );
    const forged = { ...body, sig, id: evId } as unknown as ConsentEvent;

    const v = await verifyConsentEvent(forged);
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.reason).toBe('commitment:state_root_mismatch');
  });
});
