// The rikma's password vault — pure core (PLAN_RIKMA_SHARED_INFO §3.2, stage 3).
//
// A vault item is never a row anywhere. It is a signed `vault.set` event,
// SEALED under the vault space's epoch key (`vault:<pid>`), so the relay and
// Strapi hold ciphertext only. `vault.remove` tombstones it. This module
// folds the opened events into the item list, and answers the two questions
// the key layer raises for a vault:
//
//   - which devices can read the current epoch but belong to nobody who is a
//     member now (someone left ⇒ the vault must rotate), and
//   - which secrets were readable by that person (⇒ "change these").
//
// Folding is last-writer-wins by (signed ts, event id) — deterministic on
// every replica whatever the arrival order (invariant 7). Items stay out of
// ProjectState entirely (invariant 2). Only CURRENT members' writes count:
// a member who left still holds an old epoch key, and must not be able to
// slip an edit in under it.
//
// Pure: no IDB, no fetch.

import type { ConsentEvent } from '$lib/consent/event';
import { ACTIONS } from '$lib/consent/event';
import { compareIds } from '$lib/consent/ids';
import { b64urlEncode } from '$lib/crypto/b64';
import { coveredDevices, epochCandidates } from '$lib/space/e2e/epoch';

export const VAULT_LIMITS = {
  name: 120,
  username: 200,
  secret: 4096,
  url: 500,
  note: 2000
} as const;

export type VaultItemInput = {
  name: string;
  username?: string;
  secret: string;
  url?: string;
  note?: string;
};

export type VaultItem = VaultItemInput & {
  id: string;
  createdAt: number;
  createdBy: string;
  updatedAt: number;
  updatedBy: string;
  /** when the SECRET last changed — a note edit does not make it safe again */
  secretChangedAt: number;
};

type Check = { ok: true; reason?: undefined } | { ok: false; reason: string };

export function validateVaultItem(input: unknown): Check {
  const i = input as Partial<Record<keyof VaultItemInput, unknown>> | undefined;
  if (!i || typeof i !== 'object') return { ok: false, reason: 'vault_bad_shape' };
  if (typeof i.name !== 'string' || !i.name.trim()) return { ok: false, reason: 'vault_name_required' };
  if (typeof i.secret !== 'string' || !i.secret) return { ok: false, reason: 'vault_secret_required' };
  for (const k of Object.keys(VAULT_LIMITS) as (keyof VaultItemInput)[]) {
    const v = i[k];
    if (v === undefined) continue;
    if (typeof v !== 'string') return { ok: false, reason: `vault_bad_${k}` };
    if (v.length > VAULT_LIMITS[k]) return { ok: false, reason: `vault_too_long_${k}` };
  }
  return { ok: true };
}

/** Trimmed, with empty optionals dropped — one item, one byte form. */
export function normalizeVaultItem(input: VaultItemInput): VaultItemInput {
  const out: VaultItemInput = { name: input.name.trim(), secret: input.secret };
  for (const k of ['username', 'url', 'note'] as const) {
    const v = input[k]?.trim();
    if (v) out[k] = v;
  }
  return out;
}

export function newVaultItemId(): string {
  return b64urlEncode(crypto.getRandomValues(new Uint8Array(12)));
}

export function isVaultEvent(ev: ConsentEvent): boolean {
  return (ev.action === ACTIONS.vaultSet || ev.action === ACTIONS.vaultRemove)
    && ev.subject?.type === 'vault'
    && typeof ev.subject.id === 'string'
    && ev.subject.id.length > 0;
}

/**
 * The item list: vault events from current `members`, folded
 * last-writer-wins by (ts, id). A remove followed by a later set brings the
 * item back — that later set is an edit made by someone who still saw it.
 */
export function vaultItemsFromEvents(
  events: Iterable<ConsentEvent>,
  members: ReadonlySet<string>
): VaultItem[] {
  const ordered = [...events]
    .filter(isVaultEvent)
    .filter((e) => members.has(e.actor))
    .sort((a, b) => (a.ts - b.ts) || compareIds(a.id, b.id));
  const items = new Map<string, VaultItem>();
  const firstSeen = new Map<string, { at: number; by: string }>();
  for (const ev of ordered) {
    const id = ev.subject.id;
    if (ev.action === ACTIONS.vaultRemove) {
      items.delete(id);
      continue;
    }
    if (!validateVaultItem(ev.predicate).ok) continue;
    if (!firstSeen.has(id)) firstSeen.set(id, { at: ev.ts, by: ev.actor });
    const first = firstSeen.get(id)!;
    const next = normalizeVaultItem(ev.predicate as unknown as VaultItemInput);
    const prev = items.get(id);
    items.set(id, {
      ...next,
      secretChangedAt: prev && prev.secret === next.secret ? prev.secretChangedAt : ev.ts,
      id,
      createdAt: first.at,
      createdBy: first.by,
      updatedAt: ev.ts,
      updatedBy: ev.actor
    });
  }
  return [...items.values()].sort((a, b) => a.name.localeCompare(b.name) || compareIds(a.id, b.id));
}

/** A member as the key registry knows them: every device they ever registered. */
export type VaultMemberDevices = { userId: string; devices: string[] };

/**
 * Devices that can read the vault's CURRENT epoch (its winning rotate's
 * wraps plus grants) yet belong to no current member. Non-empty ⇒ someone
 * left, or a device of theirs was granted in: the epoch must rotate
 * (PLAN_RIKMA_SHARED_INFO §3.2 — removal makes rotation mandatory).
 */
export function strangerDevices(
  events: Iterable<ConsentEvent>,
  members: VaultMemberDevices[]
): string[] {
  const all = [...events];
  const byEpoch = epochCandidates(all);
  if (byEpoch.size === 0) return [];
  const current = Math.max(...byEpoch.keys());
  const winner = (byEpoch.get(current) ?? [])[0];
  if (!winner) return [];
  const known = new Set(members.flatMap((m) => m.devices));
  return [...coveredDevices(all, winner)].filter((d) => !known.has(d)).sort();
}

/**
 * The ts of the latest rotate made because someone left — the moment the
 * vault stopped being readable by them. Null when that never happened.
 */
export function lastRemovalRotateAt(events: Iterable<ConsentEvent>): number | null {
  let at: number | null = null;
  for (const [, cands] of epochCandidates(events)) {
    const w = cands[0];
    const reason = (w?.predicate as { reason?: string } | undefined)?.reason;
    if (w && reason === 'member.remove' && (at === null || w.ts > at)) at = w.ts;
  }
  return at;
}

/**
 * Secrets a former member could read and that nobody has changed since they
 * left — the "change these passwords" checklist (§3.2: E2E cannot unshare
 * the past, so the UI must say what to rotate by hand).
 */
export function exposedItems(items: VaultItem[], removedAt: number | null): VaultItem[] {
  if (removedAt === null) return [];
  return items.filter((i) => i.secretChangedAt <= removedAt);
}
