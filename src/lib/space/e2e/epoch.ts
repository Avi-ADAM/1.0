// Epoch keys — the group-encryption core of S3a (PLAN_serverless_p2p_data §4).
//
// One AES-256-GCM key per Space per epoch. Every sealed event names the
// epoch it was encrypted under. Rules:
//
//   - genesis (epoch 0): the creator generates the key and wraps it to every
//     member device, including their own other devices.
//   - member ADDED: no rotation — wrap the CURRENT epoch key to the new
//     device (joining grants access to the present epoch's history; that is
//     the documented, deliberate semantic).
//   - member REMOVED: rotation is MANDATORY. New epoch, new key, wrapped
//     only to the remaining devices. The removed member keeps reading the
//     past (they were there — unavoidable and honest) but not the future.
//
// The distribution vehicle is a PLAINTEXT signed ConsentEvent with action
// 'epoch.rotate' — you cannot encrypt the key-distribution message with the
// key it distributes. Its predicate is tamper-proof because it rides inside
// the signed body. Raw key bytes exist transiently in memory for wrap/seal
// operations and are never persisted; a page reload re-derives them from
// the rotate events + the device's KEM private key.

import type { ConsentEvent } from '$lib/consent/event';
import { ACTIONS } from '$lib/consent/event';
import { b64urlEncode } from '$lib/crypto/b64';
import { compareIds } from '$lib/consent/ids';
import { kemWrap, kemUnwrap, type WrappedKey } from './kem';

export const EPOCH_KEY_BYTES = 32;

export type EpochRecipient = {
  device: string;          // signing-device id (devicePubB64) — the stable name
  kemPubSpkiB64: string;   // that device's KEM public key
};

export type EpochRotatePredicate = {
  epoch: number;
  reason: 'genesis' | 'member.remove' | 'member.add' | 'manual';
  /** signing-device id → epoch key wrapped to that device's KEM key */
  wraps: Record<string, WrappedKey>;
  /**
   * T9a — key commitment, `keyCommitment(rawKey)`. Optional forever
   * (invariant 1): rotates published before T9 carry none. When present,
   * every unwrap — from the rotate itself or from a later epoch.grant — must
   * reproduce it, so a grant cannot hand a device a key other than the one
   * this rotate established.
   */
  kc?: string;
};

export function generateEpochKeyRaw(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(EPOCH_KEY_BYTES));
}

const KC_TAG = new TextEncoder().encode('freemates-epoch-kc-v1');

/** T9a — public commitment to an epoch key: b64url(SHA-256(tag ‖ key)). */
export async function keyCommitment(raw: Uint8Array): Promise<string> {
  const buf = new Uint8Array(KC_TAG.length + raw.length);
  buf.set(KC_TAG, 0);
  buf.set(raw, KC_TAG.length);
  return b64urlEncode(await crypto.subtle.digest('SHA-256', buf));
}

/** A key matches a rotate when the rotate commits to it, or commits to nothing (legacy). */
async function matchesCommitment(rotateEvent: ConsentEvent, raw: Uint8Array): Promise<boolean> {
  const kc = (rotateEvent.predicate as unknown as EpochRotatePredicate | undefined)?.kc;
  if (typeof kc !== 'string') return true;
  return (await keyCommitment(raw)) === kc;
}

export async function importEpochKey(raw: Uint8Array): Promise<CryptoKey> {
  const buf = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength) as ArrayBuffer;
  return crypto.subtle.importKey('raw', buf, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export async function buildEpochPredicate(
  epoch: number,
  reason: EpochRotatePredicate['reason'],
  rawKey: Uint8Array,
  recipients: EpochRecipient[]
): Promise<EpochRotatePredicate> {
  const wraps: Record<string, WrappedKey> = {};
  for (const r of recipients) {
    wraps[r.device] = await kemWrap(rawKey, r.kemPubSpkiB64);
  }
  return { epoch, reason, wraps, kc: await keyCommitment(rawKey) };
}

/**
 * THE id order for every "lowest event id wins" rule in this layer — defined
 * once in `$lib/consent/ids` (the projection's topo tie-break uses the same
 * function) and re-exported here for the key layer. Invariant 7.
 */
export { compareIds };

export function isEpochRotateEvent(ev: ConsentEvent): boolean {
  return ev.action === ACTIONS.epochRotate
    && typeof (ev.predicate as EpochRotatePredicate | undefined)?.epoch === 'number'
    && typeof (ev.predicate as EpochRotatePredicate | undefined)?.wraps === 'object';
}

export type EpochState = {
  /** highest epoch seen; -1 when the space has no rotate events (plaintext space) */
  current: number;
  /** epoch → the rotate event that established it (lowest event id wins ties) */
  byEpoch: Map<number, ConsentEvent>;
};

/**
 * Deterministic fold of rotate events. Two rotate events claiming the same
 * epoch (a race) resolve by lowest event id — both sides converge on the
 * same winner without coordination; the loser should observe and re-rotate.
 */
export function epochStateFromEvents(events: Iterable<ConsentEvent>): EpochState {
  const byEpoch = new Map<number, ConsentEvent>();
  let current = -1;
  for (const ev of events) {
    if (!isEpochRotateEvent(ev)) continue;
    const n = (ev.predicate as unknown as EpochRotatePredicate).epoch;
    const existing = byEpoch.get(n);
    if (!existing || compareIds(ev.id, existing.id) < 0) byEpoch.set(n, ev);
    if (n > current) current = n;
  }
  return { current, byEpoch };
}

/**
 * T11 — ALL rotate events per epoch, winner first (lowest event id), the
 * rest in the same deterministic order. Sealing always uses candidates[0]
 * (the winner); OPENING tries every candidate, so events sealed under a
 * losing key during a rotate race stay readable to the whole group forever —
 * the losing rotate event carries its own wraps, exactly like the winner's.
 */
export function epochCandidates(
  events: Iterable<ConsentEvent>
): Map<number, ConsentEvent[]> {
  const byEpoch = new Map<number, ConsentEvent[]>();
  for (const ev of events) {
    if (!isEpochRotateEvent(ev)) continue;
    const n = (ev.predicate as unknown as EpochRotatePredicate).epoch;
    const arr = byEpoch.get(n) ?? [];
    if (!arr.some((e) => e.id === ev.id)) arr.push(ev);
    byEpoch.set(n, arr);
  }
  for (const arr of byEpoch.values()) arr.sort((a, b) => compareIds(a.id, b.id));
  return byEpoch;
}

/** T11 — the rotate races present in the event set (epochs with >1 candidate). */
export type RotateRace = { epoch: number; winnerId: string; loserIds: string[] };

export function detectRotateRaces(events: Iterable<ConsentEvent>): RotateRace[] {
  const races: RotateRace[] = [];
  for (const [epoch, candidates] of epochCandidates(events)) {
    if (candidates.length < 2) continue;
    races.push({
      epoch,
      winnerId: candidates[0].id,
      loserIds: candidates.slice(1).map((e) => e.id)
    });
  }
  return races.sort((a, b) => a.epoch - b.epoch);
}

/**
 * T11 — every epoch key THIS device can recover for `epoch`, winner first.
 * Readers try them in order: the winner opens post-race traffic, the losers
 * open whatever was sealed in the race window. Sealing must use index 0 only.
 */
export async function epochKeysForOpen(
  events: Iterable<ConsentEvent>,
  epoch: number,
  myDevice: string,
  myKemPrivateKey: CryptoKey
): Promise<Uint8Array[]> {
  const all = [...events];
  const candidates = epochCandidates(all).get(epoch) ?? [];
  const keys: Uint8Array[] = [];
  for (const c of candidates) {
    const k = await unwrapEpochKeyWithGrants(all, c, myDevice, myKemPrivateKey);
    if (k) keys.push(k);
  }
  return keys;
}

/**
 * Recover this device's copy of an epoch key from the rotate event.
 * Null when this device wasn't a recipient (removed member, or joined later
 * under a newer epoch) — callers treat that as "cannot read this epoch".
 * A rotate that carries a key commitment (T9a) must match it.
 */
export async function unwrapEpochKey(
  rotateEvent: ConsentEvent,
  myDevice: string,
  myKemPrivateKey: CryptoKey
): Promise<Uint8Array | null> {
  const pred = rotateEvent.predicate as unknown as EpochRotatePredicate | undefined;
  const wrapped = pred?.wraps?.[myDevice];
  if (!wrapped) return null;
  const raw = await kemUnwrap(wrapped, myKemPrivateKey);
  if (!raw || raw.length !== EPOCH_KEY_BYTES) return null;
  if (!(await matchesCommitment(rotateEvent, raw))) return null;
  return raw;
}

// ── T9a — epoch.grant ────────────────────────────────────────────────────────
//
// A rotate is the only way to CHANGE a space's key; a grant is the way to
// SHARE an existing one with more devices. Without it the documented
// "member added → wrap the current key to them" semantic had no vehicle
// except a full rotation (a new epoch for every new phone), and a device
// recovered through guardians (T9b) could never read the history its own
// user wrote. One grant covers one rotate event: it names that rotate by id
// and carries the same key wrapped to the extra devices.
//
// Grants never compete with rotates: epochCandidates/epochStateFromEvents
// look at epoch.rotate only, so a grant cannot move `current`, win a race,
// or change which key seals. Trust is the rotate's: when the rotate carries
// a key commitment (`kc`), a granted key that does not reproduce it is
// discarded, so a member cannot hand a device a different key under an
// existing rotate's name. On a legacy rotate (no `kc`) the grant is taken on
// the granting member's word — the lowest-id grant first, deterministically.

export type EpochGrantPredicate = {
  /** id of the epoch.rotate event whose key is being shared */
  rotateId: string;
  /** that rotate's epoch — redundant, checked, keeps the event self-describing */
  epoch: number;
  /** signing-device id → the rotate's key wrapped to that device's KEM key */
  wraps: Record<string, WrappedKey>;
};

export function isEpochGrantEvent(ev: ConsentEvent): boolean {
  const p = ev.predicate as EpochGrantPredicate | undefined;
  return ev.action === ACTIONS.epochGrant
    && typeof p?.rotateId === 'string'
    && typeof p?.epoch === 'number'
    && !!p?.wraps && typeof p.wraps === 'object';
}

/** Events that distribute key material and therefore travel in plaintext. */
export function isKeyDistributionEvent(ev: ConsentEvent): boolean {
  return isEpochRotateEvent(ev) || isEpochGrantEvent(ev);
}

/**
 * Build a grant for `rotateEvent`'s key. Refuses (throws) when the rotate
 * commits to a key and `rawKey` is not it — a device must never publish a
 * grant its recipients will discard.
 */
export async function buildEpochGrantPredicate(
  rotateEvent: ConsentEvent,
  rawKey: Uint8Array,
  recipients: EpochRecipient[]
): Promise<EpochGrantPredicate> {
  if (!isEpochRotateEvent(rotateEvent)) throw new Error('grant: not an epoch.rotate event');
  if (!(await matchesCommitment(rotateEvent, rawKey))) {
    throw new Error('grant: key does not match the rotate commitment');
  }
  const wraps: Record<string, WrappedKey> = {};
  for (const r of recipients) {
    wraps[r.device] = await kemWrap(rawKey, r.kemPubSpkiB64);
  }
  const epoch = (rotateEvent.predicate as unknown as EpochRotatePredicate).epoch;
  return { rotateId: rotateEvent.id, epoch, wraps };
}

/** Grants for one rotate, in deterministic (event-id) order. */
export function grantsForRotate(events: Iterable<ConsentEvent>, rotateId: string): ConsentEvent[] {
  const out: ConsentEvent[] = [];
  for (const ev of events) {
    if (!isEpochGrantEvent(ev)) continue;
    if ((ev.predicate as unknown as EpochGrantPredicate).rotateId !== rotateId) continue;
    if (!out.some((e) => e.id === ev.id)) out.push(ev);
  }
  return out.sort((a, b) => compareIds(a.id, b.id));
}

/**
 * This device's copy of `rotateEvent`'s key — from the rotate's own wraps,
 * else from any grant for it. Every source is held to the rotate's key
 * commitment when it has one.
 */
export async function unwrapEpochKeyWithGrants(
  events: Iterable<ConsentEvent>,
  rotateEvent: ConsentEvent,
  myDevice: string,
  myKemPrivateKey: CryptoKey
): Promise<Uint8Array | null> {
  const direct = await unwrapEpochKey(rotateEvent, myDevice, myKemPrivateKey);
  if (direct) return direct;
  const rotateEpoch = (rotateEvent.predicate as unknown as EpochRotatePredicate | undefined)?.epoch;
  for (const g of grantsForRotate(events, rotateEvent.id)) {
    const pred = g.predicate as unknown as EpochGrantPredicate;
    if (pred.epoch !== rotateEpoch) continue;
    const wrapped = pred.wraps?.[myDevice];
    if (!wrapped) continue;
    const raw = await kemUnwrap(wrapped, myKemPrivateKey);
    if (!raw || raw.length !== EPOCH_KEY_BYTES) continue;
    if (!(await matchesCommitment(rotateEvent, raw))) continue;
    return raw;
  }
  return null;
}

/** Every device a rotate's key already reached: its own wraps plus every grant for it. */
export function coveredDevices(events: Iterable<ConsentEvent>, rotateEvent: ConsentEvent): Set<string> {
  const all = [...events];
  const covered = new Set(Object.keys((rotateEvent.predicate as unknown as EpochRotatePredicate).wraps ?? {}));
  const epoch = (rotateEvent.predicate as unknown as EpochRotatePredicate).epoch;
  for (const g of grantsForRotate(all, rotateEvent.id)) {
    const pred = g.predicate as unknown as EpochGrantPredicate;
    if (pred.epoch !== epoch) continue;
    for (const d of Object.keys(pred.wraps ?? {})) covered.add(d);
  }
  return covered;
}

/** One member as the healer sees them in the key registry. */
export type HealMember = {
  /** every device this user ever registered, revoked ones included —
   *  a LOST device is exactly the evidence that the user was in an epoch */
  devices: string[];
  /** the user's active devices that published a KEM key */
  recipients: EpochRecipient[];
};

/**
 * T9a healing (plan §8 steps 7–8) — which grants are missing, per rotate.
 *
 * The rule is "a user's devices read what that user could read": for every
 * rotate, a member some of whose devices the key reached gets it on every
 * other active device too. That one rule covers a device recovered through
 * guardians (T9b), a device paired later (T7), and a device that simply
 * predates its user's KEM key — with no notification step: whichever member
 * opens the space next closes the gap. A member none of whose devices was
 * ever reached (joined after that epoch) gets nothing: joining does not
 * grant history before the current epoch, and healing never changes that.
 */
export function planHealGrants(
  events: Iterable<ConsentEvent>,
  members: HealMember[]
): Map<string, EpochRecipient[]> {
  const all = [...events];
  const plan = new Map<string, EpochRecipient[]>();
  const rotates = all.filter(isEpochRotateEvent).sort((a, b) => compareIds(a.id, b.id));
  for (const rotateEv of rotates) {
    const covered = coveredDevices(all, rotateEv);
    const todo: EpochRecipient[] = [];
    for (const m of members) {
      if (!m.devices.some((d) => covered.has(d))) continue;
      for (const r of m.recipients) {
        if (!covered.has(r.device) && !todo.some((x) => x.device === r.device)) todo.push(r);
      }
    }
    if (todo.length) plan.set(rotateEv.id, todo);
  }
  return plan;
}
