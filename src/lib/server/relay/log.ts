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
import { computeHeads } from '$lib/space/protocol';
import { consentStore } from '$lib/server/consent/store';

export type RelayEnvelope = { seq: number; event: ConsentEvent };

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

export function relayRead(spaceId: string, since = 0): RelayReadResult {
  const log = logs.get(spaceId);
  if (!log) return { epoch: logEpoch, latestSeq: 0, heads: [], envelopes: [] };

  // envelopes is append-only and seq is dense from 1, so `since` is an index.
  const envelopes = since > 0 ? log.envelopes.slice(since) : log.envelopes.slice();
  return {
    epoch: logEpoch,
    latestSeq: log.nextSeq - 1,
    heads: computeHeads(log.envelopes.map((e) => e.event)),
    envelopes
  };
}

/** Heads only — the O(1)-when-idle sync check. */
export function relayHeads(spaceId: string): string[] {
  const log = logs.get(spaceId);
  return log ? computeHeads(log.envelopes.map((e) => e.event)) : [];
}

/** Test hook. */
export function _resetRelayLogs() {
  logs.clear();
}
