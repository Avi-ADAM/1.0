// T9b — social recovery of a user's device chain (PLAN_T9_SOCIAL_RECOVERY).
//
// The problem T9 has to solve after S3: a user who loses EVERY device loses
// both their signing identity and every key wrapped to those devices, and
// the server can no longer vouch for them (T7's reset is exactly the server
// authority S3 gives up). This module is the identity half, and it needs no
// secret sharing at all:
//
//   - While they still have a device, the user signs a GUARDIAN SET: k of n
//     named members (typically rikma partners) who may later vouch for them.
//   - After the loss, the new device shows its public keys out of band; each
//     guardian who confirms it's really them signs a VOUCH naming exactly
//     that device (signing key AND KEM key).
//   - k valid vouches against the user's effective set = the new device is
//     theirs — after a PROTEST WINDOW (RECOVERY_PROTEST_MS). A device the
//     user still holds can sign a `recovery.protest` in that window, which
//     voids every vouch given so far; guardians who talked to a con artist
//     get a loud second chance instead of a silent takeover. Every verifier
//     (server at registration, any peer locally) reaches the same answer
//     from the same data.
//
// Guardians may be ANY user (decision 27.9.2026, plan §9) — the UI offers
// rikma partners first, but nothing here requires a shared rikma. Being a
// guardian is an obligation, so it waits for the guardian's consent
// (decision 28.9.2026): the owner NOMINATES (a `recovery.nominate` in the
// guardian's own subject — their inbox), the guardian ACCEPTS or later
// WITHDRAWS (in the owner's subject). A set takes effect only once at least
// `threshold` of its guardians have accepted, and only an accepted guardian's
// vouch counts. Until then the previous set stays in force.
//
// The DATA half is not here: in a rikma or vault space the other members
// still hold the epoch keys, and re-share them with the recovered device via
// epoch.grant (T9a, $lib/space/e2e/epoch.ts). Only a space nobody else can
// read (a personal E2E space) would need Shamir-split key material — that is
// T9c, deliberately not built (see the plan §5).
//
// Both objects are ordinary ConsentEvents (subject {type:'user', id}), so
// they reuse signing, the /api/consent/events route and the consent-event
// Strapi mirror — no new collection, which also keeps T9 clear of the
// Strapi 5 schema freeze (PLAN_STRAPI5_UPGRADE R9).
//
// Pure: no IDB, no fetch. Callers pass resolvers.

import { verifySignedObject, type PubKeyResolver } from '$lib/crypto/verify';
import { compareIds } from './ids';
import { ACTIONS, type ConsentEvent } from './event';

/** Fewest vouches that may ever recover an account. One guardian is a single point of takeover. */
export const MIN_THRESHOLD = 2;
export const MAX_GUARDIANS = 9;
/**
 * A new guardian set takes effect only after this delay; until then the
 * previous set (or none) stays in force. A thief holding an unlocked device
 * could otherwise swap in their own guardians and recover straight away —
 * the delay is the owner's window to notice and revoke that device.
 */
export const GUARDIAN_SET_ACTIVATION_MS = 72 * 60 * 60 * 1000;
/** A vouch is a statement about a device shown on a screen right now — it goes stale. */
export const VOUCH_MAX_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/**
 * Default vouch lifetime. Three days, not one: k guardians rarely answer the
 * same afternoon, and every counted vouch must still be alive at the moment
 * the k-th one arrives (see `thresholdMoment`).
 */
export const VOUCH_DEFAULT_TTL_MS = 72 * 60 * 60 * 1000;
/**
 * Between the k-th vouch and the new device's registration: the window in
 * which a device the user still holds can protest (decision 27.9.2026). Same
 * shape as T7's reset cooldown, half as long — a genuine recovery already
 * waited for k people.
 */
export const RECOVERY_PROTEST_MS = 24 * 60 * 60 * 1000;
/** A matured recovery must be completed within this long, or it lapses. */
export const RECOVERY_CLAIM_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** Clock tolerance for signed timestamps (and the ingest window, see `validateRecoveryIngest`). */
export const RECOVERY_SKEW_MS = 5 * 60_000;
const SKEW_MS = RECOVERY_SKEW_MS;

export type GuardianSetPredicate = {
  /** userIds, sorted and unique — the same set always signs the same bytes */
  guardians: string[];
  threshold: number;
};

export type RecoveryVouchPredicate = {
  /** the NEW device's signing key (b64url SPKI) */
  devicePubKey: string;
  /** the NEW device's KEM key — members will wrap epoch keys to it (T9a) */
  kemPubSpkiB64: string;
  /** id of the guardian-set event this vouch counts toward */
  guardianSetId: string;
  notAfter: number;
};

export type RecoveryProtestPredicate = {
  /** the recovering device this protest is aimed at */
  devicePubKey: string;
};

export type RecoveryCheck =
  | {
      ok: true;
      setId: string;
      vouchers: string[];
      /** when the k-th live vouch landed */
      thresholdAt: number;
      /** thresholdAt + RECOVERY_PROTEST_MS — registration opens here */
      readyAt: number;
      /** now ≥ readyAt: the device may register */
      matured: boolean;
      protestedAt?: number;
      reason?: undefined;
    }
  | {
      ok: false;
      reason: string;
      setId?: string;
      vouchers?: string[];
      threshold?: number;
      protestedAt?: number;
    };

type Check = { ok: true; reason?: undefined } | { ok: false; reason: string };

/** The two registries a guardian set is judged against. */
export type RecoveryResolvers = {
  /** the owner's keys — active, or lost ('reset'); see setSignerAcceptable */
  setSigner: PubKeyResolver;
  /** a guardian's ACTIVE keys — a guardian speaks with a device they hold now */
  guardian: PubKeyResolver;
};

export type RecoveryNominatePredicate = {
  guardianSetId: string;
  threshold: number;
  total: number;
};

/** Key metadata a set-signer resolver decides on. */
export type SignerKeyState = { revokedAt?: number; revokedReason?: 'manual' | 'reset' };

/**
 * A guardian set outlives the device that signed it only if that device was
 * LOST, not distrusted: a chain reset ('reset') keeps it, a manual revoke
 * voids it — the user re-confirms their set from a device they still trust.
 * Server-side resolvers for `resolveSetSigner` apply exactly this rule.
 */
export function setSignerAcceptable(k: SignerKeyState): boolean {
  return !k.revokedAt || k.revokedReason === 'reset';
}

// ── building ────────────────────────────────────────────────────────────────

export function validateGuardianSetPredicate(userId: string, p: unknown): Check {
  const pred = p as Partial<GuardianSetPredicate> | undefined;
  if (!pred || !Array.isArray(pred.guardians) || typeof pred.threshold !== 'number') {
    return { ok: false, reason: 'set_bad_shape' };
  }
  const g = pred.guardians;
  if (!g.every((x) => typeof x === 'string' && x.length > 0)) return { ok: false, reason: 'set_bad_guardian' };
  if (new Set(g).size !== g.length) return { ok: false, reason: 'set_duplicate_guardian' };
  if (g.some((x, i) => i > 0 && g[i - 1] >= x)) return { ok: false, reason: 'set_not_sorted' };
  if (g.includes(userId)) return { ok: false, reason: 'set_self_guardian' };
  if (g.length > MAX_GUARDIANS) return { ok: false, reason: 'set_too_many_guardians' };
  if (!Number.isInteger(pred.threshold) || pred.threshold < MIN_THRESHOLD) {
    return { ok: false, reason: 'set_threshold_too_low' };
  }
  if (pred.threshold > g.length) return { ok: false, reason: 'set_threshold_above_n' };
  return { ok: true };
}

/** Normalized predicate for a new guardian set. Throws on an invalid set. */
export function guardianSetPredicate(
  userId: string,
  guardians: string[],
  threshold: number
): GuardianSetPredicate {
  const pred = { guardians: [...new Set(guardians.map(String))].sort(), threshold };
  const v = validateGuardianSetPredicate(userId, pred);
  if (!v.ok) throw new Error(`guardian set: ${v.reason}`);
  return pred;
}

export function recoveryVouchPredicate(req: {
  devicePubKey: string;
  kemPubSpkiB64: string;
  guardianSetId: string;
  ts: number;
  ttlMs?: number;
}): RecoveryVouchPredicate {
  const ttl = Math.min(req.ttlMs ?? VOUCH_DEFAULT_TTL_MS, VOUCH_MAX_TTL_MS);
  return {
    devicePubKey: req.devicePubKey,
    kemPubSpkiB64: req.kemPubSpkiB64,
    guardianSetId: req.guardianSetId,
    notAfter: req.ts + ttl
  };
}

export function recoveryProtestPredicate(devicePubKey: string): RecoveryProtestPredicate {
  return { devicePubKey };
}

export function recoveryNominatePredicate(set: ConsentEvent): RecoveryNominatePredicate {
  const p = set.predicate as unknown as GuardianSetPredicate;
  return { guardianSetId: set.id, threshold: p.threshold, total: p.guardians.length };
}

const FP_TAG = new TextEncoder().encode('freemates-recovery-fp-v1');

/**
 * What a guardian reads back to the user over the phone: 16 digits in four
 * groups, from SHA-256 over BOTH of the new device's keys. The recovery code
 * only finds the request; this is what proves the guardian is signing for
 * the device on the user's screen and not one the server swapped in.
 */
export async function deviceFingerprint(devicePubKey: string, kemPubSpkiB64: string): Promise<string> {
  const enc = new TextEncoder();
  const a = enc.encode(devicePubKey);
  const b = enc.encode(kemPubSpkiB64);
  const buf = new Uint8Array(FP_TAG.length + a.length + 1 + b.length);
  buf.set(FP_TAG, 0);
  buf.set(a, FP_TAG.length);
  buf.set(b, FP_TAG.length + a.length + 1);
  const h = new Uint8Array(await crypto.subtle.digest('SHA-256', buf));
  const groups: string[] = [];
  for (let i = 0; i < 4; i++) {
    // 5 bytes → 40 bits → mod 10^4; the bias is far below anything a phone call notices
    let n = 0;
    for (let j = 0; j < 5; j++) n = n * 256 + h[i * 5 + j];
    groups.push(String(n % 10_000).padStart(4, '0'));
  }
  return groups.join(' ');
}

// ── reading ─────────────────────────────────────────────────────────────────

export function isGuardianSetEvent(ev: ConsentEvent, userId: string): boolean {
  return ev.action === ACTIONS.recoveryGuardians
    && ev.actor === userId
    && ev.subject?.type === 'user'
    && ev.subject?.id === userId
    && validateGuardianSetPredicate(userId, ev.predicate).ok;
}

export function isRecoveryVouchEvent(ev: ConsentEvent, userId: string): boolean {
  const p = ev.predicate as Partial<RecoveryVouchPredicate> | undefined;
  return ev.action === ACTIONS.recoveryVouch
    && ev.subject?.type === 'user'
    && ev.subject?.id === userId
    && ev.actor !== userId
    && typeof p?.devicePubKey === 'string'
    && typeof p?.kemPubSpkiB64 === 'string'
    && typeof p?.guardianSetId === 'string'
    && typeof p?.notAfter === 'number';
}

/** A guardian's accept/withdraw about `ownerId` (lives in the owner's subject). */
export function isGuardianStanceEvent(ev: ConsentEvent, ownerId: string): boolean {
  return (ev.action === ACTIONS.recoveryAccept || ev.action === ACTIONS.recoveryWithdraw)
    && ev.subject?.type === 'user'
    && ev.subject?.id === ownerId
    && ev.actor !== ownerId;
}

/** An owner's nomination of `guardianId` (lives in the guardian's subject). */
export function isRecoveryNominateEvent(ev: ConsentEvent, guardianId: string): boolean {
  const p = ev.predicate as Partial<RecoveryNominatePredicate> | undefined;
  return ev.action === ACTIONS.recoveryNominate
    && ev.subject?.type === 'user'
    && ev.subject?.id === guardianId
    && ev.actor !== guardianId
    && typeof p?.guardianSetId === 'string'
    && typeof p?.threshold === 'number'
    && typeof p?.total === 'number';
}

export function isRecoveryProtestEvent(ev: ConsentEvent, userId: string): boolean {
  const p = ev.predicate as Partial<RecoveryProtestPredicate> | undefined;
  return ev.action === ACTIONS.recoveryProtest
    && ev.actor === userId
    && ev.subject?.type === 'user'
    && ev.subject?.id === userId
    && typeof p?.devicePubKey === 'string';
}

const RECOVERY_ACTIONS: ReadonlySet<string> = new Set([
  ACTIONS.recoveryGuardians,
  ACTIONS.recoveryVouch,
  ACTIONS.recoveryProtest,
  ACTIONS.recoveryNominate,
  ACTIONS.recoveryAccept,
  ACTIONS.recoveryWithdraw
]);

/**
 * The ingest gate for recovery events (the server's /api/consent/events).
 * Signature checks happen elsewhere; this closes the one hole a signature
 * cannot: every rule above trusts the SIGNED `ts`. A thief holding an
 * unlocked device could sign a guardian set dated three days ago and skip
 * the activation delay, or a guardian could backdate a vouch into an older
 * protest window. Accepting recovery events only when `ts` ≈ arrival time
 * makes the signed clock an honest one for everything that went through
 * the mirror. Non-recovery events pass untouched.
 */
export function validateRecoveryIngest(ev: ConsentEvent, now: number = Date.now()): Check {
  if (!RECOVERY_ACTIONS.has(ev.action)) return { ok: true };
  if (Math.abs(ev.ts - now) > SKEW_MS) return { ok: false, reason: 'recovery_ts_not_now' };
  const userId = ev.subject?.type === 'user' ? ev.subject.id : '';
  if (!userId) return { ok: false, reason: 'recovery_subject_not_user' };
  if (ev.action === ACTIONS.recoveryGuardians) {
    return isGuardianSetEvent(ev, userId) ? { ok: true } : { ok: false, reason: 'recovery_bad_set' };
  }
  if (ev.action === ACTIONS.recoveryVouch) {
    if (!isRecoveryVouchEvent(ev, userId)) return { ok: false, reason: 'recovery_bad_vouch' };
    const p = ev.predicate as unknown as RecoveryVouchPredicate;
    if (p.notAfter <= ev.ts || p.notAfter - ev.ts > VOUCH_MAX_TTL_MS) {
      return { ok: false, reason: 'recovery_bad_vouch_ttl' };
    }
    return { ok: true };
  }
  if (ev.action === ACTIONS.recoveryNominate) {
    return isRecoveryNominateEvent(ev, userId) ? { ok: true } : { ok: false, reason: 'recovery_bad_nominate' };
  }
  if (ev.action === ACTIONS.recoveryAccept || ev.action === ACTIONS.recoveryWithdraw) {
    return isGuardianStanceEvent(ev, userId) ? { ok: true } : { ok: false, reason: 'recovery_bad_stance' };
  }
  return isRecoveryProtestEvent(ev, userId) ? { ok: true } : { ok: false, reason: 'recovery_bad_protest' };
}

/**
 * Which of `guardians` currently stand as guardians of `ownerId`: each one's
 * LATEST valid accept/withdraw (by signed ts; ties → lowest id) is an accept.
 * Acceptance is of the OWNER, not of one set — re-shaping the set (another
 * threshold, one more name) does not make everyone consent again.
 */
export async function acceptedGuardians(
  events: Iterable<ConsentEvent>,
  ownerId: string,
  guardians: string[],
  resolveGuardian: PubKeyResolver,
  now: number = Date.now()
): Promise<Set<string>> {
  const stances = [...events]
    .filter((e) => isGuardianStanceEvent(e, ownerId) && guardians.includes(e.actor))
    .filter((e) => e.ts <= now + SKEW_MS)
    .sort((a, b) => (b.ts - a.ts) || compareIds(a.id, b.id));
  const decided = new Set<string>();
  const accepted = new Set<string>();
  for (const e of stances) {
    if (decided.has(e.actor)) continue;
    if (!(await verifySignedObject(e, resolveGuardian)).ok) continue;
    decided.add(e.actor);
    if (e.action === ACTIONS.recoveryAccept) accepted.add(e.actor);
  }
  return accepted;
}

/**
 * The guardian set in force at `now`: the latest (by signed ts; ties → lowest
 * event id) well-formed set that has passed its activation delay AND verifies
 * against `resolveSetSigner`. A forged or voided newer set therefore cannot
 * shadow the real one — it is skipped, not chosen-then-failed.
 */
export async function effectiveGuardianSet(
  events: Iterable<ConsentEvent>,
  userId: string,
  resolvers: RecoveryResolvers,
  now: number = Date.now()
): Promise<ConsentEvent | null> {
  const all = [...events];
  const candidates = all
    .filter((e) => isGuardianSetEvent(e, userId))
    .filter((e) => e.ts + GUARDIAN_SET_ACTIVATION_MS <= now)
    .sort((a, b) => (b.ts - a.ts) || compareIds(a.id, b.id));
  for (const set of candidates) {
    if (!(await verifySignedObject(set, resolvers.setSigner)).ok) continue;
    const { guardians, threshold } = set.predicate as unknown as GuardianSetPredicate;
    const accepted = await acceptedGuardians(all, userId, guardians, resolvers.guardian, now);
    if (accepted.size >= threshold) return set;
  }
  return null;
}

/**
 * The set in force plus the newest valid set still inside its activation
 * delay — what the settings screen shows ("your new guardians take over on
 * …"). `pending` is null when nothing newer than `effective` is waiting.
 */
export async function guardianSetStatus(
  events: Iterable<ConsentEvent>,
  userId: string,
  resolvers: RecoveryResolvers,
  now: number = Date.now()
): Promise<{
  effective: ConsentEvent | null;
  /** who of the effective set has accepted (withdrawals show up here) */
  effectiveAccepted: string[];
  /** the newest valid set not (yet) in force: waiting for its delay, its acceptances, or both */
  pending: { set: ConsentEvent; activeAt: number; accepted: string[] } | null;
}> {
  const all = [...events];
  const effective = await effectiveGuardianSet(all, userId, resolvers, now);
  const acceptedOf = async (set: ConsentEvent) =>
    [...(await acceptedGuardians(all, userId, (set.predicate as unknown as GuardianSetPredicate).guardians, resolvers.guardian, now))].sort();
  const effectiveAccepted = effective ? await acceptedOf(effective) : [];
  const waiting = all
    .filter((e) => isGuardianSetEvent(e, userId))
    .filter((e) => !effective || e.ts > effective.ts)
    .sort((a, b) => (b.ts - a.ts) || compareIds(a.id, b.id));
  for (const set of waiting) {
    if ((await verifySignedObject(set, resolvers.setSigner)).ok) {
      return {
        effective,
        effectiveAccepted,
        pending: { set, activeAt: set.ts + GUARDIAN_SET_ACTIVATION_MS, accepted: await acceptedOf(set) }
      };
    }
  }
  return { effective, effectiveAccepted, pending: null };
}

/**
 * The latest valid protest against `devicePubKey`, as a cutoff: vouches
 * signed at or before it are void. `resolveProtester` should resolve the
 * user's ACTIVE keys — a protest speaks for a device the user holds now.
 */
export async function latestProtest(
  protests: Iterable<ConsentEvent>,
  userId: string,
  devicePubKey: string,
  resolveProtester: PubKeyResolver,
  now: number = Date.now()
): Promise<number | undefined> {
  const mine = [...protests]
    .filter((e) => isRecoveryProtestEvent(e, userId))
    .filter((e) => (e.predicate as unknown as RecoveryProtestPredicate).devicePubKey === devicePubKey)
    .filter((e) => e.ts <= now + SKEW_MS)
    .sort((a, b) => (b.ts - a.ts) || compareIds(a.id, b.id));
  for (const p of mine) {
    if ((await verifySignedObject(p, resolveProtester)).ok) return p.ts;
  }
  return undefined;
}

/**
 * The earliest moment at which `threshold` distinct guardians each held a
 * LIVE vouch (ts ≤ t ≤ notAfter), or null if there never was one. Liveness is
 * judged at that moment, not at `now`: the protest window deliberately
 * outlasts a short vouch, and a recovery must not expire because the user
 * waited the window out as asked.
 */
export function thresholdMoment(
  vouches: Array<{ guardian: string; ts: number; notAfter: number }>,
  threshold: number
): number | null {
  const times = [...new Set(vouches.map((v) => v.ts))].sort((a, b) => a - b);
  for (const t of times) {
    const live = new Set(vouches.filter((v) => v.ts <= t && t <= v.notAfter).map((v) => v.guardian));
    if (live.size >= threshold) return t;
  }
  return null;
}

/**
 * Do the vouches recover `expected.devicePubKey` for `userId`, and may it
 * register yet?
 *
 * `ok` = k distinct guardians of the effective set each held a live vouch
 * for exactly this device (signing key AND KEM key) at one moment, after the
 * latest protest. `matured` = the protest window since that moment is over.
 * `resolveGuardian` / `resolveProtester` should resolve ACTIVE keys only — a
 * guardian or a protesting owner speaks with a device they hold now.
 * Deterministic in its inputs: nothing depends on arrival order.
 */
export async function verifyRecovery(opts: {
  userId: string;
  expected: { devicePubKey: string; kemPubSpkiB64: string };
  sets: Iterable<ConsentEvent>;
  vouches: Iterable<ConsentEvent>;
  protests?: Iterable<ConsentEvent>;
  /** accept/withdraw events about the user (their own subject) */
  stances?: Iterable<ConsentEvent>;
  resolveSetSigner: PubKeyResolver;
  resolveGuardian: PubKeyResolver;
  resolveProtester?: PubKeyResolver;
  now?: number;
}): Promise<RecoveryCheck> {
  const now = opts.now ?? Date.now();
  const stances = [...(opts.stances ?? [])];
  const resolvers = { setSigner: opts.resolveSetSigner, guardian: opts.resolveGuardian };
  const set = await effectiveGuardianSet([...opts.sets, ...stances], opts.userId, resolvers, now);
  if (!set) return { ok: false, reason: 'no_effective_guardian_set' };
  const { threshold } = set.predicate as unknown as GuardianSetPredicate;
  // Only a guardian who stands as one now may vouch.
  const guardians = [...(await acceptedGuardians(
    stances, opts.userId, (set.predicate as unknown as GuardianSetPredicate).guardians, opts.resolveGuardian, now
  ))];

  const protestedAt = opts.protests && opts.resolveProtester
    ? await latestProtest(opts.protests, opts.userId, opts.expected.devicePubKey, opts.resolveProtester, now)
    : undefined;

  const counted: Array<{ guardian: string; ts: number; notAfter: number }> = [];
  const ordered = [...opts.vouches].sort((a, b) => compareIds(a.id, b.id));
  for (const v of ordered) {
    if (!isRecoveryVouchEvent(v, opts.userId)) continue;
    if (!guardians.includes(v.actor)) continue;
    const p = v.predicate as unknown as RecoveryVouchPredicate;
    if (p.guardianSetId !== set.id) continue;
    if (p.devicePubKey !== opts.expected.devicePubKey) continue;
    if (p.kemPubSpkiB64 !== opts.expected.kemPubSpkiB64) continue;
    if (v.ts > now + SKEW_MS || v.ts < set.ts) continue;
    if (protestedAt !== undefined && v.ts <= protestedAt) continue;
    if (p.notAfter < v.ts || p.notAfter - v.ts > VOUCH_MAX_TTL_MS) continue;
    if (!(await verifySignedObject(v, opts.resolveGuardian)).ok) continue;
    counted.push({ guardian: v.actor, ts: v.ts, notAfter: p.notAfter });
  }

  const list = [...new Set(counted.map((c) => c.guardian))].sort();
  const at = thresholdMoment(counted, threshold);
  if (at === null) {
    const reason = list.length < threshold
      ? `vouches_below_threshold:${list.length}/${threshold}`
      : 'vouches_never_live_together';
    return { ok: false, reason, setId: set.id, vouchers: list, threshold, protestedAt };
  }
  const readyAt = at + RECOVERY_PROTEST_MS;
  if (now > readyAt + RECOVERY_CLAIM_TTL_MS) {
    return { ok: false, reason: 'recovery_lapsed', setId: set.id, vouchers: list, threshold, protestedAt };
  }
  return {
    ok: true,
    setId: set.id,
    vouchers: list,
    thresholdAt: at,
    readyAt,
    matured: now >= readyAt,
    protestedAt
  };
}
