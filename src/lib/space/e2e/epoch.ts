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
};

export function generateEpochKeyRaw(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(EPOCH_KEY_BYTES));
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
  return { epoch, reason, wraps };
}

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
    if (!existing || ev.id < existing.id) byEpoch.set(n, ev);
    if (n > current) current = n;
  }
  return { current, byEpoch };
}

/**
 * Recover this device's copy of an epoch key from the rotate event.
 * Null when this device wasn't a recipient (removed member, or joined later
 * under a newer epoch) — callers treat that as "cannot read this epoch".
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
  return raw;
}
