// Vault stage 3 acceptance (PLAN_RIKMA_SHARED_INFO §6 stage 3, Exit):
// a secret written on A's device is read on B's; a member who joined after
// genesis reads after a grant, without a rotation; a member who left is
// detected and cannot read what comes after the rotation; the relay-side
// bytes carry no plaintext. In-memory devices, same harness as grant.test.ts.

import { describe, it, expect } from 'vitest';
import { chooseAlgorithm, algoParams } from '$lib/crypto/algorithm';
import { signCanonical } from '$lib/crypto/sign';
import { b64urlEncode } from '$lib/crypto/b64';
import type { JsonValue } from '$lib/crypto/canonical';
import type { IdentityRecord } from '$lib/crypto/identity';
import { ACTIONS, type ConsentEvent } from '$lib/consent/event';
import { KEM_ALGO } from '$lib/space/e2e/kem';
import {
  generateEpochKeyRaw,
  buildEpochPredicate,
  buildEpochGrantPredicate,
  epochKeysForOpen
} from '$lib/space/e2e/epoch';
import { sealEvent, openSealed } from '$lib/space/e2e/seal';
import { spaceIdForVault } from '$lib/space/protocol';
import {
  vaultItemsFromEvents,
  validateVaultItem,
  strangerDevices,
  lastRemovalRotateAt,
  exposedItems
} from './items';

type Dev = { identity: IdentityRecord; kemPriv: CryptoKey; kemPubSpkiB64: string };
const SPACE = spaceIdForVault('77');

async function makeDevice(userId: string): Promise<Dev> {
  const algo = await chooseAlgorithm();
  const sig = (await crypto.subtle.generateKey(algoParams(algo) as Algorithm, true, ['sign', 'verify'])) as CryptoKeyPair;
  const spki = await crypto.subtle.exportKey('spki', sig.publicKey);
  const kem = (await crypto.subtle.generateKey(KEM_ALGO, false, ['deriveBits'])) as CryptoKeyPair;
  return {
    identity: {
      id: 'self', userId, algo, privateKey: sig.privateKey, publicKey: sig.publicKey,
      pubSpki: spki, devicePubB64: b64urlEncode(spki), createdAt: 0
    },
    kemPriv: kem.privateKey,
    kemPubSpkiB64: b64urlEncode(await crypto.subtle.exportKey('spki', kem.publicKey))
  };
}

let clock = 1_800_000_000_000;
async function sign(d: Dev, action: string, subject: { type: string; id: string }, predicate: Record<string, unknown>) {
  const body = {
    v: 1 as const, actor: d.identity.userId, device: d.identity.devicePubB64,
    action, subject, predicate, parents: [], ts: clock++,
    nonce: b64urlEncode(crypto.getRandomValues(new Uint8Array(16)))
  };
  const { sig, id } = await signCanonical(body as unknown as JsonValue, d.identity.privateKey, d.identity.algo);
  return { ...body, sig, id } as ConsentEvent;
}

const rcpt = (d: Dev) => ({ device: d.identity.devicePubB64, kemPubSpkiB64: d.kemPubSpkiB64 });
const rotate = async (by: Dev, epoch: number, raw: Uint8Array, to: Dev[], reason: 'genesis' | 'member.remove' = 'genesis') =>
  sign(by, ACTIONS.epochRotate, { type: 'space', id: SPACE },
    (await buildEpochPredicate(epoch, reason, raw, to.map(rcpt))) as unknown as Record<string, unknown>);
const setItem = (by: Dev, id: string, p: Record<string, unknown>) => sign(by, ACTIONS.vaultSet, { type: 'vault', id }, p);
const removeItem = (by: Dev, id: string) => sign(by, ACTIONS.vaultRemove, { type: 'vault', id }, {});
const members = (...ids: string[]) => new Set(ids);

describe('vault items — folding', () => {
  it('last writer wins by (ts, id), in any arrival order', async () => {
    const a = await makeDevice('A');
    const b = await makeDevice('B');
    const v1 = await setItem(a, 'wifi', { name: 'Wi-Fi', secret: 'one' });
    const v2 = await setItem(b, 'wifi', { name: 'Wi-Fi', secret: 'two', note: ' router ' });
    for (const order of [[v1, v2], [v2, v1]]) {
      const [item] = vaultItemsFromEvents(order, members('A', 'B'));
      expect(item).toMatchObject({ id: 'wifi', secret: 'two', note: 'router', createdBy: 'A', updatedBy: 'B' });
    }
  });

  it('a remove tombstones; a later set brings it back', async () => {
    const a = await makeDevice('A');
    const e = [await setItem(a, 'x', { name: 'X', secret: 's' }), await removeItem(a, 'x')];
    expect(vaultItemsFromEvents(e, members('A'))).toEqual([]);
    e.push(await setItem(a, 'x', { name: 'X', secret: 's2' }));
    expect(vaultItemsFromEvents(e, members('A'))[0].secret).toBe('s2');
  });

  it('a former member cannot slip an edit in under an old key', async () => {
    const a = await makeDevice('A');
    const gone = await makeDevice('G');
    const e = [await setItem(a, 'x', { name: 'X', secret: 'real' }), await setItem(gone, 'x', { name: 'X', secret: 'evil' })];
    expect(vaultItemsFromEvents(e, members('A'))[0].secret).toBe('real');
  });

  it('bad items are refused, and limits hold', () => {
    expect(validateVaultItem({ name: ' ', secret: 'x' })).toMatchObject({ ok: false, reason: 'vault_name_required' });
    expect(validateVaultItem({ name: 'n', secret: '' })).toMatchObject({ ok: false, reason: 'vault_secret_required' });
    expect(validateVaultItem({ name: 'n', secret: 'x'.repeat(4097) })).toMatchObject({ ok: false, reason: 'vault_too_long_secret' });
    expect(validateVaultItem({ name: 'n', secret: 'x', url: 5 })).toMatchObject({ ok: false, reason: 'vault_bad_url' });
  });
});

describe('vault — end to end over the epoch layer', () => {
  it('A writes, B reads; C joins later and reads after a grant — no rotation, no plaintext on the wire', async () => {
    const [a, b, c] = [await makeDevice('A'), await makeDevice('B'), await makeDevice('C')];
    const k0 = generateEpochKeyRaw();
    const r0 = await rotate(a, 0, k0, [a, b]);
    const secret = await setItem(a, 'bank', { name: 'Bank', username: 'rikma77', secret: 'hunter2-ZX' });
    const env = await sealEvent(a.identity, k0, SPACE, 0, secret);

    // What the relay / Strapi store: no plaintext.
    const wire = JSON.stringify(env);
    expect(wire).not.toContain('hunter2-ZX');
    expect(wire).not.toContain('rikma77');

    const bKeys = await epochKeysForOpen([r0], 0, b.identity.devicePubB64, b.kemPriv);
    const opened = await openSealed(env, bKeys[0]);
    expect(vaultItemsFromEvents([opened!], members('A', 'B'))[0].secret).toBe('hunter2-ZX');

    // C had no key…
    expect(await epochKeysForOpen([r0], 0, c.identity.devicePubB64, c.kemPriv)).toHaveLength(0);
    // …until a member grants the CURRENT epoch.
    const g = await sign(b, ACTIONS.epochGrant, { type: 'space', id: SPACE },
      (await buildEpochGrantPredicate(r0, k0, [rcpt(c)])) as unknown as Record<string, unknown>);
    const cKeys = await epochKeysForOpen([r0, g], 0, c.identity.devicePubB64, c.kemPriv);
    expect((await openSealed(env, cKeys[0]))?.id).toBe(secret.id);
  });

  it('someone left: detected as a stranger, rotated out, cannot read what comes next, and the list says what to change', async () => {
    const [a, b, gone] = [await makeDevice('A'), await makeDevice('B'), await makeDevice('G')];
    const k0 = generateEpochKeyRaw();
    const r0 = await rotate(a, 0, k0, [a, b, gone]);
    const known = await setItem(a, 'door', { name: 'Door code', secret: '1234' });
    const nowMembers = [
      { userId: 'A', devices: [a.identity.devicePubB64] },
      { userId: 'B', devices: [b.identity.devicePubB64] }
    ];
    expect(strangerDevices([r0], nowMembers)).toEqual([gone.identity.devicePubB64]);

    const k1 = generateEpochKeyRaw();
    const r1 = await rotate(b, 1, k1, [a, b], 'member.remove');
    const events = [r0, r1];
    expect(strangerDevices(events, nowMembers)).toEqual([]);

    const later = await setItem(a, 'door', { name: 'Door code', secret: '9876' });
    const env1 = await sealEvent(a.identity, k1, SPACE, 1, later);
    expect(await epochKeysForOpen(events, 1, gone.identity.devicePubB64, gone.kemPriv)).toHaveLength(0);
    expect(JSON.stringify(env1)).not.toContain('9876');

    // Before the change the door code is exposed; after, it is not.
    const removedAt = lastRemovalRotateAt(events);
    expect(removedAt).toBe(r1.ts);
    const before = vaultItemsFromEvents([known], members('A', 'B'));
    expect(exposedItems(before, removedAt).map((i) => i.id)).toEqual(['door']);
    const after = vaultItemsFromEvents([known, later], members('A', 'B'));
    expect(exposedItems(after, removedAt)).toEqual([]);
  });

  it('editing only the note does not clear the exposure', async () => {
    const a = await makeDevice('A');
    const e = [await setItem(a, 'k', { name: 'K', secret: 'same' })];
    const removedAt = clock++;
    e.push(await setItem(a, 'k', { name: 'K', secret: 'same', note: 'moved' }));
    expect(exposedItems(vaultItemsFromEvents(e, members('A')), removedAt)).toHaveLength(1);
  });
});
