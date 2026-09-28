// T9b — the server half end to end, against the real consent store (memory
// mode) and the real registry resolvers: set → request → vouches → protest
// window → registration decision → overview a surviving device would see.

import { describe, it, expect, beforeEach } from 'vitest';
import { chooseAlgorithm, algoParams } from '$lib/crypto/algorithm';
import { b64urlEncode } from '$lib/crypto/b64';
import type { IdentityRecord } from '$lib/crypto/identity';
import { buildAndSignEvent } from '$lib/consent/signEvent';
import { ACTIONS } from '$lib/consent/event';
import {
  guardianSetPredicate,
  recoveryVouchPredicate,
  recoveryProtestPredicate,
  recoveryNominatePredicate,
  GUARDIAN_SET_ACTIVATION_MS,
  RECOVERY_PROTEST_MS
} from '$lib/consent/recovery';
import { consentStore } from './store';
import { judgeRegistration } from './devicePolicy';
import {
  recoveryCheckFor,
  recoveryOverview,
  openRecoverySession,
  findRecoverySession,
  isRecoveryCodeShape,
  _resetRecoverySessions
} from './recovery';

async function device(userId: string, register = true): Promise<IdentityRecord> {
  const algo = await chooseAlgorithm();
  const kp = (await crypto.subtle.generateKey(
    algoParams(algo) as Algorithm, true, ['sign', 'verify']
  )) as CryptoKeyPair;
  const spki = await crypto.subtle.exportKey('spki', kp.publicKey);
  const id: IdentityRecord = {
    id: 'self', userId, algo, privateKey: kp.privateKey, publicKey: kp.publicKey,
    pubSpki: spki, devicePubB64: b64urlEncode(spki), createdAt: 0
  };
  if (register) {
    await consentStore.putKey({
      userId, devicePubB64: id.devicePubB64, algo, pubSpkiB64: id.devicePubB64,
      label: 'test', addedAt: 0
    });
  }
  return id;
}

const USER = '10';
const KEM = 'NEW-KEM-SPKI';
const H = 60 * 60 * 1000;

beforeEach(() => {
  consentStore._reset();
  _resetRecoverySessions();
});

async function world() {
  const phone = await device(USER);
  const [g1, g2, g3] = [await device('21'), await device('22'), await device('23')];
  const now = Date.now();
  const set = await buildAndSignEvent(phone, {
    actor: USER,
    action: ACTIONS.recoveryGuardians,
    subject: { type: 'user', id: USER },
    predicate: guardianSetPredicate(USER, ['21', '22', '23'], 2),
    ts: now - GUARDIAN_SET_ACTIVATION_MS - H
  });
  await consentStore.putEvent(set);
  // Guardianship waits for consent: each guardian agrees.
  for (const g of [g1, g2, g3]) {
    await consentStore.putEvent(await buildAndSignEvent(g, {
      actor: g.userId, action: ACTIONS.recoveryAccept,
      subject: { type: 'user', id: USER }, predicate: {}, ts: now - GUARDIAN_SET_ACTIVATION_MS
    }));
  }
  const fresh = await device(USER, false);
  const vouch = async (g: IdentityRecord, ts: number) => {
    const ev = await buildAndSignEvent(g, {
      actor: g.userId,
      action: ACTIONS.recoveryVouch,
      subject: { type: 'user', id: USER },
      predicate: recoveryVouchPredicate({
        devicePubKey: fresh.devicePubB64, kemPubSpkiB64: KEM, guardianSetId: set.id, ts
      }),
      ts
    });
    await consentStore.putEvent(ev);
  };
  return { phone, g1, g2, g3, set, fresh, now, vouch };
}

describe('server recovery flow', () => {
  it('two of three guardians + a quiet day = the new device registers', async () => {
    const w = await world();
    await w.vouch(w.g1, w.now - 2 * H);
    await w.vouch(w.g3, w.now - RECOVERY_PROTEST_MS - H);
    const expected = { devicePubKey: w.fresh.devicePubB64, kemPubSpkiB64: KEM };

    const check = await recoveryCheckFor(USER, expected, w.now);
    expect(check).toMatchObject({ ok: true, vouchers: ['21', '23'], matured: false });

    // A day after the SECOND vouch, not the first.
    const later = w.now - 2 * H + RECOVERY_PROTEST_MS;
    const decision = await judgeRegistration({
      existing: await consentStore.getKeysForUser(USER),
      userId: USER, devicePubB64: w.fresh.devicePubB64, cert: undefined, enforce: true, now: later,
      recovery: () => recoveryCheckFor(USER, expected, later)
    });
    expect(decision).toMatchObject({ allow: true, status: 'recovered_by_guardians' });
  });

  it('a protest from the phone the user still holds stops it, and the phone sees it first', async () => {
    const w = await world();
    await openRecoverySession({
      userId: USER, devicePubB64: w.fresh.devicePubB64, algo: w.fresh.algo,
      pubSpkiB64: w.fresh.devicePubB64, kemPubSpkiB64: KEM, label: 'thief'
    });
    // Before any vouch, the surviving phone already sees the request.
    let o = await recoveryOverview(USER, w.now);
    expect(o.effective?.id).toBe(w.set.id);
    expect(o.recoveries).toHaveLength(1);
    expect(o.recoveries[0].fingerprint).toMatch(/^\d{4} \d{4} \d{4} \d{4}$/);

    await w.vouch(w.g1, w.now - 3 * H);
    await w.vouch(w.g2, w.now - 3 * H);
    const protest = await buildAndSignEvent(w.phone, {
      actor: USER,
      action: ACTIONS.recoveryProtest,
      subject: { type: 'user', id: USER },
      predicate: recoveryProtestPredicate(w.fresh.devicePubB64),
      ts: w.now - H
    });
    await consentStore.putEvent(protest);

    const check = await recoveryCheckFor(
      USER, { devicePubKey: w.fresh.devicePubB64, kemPubSpkiB64: KEM }, w.now + RECOVERY_PROTEST_MS
    );
    expect(check).toMatchObject({ ok: false, protestedAt: w.now - H });
    o = await recoveryOverview(USER, w.now);
    expect(o.recoveries[0].check.protestedAt).toBe(w.now - H);
  });

  it('a guardian set signed by a MANUALLY revoked device does not protect anyone', async () => {
    const w = await world();
    const k = (await consentStore.getKeysForUser(USER))[0];
    await consentStore.putKey({ ...k, revokedAt: Date.now(), revokedReason: 'manual' });
    const check = await recoveryCheckFor(USER, { devicePubKey: w.fresh.devicePubB64, kemPubSpkiB64: KEM });
    expect(check).toMatchObject({ ok: false, reason: 'no_effective_guardian_set' });
  });
});

describe('guardian inbox', () => {
  it('a nominee sees the request, and after agreeing sees themselves as guardian', async () => {
    const w = await world();
    const nominee = await device('24');
    const set2 = await buildAndSignEvent(w.phone, {
      actor: USER, action: ACTIONS.recoveryGuardians, subject: { type: 'user', id: USER },
      predicate: guardianSetPredicate(USER, ['21', '22', '24'], 2), ts: w.now
    });
    await consentStore.putEvent(set2);
    await consentStore.putEvent(await buildAndSignEvent(w.phone, {
      actor: USER, action: ACTIONS.recoveryNominate, subject: { type: 'user', id: '24' },
      predicate: recoveryNominatePredicate(set2) as unknown as Record<string, unknown>, ts: w.now
    }));

    let o = await recoveryOverview('24', w.now);
    expect(o.guarding).toEqual([{ ownerId: USER, current: true, threshold: 2, total: 3, stance: null }]);
    // The owner still has the old set in force; the new one waits.
    const owner = await recoveryOverview(USER, w.now);
    expect(owner.effective?.id).toBe(w.set.id);
    expect(owner.pending?.set.id).toBe(set2.id);
    expect(owner.pending?.accepted).toEqual(['21', '22']);

    await consentStore.putEvent(await buildAndSignEvent(nominee, {
      actor: '24', action: ACTIONS.recoveryAccept, subject: { type: 'user', id: USER }, predicate: {}, ts: w.now + 1
    }));
    o = await recoveryOverview('24', w.now + 2);
    expect(o.guarding[0].stance).toBe('accepted');
  });
});

describe('recovery sessions', () => {
  it('codes are 8 unambiguous characters and one device holds one code', async () => {
    const req = {
      userId: USER, devicePubB64: 'D', algo: 'Ed25519' as const,
      pubSpkiB64: 'D', kemPubSpkiB64: KEM, label: 'x'
    };
    const a = await openRecoverySession(req);
    expect(isRecoveryCodeShape(a.code)).toBe(true);
    expect(a.code).not.toMatch(/[01ILO]/);
    const b = await openRecoverySession(req);
    expect(findRecoverySession(a.code)).toBeUndefined();
    expect(findRecoverySession(b.code.toLowerCase())?.devicePubB64).toBe('D');
  });
});
