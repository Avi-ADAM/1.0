// T9b — client half of social recovery (PLAN_T9_SOCIAL_RECOVERY §4).
// Browser-only. Three roles, one module:
//
//   OWNER (a device they hold): name guardians (a signed `recovery.guardians`),
//     watch the account for recoveries in progress, protest one that isn't
//     theirs (a signed `recovery.protest`).
//   NEW DEVICE (every device lost): open a recovery request, read the code and
//     the fingerprint to each guardian, wait out the protest window, register.
//   GUARDIAN: look the request up by code, compare the fingerprint with what
//     the user reads over the phone, sign a `recovery.vouch`.
//
// Every signed object is an ordinary ConsentEvent posted to
// /api/consent/events; the server judges it with the same pure rules
// ($lib/consent/recovery.ts) any peer would.

import { b64urlEncode } from '$lib/crypto/b64';
import { ensureIdentity, loadIdentity, type IdentityRecord } from '$lib/crypto/identity';
import { buildAndSignEvent } from '$lib/consent/signEvent';
import { ensurePubkeyRegistered } from '$lib/consent/publish';
import { ACTIONS, type ConsentEvent } from '$lib/consent/event';
import {
  guardianSetPredicate,
  recoveryVouchPredicate,
  recoveryProtestPredicate,
  recoveryNominatePredicate,
  deviceFingerprint
} from '$lib/consent/recovery';
import { ensureKemKeypair } from '$lib/space/e2e/kem';
import { cookieUserId, type PairingResult } from './devicePairing';

export type Result<T = Record<string, unknown>> = PairingResult<T>;

export type GuardianRef = { id: string; username: string | null; accepted?: boolean };
export type GuardianSetView = {
  id: string;
  signedAt: number;
  threshold: number;
  guardians: GuardianRef[];
  activeAt?: number;
};
export type RecoveryInProgress = {
  devicePubKey: string;
  fingerprint: string;
  threshold: number | null;
  vouchers: GuardianRef[];
  readyAt: number | null;
  protestedAt: number | null;
};
/** Someone who nominated THIS user as their guardian. */
export type Guardianship = {
  ownerId: string;
  username: string | null;
  current: boolean;
  threshold: number;
  total: number;
  stance: 'accepted' | 'withdrawn' | null;
};
export type RecoveryOverview = {
  effective: GuardianSetView | null;
  pending: GuardianSetView | null;
  recoveries: RecoveryInProgress[];
  guarding: Guardianship[];
};

async function post(path: string, body: unknown): Promise<Response> {
  return fetch(path, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

async function reasonOf(res: Response): Promise<string> {
  const data = await res.clone().json().catch(() => null);
  if (data?.reason) return String(data.reason);
  if (data?.message) return String(data.message);
  return `http_${res.status}`;
}

/** This device's identity, registered — every signed recovery object needs an active key. */
async function signingIdentity(): Promise<Result<{ identity: IdentityRecord; userId: string }>> {
  const userId = cookieUserId();
  if (!userId) return { ok: false, reason: 'no_session' };
  const identity = await loadIdentity();
  if (!identity || identity.userId !== userId) return { ok: false, reason: 'this_device_has_no_identity' };
  await ensurePubkeyRegistered(identity);
  return { ok: true, identity, userId };
}

async function publishEvent(ev: ConsentEvent): Promise<Result> {
  const res = await post('/api/consent/events', { event: ev });
  if (!res.ok) return { ok: false, reason: await reasonOf(res) };
  return { ok: true };
}

// ── owner ───────────────────────────────────────────────────────────────────

export async function loadRecoveryOverview(): Promise<Result<RecoveryOverview>> {
  try {
    const res = await fetch('/api/consent/recovery/overview', { credentials: 'include' });
    if (!res.ok) return { ok: false, reason: await reasonOf(res) };
    const data = await res.json();
    return {
      ok: true,
      effective: data.effective,
      pending: data.pending,
      recoveries: data.recoveries ?? [],
      guarding: data.guarding ?? []
    };
  } catch (e) {
    return { ok: false, reason: (e as Error).message };
  }
}

/** Sign and publish a guardian set. It takes effect after the activation delay. */
export async function publishGuardianSet(guardians: string[], threshold: number): Promise<Result> {
  const me = await signingIdentity();
  if (!me.ok) return me;
  let predicate;
  try {
    predicate = guardianSetPredicate(me.userId, guardians, threshold);
  } catch (e) {
    return { ok: false, reason: (e as Error).message.replace(/^guardian set: /, '') };
  }
  const ev = await buildAndSignEvent(me.identity, {
    actor: me.userId,
    action: ACTIONS.recoveryGuardians,
    subject: { type: 'user', id: me.userId },
    predicate: predicate as unknown as Record<string, unknown>
  });
  const published = await publishEvent(ev);
  if (!published.ok) return published;
  // Being a guardian waits for the guardian's consent: drop a nomination in
  // each one's inbox (their own subject). A failed one is not fatal — the set
  // is signed; the owner can re-send from the settings page.
  for (const g of predicate.guardians) {
    const nom = await buildAndSignEvent(me.identity, {
      actor: me.userId,
      action: ACTIONS.recoveryNominate,
      subject: { type: 'user', id: g },
      predicate: recoveryNominatePredicate(ev) as unknown as Record<string, unknown>
    });
    await publishEvent(nom);
  }
  return { ok: true };
}

/** Guardian side: agree to guard `ownerId` (or step down). */
export async function answerNomination(ownerId: string, accept: boolean): Promise<Result> {
  const me = await signingIdentity();
  if (!me.ok) return me;
  if (me.userId === ownerId) return { ok: false, reason: 'cannot_guard_self' };
  const ev = await buildAndSignEvent(me.identity, {
    actor: me.userId,
    action: accept ? ACTIONS.recoveryAccept : ACTIONS.recoveryWithdraw,
    subject: { type: 'user', id: ownerId },
    predicate: {}
  });
  return publishEvent(ev);
}

/** "This isn't me" — voids every vouch given so far for that device. */
export async function protestRecovery(devicePubKey: string): Promise<Result> {
  const me = await signingIdentity();
  if (!me.ok) return me;
  if (devicePubKey === me.identity.devicePubB64) return { ok: false, reason: 'cannot_protest_self' };
  const ev = await buildAndSignEvent(me.identity, {
    actor: me.userId,
    action: ACTIONS.recoveryProtest,
    subject: { type: 'user', id: me.userId },
    predicate: recoveryProtestPredicate(devicePubKey) as unknown as Record<string, unknown>
  });
  return publishEvent(ev);
}

// ── new device ──────────────────────────────────────────────────────────────

export type RecoveryRequest = {
  code: string;
  fingerprint: string;
  threshold: number;
  guardians: GuardianRef[];
  devicePubKey: string;
};

/** Open (or re-open) a recovery request for THIS device. */
export async function openRecoveryRequest(): Promise<Result<RecoveryRequest>> {
  const userId = cookieUserId();
  if (!userId) return { ok: false, reason: 'no_session' };
  try {
    const identity = await ensureIdentity(userId);
    const kem = await ensureKemKeypair();
    const res = await post('/api/consent/recovery', {
      devicePubB64: identity.devicePubB64,
      algo: identity.algo,
      pubSpkiB64: b64urlEncode(identity.pubSpki),
      kemPubSpkiB64: kem.kemPubSpkiB64,
      label: navigator.userAgent.slice(0, 40)
    });
    if (!res.ok) return { ok: false, reason: await reasonOf(res) };
    const data = await res.json();
    // Show the fingerprint of the keys THIS device holds, never the server's
    // echo of it — that is the whole point of reading it aloud.
    const fingerprint = await deviceFingerprint(identity.devicePubB64, kem.kemPubSpkiB64);
    return {
      ok: true,
      code: data.code,
      fingerprint,
      threshold: data.threshold,
      guardians: data.guardians ?? [],
      devicePubKey: identity.devicePubB64
    };
  } catch (e) {
    return { ok: false, reason: (e as Error).message };
  }
}

/** Register this device through recovery. The server re-derives everything from the vouches. */
export async function completeRecovery(): Promise<Result<{ status: string; retryAfterMs?: number }>> {
  const userId = cookieUserId();
  if (!userId) return { ok: false, reason: 'no_session' };
  const identity = await ensureIdentity(userId);
  const kem = await ensureKemKeypair();
  const res = await post('/api/consent/keys/register', {
    userId,
    devicePubB64: identity.devicePubB64,
    algo: identity.algo,
    pubSpkiB64: b64urlEncode(identity.pubSpki),
    kemPubSpkiB64: kem.kemPubSpkiB64,
    label: navigator.userAgent.slice(0, 40),
    recovery: true
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) return { ok: false, reason: data.reason ?? `http_${res.status}` };
  return { ok: true, status: data.status };
}

// ── guardian ────────────────────────────────────────────────────────────────

export type RecoveryLookup = {
  userId: string;
  username: string | null;
  devicePubB64: string;
  kemPubSpkiB64: string;
  label: string;
  /** computed HERE from the keys the vouch will name — not the server's */
  fingerprint: string;
  openedAt: number;
  guardianSetId: string;
  threshold: number;
  vouchers: string[];
  protestedAt: number | null;
};

export async function lookupRecoveryRequest(code: string): Promise<Result<{ request: RecoveryLookup }>> {
  try {
    const clean = code.replace(/[\s-]/g, '').toUpperCase();
    const res = await fetch(`/api/consent/recovery?code=${encodeURIComponent(clean)}`, { credentials: 'include' });
    if (!res.ok) return { ok: false, reason: await reasonOf(res) };
    const { request } = await res.json();
    const fingerprint = await deviceFingerprint(request.devicePubB64, request.kemPubSpkiB64);
    return { ok: true, request: { ...request, fingerprint } };
  } catch (e) {
    return { ok: false, reason: (e as Error).message };
  }
}

/** Sign a vouch for exactly the keys the guardian was shown (and compared). */
export async function vouchForRecovery(req: RecoveryLookup): Promise<Result> {
  const me = await signingIdentity();
  if (!me.ok) return me;
  if (me.userId === req.userId) return { ok: false, reason: 'cannot_vouch_for_self' };
  const ts = Date.now();
  const ev = await buildAndSignEvent(me.identity, {
    actor: me.userId,
    action: ACTIONS.recoveryVouch,
    subject: { type: 'user', id: req.userId },
    predicate: recoveryVouchPredicate({
      devicePubKey: req.devicePubB64,
      kemPubSpkiB64: req.kemPubSpkiB64,
      guardianSetId: req.guardianSetId,
      ts
    }) as unknown as Record<string, unknown>,
    ts
  });
  return publishEvent(ev);
}
