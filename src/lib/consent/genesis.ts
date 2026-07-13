// T6 — Genesis snapshot: migrating an EXISTING project from Strapi into its
// Space (HANDOFF_DISTRIBUTED_DB T6, PLAN_serverless_p2p_data §11).
//
// The genesis is a `snapshot.commit` event with NO parents (a DAG root) whose
// predicate carries the exported present-state inline — the same predicate
// shape and restore path as T10 compaction snapshots. Two deliberate
// differences from T10:
//
//   - `upTo` is the sentinel 'genesis' and `heads` is [] — there is no
//     covered history. We migrate the present, never the past (§11: "אין
//     צורך להמיר את ההיסטוריה לאירועים — רק את ההווה").
//   - the snapshotCommit reducer APPLIES the inline state (merge semantics,
//     see reducers/snapshotCommit.ts) — this is the single place imported
//     state enters the projection, so migrated members/balances participate
//     in every replay and every future stateRoot, deterministically for any
//     arrival order.
//
// Consent: publishing the commit is the proposer's attestation. Every other
// member verifies (inline-state ↔ root integrity here; comparison against a
// fresh Strapi export is the human-facing advisory) and signs
// `snapshot.vote`. Maturity rides the same stageVotes/rounds machinery as
// T10 (isSnapshotMatured). The projection applies genesis immediately — in
// the shadow phase the display source is still GraphQL, and the §11 rule
// ("פרויקט שלא כל חבריו חתמו נשאר ב-Strapi") governs the exit from shadow,
// not the replay.

import type { ProjectState } from './projection';
import { emptyState } from './projection';
import { normalizeState, computeStateRoot, STATE_ROOT_VERSION } from './stateRoot';
import { restoreState } from './stateRestore';
import type { SnapshotPredicate } from '$lib/space/compaction';

/** Sentinel `upTo` marking a snapshot.commit as a genesis (no covered history). */
export const GENESIS_UP_TO = 'genesis';

/** One member row of the Strapi export (see /api/consent/genesis/[projectId]). */
export type GenesisMemberRow = {
  id: string | number;
  /** hervachti in shekels as Strapi stores it (float, nullable). */
  hervachti?: number | null;
};

/**
 * Pure: Strapi export rows → the opening ProjectState. Balances follow the
 * exact convention the T2 shadow panel compares by: shekels float × 100,
 * rounded, as bigint agorot. Deterministic for a given export.
 */
export function buildGenesisState(
  projectId: string,
  members: GenesisMemberRow[]
): ProjectState {
  const state = emptyState(projectId);
  for (const m of members) {
    const id = String(m.id);
    state.members.add(id);
    if (typeof m.hervachti === 'number' && Number.isFinite(m.hervachti)) {
      state.balances.set(id, BigInt(Math.round(m.hervachti * 100)));
    }
  }
  return state;
}

/**
 * The genesis predicate — byte-identical for two proposers holding the same
 * export (up to the signing envelope), like buildSnapshotPredicate.
 */
export async function buildGenesisPredicate(state: ProjectState): Promise<SnapshotPredicate> {
  return {
    upTo: GENESIS_UP_TO,
    heads: [],
    stateRoot: await computeStateRoot(state),
    stateV: STATE_ROOT_VERSION,
    state: JSON.parse(JSON.stringify(normalizeState(state))) as unknown
  };
}

export type GenesisVerifyResult =
  | { ok: true; state: ProjectState; reason?: undefined }
  | { ok: false; reason: string; state?: undefined };

/**
 * A member's integrity check before voting: is this really a genesis, does
 * its inline state restore, and does it hash to the signed root? (The T10
 * verifySnapshotAgainstLocal replays covered history — a genesis covers
 * none, so integrity + the human-facing export comparison replace it.)
 */
export async function verifyGenesisPredicate(
  predicate: SnapshotPredicate
): Promise<GenesisVerifyResult> {
  if (predicate.upTo !== GENESIS_UP_TO || (predicate.heads?.length ?? 0) !== 0) {
    return { ok: false, reason: 'not_a_genesis_snapshot' };
  }
  if (predicate.stateV !== STATE_ROOT_VERSION) {
    return { ok: false, reason: `state_version_mismatch:${predicate.stateV}` };
  }
  const restored = restoreState(predicate.state);
  if (!restored.ok) return { ok: false, reason: `restore_failed:${restored.reason}` };
  const root = await computeStateRoot(restored.state);
  if (root !== predicate.stateRoot) {
    return { ok: false, reason: 'inline_state_does_not_match_root' };
  }
  return { ok: true, state: restored.state };
}

/**
 * Advisory comparison of a signed genesis state against a FRESH export —
 * human-readable mismatch lines (empty = exact match). Balances legitimately
 * drift between proposal and vote (a sale in between); the voter sees the
 * drift and decides. This is consent, not a machine gate.
 */
export function diffGenesisAgainstExport(
  genesisState: ProjectState,
  fresh: GenesisMemberRow[]
): string[] {
  const diffs: string[] = [];
  const freshIds = new Set(fresh.map((m) => String(m.id)));
  for (const m of genesisState.members) {
    if (!freshIds.has(m)) diffs.push(`member ${m}: signed but not in current export`);
  }
  for (const row of fresh) {
    const id = String(row.id);
    if (!genesisState.members.has(id)) {
      diffs.push(`member ${id}: in current export but not signed`);
      continue;
    }
    const signed = genesisState.balances.get(id) ?? 0n;
    const current =
      typeof row.hervachti === 'number' && Number.isFinite(row.hervachti)
        ? BigInt(Math.round(row.hervachti * 100))
        : 0n;
    if (signed !== current) {
      diffs.push(`balance ${id}: signed=${signed} current=${current} (agorot)`);
    }
  }
  return diffs;
}
