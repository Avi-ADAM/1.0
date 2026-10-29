// HTTP transport for the Space sync protocol against /api/relay/[spaceId].
// Deliberately thin: cursor logic and ingestion live in spaceStore; this
// module only speaks the wire format.

import type { ConsentEvent } from '$lib/consent/event';
import type { SealedEnvelope } from './e2e/seal';
import { RELAY_MAX_BATCH } from './protocol';

export type RelayPullResponse = {
  ok: boolean;
  epoch: string;
  latestSeq: number;
  heads: string[];
  // one seq stream, two kinds: plaintext events and sealed envelopes
  events: Array<{ seq: number; event?: ConsentEvent; sealed?: SealedEnvelope }>;
};

export type RelayHeadsResponse = {
  ok: boolean;
  epoch: string;
  latestSeq: number;
  heads: string[];
};

export type RelayPushResponse = {
  ok: boolean;
  epoch: string;
  latestSeq: number;
  results: Array<
    | { id: string; ok: true; seq: number; deduped: boolean; reason?: undefined }
    | { id: string | null; ok: false; reason: string }
  >;
};

// `reason?: undefined` / `data?: undefined` on the opposite branches follows
// the repo-wide VerifyResult pattern: the project compiles with strict:false,
// where discriminated-union narrowing doesn't kick in.
export type RelayResult<T> =
  | { ok: true; data: T; reason?: undefined }
  | { ok: false; reason: string; data?: undefined };

async function call<T>(input: string, init?: RequestInit): Promise<RelayResult<T>> {
  try {
    const res = await fetch(input, { credentials: 'include', ...init });
    if (!res.ok) return { ok: false, reason: `http_${res.status}` };
    return { ok: true, data: (await res.json()) as T };
  } catch (e) {
    return { ok: false, reason: 'network_' + (e as Error).message };
  }
}

export function pullEvents(spaceId: string, since = 0): Promise<RelayResult<RelayPullResponse>> {
  return call(`/api/relay/${encodeURIComponent(spaceId)}?since=${since}`);
}

export function pullHeads(spaceId: string): Promise<RelayResult<RelayHeadsResponse>> {
  return call(`/api/relay/${encodeURIComponent(spaceId)}?headsOnly=1`);
}

export function pushEvents(
  spaceId: string,
  events: ConsentEvent[]
): Promise<RelayResult<RelayPushResponse>> {
  return pushChunked(spaceId, 'events', events);
}

export function pushSealed(
  spaceId: string,
  sealed: SealedEnvelope[]
): Promise<RelayResult<RelayPushResponse>> {
  return pushChunked(spaceId, 'sealed', sealed);
}

/**
 * One POST per RELAY_MAX_BATCH items, in the order given (computeDiff's
 * topological order), merged into a single response. Stops at the first
 * failed chunk: what already landed stays — the relay dedupes by id, so the
 * next sync simply re-offers the rest.
 */
async function pushChunked(
  spaceId: string,
  key: 'events' | 'sealed',
  items: Array<ConsentEvent | SealedEnvelope>
): Promise<RelayResult<RelayPushResponse>> {
  let merged: RelayPushResponse | null = null;
  // An empty push still makes one request, as before (the route answers 400).
  for (let i = 0; i < Math.max(items.length, 1); i += RELAY_MAX_BATCH) {
    const res = await call<RelayPushResponse>(`/api/relay/${encodeURIComponent(spaceId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: items.slice(i, i + RELAY_MAX_BATCH) })
    });
    if (!res.ok) return res;
    merged = merged
      ? { ...res.data, results: [...merged.results, ...res.data.results] }
      : res.data;
  }
  return { ok: true, data: merged };
}
