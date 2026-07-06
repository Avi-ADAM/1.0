// Space replica — the client half of the distributed data layer (S2a+S3a).
//
// Local-first by construction:
//   1. hydrate()       — events come out of IndexedDB instantly, no network.
//                        A returning user sees the projection before the
//                        first request leaves the device.
//   2. sync()          — heads/diff (plaintext) + seq-cursor (sealed)
//                        exchange with the relay.
//   3. publish()       — sign locally, apply locally, THEN ship.
//   4. publishSealed() — same, but the relay only ever sees ciphertext.
//
// E2E mode (S3a) switches on per-space the moment the space contains an
// 'epoch.rotate' event (see rotateEpoch / $lib/space/e2e/*). From then on:
//   - plaintext publish is refused for anything except epoch.rotate
//     (key distribution must stay readable — you can't encrypt the message
//     that distributes the key);
//   - locally-held non-rotate events are never pushed in plaintext;
//   - pulled sealed envelopes are outer-verified, decrypted with the epoch
//     key (recovered via this device's KEM key), and the INNER event goes
//     through the normal ingest pipeline — signature, dedupe, commitments.
//
// Raw epoch keys live in a per-replica in-memory map only. A reload
// re-derives them from the rotate events + the KEM private key in IDB.
//
// This layer runs in parallel to the existing Strapi/GraphQL flow and is
// gated by localStorage.SPACE_SYNC_ENABLED — same shadow pattern the consent
// plan used. Nothing here mutates Strapi state.

import { browser } from '$app/environment';
import {
  idbAdd,
  idbGet,
  idbSpaceLink,
  idbSpaceEventIds,
  idbGetCursor,
  idbPutCursor
} from '$lib/crypto/keystore';
import { ensureIdentity, loadIdentity } from '$lib/crypto/identity';
import { verifySignedObject } from '$lib/crypto/verify';
import { ingestEvent } from '$lib/consent/ingest';
import { project, type ProjectState } from '$lib/consent/projection';
import { buildAndSignEvent, type SignableEvent } from '$lib/consent/signEvent';
import { ACTIONS, type ConsentEvent } from '$lib/consent/event';
import { computeHeads, computeDiff, sameHeads, isValidSpaceId } from './protocol';
import { pullEvents, pullHeads, pushEvents, pushSealed } from './relayClient';
import { resolvePeerKey } from './peerKeys';
import { ensureKemKeypair } from './e2e/kem';
import {
  epochStateFromEvents,
  unwrapEpochKey,
  generateEpochKeyRaw,
  buildEpochPredicate,
  isEpochRotateEvent,
  type EpochRecipient,
  type EpochRotatePredicate
} from './e2e/epoch';
import { sealEvent, openSealed, type SealedEnvelope } from './e2e/seal';

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
    /** current epoch of this space; -1 = plaintext space (no E2E yet) */
    epoch: -1,
    reason: undefined as string | undefined
  });

  let hydratePromise: Promise<void> | null = null;
  let syncInFlight: Promise<boolean> | null = null;
  // raw epoch keys, memory only — never persisted (re-derived after reload)
  const epochKeysRaw = new Map<number, Uint8Array>();

  function addToState(ev: ConsentEvent) {
    if (state.eventsById.has(ev.id)) return;
    const next = new Map(state.eventsById);
    next.set(ev.id, ev);
    state.eventsById = next;
    if (isEpochRotateEvent(ev)) {
      const n = (ev.predicate as unknown as EpochRotatePredicate).epoch;
      if (n > state.epoch) state.epoch = n;
    }
  }

  function isE2E(): boolean {
    return state.epoch >= 0;
  }

  /**
   * Raw key for an epoch: memory cache, else unwrap from the rotate event
   * with this device's KEM private key. Null = this device can't read the
   * epoch (removed member / joined under a later epoch / keys not synced).
   */
  async function ensureEpochKeyRaw(epoch: number): Promise<Uint8Array | null> {
    const cached = epochKeysRaw.get(epoch);
    if (cached) return cached;
    const es = epochStateFromEvents(state.eventsById.values());
    const rotate = es.byEpoch.get(epoch);
    if (!rotate) return null;
    const identity = await loadIdentity();
    if (!identity) return null;
    const kem = await ensureKemKeypair();
    const raw = await unwrapEpochKey(rotate, identity.devicePubB64, kem.privateKey);
    if (raw) epochKeysRaw.set(epoch, raw);
    return raw;
  }

  /** Instant local load — the fast path. Safe to call repeatedly. */
  function hydrate(): Promise<void> {
    if (!browser) return Promise.resolve();
    if (hydratePromise) return hydratePromise;
    hydratePromise = (async () => {
      state.status = 'hydrating';
      try {
        const ids = await idbSpaceEventIds(spaceId);
        for (const id of ids) {
          if (state.eventsById.has(id)) continue;
          const ev = await idbGet<ConsentEvent>('events', id);
          if (ev) addToState(ev);
        }
        state.status = state.status === 'hydrating' ? 'local' : state.status;
      } catch (e) {
        state.status = 'error';
        state.reason = 'hydrate_' + (e as Error).message;
      }
    })();
    return hydratePromise;
  }

  async function ingestAndLink(raw: unknown): Promise<ConsentEvent | null> {
    const res = await ingestEvent(raw, resolvePeerKey);
    if (!res.ok) return null;
    await idbSpaceLink(spaceId, res.event.id);
    addToState(res.event);
    return res.event;
  }

  /**
   * One full round with the relay. Plaintext events flow via heads/diff;
   * sealed envelopes flow via the shared seq cursor. Returns true when the
   * round ended with nothing known to be missing on either side.
   */
  function sync(): Promise<boolean> {
    if (!browser) return Promise.resolve(false);
    if (syncInFlight) return syncInFlight;
    syncInFlight = (async () => {
      await hydrate();
      state.status = 'syncing';
      try {
        // Resume from the stored cursor; a relay restart (new epoch id)
        // means seq numbering reset — refetch from 0, dedupe absorbs it.
        const cursor = await idbGetCursor(spaceId);
        const since = cursor?.seq ?? 0;

        const pulled = await pullEvents(spaceId, since);
        if (!pulled.ok) throw new Error(pulled.reason);
        let page = pulled.data;
        if (cursor && cursor.epoch !== page.epoch && since > 0) {
          const refetch = await pullEvents(spaceId, 0);
          if (!refetch.ok) throw new Error(refetch.reason);
          page = refetch.data;
        }

        // Pass 1 — plaintext (includes epoch.rotate key distribution).
        for (const env of page.events) {
          if (env.event) await ingestAndLink(env.event);
        }
        // Pass 2 — sealed, now that any new rotate events are ingested.
        for (const env of page.events) {
          if (!env.sealed) continue;
          const opened = await openSealedEnvelope(env.sealed);
          if (opened) await ingestAndLink(opened);
          // Unopenable envelopes are simply skipped: wrong epoch for this
          // device, or garbage. They remain on the relay; a device that CAN
          // read them will. Nothing to retry locally without the key.
        }
        await idbPutCursor({ spaceId, epoch: page.epoch, seq: page.latestSeq });

        // Push what the relay lacks. In an E2E space only key-distribution
        // events may travel in plaintext — everything else went (or must go)
        // through publishSealed, so pushing it here would leak it.
        const pushable = isE2E()
          ? [...state.eventsById.values()].filter(isEpochRotateEvent)
          : [...state.eventsById.values()];
        const missing = computeDiff(pushable, page.heads);
        if (missing.length > 0) {
          const pushRes = await pushEvents(spaceId, missing);
          if (!pushRes.ok) throw new Error(pushRes.reason);
        }

        state.lastSyncAt = Date.now();
        state.status = 'synced';
        state.reason = undefined;
        return true;
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

  /** Outer-verify + decrypt one sealed envelope. Null when unreadable. */
  async function openSealedEnvelope(env: SealedEnvelope): Promise<ConsentEvent | null> {
    if (env.spaceId !== spaceId) return null;
    const outer = await verifySignedObject(env, resolvePeerKey);
    if (!outer.ok) return null;
    const raw = await ensureEpochKeyRaw(env.epoch);
    if (!raw) return null;
    return openSealed(env, raw);
  }

  /**
   * PLAINTEXT publish (S2 spaces, and epoch.rotate in E2E spaces).
   * Parents default to the current local heads, which is what keeps the
   * space a connected DAG instead of a pile of roots.
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

    if (isE2E() && event.action !== ACTIONS.epochRotate) {
      return { ok: false, event, reason: 'space_is_e2e_use_publishSealed' };
    }

    // Local-first: our own signed event is applied before any network I/O.
    await idbAdd('events', event);
    await idbSpaceLink(spaceId, event.id);
    addToState(event);

    const pushed = await pushEvents(spaceId, [event]);
    if (!pushed.ok) {
      // Not lost — it's in IDB and the space index; the next sync()'s
      // computeDiff will re-offer it to the relay.
      return { ok: false, event, reason: pushed.reason };
    }
    const mine = pushed.data.results.find((r) => r.id === event.id);
    if (mine && !mine.ok) return { ok: false, event, reason: mine.reason };
    return { ok: true, event };
  }

  /** E2E publish: sign inner → apply locally → seal → ship ciphertext. */
  async function publishSealed(
    userId: string,
    partial: Omit<SignableEvent, 'actor' | 'parents'> & { parents?: string[] }
  ): Promise<{ ok: boolean; event: ConsentEvent; reason?: string }> {
    const identity = await ensureIdentity(userId);
    const event = await buildAndSignEvent(identity, {
      ...partial,
      actor: userId,
      parents: partial.parents ?? computeHeads(state.eventsById.values())
    });

    if (!isE2E()) return { ok: false, event, reason: 'no_epoch_rotate_first' };
    const raw = await ensureEpochKeyRaw(state.epoch);
    if (!raw) return { ok: false, event, reason: 'no_epoch_key_for_device' };

    await idbAdd('events', event);
    await idbSpaceLink(spaceId, event.id);
    addToState(event);

    const sealed = await sealEvent(identity, raw, spaceId, state.epoch, event);
    const pushed = await pushSealed(spaceId, [sealed]);
    if (!pushed.ok) return { ok: false, event, reason: pushed.reason };
    const mine = pushed.data.results.find((r) => r.id === sealed.id);
    if (mine && !mine.ok) return { ok: false, event, reason: mine.reason };
    return { ok: true, event };
  }

  /**
   * Start (epoch 0) or rotate (epoch n+1) this space's group key.
   * `recipients` = every member device that should read the new epoch —
   * on member removal, simply omit the removed member's devices.
   * The caller assembles recipients from the key registry (see
   * fetchKemRecipients in peerKeys.ts).
   */
  async function rotateEpoch(
    userId: string,
    recipients: EpochRecipient[],
    reason: EpochRotatePredicate['reason'] = 'manual'
  ): Promise<{ ok: boolean; epoch: number; reason?: string }> {
    const nextEpoch = state.epoch + 1;
    const rawKey = generateEpochKeyRaw();
    const predicate = await buildEpochPredicate(nextEpoch, reason, rawKey, recipients);
    // Cache before shipping: the rotate event is applied locally even when
    // the network push fails, and local sealed publishes need this key.
    epochKeysRaw.set(nextEpoch, rawKey);
    const res = await publish(userId, {
      action: ACTIONS.epochRotate,
      subject: { type: 'space', id: spaceId },
      predicate: predicate as unknown as Record<string, unknown>
    });
    // addToState (inside publish) already bumped state.epoch via the event.
    return { ok: res.ok, epoch: nextEpoch, reason: res.reason };
  }

  /** Cheap idle poll. E2E spaces compare seq cursors (relay can't see the
   * sealed DAG); plaintext spaces compare heads. */
  async function pollAndSyncIfBehind(): Promise<boolean> {
    if (!browser) return false;
    await hydrate();
    const remote = await pullHeads(spaceId);
    if (!remote.ok) return false;

    if (isE2E()) {
      const cursor = await idbGetCursor(spaceId);
      const upToDate = cursor
        && cursor.epoch === remote.data.epoch
        && cursor.seq >= remote.data.latestSeq;
      if (upToDate) {
        state.lastSyncAt = Date.now();
        return true;
      }
      return sync();
    }

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
    publishSealed,
    rotateEpoch,
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
