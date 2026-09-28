// T9b — server half of social recovery (PLAN_T9_SOCIAL_RECOVERY §4).
//
// Two things live here, both thin:
//
//   1. RECOVERY SESSIONS — the new device's public keys behind a short code,
//      so a guardian can find the request by typing what the user reads to
//      them over the phone. In memory, like T7 pairing: nothing in a session
//      is authority. The vouches are signed consent events (mirrored, so they
//      survive a restart); a lost session only means the new device opens a
//      new code, and every vouch already given still counts because it names
//      the device keys, not the code.
//
//   2. STATE — the user's recovery events from the consent mirror, judged by
//      the pure core ($lib/consent/recovery.ts) with the key registry as the
//      resolvers. The server applies exactly the rules any peer would.
//
// Guardian lookup is gated on the guardian actually being in the user's
// effective set: a code alone tells a stranger nothing.

import { randomInt } from 'node:crypto';
import type { ConsentEvent } from '$lib/consent/event';
import { ACTIONS } from '$lib/consent/event';
import { verifySignedObject } from '$lib/crypto/verify';
import {
  verifyRecovery,
  guardianSetStatus,
  effectiveGuardianSet,
  isRecoveryVouchEvent,
  acceptedGuardians,
  isGuardianSetEvent,
  isGuardianStanceEvent,
  isRecoveryNominateEvent,
  deviceFingerprint,
  type RecoveryResolvers,
  type RecoveryNominatePredicate,
  type GuardianSetPredicate,
  type RecoveryCheck,
  type RecoveryVouchPredicate
} from '$lib/consent/recovery';
import { consentStore } from './store';
import { resolveFromStore, resolveSetSignerFromStore } from './verifyServerSide';

// ── sessions ────────────────────────────────────────────────────────────────

export type RecoverySession = {
  code: string;
  userId: string;
  devicePubB64: string;
  algo: 'Ed25519' | 'ECDSA-P256';
  pubSpkiB64: string;
  kemPubSpkiB64: string;
  label: string;
  fingerprint: string;
  createdAt: number;
};

/** As long as a default vouch: the code has to outlive k phone calls. */
export const RECOVERY_SESSION_TTL_MS = 72 * 60 * 60 * 1000;

// No ambiguous chars (0/O, 1/I/L). Eight of them, not pairing's six: this
// code is looked up ACROSS users and lives for days, not minutes.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LEN = 8;

const sessions = new Map<string, RecoverySession>();

function newCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LEN; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return code;
}

function prune(now = Date.now()) {
  for (const [code, s] of sessions) {
    if (s.createdAt + RECOVERY_SESSION_TTL_MS <= now) sessions.delete(code);
  }
}

export function normalizeRecoveryCode(code: string): string {
  return code.replace(/[\s-]/g, '').toUpperCase();
}

export function isRecoveryCodeShape(code: string): boolean {
  return new RegExp(`^[${ALPHABET}]{${CODE_LEN}}$`).test(normalizeRecoveryCode(code));
}

export async function openRecoverySession(
  req: Omit<RecoverySession, 'code' | 'createdAt' | 'fingerprint'>
): Promise<RecoverySession> {
  prune();
  // One session per device: re-opening (a reload, a lost code) replaces it.
  for (const [code, s] of sessions) {
    if (s.userId === req.userId && s.devicePubB64 === req.devicePubB64) sessions.delete(code);
  }
  let code = newCode();
  while (sessions.has(code)) code = newCode();
  const fingerprint = await deviceFingerprint(req.devicePubB64, req.kemPubSpkiB64);
  const s: RecoverySession = { ...req, code, fingerprint, createdAt: Date.now() };
  sessions.set(code, s);
  return s;
}

export function findRecoverySession(code: string): RecoverySession | undefined {
  prune();
  return sessions.get(normalizeRecoveryCode(code));
}

/** The user's own open session for this device, if any (status polling). */
export function sessionForDevice(userId: string, devicePubB64: string): RecoverySession | undefined {
  prune();
  for (const s of sessions.values()) {
    if (s.userId === userId && s.devicePubB64 === devicePubB64) return s;
  }
  return undefined;
}

export function closeRecoverySessionsFor(userId: string): void {
  for (const [code, s] of sessions) if (s.userId === userId) sessions.delete(code);
}

/** Test hook. */
export function _resetRecoverySessions(): void {
  sessions.clear();
}

// ── state ───────────────────────────────────────────────────────────────────

export type UserRecoveryEvents = {
  sets: ConsentEvent[];
  vouches: ConsentEvent[];
  protests: ConsentEvent[];
  /** guardians' accept/withdraw about this user */
  stances: ConsentEvent[];
  /** nominations addressed TO this user (they are someone's guardian-to-be) */
  nominations: ConsentEvent[];
};

export const storeResolvers: RecoveryResolvers = {
  setSigner: resolveSetSignerFromStore,
  guardian: resolveFromStore
};

export async function loadRecoveryEvents(userId: string): Promise<UserRecoveryEvents> {
  const all = await consentStore.eventsForSubject('user', userId);
  return {
    sets: all.filter((e) => e.action === ACTIONS.recoveryGuardians),
    vouches: all.filter((e) => e.action === ACTIONS.recoveryVouch),
    protests: all.filter((e) => e.action === ACTIONS.recoveryProtest),
    stances: all.filter((e) => isGuardianStanceEvent(e, userId)),
    nominations: all.filter((e) => isRecoveryNominateEvent(e, userId))
  };
}

export async function recoveryCheckFor(
  userId: string,
  device: { devicePubKey: string; kemPubSpkiB64: string },
  now = Date.now(),
  events?: UserRecoveryEvents
): Promise<RecoveryCheck> {
  const ev = events ?? (await loadRecoveryEvents(userId));
  return verifyRecovery({
    userId,
    expected: device,
    sets: ev.sets,
    vouches: ev.vouches,
    protests: ev.protests,
    stances: ev.stances,
    resolveSetSigner: resolveSetSignerFromStore,
    resolveGuardian: resolveFromStore,
    resolveProtester: resolveFromStore,
    now
  });
}

export async function effectiveSetFor(userId: string, now = Date.now()) {
  const { sets, stances } = await loadRecoveryEvents(userId);
  const set = await effectiveGuardianSet([...sets, ...stances], userId, storeResolvers, now);
  if (!set) return null;
  const predicate = set.predicate as unknown as GuardianSetPredicate;
  const accepted = [...(await acceptedGuardians(stances, userId, predicate.guardians, resolveFromStore, now))].sort();
  return { set, predicate, accepted };
}

export type PendingRecovery = {
  devicePubKey: string;
  kemPubSpkiB64: string;
  fingerprint: string;
  check: RecoveryCheck;
};

/**
 * What the user's own devices need to see: the guardian sets, and every
 * device someone is vouching for that is not yet a SETTLED key of the user —
 * i.e. every recovery in progress on this account. "Settled" is certified
 * (T7 pairing) or already recovered; an active uncertified key is not,
 * because in shadow mode the recovering device registers itself on login.
 */
export async function recoveryOverview(userId: string, now = Date.now()) {
  const events = await loadRecoveryEvents(userId);
  const status = await guardianSetStatus([...events.sets, ...events.stances], userId, storeResolvers, now);
  const keys = await consentStore.getKeysForUser(userId);
  const settled = new Set(
    keys.filter((k) => !k.revokedAt && (k.cert || k.recovery)).map((k) => k.devicePubB64)
  );

  const targets = new Map<string, string>(); // devicePubKey → kem
  for (const v of events.vouches) {
    if (!isRecoveryVouchEvent(v, userId)) continue;
    const p = v.predicate as unknown as RecoveryVouchPredicate;
    if (settled.has(p.devicePubKey)) continue;
    if (p.notAfter < now - 7 * 24 * 60 * 60 * 1000) continue; // long dead
    targets.set(`${p.devicePubKey}\n${p.kemPubSpkiB64}`, p.kemPubSpkiB64);
  }
  // A request with no vouch yet is the earliest warning there is.
  for (const s of sessions.values()) {
    if (s.userId !== userId || settled.has(s.devicePubB64)) continue;
    targets.set(`${s.devicePubB64}\n${s.kemPubSpkiB64}`, s.kemPubSpkiB64);
  }
  const pending: PendingRecovery[] = [];
  for (const key of targets.keys()) {
    const [devicePubKey, kemPubSpkiB64] = key.split('\n');
    const check = await recoveryCheckFor(userId, { devicePubKey, kemPubSpkiB64 }, now, events);
    if (!check.ok && check.reason === 'recovery_lapsed') continue;
    pending.push({
      devicePubKey,
      kemPubSpkiB64,
      fingerprint: await deviceFingerprint(devicePubKey, kemPubSpkiB64),
      check
    });
  }
  return { ...status, recoveries: pending, guarding: await guardingFor(userId, events.nominations, now) };
}

export type Guardianship = {
  ownerId: string;
  /** the nominating set is still the owner's newest (not replaced since) */
  current: boolean;
  threshold: number;
  total: number;
  /** this user's standing answer, or null if they never answered */
  stance: 'accepted' | 'withdrawn' | null;
};

/**
 * The guardian's side: everyone who nominated `guardianId`, and where they
 * stand. Nominations live in the guardian's own subject; the answer lives in
 * the owner's, so each owner's stances are read back from there.
 */
async function guardingFor(
  guardianId: string,
  nominations: ConsentEvent[],
  now: number
): Promise<Guardianship[]> {
  const owners = new Map<string, ConsentEvent>();
  for (const n of nominations.sort((a, b) => b.ts - a.ts)) {
    if (owners.has(n.actor)) continue;
    // Only the owner's own signature counts as a nomination.
    if (!(await verifySignedObject(n, resolveSetSignerFromStore)).ok) continue;
    owners.set(n.actor, n);
  }
  const out: Guardianship[] = [];
  for (const [ownerId, nom] of owners) {
    const theirs = await loadRecoveryEvents(ownerId);
    const newest = theirs.sets
      .filter((e) => isGuardianSetEvent(e, ownerId))
      .sort((a, b) => b.ts - a.ts)[0];
    const pred = nom.predicate as unknown as RecoveryNominatePredicate;
    // Still listed in the owner's newest set? A set that dropped them ends it.
    const listed = newest ? (newest.predicate as unknown as GuardianSetPredicate).guardians.includes(guardianId) : false;
    if (!listed) continue;
    const mine = theirs.stances
      .filter((e) => e.actor === guardianId && e.ts <= now + 5 * 60_000)
      .sort((a, b) => b.ts - a.ts)[0];
    out.push({
      ownerId,
      current: newest?.id === pred.guardianSetId,
      threshold: pred.threshold,
      total: pred.total,
      stance: !mine ? null : mine.action === ACTIONS.recoveryAccept ? 'accepted' : 'withdrawn'
    });
  }
  return out;
}
