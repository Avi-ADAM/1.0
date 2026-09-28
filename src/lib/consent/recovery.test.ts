// T9b acceptance — guardian sets and vouches (PLAN_T9_SOCIAL_RECOVERY §4).
// Real signatures, in-memory keys; the resolvers stand in for the key
// registry exactly as the server and a peer would wire them.

import { describe, it, expect } from 'vitest';
import { chooseAlgorithm, algoParams, type SigAlgo } from '$lib/crypto/algorithm';
import { b64urlEncode } from '$lib/crypto/b64';
import type { PubKeyResolver } from '$lib/crypto/verify';
import type { IdentityRecord } from '$lib/crypto/identity';
import { buildAndSignEvent } from './signEvent';
import { ACTIONS, type ConsentEvent } from './event';
import {
  guardianSetPredicate,
  validateGuardianSetPredicate,
  recoveryVouchPredicate,
  effectiveGuardianSet,
  verifyRecovery,
  setSignerAcceptable,
  guardianSetStatus,
  recoveryProtestPredicate,
  thresholdMoment,
  validateRecoveryIngest,
  deviceFingerprint,
  acceptedGuardians,
  isRecoveryNominateEvent,
  recoveryNominatePredicate,
  GUARDIAN_SET_ACTIVATION_MS,
  VOUCH_MAX_TTL_MS,
  RECOVERY_PROTEST_MS,
  RECOVERY_CLAIM_TTL_MS,
  RECOVERY_SKEW_MS
} from './recovery';

async function makeIdentity(userId: string): Promise<IdentityRecord> {
  const algo = await chooseAlgorithm();
  const kp = (await crypto.subtle.generateKey(
    algoParams(algo) as Algorithm, true, ['sign', 'verify']
  )) as CryptoKeyPair;
  const spki = await crypto.subtle.exportKey('spki', kp.publicKey);
  return {
    id: 'self', userId, algo,
    privateKey: kp.privateKey, publicKey: kp.publicKey,
    pubSpki: spki, devicePubB64: b64urlEncode(spki), createdAt: 0
  };
}

function resolverOf(ids: IdentityRecord[]): PubKeyResolver {
  const byDevice = new Map(ids.map((i) => [i.devicePubB64, i]));
  return async (actor, device) => {
    const i = byDevice.get(device);
    if (!i || i.userId !== actor) return null;
    return { key: i.publicKey, algo: i.algo as SigAlgo };
  };
}

const T0 = 1_800_000_000_000;
const LATER = T0 + GUARDIAN_SET_ACTIVATION_MS + 1;
const USER = 'u1';
const NEW_DEVICE = { devicePubKey: 'NEW-SIG', kemPubSpkiB64: 'NEW-KEM' };

async function setEvent(by: IdentityRecord, guardians: string[], threshold: number, ts = T0) {
  return buildAndSignEvent(by, {
    actor: by.userId,
    action: ACTIONS.recoveryGuardians,
    subject: { type: 'user', id: by.userId },
    predicate: guardianSetPredicate(by.userId, guardians, threshold),
    ts
  });
}

async function vouchEvent(
  by: IdentityRecord,
  set: ConsentEvent,
  opts: { ts?: number; device?: typeof NEW_DEVICE; ttlMs?: number; setId?: string } = {}
) {
  const ts = opts.ts ?? LATER;
  const device = opts.device ?? NEW_DEVICE;
  return buildAndSignEvent(by, {
    actor: by.userId,
    action: ACTIONS.recoveryVouch,
    subject: { type: 'user', id: USER },
    predicate: recoveryVouchPredicate({
      ...device,
      guardianSetId: opts.setId ?? set.id,
      ts,
      ttlMs: opts.ttlMs
    }),
    ts
  });
}

describe('guardian set — shape rules', () => {
  it('normalizes: sorted, unique', () => {
    expect(guardianSetPredicate(USER, ['g3', 'g1', 'g1', 'g2'], 2)).toEqual({
      guardians: ['g1', 'g2', 'g3'], threshold: 2
    });
  });

  it.each([
    [['g1', 'g2'], 1, 'set_threshold_too_low'],
    [['g1', 'g2'], 3, 'set_threshold_above_n'],
    [[USER, 'g2'], 2, 'set_self_guardian'],
    [['g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8', 'g9', 'h1'], 2, 'set_too_many_guardians']
  ])('rejects %j with threshold %i (%s)', (guardians, threshold, reason) => {
    expect(() => guardianSetPredicate(USER, guardians, threshold)).toThrow(reason);
  });

  it('a hand-built unsorted set does not validate (one set, one byte form)', () => {
    expect(validateGuardianSetPredicate(USER, { guardians: ['g2', 'g1'], threshold: 2 }))
      .toMatchObject({ ok: false, reason: 'set_not_sorted' });
  });
});

// Guardian identities by id, and their accept/withdraw events — a set only
// counts once enough of its guardians have agreed (decision 28.9.2026).
const G = new Map<string, IdentityRecord>();
async function guardian(id: string): Promise<IdentityRecord> {
  if (!G.has(id)) G.set(id, await makeIdentity(id));
  return G.get(id)!;
}
async function stance(id: string, accept = true, ts = T0 + 1, owner = USER) {
  return buildAndSignEvent(await guardian(id), {
    actor: id,
    action: accept ? ACTIONS.recoveryAccept : ACTIONS.recoveryWithdraw,
    subject: { type: 'user', id: owner },
    predicate: {},
    ts
  });
}
async function accepts(ids: string[], ts = T0 + 1) {
  return Promise.all(ids.map((id) => stance(id, true, ts)));
}
const guardianResolver = () => resolverOf([...G.values()]);
const resolvers = (owner: IdentityRecord[]) => ({ setSigner: resolverOf(owner), guardian: guardianResolver() });

describe('effectiveGuardianSet', () => {
  it('a set is not in force before its activation delay', async () => {
    const u = await makeIdentity(USER);
    const set = await setEvent(u, ['g1', 'g2'], 2);
    const ev = [set, ...(await accepts(['g1', 'g2']))];
    expect(await effectiveGuardianSet(ev, USER, resolvers([u]), T0 + 1000)).toBeNull();
    expect((await effectiveGuardianSet(ev, USER, resolvers([u]), LATER))?.id).toBe(set.id);
  });

  it('a set is not in force until `threshold` of its guardians have agreed', async () => {
    const u = await makeIdentity(USER);
    const set = await setEvent(u, ['g1', 'g2', 'g3'], 2);
    const one = await accepts(['g1']);
    expect(await effectiveGuardianSet([set, ...one], USER, resolvers([u]), LATER)).toBeNull();
    const two = await accepts(['g1', 'g3']);
    expect((await effectiveGuardianSet([set, ...two], USER, resolvers([u]), LATER))?.id).toBe(set.id);
  });

  it('a withdrawal after agreeing takes the guardian out again', async () => {
    const u = await makeIdentity(USER);
    const set = await setEvent(u, ['g1', 'g2'], 2);
    const ev = [set, ...(await accepts(['g1', 'g2'])), await stance('g2', false, T0 + 50)];
    expect(await effectiveGuardianSet(ev, USER, resolvers([u]), LATER)).toBeNull();
  });

  it('an agreement signed by someone else does not count', async () => {
    const u = await makeIdentity(USER);
    const set = await setEvent(u, ['g1', 'g2'], 2);
    const impostor = await makeIdentity('g2'); // not g2's registered key
    const fake = await buildAndSignEvent(impostor, {
      actor: 'g2', action: ACTIONS.recoveryAccept, subject: { type: 'user', id: USER }, predicate: {}, ts: T0 + 1
    });
    const ev = [set, ...(await accepts(['g1'])), fake];
    expect(await effectiveGuardianSet(ev, USER, resolvers([u]), LATER)).toBeNull();
  });

  it('while a newer set waits for consent, the older one stays in force', async () => {
    const u = await makeIdentity(USER);
    const old = await setEvent(u, ['g1', 'g2'], 2, T0);
    const next = await setEvent(u, ['g3', 'g4'], 2, T0 + 1000);
    const ev = [old, next, ...(await accepts(['g1', 'g2']))];
    expect((await effectiveGuardianSet(ev, USER, resolvers([u]), LATER + 5000))?.id).toBe(old.id);
    const status = await guardianSetStatus(ev, USER, resolvers([u]), LATER + 5000);
    expect(status).toMatchObject({ effective: { id: old.id }, effectiveAccepted: ['g1', 'g2'], pending: { set: { id: next.id }, accepted: [] } });
  });

  it('a newer set replaces an older one only once IT has matured', async () => {
    const u = await makeIdentity(USER);
    const old = await setEvent(u, ['g1', 'g2'], 2, T0);
    const next = await setEvent(u, ['g3', 'g4'], 2, T0 + 1000);
    const ev = [old, next, ...(await accepts(['g1', 'g2', 'g3', 'g4']))];
    expect((await effectiveGuardianSet(ev, USER, resolvers([u]), T0 + GUARDIAN_SET_ACTIVATION_MS + 10))?.id)
      .toBe(old.id);
    expect((await effectiveGuardianSet(ev, USER, resolvers([u]), T0 + GUARDIAN_SET_ACTIVATION_MS + 2000))?.id)
      .toBe(next.id);
  });

  it('a newer set from an unresolvable signer is skipped, not chosen-then-failed', async () => {
    const u = await makeIdentity(USER);
    const thiefDevice = await makeIdentity(USER); // a key the registry refuses
    const real = await setEvent(u, ['g1', 'g2'], 2, T0);
    const forged = await setEvent(thiefDevice, ['t1', 't2'], 2, T0 + 5);
    const ev = [forged, real, ...(await accepts(['g1', 'g2', 't1', 't2']))];
    const got = await effectiveGuardianSet(ev, USER, resolvers([u]), LATER + 10);
    expect(got?.id).toBe(real.id);
  });

  it('only sets signed by the user themselves count', async () => {
    const other = await makeIdentity('someone-else');
    const set = await buildAndSignEvent(other, {
      actor: other.userId,
      action: ACTIONS.recoveryGuardians,
      subject: { type: 'user', id: USER },
      predicate: guardianSetPredicate(USER, ['g1', 'g2'], 2),
      ts: T0
    });
    const ev = [set, ...(await accepts(['g1', 'g2']))];
    expect(await effectiveGuardianSet(ev, USER, resolvers([other]), LATER)).toBeNull();
  });
});

describe('verifyRecovery', () => {
  async function world() {
    const u = await makeIdentity(USER);
    const [g1, g2, g3] = [await guardian('g1'), await guardian('g2'), await guardian('g3')];
    const outsider = await guardian('x9');
    const set = await setEvent(u, ['g1', 'g2', 'g3'], 2);
    return {
      u, g1, g2, g3, outsider, set,
      stances: await accepts(['g1', 'g2', 'g3']),
      resolveSetSigner: resolverOf([u]),
      resolveGuardian: guardianResolver()
    };
  }

  const check = (w: Awaited<ReturnType<typeof world>>, vouches: ConsentEvent[], now = LATER + 60_000, stances = w.stances) =>
    verifyRecovery({
      userId: USER,
      expected: NEW_DEVICE,
      sets: [w.set],
      vouches,
      stances,
      resolveSetSigner: w.resolveSetSigner,
      resolveGuardian: w.resolveGuardian,
      now
    });

  it('a guardian who never agreed cannot vouch', async () => {
    const w = await world();
    const onlyTwo = await accepts(['g1', 'g2']); // g3 never agreed
    const v = [await vouchEvent(w.g1, w.set), await vouchEvent(w.g3, w.set)];
    expect(await check(w, v, LATER + 60_000, onlyTwo)).toMatchObject({ ok: false, reason: 'vouches_below_threshold:1/2' });
  });

  it('k distinct guardians recover the device — after the protest window', async () => {
    const w = await world();
    const v = [await vouchEvent(w.g1, w.set), await vouchEvent(w.g3, w.set, { ts: LATER + 10 })];
    const res = await check(w, v);
    expect(res).toMatchObject({
      ok: true, setId: w.set.id, vouchers: ['g1', 'g3'],
      thresholdAt: LATER + 10, readyAt: LATER + 10 + RECOVERY_PROTEST_MS, matured: false
    });
    expect(await check(w, v, LATER + 10 + RECOVERY_PROTEST_MS)).toMatchObject({ ok: true, matured: true });
  });

  it('a matured recovery that nobody completes lapses', async () => {
    const w = await world();
    const v = [await vouchEvent(w.g1, w.set), await vouchEvent(w.g2, w.set)];
    const res = await check(w, v, LATER + RECOVERY_PROTEST_MS + RECOVERY_CLAIM_TTL_MS + 1);
    expect(res).toMatchObject({ ok: false, reason: 'recovery_lapsed' });
  });

  it('the answer does not depend on vouch order', async () => {
    const w = await world();
    const v = [await vouchEvent(w.g2, w.set), await vouchEvent(w.g1, w.set)];
    expect(await check(w, v)).toEqual(await check(w, [...v].reverse()));
  });

  it('one guardian vouching twice is one vouch', async () => {
    const w = await world();
    const res = await check(w, [
      await vouchEvent(w.g1, w.set),
      await vouchEvent(w.g1, w.set, { ts: LATER + 5 })
    ]);
    expect(res).toMatchObject({ ok: false, reason: 'vouches_below_threshold:1/2' });
  });

  it('a non-guardian vouch does not count', async () => {
    const w = await world();
    const res = await check(w, [await vouchEvent(w.g1, w.set), await vouchEvent(w.outsider, w.set)]);
    expect(res.ok).toBe(false);
  });

  it('vouches for a different device — or a different KEM key — do not count', async () => {
    const w = await world();
    const res = await check(w, [
      await vouchEvent(w.g1, w.set),
      await vouchEvent(w.g2, w.set, { device: { ...NEW_DEVICE, kemPubSpkiB64: 'ATTACKER-KEM' } })
    ]);
    expect(res.ok).toBe(false);
  });

  it('a vouch that expired before the next one arrived does not count', async () => {
    const w = await world();
    const res = await check(
      w,
      [
        await vouchEvent(w.g2, w.set, { ttlMs: 1000 }),
        await vouchEvent(w.g1, w.set, { ts: LATER + 5000 })
      ],
      LATER + 60_000
    );
    expect(res).toMatchObject({ ok: false, reason: 'vouches_never_live_together' });
  });

  it('liveness is judged when the k-th vouch lands, not at registration', async () => {
    // Both vouches were live together at LATER; the 24h protest window then
    // outlasts the short one. Waiting as asked must not expire the recovery.
    const w = await world();
    const v = [await vouchEvent(w.g1, w.set), await vouchEvent(w.g2, w.set, { ttlMs: 1000 })];
    const res = await check(w, v, LATER + RECOVERY_PROTEST_MS + 1);
    expect(res).toMatchObject({ ok: true, matured: true, thresholdAt: LATER });
  });

  it('the TTL is capped even when a vouch asks for more', async () => {
    const p = recoveryVouchPredicate({ ...NEW_DEVICE, guardianSetId: 's', ts: 0, ttlMs: VOUCH_MAX_TTL_MS * 10 });
    expect(p.notAfter).toBe(VOUCH_MAX_TTL_MS);
  });

  it('a vouch aimed at another guardian set does not count', async () => {
    const w = await world();
    const res = await check(w, [
      await vouchEvent(w.g1, w.set),
      await vouchEvent(w.g2, w.set, { setId: 'some-older-set' })
    ]);
    expect(res.ok).toBe(false);
  });

  it('a vouch with a forged signature does not count', async () => {
    const w = await world();
    const good = await vouchEvent(w.g2, w.set);
    const forged = { ...good, predicate: { ...good.predicate, notAfter: good.ts + 1 } };
    const res = await check(w, [await vouchEvent(w.g1, w.set), forged]);
    expect(res.ok).toBe(false);
  });

  it('no effective set → no recovery', async () => {
    const w = await world();
    const res = await check(w, [await vouchEvent(w.g1, w.set), await vouchEvent(w.g2, w.set)], T0 + 1000);
    expect(res).toMatchObject({ ok: false, reason: 'no_effective_guardian_set' });
  });
});

describe('setSignerAcceptable', () => {
  it('a lost device (chain reset) keeps its set; a distrusted one (manual revoke) voids it', () => {
    expect(setSignerAcceptable({})).toBe(true);
    expect(setSignerAcceptable({ revokedAt: 5, revokedReason: 'reset' })).toBe(true);
    expect(setSignerAcceptable({ revokedAt: 5, revokedReason: 'manual' })).toBe(false);
  });
});

describe('protest window', () => {
  async function world() {
    const u = await makeIdentity(USER);
    const [g1, g2, g3] = [await guardian('g1'), await guardian('g2'), await guardian('g3')];
    const set = await setEvent(u, ['g1', 'g2', 'g3'], 2);
    return { u, g1, g2, g3, set, stances: await accepts(['g1', 'g2', 'g3']) };
  }

  async function protestEvent(by: IdentityRecord, ts: number, device = NEW_DEVICE.devicePubKey) {
    return buildAndSignEvent(by, {
      actor: by.userId,
      action: ACTIONS.recoveryProtest,
      subject: { type: 'user', id: USER },
      predicate: recoveryProtestPredicate(device),
      ts
    });
  }

  const check = (
    w: Awaited<ReturnType<typeof world>>,
    vouches: ConsentEvent[],
    protests: ConsentEvent[],
    protester: IdentityRecord[],
    now = LATER + RECOVERY_PROTEST_MS + 60_000
  ) =>
    verifyRecovery({
      userId: USER,
      expected: NEW_DEVICE,
      sets: [w.set],
      vouches,
      protests,
      stances: w.stances,
      resolveSetSigner: resolverOf([w.u]),
      resolveGuardian: guardianResolver(),
      resolveProtester: resolverOf(protester),
      now
    });

  it('a protest from a device the user holds voids every vouch before it', async () => {
    const w = await world();
    const v = [await vouchEvent(w.g1, w.set), await vouchEvent(w.g2, w.set, { ts: LATER + 10 })];
    const protest = await protestEvent(w.u, LATER + 60_000);
    const res = await check(w, v, [protest], [w.u]);
    expect(res).toMatchObject({ ok: false, reason: 'vouches_below_threshold:0/2', protestedAt: LATER + 60_000 });
  });

  it('guardians may vouch again after a protest — the window restarts', async () => {
    const w = await world();
    const protestAt = LATER + 60_000;
    const v = [
      await vouchEvent(w.g1, w.set),
      await vouchEvent(w.g2, w.set, { ts: LATER + 10 }),
      await vouchEvent(w.g1, w.set, { ts: protestAt + 1000 }),
      await vouchEvent(w.g3, w.set, { ts: protestAt + 2000 })
    ];
    const protest = await protestEvent(w.u, protestAt);
    const res = await check(w, v, [protest], [w.u], protestAt + 2000 + RECOVERY_PROTEST_MS);
    expect(res).toMatchObject({ ok: true, vouchers: ['g1', 'g3'], thresholdAt: protestAt + 2000, matured: true });
  });

  it('a protest from a key the registry refuses (lost, stolen, revoked) changes nothing', async () => {
    const w = await world();
    const v = [await vouchEvent(w.g1, w.set), await vouchEvent(w.g2, w.set)];
    const stranger = await makeIdentity(USER);
    const res = await check(w, v, [await protestEvent(stranger, LATER + 60_000)], [w.u]);
    expect(res).toMatchObject({ ok: true, matured: true });
  });

  it('a protest aimed at another device does not touch this one', async () => {
    const w = await world();
    const v = [await vouchEvent(w.g1, w.set), await vouchEvent(w.g2, w.set)];
    const res = await check(w, v, [await protestEvent(w.u, LATER + 60_000, 'OTHER-DEVICE')], [w.u]);
    expect(res.ok).toBe(true);
  });
});

describe('thresholdMoment', () => {
  it('finds the first moment k guardians are live together', () => {
    expect(thresholdMoment([
      { guardian: 'a', ts: 10, notAfter: 20 },
      { guardian: 'b', ts: 30, notAfter: 40 },
      { guardian: 'c', ts: 35, notAfter: 90 }
    ], 2)).toBe(35);
  });
  it('one guardian twice is still one', () => {
    expect(thresholdMoment([
      { guardian: 'a', ts: 10, notAfter: 90 },
      { guardian: 'a', ts: 20, notAfter: 90 }
    ], 2)).toBeNull();
  });
});

describe('guardianSetStatus', () => {
  it('reports the set in force and the one waiting to take over', async () => {
    const u = await makeIdentity(USER);
    const old = await setEvent(u, ['g1', 'g2'], 2, T0);
    const next = await setEvent(u, ['g3', 'g4'], 2, LATER);
    const ev = [old, next, ...(await accepts(['g1', 'g2', 'g3', 'g4']))];
    const got = await guardianSetStatus(ev, USER, resolvers([u]), LATER + 1000);
    expect(got.effective?.id).toBe(old.id);
    expect(got.pending).toMatchObject({ set: { id: next.id }, activeAt: LATER + GUARDIAN_SET_ACTIVATION_MS, accepted: ['g3', 'g4'] });
  });
});

describe('validateRecoveryIngest', () => {
  it('refuses a guardian set dated away from now (the activation-delay bypass)', async () => {
    const u = await makeIdentity(USER);
    const backdated = await setEvent(u, ['g1', 'g2'], 2, T0 - GUARDIAN_SET_ACTIVATION_MS);
    expect(validateRecoveryIngest(backdated, T0)).toMatchObject({ ok: false, reason: 'recovery_ts_not_now' });
    const honest = await setEvent(u, ['g1', 'g2'], 2, T0);
    expect(validateRecoveryIngest(honest, T0 + RECOVERY_SKEW_MS - 1)).toEqual({ ok: true });
  });

  it('refuses a vouch that asks for more than the maximum lifetime', async () => {
    const u = await makeIdentity(USER);
    const g1 = await makeIdentity('g1');
    const set = await setEvent(u, ['g1', 'g2'], 2);
    const v = await buildAndSignEvent(g1, {
      actor: 'g1',
      action: ACTIONS.recoveryVouch,
      subject: { type: 'user', id: USER },
      predicate: { ...NEW_DEVICE, guardianSetId: set.id, notAfter: LATER + VOUCH_MAX_TTL_MS + 1 },
      ts: LATER
    });
    expect(validateRecoveryIngest(v, LATER)).toMatchObject({ ok: false, reason: 'recovery_bad_vouch_ttl' });
  });

  it('leaves every other action alone', async () => {
    const u = await makeIdentity(USER);
    const ev = await buildAndSignEvent(u, {
      actor: USER, action: ACTIONS.messagePost, subject: { type: 'forum', id: '1' }, ts: 0
    });
    expect(validateRecoveryIngest(ev, T0)).toEqual({ ok: true });
  });
});

describe('deviceFingerprint', () => {
  it('is 4 groups of 4 digits, stable, and changes with either key', async () => {
    const a = await deviceFingerprint('SIG', 'KEM');
    expect(a).toMatch(/^\d{4} \d{4} \d{4} \d{4}$/);
    expect(await deviceFingerprint('SIG', 'KEM')).toBe(a);
    expect(await deviceFingerprint('SIG', 'KEM2')).not.toBe(a);
    expect(await deviceFingerprint('SIG2', 'KEM')).not.toBe(a);
  });
});

describe('nominations', () => {
  it('a nomination lives in the guardian\'s own subject and names the set', async () => {
    const u = await makeIdentity(USER);
    const set = await setEvent(u, ['g1', 'g2'], 2);
    const nom = await buildAndSignEvent(u, {
      actor: USER,
      action: ACTIONS.recoveryNominate,
      subject: { type: 'user', id: 'g1' },
      predicate: recoveryNominatePredicate(set) as unknown as Record<string, unknown>,
      ts: T0
    });
    expect(isRecoveryNominateEvent(nom, 'g1')).toBe(true);
    expect(isRecoveryNominateEvent(nom, USER)).toBe(false);
    expect(nom.predicate).toEqual({ guardianSetId: set.id, threshold: 2, total: 2 });
    expect(validateRecoveryIngest(nom, T0)).toEqual({ ok: true });
  });

  it('acceptance is of the owner, so a reshaped set keeps it', async () => {
    const u = await makeIdentity(USER);
    const first = await setEvent(u, ['g1', 'g2'], 2, T0 - GUARDIAN_SET_ACTIVATION_MS);
    const reshaped = await setEvent(u, ['g1', 'g2', 'g3'], 2, T0);
    const agreed = await accepts(['g1', 'g2'], T0 - GUARDIAN_SET_ACTIVATION_MS + 1);
    const got = await acceptedGuardians(agreed, USER, ['g1', 'g2', 'g3'], guardianResolver(), LATER);
    expect([...got].sort()).toEqual(['g1', 'g2']);
    expect((await effectiveGuardianSet([first, reshaped, ...agreed], USER, resolvers([u]), LATER))?.id).toBe(reshaped.id);
  });
});
