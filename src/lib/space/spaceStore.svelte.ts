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
  idbPutCursor,
  idbGetSpaceSnapshot,
  idbPutSpaceSnapshot,
  idbSpaceUnlink
} from '$lib/crypto/keystore';
import { ensureIdentity, loadIdentity } from '$lib/crypto/identity';
import { verifySignedObject } from '$lib/crypto/verify';
import { ingestEvent } from '$lib/consent/ingest';
import { projectFrom, emptyState, type ProjectState } from '$lib/consent/projection';
import { restoreState } from '$lib/consent/stateRestore';
import {
  buildSnapshotPredicate,
  isSnapshotMatured,
  computePrunableIds,
  PRUNE_SAFETY_MS,
  type SnapshotPredicate
} from './compaction';
import { projectIdOfSpace } from './rotateGuard';
import { buildAndSignEvent, type SignableEvent } from '$lib/consent/signEvent';
import { ACTIONS, type ConsentEvent } from '$lib/consent/event';
import { computeHeads, computeDiff, sameHeads, isValidSpaceId } from './protocol';
import { pullEvents, pullHeads, pushEvents, pushSealed } from './relayClient';
import { resolvePeerKey } from './peerKeys';
import { ensureKemKeypair } from './e2e/kem';
import {
  epochCandidates,
  unwrapEpochKeyWithGrants,
  detectRotateRaces,
  generateEpochKeyRaw,
  buildEpochPredicate,
  buildEpochGrantPredicate,
  isEpochRotateEvent,
  isKeyDistributionEvent,
  coveredDevices,
  planHealGrants,
  type EpochRecipient,
  type HealMember,
  type EpochRotatePredicate,
  type RotateRace
} from './e2e/epoch';
import { sealEvent, openSealed, type SealedEnvelope } from './e2e/seal';
import { validateKeyEvent, type KeyGuardContext } from './rotateGuard';

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

export type SpaceReplicaOptions = {
  /**
   * What the key guard cannot read from this space's own events — for a
   * `vault:<id>` space, the parent rikma's active members. Read on every
   * judgement, so it can follow the project replica as it syncs. A vault
   * without it rejects every rotate/grant (fail closed).
   */
  guardContext?: () => KeyGuardContext;
};

/** One replica per spaceId per tab; callers share instances. */
export function openSpace(spaceId: string, opts: SpaceReplicaOptions = {}): SpaceReplica {
  if (!isValidSpaceId(spaceId)) throw new Error(`bad spaceId: ${spaceId}`);
  let r = replicas.get(spaceId);
  if (!r) {
    r = createSpaceReplica(spaceId, opts);
    replicas.set(spaceId, r);
  }
  return r;
}

export function createSpaceReplica(spaceId: string, opts: SpaceReplicaOptions = {}) {
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
  // raw epoch keys, memory only — never persisted (re-derived after reload).
  // T11: keyed by ROTATE EVENT ID, not by epoch number — a raced epoch has
  // several candidate keys and every readable one must stay reachable.
  const keysByRotateId = new Map<string, Uint8Array>();
  // T10 — compaction base: the restored state of the latest pruned snapshot.
  // Events in eventsById are the TAIL on top of this base. Null = no
  // compaction happened yet (project from emptyState, the pre-T10 behavior).
  let baseState: ProjectState | null = null;

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

  /** Unwrap (with per-rotate-event cache) the key one rotate event carries. */
  async function keyForRotate(rotateEv: ConsentEvent): Promise<Uint8Array | null> {
    const cached = keysByRotateId.get(rotateEv.id);
    if (cached) return cached;
    const identity = await loadIdentity();
    if (!identity) return null;
    const kem = await ensureKemKeypair();
    // T9a: the rotate's own wraps, else any epoch.grant that shared it with
    // this device. Only hits are cached — a grant can arrive later.
    const raw = await unwrapEpochKeyWithGrants(
      state.eventsById.values(), rotateEv, identity.devicePubB64, kem.privateKey
    );
    if (raw) keysByRotateId.set(rotateEv.id, raw);
    return raw;
  }

  function guardContext(): KeyGuardContext | undefined {
    return opts.guardContext?.();
  }

  /**
   * The WINNER key for an epoch — the only key sealing may use (T11: both
   * race sides converge on the lowest-event-id winner, so future traffic is
   * single-keyed). Null = this device can't read the epoch (removed member /
   * joined under a later epoch / keys not synced / lost the race AND was
   * excluded from the winner's wraps — see needsReRotate).
   */
  async function ensureEpochKeyRaw(epoch: number): Promise<Uint8Array | null> {
    const winner = (epochCandidates(state.eventsById.values()).get(epoch) ?? [])[0];
    if (!winner) return null;
    return keyForRotate(winner);
  }

  /** Instant local load — the fast path. Safe to call repeatedly. */
  function hydrate(): Promise<void> {
    if (!browser) return Promise.resolve();
    if (hydratePromise) return hydratePromise;
    hydratePromise = (async () => {
      state.status = 'hydrating';
      try {
        // T10: a compacted space restores its base state first — the events
        // below are just the tail on top of it.
        const snapRow = await idbGetSpaceSnapshot(spaceId);
        if (snapRow) {
          const restored = restoreState(snapRow.state);
          if (restored.ok) baseState = restored.state;
          // restore failure (e.g. version skew) degrades to tail-only —
          // the next sync full-pulls and the projection self-heals.
        }
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
    // T5/T9a: an unauthorized epoch.rotate or epoch.grant is rejected like a
    // bad signature — not linked to the space, not applied. Membership +
    // continuity are judged against the replica's current view of the space.
    const guard = validateKeyEvent(spaceId, state.eventsById.values(), res.event, guardContext());
    if (!guard.ok) return null;
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
        let newKeyMaterial = false;
        for (const env of page.events) {
          if (!env.event) continue;
          const known = state.eventsById.has(env.event.id);
          const ev = await ingestAndLink(env.event);
          if (ev && !known && isKeyDistributionEvent(ev)) newKeyMaterial = true;
        }
        // A rotate or grant that arrives AFTER the envelopes it unlocks (a new
        // member, a recovered device — T9a) would otherwise be useless: the
        // cursor already moved past those envelopes, and pass 2 below only
        // sees this page. New key material ⇒ walk the sealed history again
        // from 0; id dedupe makes the already-open ones free.
        let sealedPage = page.events;
        if (newKeyMaterial && since > 0) {
          const full = await pullEvents(spaceId, 0);
          if (full.ok) sealedPage = full.data.events;
        }
        // Pass 2 — sealed, now that any new rotate events are ingested.
        for (const env of sealedPage) {
          if (!env.sealed) continue;
          const opened = await openSealedEnvelope(env.sealed);
          if (opened) await ingestAndLink(opened);
          // Unopenable envelopes are simply skipped: wrong epoch for this
          // device, or garbage. They remain on the relay; a device that CAN
          // read them will. Nothing to retry locally without the key.
        }
        await idbPutCursor({ spaceId, epoch: page.epoch, seq: page.latestSeq });

        // Push what the relay lacks. In an E2E space only key-distribution
        // events (rotate, grant) may travel in plaintext — everything else
        // went (or must go) through publishSealed, so pushing it would leak it.
        const pushable = isE2E()
          ? [...state.eventsById.values()].filter(isKeyDistributionEvent)
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

  /**
   * Outer-verify + decrypt one sealed envelope. Null when unreadable.
   * T11: tries EVERY candidate key for the envelope's epoch (winner first) —
   * an envelope sealed under a losing rotate's key during a race window
   * stays readable to everyone, because the losing rotate event still
   * carries its own wraps.
   */
  async function openSealedEnvelope(env: SealedEnvelope): Promise<ConsentEvent | null> {
    if (env.spaceId !== spaceId) return null;
    const outer = await verifySignedObject(env, resolvePeerKey);
    if (!outer.ok) return null;
    for (const rotateEv of epochCandidates(state.eventsById.values()).get(env.epoch) ?? []) {
      const raw = await keyForRotate(rotateEv);
      if (!raw) continue;
      const opened = await openSealed(env, raw);
      if (opened) return opened;
    }
    return null;
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

    if (isE2E() && !isKeyDistributionEvent(event)) {
      return { ok: false, event, reason: 'space_is_e2e_use_publishSealed' };
    }

    // T5/T9a: hold ourselves to the same key rules we enforce on peers —
    // publishing an unauthorized rotate/grant would just get dropped by everyone.
    const guard = validateKeyEvent(spaceId, state.eventsById.values(), event, guardContext());
    if (!guard.ok) return { ok: false, event, reason: guard.reason };

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

  /**
   * E2E publish: sign inner → apply locally → seal → ship ciphertext.
   *
   * `atomic`: ship FIRST and apply only once the relay took it. Sealed events
   * are never re-offered by sync() (only key-distribution events travel in
   * plaintext there), so a local-first write whose push failed would live on
   * this device alone — for a vault secret that is a silent divergence
   * between what this member sees and what everyone else does.
   */
  async function publishSealed(
    userId: string,
    partial: Omit<SignableEvent, 'actor' | 'parents'> & { parents?: string[] },
    opts: { atomic?: boolean } = {}
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

    const applyLocally = async () => {
      await idbAdd('events', event);
      await idbSpaceLink(spaceId, event.id);
      addToState(event);
    };
    if (!opts.atomic) await applyLocally();

    const sealed = await sealEvent(identity, raw, spaceId, state.epoch, event);
    const pushed = await pushSealed(spaceId, [sealed]);
    if (!pushed.ok) return { ok: false, event, reason: pushed.reason };
    const mine = pushed.data.results.find((r) => r.id === sealed.id);
    if (mine && !mine.ok) return { ok: false, event, reason: mine.reason };
    if (opts.atomic) await applyLocally();
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
    const res = await publish(userId, {
      action: ACTIONS.epochRotate,
      subject: { type: 'space', id: spaceId },
      predicate: predicate as unknown as Record<string, unknown>
    });
    // Cache under the rotate EVENT id (T11) — the event exists even when the
    // network push failed (applied locally first), and local sealed publishes
    // need this key without a KEM round-trip.
    keysByRotateId.set(res.event.id, rawKey);
    // addToState (inside publish) already bumped state.epoch via the event.
    return { ok: res.ok, epoch: nextEpoch, reason: res.reason };
  }

  /**
   * T9a — share keys this device already holds with more devices, without
   * rotating: a new member, a newly paired device, or a device recovered
   * through guardians (T9b). One epoch.grant per rotate event.
   *
   * `scope: 'current'` shares only the current epoch — the documented
   * semantic for a NEW MEMBER (joining grants the present epoch's history).
   * `scope: 'all'` shares every epoch this device can read — for a user's
   * OWN new device, which should see the history that user was part of.
   * Rotates this device cannot read are skipped; `skipped` counts them so the
   * caller can ask another member to complete the grant.
   */
  async function grantEpochKeys(
    userId: string,
    recipients: EpochRecipient[],
    scope: 'current' | 'all' = 'current'
  ): Promise<{ ok: boolean; granted: number; skipped: number; reason?: string }> {
    if (!isE2E()) return { ok: false, granted: 0, skipped: 0, reason: 'no_epoch_rotate_first' };
    if (recipients.length === 0) return { ok: true, granted: 0, skipped: 0 };

    const byEpoch = epochCandidates(state.eventsById.values());
    const epochs = scope === 'current' ? [state.epoch] : [...byEpoch.keys()].sort((a, b) => a - b);
    let granted = 0;
    let skipped = 0;
    for (const epoch of epochs) {
      // Every candidate, not just the winner: race-window envelopes were
      // sealed under the losers' keys and must stay readable (T11).
      for (const rotateEv of byEpoch.get(epoch) ?? []) {
        // Covered by the rotate OR an earlier grant — granting twice is noise.
        const covered = coveredDevices(state.eventsById.values(), rotateEv);
        const todo = recipients.filter((r) => !covered.has(r.device));
        if (todo.length === 0) continue;
        const raw = await keyForRotate(rotateEv);
        if (!raw) {
          skipped++;
          continue;
        }
        const predicate = await buildEpochGrantPredicate(rotateEv, raw, todo);
        const res = await publish(userId, {
          action: ACTIONS.epochGrant,
          subject: { type: 'space', id: spaceId },
          predicate: predicate as unknown as Record<string, unknown>
        });
        if (!res.ok) return { ok: false, granted, skipped, reason: res.reason };
        granted++;
      }
    }
    return { ok: true, granted, skipped };
  }

  /**
   * T9a healing (plan §8 steps 7–8): hand every member's newer devices the
   * epoch keys that member could already read — a device recovered through
   * guardians, a device paired later. `members` comes from the key registry
   * (peerKeys.fetchHealMembers). Idempotent: covered devices are skipped, so
   * calling it on every open of an E2E space is cheap and converges.
   * Rotates this device cannot read are counted in `skipped`; another member
   * who can will close them.
   */
  async function healEpochGrants(
    userId: string,
    members: HealMember[]
  ): Promise<{ ok: boolean; granted: number; skipped: number; reason?: string }> {
    if (!isE2E()) return { ok: true, granted: 0, skipped: 0 };
    const plan = planHealGrants(state.eventsById.values(), members);
    let granted = 0;
    let skipped = 0;
    for (const [rotateId, todo] of plan) {
      const rotateEv = state.eventsById.get(rotateId);
      if (!rotateEv) continue;
      const raw = await keyForRotate(rotateEv);
      if (!raw) {
        skipped++;
        continue;
      }
      const predicate = await buildEpochGrantPredicate(rotateEv, raw, todo);
      const res = await publish(userId, {
        action: ACTIONS.epochGrant,
        subject: { type: 'space', id: spaceId },
        predicate: predicate as unknown as Record<string, unknown>
      });
      if (!res.ok) return { ok: false, granted, skipped, reason: res.reason };
      granted++;
    }
    return { ok: true, granted, skipped };
  }

  /** Can this device read (and seal under) the current epoch? False on a plaintext space. */
  async function canReadCurrentEpoch(): Promise<boolean> {
    if (!isE2E()) return false;
    return (await ensureEpochKeyRaw(state.epoch)) !== null;
  }

  /** T11 — the rotate races visible in this replica (epochs with >1 rotate). */
  function rotateRaces(): RotateRace[] {
    return detectRotateRaces(state.eventsById.values());
  }

  /**
   * T11 — true when this device LOST a rotate race and was left out of the
   * winner's wraps: it can unwrap some candidate key for the current epoch
   * but not the winner's, so it can read the race window yet cannot seal (or
   * read) post-race traffic. The remedy is a fresh rotateEpoch() to n+1
   * (rotate events are plaintext by design, so even a locked-out device can
   * publish one) — the caller decides when, to avoid rotate storms.
   */
  async function needsReRotate(): Promise<boolean> {
    if (!isE2E()) return false;
    const candidates = epochCandidates(state.eventsById.values()).get(state.epoch) ?? [];
    if (candidates.length === 0) return false;
    if (await keyForRotate(candidates[0])) return false; // winner readable — fine
    for (const c of candidates.slice(1)) {
      if (await keyForRotate(c)) return true; // race participant, excluded from winner
    }
    return false; // can't read ANY key — not a race problem (removed member etc.)
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
    const base = baseState ?? emptyState(projectId);
    return projectFrom(base, [...state.eventsById.values()]);
  }

  /**
   * T10 — propose a compaction snapshot of the CURRENT frontier: publishes
   * a snapshot.commit whose parents are the covered heads and whose
   * predicate carries the normalized state + root. Members then vote
   * (snapshot.vote) or let restime silence mature it.
   */
  async function proposeSnapshot(
    userId: string
  ): Promise<{ ok: boolean; snapshotId?: string; reason?: string }> {
    const projectId = projectIdOfSpace(spaceId);
    let predicate: SnapshotPredicate;
    try {
      predicate = await buildSnapshotPredicate(state.eventsById.values(), projectId);
    } catch (e) {
      return { ok: false, reason: (e as Error).message };
    }
    const publishFn = isE2E() ? publishSealed : publish;
    const res = await publishFn(userId, {
      action: 'snapshot.commit',
      subject: { type: 'project', id: projectId ?? spaceId },
      predicate: predicate as unknown as Record<string, unknown>,
      parents: predicate.heads
    });
    return { ok: res.ok, snapshotId: res.event.id, reason: res.reason };
  }

  /**
   * T10 — prune the local store up to the latest MATURED snapshot that also
   * cleared the safety window. Deletes covered events from IDB + memory and
   * installs the snapshot's state as the new base. Returns how many events
   * were pruned (0 = nothing eligible; never an error).
   */
  async function compact(now = Date.now()): Promise<number> {
    await hydrate();
    const projectId = projectIdOfSpace(spaceId);
    const projection = projectFor(projectId ?? spaceId);

    // Latest eligible snapshot: matured + safety window + carries a state
    // we can restore.
    let chosen: { ev: ConsentEvent; predicate: SnapshotPredicate } | null = null;
    for (const ev of state.eventsById.values()) {
      if (ev.action !== 'snapshot.commit') continue;
      const p = ev.predicate as unknown as SnapshotPredicate | undefined;
      if (!p || p.state === undefined || !Array.isArray(p.heads)) continue;
      if (!isSnapshotMatured(projection, ev.id)) continue;
      if (ev.ts + PRUNE_SAFETY_MS > now) continue;
      if (!chosen || ev.ts > chosen.ev.ts) chosen = { ev, predicate: p };
    }
    if (!chosen) return 0;

    const restored = restoreState(chosen.predicate.state);
    if (!restored.ok) return 0; // version skew — refuse to prune, keep replaying

    const prunable = computePrunableIds(state.eventsById.values(), chosen.ev);
    if (prunable.size === 0) return 0;

    for (const id of prunable) {
      await idbSpaceUnlink(spaceId, id);
    }
    await idbPutSpaceSnapshot({
      spaceId,
      snapshotEventId: chosen.ev.id,
      stateRoot: chosen.predicate.stateRoot,
      stateV: chosen.predicate.stateV,
      state: chosen.predicate.state,
      prunedAt: now
    });

    const next = new Map(state.eventsById);
    for (const id of prunable) next.delete(id);
    state.eventsById = next;
    baseState = restored.state;
    return prunable.size;
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
    grantEpochKeys,
    healEpochGrants,
    canReadCurrentEpoch,
    rotateRaces,
    needsReRotate,
    pollAndSyncIfBehind,
    projectFor,
    proposeSnapshot,
    compact,
    heads
  };
}

/** Polling fallback interval while a socket wake-up is active (T1). */
const SOCKET_FALLBACK_POLL_MS = 3 * 60_000;

/**
 * Background loop for a replica. Call from onMount of a page that opted in;
 * returns a stop function for onDestroy. No-op unless SPACE_SYNC_ENABLED.
 *
 * T1: when the Socket.io client is available, the replica also subscribes to
 * 'space:changed' wake-ups — a push in another tab/device triggers a pull
 * within a second. Polling stays as the fallback, stretched to a long
 * heartbeat while the socket listener is wired (the socket server may still
 * be down; pollAndSyncIfBehind is cheap).
 */
export function startAutoSync(replica: SpaceReplica, intervalMs = 20_000): () => void {
  console.log("[space]",spaceSyncEnabled())
  if (!spaceSyncEnabled()) return () => {};
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let unsubSocket: (() => void) | null = null;

  const delay = () => (unsubSocket ? Math.max(intervalMs, SOCKET_FALLBACK_POLL_MS) : intervalMs);

  const tick = async () => {
    if (stopped) return;
    await replica.pollAndSyncIfBehind();
    if (!stopped) timer = setTimeout(tick, delay());
  };

  // Socket wake-up (dynamic import keeps this module free of a hard
  // socket.io-client dependency in tests / SSR).
  import('$lib/stores/socketClient')
    .then(({ socketClient }) => {
      if (stopped) return;
      socketClient.subscribeSpace(replica.spaceId);
      const off = socketClient.onSpaceChanged((spaceId) => {
        if (spaceId === replica.spaceId) void replica.pollAndSyncIfBehind();
      });
      unsubSocket = () => {
        off();
        socketClient.unsubscribeSpace(replica.spaceId);
      };
    })
    .catch(() => { /* no socket client — polling only */ });

  // First round is a full sync so a fresh device backfills immediately.
  replica.sync().then(() => { if (!stopped) timer = setTimeout(tick, delay()); });

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
    if (unsubSocket) unsubSocket();
  };
}
