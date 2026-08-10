/**
 * Reading an open archive/edit Decision back (PLAN_OBJECT_ARCHIVAL — phase 2).
 *
 * The rounds live in `negoarch` and each carries its own `ordern`, so "the
 * version on the table" is the highest round — not the newest row and not the
 * original proposal. Everything downstream (who may still sign, what a counter
 * is countering, what matures on silence) is derived from that one idea, so it
 * is computed here once instead of in each caller.
 */

import { gqlStr, run, type Exec } from './gql.js';
import { TARGET_META, type TargetKind } from './targets.js';
import type { ArchiveScope, HoursOutcome, RoundMode, StandingRound } from './apply.js';
import type { ArchiveSource, DecisionKind } from './decision.js';

export interface ArchRound extends StandingRound {
  ordern: number;
  proposedById: string | null;
  zman: string | null;
}

export interface ArchVote {
  userId: string;
  order: number;
  what: boolean;
  zman?: string | null;
  why?: string | null;
}

export interface ObjectChangeDecision {
  id: string;
  kind: DecisionKind;
  archived: boolean;
  decisionName: string;
  targetKind: TargetKind;
  targetId: string;
  targetName: string;
  scope: ArchiveScope;
  source: ArchiveSource;
  why: string | null;
  endsMembership: boolean;
  memberId: string | null;
  projectId: string | null;
  projectRestime: string | null;
  memberIds: string[];
  rounds: ArchRound[];
  vots: ArchVote[];
  timegramaId: string | null;
  timegramaDate: string | null;
}

const TARGET_FRAGMENT = Object.entries(TARGET_META)
  .map(([, meta]) => `${meta.decisionField} { data { id attributes { name } } }`)
  .join('\n          ');

function num(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Load a Decision of kind archiveObject/editObject, normalized. */
export async function fetchObjectChangeDecision(
  exec: Exec,
  decisionId: string,
): Promise<ObjectChangeDecision | null> {
  const data = await run(
    exec,
    `{ decision(id: ${gqlStr(decisionId)}) { data { id attributes {
      kind archived decisionName targetKind archScope archSource archWhy
      archEndsMembership
      archMember { data { id } }
      vots { what order zman why users_permissions_user { data { id } } }
      negoarch {
        ordern mode why zman name descrip hm price kindOf
        sqadualed sqadualedf hoursOutcome hoursToCredit effectiveFrom
        proposedBy { data { id } }
        transferTo { data { id } }
      }
      timegrama { data { id attributes { date done } } }
      projects { data { id attributes { restime user_1s { data { id } } } } }
      ${TARGET_FRAGMENT}
    } } } }`,
    'fetchDecision',
  );

  const node = data?.decision?.data;
  if (!node) return null;
  const a = node.attributes ?? {};

  const kind = a.kind as DecisionKind;
  if (kind !== 'archiveObject' && kind !== 'editObject') return null;

  // Exactly one of the five target relations is populated; `targetKind` says
  // which, and the relation itself carries the display name.
  const targetKind = a.targetKind as TargetKind;
  const targetNode = targetKind ? a[TARGET_META[targetKind]?.decisionField]?.data : null;

  const project = a.projects?.data?.[0];

  return {
    id: String(node.id),
    kind,
    archived: !!a.archived,
    decisionName: a.decisionName ?? '',
    targetKind,
    targetId: targetNode?.id ? String(targetNode.id) : '',
    targetName: targetNode?.attributes?.name ?? '',
    scope: (a.archScope ?? 'archive') as ArchiveScope,
    source: (a.archSource ?? 'user') as ArchiveSource,
    why: a.archWhy ?? null,
    endsMembership: !!a.archEndsMembership,
    memberId: a.archMember?.data?.id ? String(a.archMember.data.id) : null,
    projectId: project?.id ? String(project.id) : null,
    projectRestime: project?.attributes?.restime ?? null,
    memberIds: (project?.attributes?.user_1s?.data ?? []).map((u: any) => String(u.id)),
    rounds: (a.negoarch ?? []).map(
      (r: any): ArchRound => ({
        ordern: Number(r.ordern ?? 1),
        mode: (r.mode ?? 'archive') as RoundMode,
        why: r.why ?? null,
        name: r.name ?? null,
        descrip: r.descrip ?? null,
        hm: num(r.hm),
        price: num(r.price),
        kindOf: r.kindOf ?? null,
        sqadualed: r.sqadualed ?? null,
        sqadualedf: r.sqadualedf ?? null,
        hoursOutcome: (r.hoursOutcome ?? null) as HoursOutcome | null,
        hoursToCredit: num(r.hoursToCredit),
        transferToId: r.transferTo?.data?.id ? String(r.transferTo.data.id) : null,
        effectiveFrom: r.effectiveFrom ?? null,
        proposedById: r.proposedBy?.data?.id ? String(r.proposedBy.data.id) : null,
        zman: r.zman ?? null,
      }),
    ),
    vots: (a.vots ?? []).map(
      (v: any): ArchVote => ({
        userId: String(v.users_permissions_user?.data?.id ?? ''),
        order: Number(v.order ?? 1),
        what: v.what !== false,
        zman: v.zman ?? null,
        why: v.why ?? null,
      }),
    ),
    timegramaId: a.timegrama?.data?.id ? String(a.timegrama.data.id) : null,
    timegramaDate: a.timegrama?.data?.attributes?.date ?? null,
  };
}

/** The round currently on the table: the highest `ordern`, or 1 if empty. */
export function standingOrder(decision: ObjectChangeDecision): number {
  return decision.rounds.reduce((max, r) => Math.max(max, r.ordern), 1);
}

/** The version being decided on right now. */
export function standingRound(decision: ObjectChangeDecision): ArchRound {
  const order = standingOrder(decision);
  const round = decision.rounds.find((r) => r.ordern === order);
  // A Decision with no rounds at all should not exist, but never crash the
  // maturation over it — fall back to the plainest possible reading.
  return (
    round ?? {
      ordern: order,
      mode: decision.kind === 'editObject' ? 'keep' : 'archive',
      hoursOutcome: 'waive',
      proposedById: null,
      zman: null,
    }
  );
}

/** Members who have signed the standing round. */
export function signersOf(decision: ObjectChangeDecision, order: number): string[] {
  return Array.from(
    new Set(
      decision.vots
        .filter((v) => v.what && Number(v.order) === order)
        .map((v) => v.userId),
    ),
  );
}

/**
 * Unanimity on the standing round — the same bar the creation flow uses.
 * Silence maturation is the other route, and it lives in the timegrama handler.
 */
export function hasConsensus(decision: ObjectChangeDecision, order: number): boolean {
  if (decision.memberIds.length === 0) return false;
  const signed = new Set(signersOf(decision, order));
  return decision.memberIds.every((id) => signed.has(id));
}

/** Whether this member still owes an answer on the standing round. */
export function isMyTurn(
  decision: ObjectChangeDecision,
  order: number,
  userId: string,
): boolean {
  return decision.memberIds.includes(String(userId)) && !signersOf(decision, order).includes(String(userId));
}
