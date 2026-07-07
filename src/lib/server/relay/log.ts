// Per-space append-only relay log — the "dumb mailbox" of S2a
// (PLAN_serverless_p2p_data §3 transport 1). The relay solves exactly one
// problem: two devices that are never online at the same moment. It assigns
// a monotonic seq to each accepted event so clients can pull incrementally
// (`since` cursor) instead of re-downloading the space.
//
// Durability model (deliberate, documented): the seq log itself is
// in-memory. Every accepted event is ALSO written through to consentStore
// (memory + Strapi mirror), so events survive restarts — only the cursor
// numbering does not. Each process start mints a fresh `logEpoch`; a client
// whose stored cursor carries a different epoch resyncs from seq 0 and its
// id-based dedupe makes that cheap. This keeps the relay honest to its role:
// it is never the authority, so it must never need to be.

import { randomBytes } from 'node:crypto';
import type { ConsentEvent } from '$lib/consent/event';
import type { SealedEnvelope } from '$lib/space/e2e/seal';
import { computeHeads } from '$lib/space/protocol';
import { consentStore } from '$lib/server/consent/store';
import { mirrorSaveSealed, mirrorSealedForSpace } from './sealedMirror';

// A log entry is either a plaintext signed event (S2) or a sealed envelope
// (S3a) — one seq stream per space covers both, so a single client cursor
// stays valid as a space transitions to E2E.
export type RelayEnvelope = {
  seq: number;
  event?: ConsentEvent;
  sealed?: SealedEnvelope;
};

export type RelayAppendResult =
  | { ok: true; seq: number; deduped: boolean; reason?: undefined }
  | { ok: false; reason: string; seq?: undefined; deduped?: undefined };

export type RelayReadResult = {
  epoch: string;
  latestSeq: number;
  heads: string[];
  envelopes: RelayEnvelope[];
};

type SpaceLog = {
  envelopes: RelayEnvelope[];
  byId: Map<string, number>; // event id -> seq
  nextSeq: number;
};

/** Regenerated on every process start; clients detect it and resync. */
export const logEpoch = randomBytes(9).toString('base64url');

const logs = new Map<string, SpaceLog>();

/** Soft cap per space. FreeMates spaces are small (2–20 people); a space
 * that blows past this is a bug or abuse, not a use case. */
export const MAX_EVENTS_PER_SPACE = 50_000;

function getLog(spaceId: string): SpaceLog {
  let log = logs.get(spaceId);
  if (!log) {
    log = { envelopes: [], byId: new Map(), nextSeq: 1 };
    logs.set(spaceId, log);
  }
  return log;
}

export async function relayAppend(
  spaceId: string,
  event: ConsentEvent
): Promise<RelayAppendResult> {
  const log = getLog(spaceId);

  const existing = log.byId.get(event.id);
  if (existing !== undefined) return { ok: true, seq: existing, deduped: true };

  if (log.envelopes.length >= MAX_EVENTS_PER_SPACE) {
    return { ok: false, reason: 'space_full' };
  }

  const seq = log.nextSeq++;
  log.envelopes.push({ seq, event });
  log.byId.set(event.id, seq);

  // Write-through so the event survives restarts (relay log is memory-only).
  await consentStore.putEvent(event);
  return { ok: true, seq, deduped: false };
}

/**
 * Sealed path (S3a): the relay stores ciphertext it cannot read. T3: each
 * accepted envelope is ALSO written through to the sealed-envelope Strapi
 * collection (best-effort, fire-and-forget — a down mirror never blocks a
 * push), so sealed history survives restarts the same way plaintext events
 * do via consentStore. The relay stays a mailbox, never an authority.
 */
export async function relayAppendSealed(
  spaceId: string,
  sealed: SealedEnvelope
): Promise<RelayAppendResult> {
  const log = getLog(spaceId);

  const existing = log.byId.get(sealed.id);
  if (existing !== undefined) return { ok: true, seq: existing, deduped: true };

  if (log.envelopes.length >= MAX_EVENTS_PER_SPACE) {
    return { ok: false, reason: 'space_full' };
  }

  const seq = log.nextSeq++;
  log.envelopes.push({ seq, sealed });
  log.byId.set(sealed.id, seq);

  // Write-through so the ciphertext survives restarts (T3). mirrorSaveSealed
  // never rejects — degradation is memory-only, exactly like mirrorSaveEvent.
  void mirrorSaveSealed(sealed);
  return { ok: true, seq, deduped: false };
}

/** Spaces already lazily re-hydrated from the mirror this process. */
const hydratedSpaces = new Set<string>();

/**
 * T3 lazy hydration: on the first touch of a space after a process start,
 * reload its sealed envelopes from the Strapi mirror into the in-memory log.
 * Runs at most once per space per process; ids already present (e.g. pushed
 * by a fast client before the first read) dedupe naturally. Failure degrades
 * to memory-only — never throws.
 */
export async function relayEnsureHydrated(spaceId: string): Promise<void> {
  if (hydratedSpaces.has(spaceId)) return;
  hydratedSpaces.add(spaceId);

  const fromMirror = await mirrorSealedForSpace(spaceId);
  if (fromMirror.length === 0) return;

  const log = getLog(spaceId);
  for (const sealed of fromMirror) {
    if (log.byId.has(sealed.id)) continue;
    if (log.envelopes.length >= MAX_EVENTS_PER_SPACE) break;
    const seq = log.nextSeq++;
    log.envelopes.push({ seq, sealed });
    log.byId.set(sealed.id, seq);
  }
}

export function relayRead(spaceId: string, since = 0): RelayReadResult {
  const log = logs.get(spaceId);
  if (!log) return { epoch: logEpoch, latestSeq: 0, heads: [], envelopes: [] };

  // envelopes is append-only and seq is dense from 1, so `since` is an index.
  const envelopes = since > 0 ? log.envelopes.slice(since) : log.envelopes.slice();
  return {
    epoch: logEpoch,
    latestSeq: log.nextSeq - 1,
    heads: plaintextHeads(log),
    envelopes
  };
}

/**
 * Heads only — the O(1)-when-idle sync check. Computed over PLAINTEXT
 * events only: the relay cannot see inside sealed envelopes, so for an E2E
 * space this reflects just the key-distribution layer and clients must rely
 * on the seq cursor (which covers both kinds) for "am I behind".
 */
export function relayHeads(spaceId: string): string[] {
  const log = logs.get(spaceId);
  return log ? plaintextHeads(log) : [];
}

function plaintextHeads(log: SpaceLog): string[] {
  const events: ConsentEvent[] = [];
  for (const e of log.envelopes) if (e.event) events.push(e.event);
  return computeHeads(events);
}

/** Test hook. Clears the in-memory log AND the hydration marks — i.e. a
 * simulated process restart. */
export function _resetRelayLogs() {
  logs.clear();
  hydratedSpaces.clear();
}
