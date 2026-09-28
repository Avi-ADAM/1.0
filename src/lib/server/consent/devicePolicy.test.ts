// T7 — registration policy (devicePolicy.ts). Real WebCrypto identities,
// real consentStore (memory-only in tests), no HTTP.

import { describe, it, expect, beforeEach } from 'vitest';
import { chooseAlgorithm, algoParams } from '$lib/crypto/algorithm';
import { b64urlEncode } from '$lib/crypto/b64';
import type { IdentityRecord } from '$lib/crypto/identity';
import { signDeviceCert } from '$lib/crypto/deviceCert';
import { consentStore, type StoredPubKey } from './store';
import { judgeRegistration, RESET_COOLDOWN_MS } from './devicePolicy';

async function makeIdentity(userId: string): Promise<IdentityRecord> {
  const algo = await chooseAlgorithm();
  const pair = (await crypto.subtle.generateKey(
    algoParams(algo) as Algorithm, true, ['sign', 'verify']
  )) as CryptoKeyPair;
  const spki = await crypto.subtle.exportKey('spki', pair.publicKey);
  return {
    id: 'self', userId, algo,
    privateKey: pair.privateKey, publicKey: pair.publicKey,
    pubSpki: spki, devicePubB64: b64urlEncode(spki), createdAt: Date.now()
  };
}

function storedKeyOf(d: IdentityRecord, extra?: Partial<StoredPubKey>): StoredPubKey {
  return {
    userId: d.userId,
    devicePubB64: d.devicePubB64,
    algo: d.algo,
    pubSpkiB64: b64urlEncode(d.pubSpki),
    label: 'test',
    addedAt: Date.now(),
    ...extra
  };
}

beforeEach(() => consentStore._reset());

describe('judgeRegistration — first device & re-register', () => {
  it('first device is TOFU', async () => {
    const d = await makeIdentity('dana');
    const res = await judgeRegistration({
      existing: [], userId: 'dana', devicePubB64: d.devicePubB64,
      cert: undefined, enforce: true
    });
    expect(res).toMatchObject({ allow: true, status: 'first_device_tofu' });
  });

  it('same active device re-registers freely (bootstrap re-publish)', async () => {
    const d = await makeIdentity('dana');
    const res = await judgeRegistration({
      existing: [storedKeyOf(d)], userId: 'dana', devicePubB64: d.devicePubB64,
      cert: undefined, enforce: true
    });
    expect(res).toMatchObject({ allow: true, status: 'reregister_ok' });
  });

  it('a revoked device cannot re-register', async () => {
    const d = await makeIdentity('dana');
    const res = await judgeRegistration({
      existing: [
        storedKeyOf(d, { revokedAt: Date.now(), revokedReason: 'manual' }),
        storedKeyOf(await makeIdentity('dana')) // another active device exists
      ],
      userId: 'dana', devicePubB64: d.devicePubB64, cert: undefined, enforce: false
    });
    expect(res).toMatchObject({ allow: false, status: 'device_revoked' });
  });
});

describe('judgeRegistration — subsequent devices', () => {
  it('shadow: uncertified second device accepted-and-flagged; enforce: rejected', async () => {
    const laptop = await makeIdentity('dana');
    const phone = await makeIdentity('dana');
    const existing = [storedKeyOf(laptop)];

    const shadow = await judgeRegistration({
      existing, userId: 'dana', devicePubB64: phone.devicePubB64,
      cert: undefined, enforce: false
    });
    expect(shadow).toMatchObject({ allow: true, status: 'uncertified_shadow' });

    const enforced = await judgeRegistration({
      existing, userId: 'dana', devicePubB64: phone.devicePubB64,
      cert: undefined, enforce: true
    });
    expect(enforced).toMatchObject({ allow: false, status: 'missing_cert' });
  });

  it('a valid parent-signed cert admits the device even under enforcement', async () => {
    const laptop = await makeIdentity('dana');
    const phone = await makeIdentity('dana');
    await consentStore.putKey(storedKeyOf(laptop)); // resolveFromStore must find the parent
    const cert = await signDeviceCert(laptop, {
      userId: 'dana', devicePubKey: phone.devicePubB64, deviceLabel: 'phone'
    });
    const res = await judgeRegistration({
      existing: [storedKeyOf(laptop)], userId: 'dana',
      devicePubB64: phone.devicePubB64, cert, enforce: true
    });
    expect(res).toMatchObject({ allow: true, status: 'valid_cert' });
  });

  it('a cert signed by a REVOKED parent is rejected under enforcement', async () => {
    const laptop = await makeIdentity('dana');
    const other = await makeIdentity('dana');
    const phone = await makeIdentity('dana');
    await consentStore.putKey(storedKeyOf(laptop, { revokedAt: Date.now(), revokedReason: 'manual' }));
    const cert = await signDeviceCert(laptop, {
      userId: 'dana', devicePubKey: phone.devicePubB64, deviceLabel: 'phone'
    });
    const res = await judgeRegistration({
      existing: [
        storedKeyOf(laptop, { revokedAt: Date.now(), revokedReason: 'manual' }),
        storedKeyOf(other)
      ],
      userId: 'dana', devicePubB64: phone.devicePubB64, cert, enforce: true
    });
    expect(res).toMatchObject({ allow: false, status: 'invalid_cert' });
    expect(res.certReason).toBe('unknown_or_revoked_device');
  });
});

describe('judgeRegistration — chain reset', () => {
  it('within the cooldown nothing is accepted (protest window)', async () => {
    const old = await makeIdentity('dana');
    const fresh = await makeIdentity('dana');
    const now = Date.now();
    const res = await judgeRegistration({
      existing: [storedKeyOf(old, { revokedAt: now - 1000, revokedReason: 'reset' })],
      userId: 'dana', devicePubB64: fresh.devicePubB64,
      cert: undefined, enforce: true, now
    });
    expect(res).toMatchObject({ allow: false, status: 'reset_cooldown' });
    expect(res.retryAfterMs).toBeGreaterThan(0);
  });

  it('after the cooldown the next registration is a fresh TOFU', async () => {
    const old = await makeIdentity('dana');
    const fresh = await makeIdentity('dana');
    const now = Date.now();
    const res = await judgeRegistration({
      existing: [storedKeyOf(old, {
        revokedAt: now - RESET_COOLDOWN_MS - 1000, revokedReason: 'reset'
      })],
      userId: 'dana', devicePubB64: fresh.devicePubB64,
      cert: undefined, enforce: true, now
    });
    expect(res).toMatchObject({ allow: true, status: 'reset_tofu' });
  });
});

describe('judgeRegistration — T9b guardian recovery', () => {
  const vouched = (matured: boolean, readyAt = Date.now() + 5000) => async () => ({
    ok: true as const, setId: 's', vouchers: ['g1', 'g2'], thresholdAt: readyAt - 1, readyAt, matured
  });

  it('a matured recovery registers even mid-reset and under enforcement', async () => {
    const old = await makeIdentity('dana');
    const fresh = await makeIdentity('dana');
    const now = Date.now();
    const res = await judgeRegistration({
      existing: [storedKeyOf(old, { revokedAt: now - 1000, revokedReason: 'reset' })],
      userId: 'dana', devicePubB64: fresh.devicePubB64,
      cert: undefined, enforce: true, now, recovery: vouched(true)
    });
    expect(res).toMatchObject({ allow: true, status: 'recovered_by_guardians' });
  });

  it('inside the protest window the device waits, and is told how long', async () => {
    const fresh = await makeIdentity('dana');
    const now = Date.now();
    const res = await judgeRegistration({
      existing: [storedKeyOf(await makeIdentity('dana'))],
      userId: 'dana', devicePubB64: fresh.devicePubB64,
      cert: undefined, enforce: false, now, recovery: vouched(false, now + 5000)
    });
    expect(res).toMatchObject({ allow: false, status: 'recovery_pending', retryAfterMs: 5000 });
  });

  it('an explicit recovery without enough vouches is refused — shadow mode does not rescue it', async () => {
    const fresh = await makeIdentity('dana');
    const res = await judgeRegistration({
      existing: [], userId: 'dana', devicePubB64: fresh.devicePubB64,
      cert: undefined, enforce: false,
      recovery: async () => ({ ok: false as const, reason: 'vouches_below_threshold:1/2' })
    });
    expect(res).toMatchObject({
      allow: false, status: 'recovery_not_vouched', certReason: 'vouches_below_threshold:1/2'
    });
  });

  it('RECOVERY_ENFORCE: a matured reset no longer TOFUs a user with guardians; shadow flags it', async () => {
    const old = await makeIdentity('dana');
    const fresh = await makeIdentity('dana');
    const now = Date.now();
    const base = {
      existing: [storedKeyOf(old, { revokedAt: now - RESET_COOLDOWN_MS - 1000, revokedReason: 'reset' as const })],
      userId: 'dana', devicePubB64: fresh.devicePubB64, cert: undefined, enforce: true, now,
      hasGuardians: async () => true
    };
    expect(await judgeRegistration({ ...base, recoveryEnforce: true }))
      .toMatchObject({ allow: false, status: 'reset_blocked_by_guardians' });
    expect(await judgeRegistration({ ...base, recoveryEnforce: false }))
      .toMatchObject({ allow: true, status: 'reset_tofu', guardiansShadow: true });
    expect(await judgeRegistration({ ...base, hasGuardians: async () => false, recoveryEnforce: true }))
      .toMatchObject({ allow: true, status: 'reset_tofu' });
  });
});
