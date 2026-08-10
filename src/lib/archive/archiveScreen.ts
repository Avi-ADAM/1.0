/**
 * Flattening the archive query into one readable list
 * (PLAN_OBJECT_ARCHIVAL — phase 3).
 *
 * Five collections, five field vocabularies, one screen. The decisions are
 * joined back onto their targets here so each row can say *why* the object
 * left and what happened to its hours — an archive that only lists names is
 * indistinguishable from a delete log.
 */

import type { ArchTargetKind, ArchHoursOutcome } from './decisionView.js';

export interface ArchiveEntry {
  key: string;
  targetKind: ArchTargetKind;
  targetId: string;
  name: string;
  descrip: string | null;
  ownerName: string | null;
  lifecycle: 'archived' | 'released';
  at: string | null;
  /** From the matured decision round. */
  why: string | null;
  hoursOutcome: ArchHoursOutcome | null;
  hoursCredited: number | null;
  endsMembership: boolean;
  decisionId: string | null;
}

/** Decision relation name per target kind — mirrors the Strapi schema. */
const TARGET_FIELD: Record<ArchTargetKind, string> = {
  openMission: 'archOpenMission',
  missionInProgress: 'archMesimabetahalich',
  openResource: 'archOpenMashaabim',
  resourceInProgress: 'archMashabetahalich',
  matanot: 'archMatanot',
};

/** Which collection on the project feeds each target kind. */
const SOURCES: Array<{ field: string; kind: ArchTargetKind }> = [
  { field: 'open_missions', kind: 'openMission' },
  { field: 'mesimabetahaliches', kind: 'missionInProgress' },
  { field: 'open_mashaabims', kind: 'openResource' },
  { field: 'mashabetahaliches', kind: 'resourceInProgress' },
  { field: 'matanotofs', kind: 'matanot' },
];

function num(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Index the archive decisions by `${targetKind}:${targetId}` so each object
 * can find the decision that removed it. The most recently updated wins: an
 * object can carry more than one decision over its life (an earlier one may
 * have matured into `keep`), and the last is the one that ended it.
 */
function indexDecisions(decisions: any[]): Map<string, any> {
  const byTarget = new Map<string, any>();
  for (const d of decisions) {
    const a = d?.attributes;
    const kind = a?.targetKind as ArchTargetKind;
    if (!kind || !TARGET_FIELD[kind]) continue;
    const targetId = a[TARGET_FIELD[kind]]?.data?.id;
    if (!targetId) continue;
    const key = `${kind}:${targetId}`;
    const prev = byTarget.get(key);
    if (!prev || String(a.updatedAt ?? '') > String(prev.attributes?.updatedAt ?? '')) {
      byTarget.set(key, d);
    }
  }
  return byTarget;
}

/** The round that actually took effect: the highest one. */
function maturedRound(decision: any): any | null {
  const rounds = decision?.attributes?.negoarch ?? [];
  if (!rounds.length) return null;
  return rounds.reduce((best: any, r: any) =>
    Number(r?.ordern ?? 1) >= Number(best?.ordern ?? 1) ? r : best,
  );
}

export function buildArchiveEntries(projectAttrs: any): ArchiveEntry[] {
  if (!projectAttrs) return [];

  const byTarget = indexDecisions(projectAttrs.decisions?.data ?? []);
  const entries: ArchiveEntry[] = [];

  for (const { field, kind } of SOURCES) {
    for (const node of projectAttrs[field]?.data ?? []) {
      const a = node?.attributes ?? {};
      const decision = byTarget.get(`${kind}:${node.id}`) ?? null;
      const round = maturedRound(decision);

      entries.push({
        key: `${kind}-${node.id}`,
        targetKind: kind,
        targetId: String(node.id),
        name: a.name ?? '',
        descrip: a.descrip ?? a.desc ?? null,
        ownerName: a.users_permissions_user?.data?.attributes?.username ?? null,
        lifecycle: a.lifecycle === 'released' ? 'released' : 'archived',
        // `archiveEffectiveFrom` is set for a scheduled end-of-cycle close, and
        // is the honest date in that case.
        at: a.archiveEffectiveFrom ?? a.updatedAt ?? null,
        why: round?.why ?? decision?.attributes?.archWhy ?? null,
        hoursOutcome: (round?.hoursOutcome ?? null) as ArchHoursOutcome | null,
        hoursCredited:
          round?.hoursOutcome === 'credit' ? num(round?.hoursToCredit) : null,
        endsMembership: !!decision?.attributes?.archEndsMembership,
        decisionId: decision?.id ? String(decision.id) : null,
      });
    }
  }

  // Newest first, so the archive reads as a history rather than a heap.
  return entries.sort((x, y) => String(y.at ?? '').localeCompare(String(x.at ?? '')));
}
