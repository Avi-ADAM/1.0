// T6 — client flow for the genesis migration: export → propose → verify →
// vote (HANDOFF_DISTRIBUTED_DB T6). Browser-side glue over the pure layer in
// $lib/consent/genesis.ts; the replica does the signing and shipping.

import type { SpaceReplica } from './spaceStore.svelte';
import type { ProjectState } from '$lib/consent/projection';
import { subjectKey } from '$lib/consent/projection';
import {
  GENESIS_UP_TO,
  buildGenesisState,
  buildGenesisPredicate,
  verifyGenesisPredicate,
  diffGenesisAgainstExport,
  type GenesisMemberRow
} from '$lib/consent/genesis';
import { isSnapshotMatured, type SnapshotPredicate } from './compaction';

export type GenesisExport =
  | { ok: true; members: GenesisMemberRow[]; projectName?: string | null; reason?: undefined }
  | { ok: false; reason: string; members?: undefined };

export async function fetchGenesisExport(projectId: string): Promise<GenesisExport> {
  try {
    const res = await fetch(`/api/consent/genesis/${projectId}`, { credentials: 'include' });
    if (!res.ok) return { ok: false, reason: `http_${res.status}` };
    const body = await res.json();
    return { ok: true, members: body.members ?? [], projectName: body.projectName };
  } catch (e) {
    return { ok: false, reason: 'network_' + (e as Error).message };
  }
}

/**
 * Propose the genesis: fetch the export, sign a parentless snapshot.commit
 * carrying it, and cast the proposer's own snapshot.vote (proposing IS
 * agreeing — the commit alone doesn't enter the stage tally).
 */
export async function proposeGenesis(
  replica: SpaceReplica,
  userId: string,
  projectId: string
): Promise<{ ok: boolean; eventId?: string; reason?: string }> {
  const exp = await fetchGenesisExport(projectId);
  if (!exp.ok) return { ok: false, reason: 'export:' + exp.reason };
  if (exp.members.length === 0) return { ok: false, reason: 'export_has_no_members' };

  const state = buildGenesisState(projectId, exp.members);
  const predicate = await buildGenesisPredicate(state);

  const res = await replica.publish(userId, {
    action: 'snapshot.commit',
    subject: { type: 'project', id: projectId },
    predicate: predicate as unknown as Record<string, unknown>,
    parents: [] // a genesis is a DAG root by definition
  });
  if (!res.ok) return { ok: false, eventId: res.event.id, reason: res.reason };

  const vote = await voteGenesis(replica, userId, res.event.id, true);
  return { ok: vote.ok, eventId: res.event.id, reason: vote.reason };
}

/**
 * Verify-then-vote. The integrity check (inline state ↔ signed root) is a
 * hard gate; the fresh-export diff is returned to the caller as advisory —
 * balances may have legitimately moved since the proposal was signed, and
 * whether that's acceptable is the member's call, not the machine's.
 */
export async function voteGenesis(
  replica: SpaceReplica,
  userId: string,
  genesisEventId: string,
  what: boolean
): Promise<{ ok: boolean; reason?: string; diffs?: string[] }> {
  const ev = replica.state.eventsById.get(genesisEventId);
  if (!ev) return { ok: false, reason: 'genesis_event_not_found' };

  const check = await verifyGenesisPredicate(ev.predicate as unknown as SnapshotPredicate);
  if (!check.ok) return { ok: false, reason: 'verify:' + check.reason };

  let diffs: string[] = [];
  const fresh = await fetchGenesisExport(check.state.projectId ?? '');
  if (fresh.ok) diffs = diffGenesisAgainstExport(check.state, fresh.members);

  const res = await replica.publish(userId, {
    action: 'snapshot.vote',
    subject: { type: 'snapshot', id: genesisEventId },
    predicate: { what, order: 0 }
  });
  return { ok: res.ok, reason: res.reason, diffs };
}

export type GenesisStatus = {
  eventId: string;
  proposedBy: string;
  matured: boolean;
  /** members whose snapshot.vote is a standing YES */
  approvals: string[];
  membersTotal: number;
};

/** The genesis visible in a projection, if any (null = not proposed yet). */
export function genesisStatus(projection: ProjectState): GenesisStatus | null {
  const mark = projection.snapshots.find((s) => s.upTo === GENESIS_UP_TO);
  if (!mark) return null;
  const tally = projection.stageVotes.get(subjectKey('snapshot', mark.eventId));
  const approvals = tally
    ? [...tally.votes.entries()].filter(([, v]) => v.what).map(([k]) => k)
    : [];
  return {
    eventId: mark.eventId,
    proposedBy: mark.by,
    matured: isSnapshotMatured(projection, mark.eventId),
    approvals,
    membersTotal: projection.members.size
  };
}
