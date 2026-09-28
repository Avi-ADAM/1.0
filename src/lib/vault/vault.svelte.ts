// The rikma vault, client session (PLAN_RIKMA_SHARED_INFO §3.2 / §5, stage 3).
// Browser-only; one per open docs tab.
//
// The vault is its own space, `vault:<pid>` — never `project:<pid>`: the first
// epoch.rotate turns a space E2E for good, and the rikma's signed log must
// stay readable to the server (S2b gate). Everything here rides pieces that
// already exist and are tested:
//
//   enable  → rotateEpoch('genesis') on the vault space, wrapped to every
//             member device with a KEM key
//   write   → publishSealed(vault.set | vault.remove)
//   read    → sync() opens envelopes with this device's epoch keys; the item
//             list is folded by items.ts
//   upkeep  → on every sync, a member who can read the vault:
//             - grants the CURRENT epoch to every member device that lacks it
//               (a member who joined after genesis, or registered a KEM key
//               late) — joining sees the present, not the past
//             - heals history onto a member's newer devices (T9a, a paired or
//               guardian-recovered device) — a user reads what they could read
//             - rotates if a device of someone who is no longer a member can
//               read the current epoch (removal makes rotation mandatory)
//
// Membership comes from the rikma page (Strapi `user_1s`). Pre-S3 the server
// is still the authority on membership, and the vault guard needs a member
// set before it accepts any key event (it fails closed without one). When S3
// makes the project projection authoritative, `members` switches to it.
//
// Honest limits, said in the UI too: E2E cannot unshare the past (a member
// who left keeps what they already read — hence the change-these list), and
// the relay sees the vault's size and write rhythm, never its content.

import { browser } from '$app/environment';
import { ACTIONS } from '$lib/consent/event';
import { ensurePubkeyRegistered } from '$lib/consent/publish';
import { ensureIdentity } from '$lib/crypto/identity';
import { spaceIdForVault } from '$lib/space/protocol';
import { openSpace, type SpaceReplica } from '$lib/space/spaceStore.svelte';
import { fetchHealMembers } from '$lib/space/peerKeys';
import { ensureKemKeypair } from '$lib/space/e2e/kem';
import {
  vaultItemsFromEvents,
  validateVaultItem,
  normalizeVaultItem,
  newVaultItemId,
  strangerDevices,
  lastRemovalRotateAt,
  exposedItems,
  type VaultItem,
  type VaultItemInput
} from './items';

export type VaultStatus =
  | 'loading'
  | 'off'      // no genesis yet — any member can turn it on
  | 'locked'   // the vault exists, but this device has no key yet (waiting for a grant)
  | 'open'
  | 'error';

/** Per-browser opt-in on top of the server flag, for trying it before launch. */
export function vaultOptIn(): boolean {
  if (!browser) return false;
  try {
    return localStorage.getItem('VAULT_ENABLED') === '1';
  } catch {
    return false;
  }
}

const SYNC_EVERY_MS = 30_000;

// The guard reads members through this, so a membership change on the page
// reaches a replica that openSpace() already cached.
const membersByVault = new Map<string, Set<string>>();

export class VaultSession {
  status = $state<VaultStatus>('loading');
  items = $state<VaultItem[]>([]);
  /** secrets a former member could read that nobody has changed since */
  exposed = $state<VaultItem[]>([]);
  busy = $state(false);
  reason = $state('');

  readonly projectId: string;
  readonly userId: string;
  #members: Set<string>;
  #replica: SpaceReplica | null = null;
  #timer: ReturnType<typeof setInterval> | null = null;

  constructor(projectId: string, userId: string, memberIds: string[]) {
    this.projectId = String(projectId);
    this.userId = String(userId);
    this.#members = new Set(memberIds.map(String));
  }

  get #spaceId() {
    return spaceIdForVault(this.projectId);
  }

  /** Start syncing; returns the teardown for an $effect. */
  start(): () => void {
    if (!browser) return () => {};
    membersByVault.set(this.#spaceId, this.#members);
    this.#replica = openSpace(this.#spaceId, {
      guardContext: () => ({ members: membersByVault.get(this.#spaceId) ?? new Set() })
    });
    void this.refresh();
    this.#timer = setInterval(() => void this.refresh(), SYNC_EVERY_MS);
    return () => {
      if (this.#timer) clearInterval(this.#timer);
      this.#timer = null;
    };
  }

  /** Pull, open what this device can, do the upkeep, re-fold the list. */
  async refresh(): Promise<void> {
    const r = this.#replica;
    if (!r) return;
    try {
      await r.sync();
      if (r.state.epoch < 0) {
        this.status = 'off';
        this.items = [];
        return;
      }
      if (!(await r.canReadCurrentEpoch())) {
        this.status = 'locked';
        return;
      }
      await this.#upkeep(r);
      this.#fold(r);
      this.status = 'open';
      this.reason = '';
    } catch (e) {
      this.status = 'error';
      this.reason = (e as Error).message;
    }
  }

  #fold(r: SpaceReplica) {
    const events = [...r.state.eventsById.values()];
    this.items = vaultItemsFromEvents(events, this.#members);
    this.exposed = exposedItems(this.items, lastRemovalRotateAt(events));
  }

  async #upkeep(r: SpaceReplica) {
    const members = await fetchHealMembers([...this.#members]);
    // A registry answer with members missing would make their devices look
    // like strangers — never rotate (or grant) on a partial picture.
    if (members.length !== this.#members.size) return;
    const recipients = members.flatMap((m) => m.recipients);

    const strangers = strangerDevices(r.state.eventsById.values(), members);
    if (strangers.length > 0) {
      // Someone left: a new epoch, wrapped to current members only.
      await r.rotateEpoch(this.userId, recipients, 'member.remove');
      return;
    }
    await r.grantEpochKeys(this.userId, recipients, 'current');
    await r.healEpochGrants(this.userId, members);
  }

  /** Turn the vault on for the whole rikma (genesis rotate on `vault:<pid>`). */
  async enable(): Promise<{ ok: boolean; reason?: string }> {
    const r = this.#replica;
    if (!r) return { ok: false, reason: 'not_started' };
    return this.#run(async () => {
      // This device must be a recipient — make sure its keys are published.
      const identity = await ensureIdentity(this.userId);
      await ensureKemKeypair();
      await ensurePubkeyRegistered(identity);
      await r.sync();
      if (r.state.epoch >= 0) return { ok: true }; // someone beat us to it
      const members = await fetchHealMembers([...this.#members]);
      const recipients = members.flatMap((m) => m.recipients);
      if (!recipients.some((x) => x.device === identity.devicePubB64)) {
        return { ok: false, reason: 'this_device_has_no_kem_key' };
      }
      const res = await r.rotateEpoch(this.userId, recipients, 'genesis');
      return res.ok ? { ok: true } : { ok: false, reason: res.reason };
    });
  }

  async save(input: VaultItemInput, id?: string): Promise<{ ok: boolean; reason?: string }> {
    const check = validateVaultItem(input);
    if (!check.ok) return check;
    return this.#write(ACTIONS.vaultSet, id ?? newVaultItemId(), normalizeVaultItem(input));
  }

  async remove(id: string): Promise<{ ok: boolean; reason?: string }> {
    return this.#write(ACTIONS.vaultRemove, id, {});
  }

  async #write(
    action: typeof ACTIONS.vaultSet | typeof ACTIONS.vaultRemove,
    id: string,
    predicate: Record<string, unknown>
  ): Promise<{ ok: boolean; reason?: string }> {
    const r = this.#replica;
    if (!r) return { ok: false, reason: 'not_started' };
    return this.#run(async () => {
      // Atomic: a secret other members cannot see must not look saved here.
      const res = await r.publishSealed(
        this.userId,
        { action, subject: { type: 'vault', id }, predicate },
        { atomic: true }
      );
      this.#fold(r);
      return res.ok ? { ok: true } : { ok: false, reason: res.reason };
    });
  }

  async #run<T extends { ok: boolean; reason?: string }>(fn: () => Promise<T>): Promise<T> {
    this.busy = true;
    try {
      return await fn();
    } finally {
      this.busy = false;
      await this.refresh();
    }
  }
}
