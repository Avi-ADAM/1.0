// Space replica — the client half of the distributed data layer (S2a).
//
// Local-first by construction:
//   1. hydrate()   — events come out of IndexedDB instantly, no network.
//                    A returning user sees the projection before the first
//                    request leaves the device (the "faster loading" win).
//   2. sync()      — heads/diff exchange with the relay: pull what we lack,
//                    push what it lacks. Cheap when idle (headsOnly poll).
//   3. publish()   — sign locally, apply locally, THEN ship. The UI never
//                    waits for the server to see the user's own action.
//
// This layer runs in parallel to the existing Strapi/GraphQL flow and is
// gated by localStorage.SPACE_SYNC_ENABLED — same shadow pattern the consent
// plan used. Nothing here mutates Strapi state; it only grows the signed
// event log that S2b will make authoritative.

import { browser } from '$app/environment';
import {
  idbAdd,
  idbGet,
  idbSpaceLink,
  idbSpaceEventIds,
  idbGetCursor,
  idbPutCursor
} from '$lib/crypto/keystore';
import { ensureIdentity } from '$lib/crypto/identity';
import { ingestEvent } from '$lib/consent/ingest';
import { project, type ProjectState } from '$lib/consent/projection';
import { buildAndSignEvent, type SignableEvent } from '$lib/consent/signEvent';
import type { ConsentEvent } from '$lib/consent/event';
import { computeHeads, computeDiff, sameHeads, isValidSpaceId } from './protocol';
import { pullEvents, pullHeads, pushEvents } from './relayClient';
import { resolvePeerKey } from './peerKeys';

export function spaceSyncEnabled(): boolean {
  return browser && localStorage.getItem('SPACE_SYNC_ENABLED') === '1';
}

export type SpaceStatus =
  | 'idle'       // created, nothing loaded yet
  | 'hydrating'  // reading local IDB
  | 'local'      // local data available, no successful sync yet this session
  | 'syncing'    // exchange with relay in flight
  | 'synced'     // local == relay as of lastSyncAt
  | 'error';     // last sync failed; local data still valid

export type SpaceReplica = ReturnType<typeof createSpaceReplica>;

const replicas = new Map<string, SpaceReplica>();

/** One replica per spaceId per tab; callers share instances. */
export function openSpace(spaceId: string): SpaceReplica {
  if (!isValidSpaceId(spaceId)) throw new Error(`bad spaceId: ${spaceId}`);
  let r = replicas.get(spaceId);
  if (!r) {
    r = createSpaceReplica(spaceId);
    replicas.set(spaceId, r);
  }
  return r;
}

export function createSpaceReplica(spaceId: string) {
  const state = $state({
    status: 'idle' as SpaceStatus,
    eventsById: new Map<string, ConsentEvent>(),
    lastSyncAt: 0,
    reason: undefined as string | undefined
  });

  let hydratePromise: Promise<void> | null = null;
  let syncInFlight: Promise<boolean> | null = null;

  function addToState(ev: ConsentEvent) {
    if (state.eventsById.has(ev.id)) return;
    const next = new Map(state.eventsById);
    next.set(ev.id, ev);
    state.eventsById = next;
  }

  /** Instant local load — the fast path. Safe to call repeatedly. */
  function hydrate(): Promise<void> {
    if (!browser) return Promise.resolve();
    if (hydratePromise) return hydratePromise;
    hydratePromise = (async () => {
      state.status = 'hydrating';
      try {
        const ids = await idbSpaceEventIds(spaceId);
        const next = new Map(state.eventsById);
        for (const id of ids) {
          if (next.has(id)) continue;
          const ev = await idbGet<ConsentEvent>('events', id);
          if (ev) next.set(id, ev);
        }
        state.eventsById = next;
        state.status = state.status === 'hydrating' ? 'local' : state.status;
      } catch (e) {
        state.status = 'error';
        state.reason = 'hydrate_' + (e as Error).message;
      }
    })();
    return hydratePromise;
  }

  /**
   * One full heads/diff round with the relay. Returns true when local and
   * relay ended the round with identical heads.
   */
  function sync(): Promise<boolean> {
    if (!browser) return Promise.resolve(false);
    if (syncInFlight) return syncInFlight;
    syncInFlight = (async () => {
      await hydrate();
      state.status = 'syncing';
      try {
        // Resume from the stored cursor; a relay restart (new epoch) means
        // seq numbering reset — restart from 0, dedupe absorbs the overlap.
        const cursor = await idbGetCursor(spaceId);
        let since = cursor?.seq ?? 0;

        const pulled = await pullEvents(spaceId, since);
        if (!pulled.ok) throw new Error(pulled.reason);
        let page = pulled.data;
        if (cursor && cursor.epoch !== page.epoch && since > 0) {
          const refetch = await pullEvents(spaceId, 0);
          if (!refetch.ok) throw new Error(refetch.reason);
          page = refetch.data;
        }

        for (const { event } of page.events) {
          const res = await ingestEvent(event, resolvePeerKey);
          if (res.ok) {
            await idbSpaceLink(spaceId, res.event.id);
            addToState(res.event);
          }
          // Rejected events are dropped silently here; the relay already
          // verified once, so rejects mean a revoked key or local clock spew —
          // both visible in devtools, neither worth breaking sync over.
        }
        await idbPutCursor({ spaceId, epoch: page.epoch, seq: page.latestSeq });

        // Push what the relay lacks (includes anything signed offline).
        const missing = computeDiff(state.eventsById.values(), page.heads);
        if (missing.length > 0) {
          const pushRes = await pushEvents(spaceId, missing);
          if (!pushRes.ok) throw new Error(pushRes.reason);
        }

        state.lastSyncAt = Date.now();
        state.status = 'synced';
        state.reason = undefined;
        return missing.length === 0
          ? sameHeads(computeHeads(state.eventsById.values()), page.heads)
          : true;
      } catch (e) {
        state.status = 'error';
        state.reason = 'sync_' + (e as Error).message;
        return false;
      } finally {
        syncInFlight = null;
      }
    })();
    return syncInFlight;
  }

  /**
   * Sign + apply locally + ship. Parents default to the current local heads,
   * which is what keeps the space a connected DAG instead of a pile of roots.
   */
  async function publish(
    userId: string,
    partial: Omit<SignableEvent, 'actor' | 'parents'> & { parents?: string[] }
  ): Promise<{ ok: boolean; event: ConsentEvent; reason?: string }> {
    const identity = await ensureIdentity(userId);
    const event = await buildAndSignEvent(identity, {
      ...partial,
      actor: userId,
      parents: partial.parents ?? computeHeads(state.eventsById.values())
    });

    // Local-first: our own signed event is applied before any network I/O.
    await idbAdd('events', event);
    await idbSpaceLink(spaceId, event.id);
    addToState(event);

    const pushed = await pushEvents(spaceId, [event]);
    if (!pushed.ok) {
      // Not lost — it's in IDB and in the space index; the next sync()'s
      // computeDiff will re-offer it to the relay.
      return { ok: false, event, reason: pushed.reason };
    }
    const mine = pushed.data.results.find((r) => r.id === event.id);
    if (mine && !mine.ok) return { ok: false, event, reason: mine.reason };
    return { ok: true, event };
  }

  /** Cheap idle poll: compare head lists, sync only when they differ. */
  async function pollAndSyncIfBehind(): Promise<boolean> {
    if (!browser) return false;
    await hydrate();
    const remote = await pullHeads(spaceId);
    if (!remote.ok) return false;
    const local = computeHeads(state.eventsById.values());
    if (sameHeads(local, remote.data.heads)) {
      state.lastSyncAt = Date.now();
      if (state.status === 'local' || state.status === 'synced') state.status = 'synced';
      return true;
    }
    return sync();
  }

  function projectFor(projectId: string): ProjectState {
    return project([...state.eventsById.values()], projectId);
  }

  function heads(): string[] {
    return computeHeads(state.eventsById.values());
  }

  return {
    spaceId,
    get state() { return state; },
    hydrate,
    sync,
    publish,
    pollAndSyncIfBehind,
    projectFor,
    heads
  };
}

/**
 * Background loop for a replica. Call from onMount of a page that opted in;
 * returns a stop function for onDestroy. No-op unless SPACE_SYNC_ENABLED.
 */
export function startAutoSync(replica: SpaceReplica, intervalMs = 20_000): () => void {
  if (!spaceSyncEnabled()) return () => {};
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const tick = async () => {
    if (stopped) return;
    await replica.pollAndSyncIfBehind();
    if (!stopped) timer = setTimeout(tick, intervalMs);
  };
  // First round is a full sync so a fresh device backfills immediately.
  replica.sync().then(() => { if (!stopped) timer = setTimeout(tick, intervalMs); });

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
  };
}
