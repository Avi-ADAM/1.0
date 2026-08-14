/**
 * Turning a raw archive/edit Decision into what the card needs to show
 * (PLAN_OBJECT_ARCHIVAL — phase 2).
 *
 * Pure and shared: the lev extractor calls it, and the tests exercise it
 * directly. It answers three questions the card is built around:
 *   - which version is on the table (the highest round, not the newest row),
 *   - is it my turn (am I a member who has not signed that round),
 *   - and what does approving actually cost — hours, and possibly someone's
 *     membership of the rikma.
 */

export type ArchTargetKind =
  | 'openMission'
  | 'missionInProgress'
  | 'openResource'
  | 'resourceInProgress'
  | 'matanot';

export type ArchMode = 'archive' | 'keep';
export type ArchHoursOutcome = 'credit' | 'waive' | 'transfer' | 'endOfCycle';

/** Decision relation name per target kind — mirrors the Strapi schema. */
const TARGET_FIELD: Record<ArchTargetKind, string> = {
  openMission: 'archOpenMission',
  missionInProgress: 'archMesimabetahalich',
  openResource: 'archOpenMashaabim',
  resourceInProgress: 'archMashabetahalich',
  matanot: 'archMatanot',
};

export interface ArchVersion {
  name: string | null;
  descrip: string | null;
  hm: number | null;
  price: number | null;
  kindOf: string | null;
  sqadualed: string | null;
  sqadualedf: string | null;
}

export interface ArchRoundView extends ArchVersion {
  ordern: number;
  mode: ArchMode;
  why: string | null;
  hoursOutcome: ArchHoursOutcome | null;
  hoursToCredit: number | null;
  transferToName: string | null;
  effectiveFrom: string | null;
  proposedById: string | null;
  proposedByName: string | null;
  zman: string | null;
}

export interface ArchiveDecisionView {
  decisionId: string;
  kind: 'archiveObject' | 'editObject';
  targetKind: ArchTargetKind;
  targetId: string;
  targetName: string;
  scope: 'archive' | 'release';
  source: 'user' | 'dormancy';
  why: string | null;
  /** Approving also ends this member's membership of the rikma. */
  endsMembership: boolean;
  memberId: string | null;
  memberName: string | null;
  /** Who carries the commitment (in-progress objects). */
  ownerId: string | null;
  ownerName: string | null;
  ownerPic: string | null;
  /** Accrued value, which is what makes the settlement block appear. */
  accruedHours: number;
  perhour: number | null;
  standingOrder: number;
  standing: ArchRoundView;
  /** Round 1 — shown next to the standing version as the reference. */
  original: ArchRoundView | null;
  rounds: ArchRoundView[];
  signedIds: string[];
  awaitingIds: string[];
  myTurn: boolean;
  memberCount: number;
}

function num(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function roundOf(raw: any): ArchRoundView {
  return {
    ordern: Number(raw?.ordern ?? 1),
    mode: (raw?.mode ?? 'archive') as ArchMode,
    why: raw?.why ?? null,
    name: raw?.name ?? null,
    descrip: raw?.descrip ?? null,
    hm: num(raw?.hm),
    price: num(raw?.price),
    kindOf: raw?.kindOf ?? null,
    sqadualed: raw?.sqadualed ?? null,
    sqadualedf: raw?.sqadualedf ?? null,
    hoursOutcome: (raw?.hoursOutcome ?? null) as ArchHoursOutcome | null,
    hoursToCredit: num(raw?.hoursToCredit),
    transferToName: raw?.transferTo?.data?.attributes?.name ?? null,
    effectiveFrom: raw?.effectiveFrom ?? null,
    proposedById: raw?.proposedBy?.data?.id ? String(raw.proposedBy.data.id) : null,
    proposedByName: raw?.proposedBy?.data?.attributes?.username ?? null,
    zman: raw?.zman ?? null,
  };
}

/**
 * Build the view, or return null when the Decision is not an archive/edit one
 * or is too malformed to act on (no target). Never throws — it runs inside the
 * lev extractor, where one bad row must not take down every other card.
 */
export function buildArchiveDecisionView(
  decision: any,
  memberIds: string[],
  myId: string,
): ArchiveDecisionView | null {
  const a = decision?.attributes;
  const kind = a?.kind;
  if (kind !== 'archiveObject' && kind !== 'editObject') return null;

  const targetKind = a.targetKind as ArchTargetKind;
  if (!targetKind || !TARGET_FIELD[targetKind]) return null;

  const targetNode = a[TARGET_FIELD[targetKind]]?.data;
  if (!targetNode?.id) return null;
  const ta = targetNode.attributes ?? {};

  const rounds = (a.negoarch ?? []).map(roundOf).sort((x: ArchRoundView, y: ArchRoundView) => x.ordern - y.ordern);
  const standingOrder = rounds.length ? rounds[rounds.length - 1].ordern : 1;
  const standing =
    rounds.find((r: ArchRoundView) => r.ordern === standingOrder) ??
    roundOf({ ordern: 1, mode: kind === 'editObject' ? 'keep' : 'archive' });
  const original = rounds.find((r: ArchRoundView) => r.ordern === 1) ?? null;

  // Signatures are per round: standing behind round 1 says nothing about
  // round 2, which is exactly what makes a counter a real question.
  const signedIds = Array.from(
    new Set(
      (a.vots ?? [])
        .filter((v: any) => v.what !== false && Number(v.order ?? 1) === standingOrder)
        .map((v: any) => String(v.users_permissions_user?.data?.id ?? '')),
    ),
  ).filter(Boolean) as string[];

  const owner = ta.users_permissions_user?.data;

  return {
    decisionId: String(decision.id),
    kind,
    targetKind,
    targetId: String(targetNode.id),
    targetName: ta.name ?? '',
    scope: (a.archScope ?? 'archive') as 'archive' | 'release',
    source: (a.archSource ?? 'user') as 'user' | 'dormancy',
    why: a.archWhy ?? null,
    endsMembership: !!a.archEndsMembership,
    memberId: a.archMember?.data?.id ? String(a.archMember.data.id) : null,
    memberName: a.archMember?.data?.attributes?.username ?? null,
    ownerId: owner?.id ? String(owner.id) : null,
    ownerName: owner?.attributes?.username ?? null,
    ownerPic: owner?.attributes?.profilePic?.data?.attributes?.url ?? null,
    accruedHours: num(ta.howmanyhoursalready) ?? 0,
    perhour: num(ta.perhour ?? ta.pricePerUnit ?? ta.price),
    standingOrder,
    standing,
    original,
    rounds,
    signedIds,
    awaitingIds: memberIds.filter((id) => !signedIds.includes(id)),
    myTurn: memberIds.includes(String(myId)) && !signedIds.includes(String(myId)),
    memberCount: memberIds.length,
  };
}

/**
 * The values a counter should start from: the standing version where it has
 * an opinion, the object's own current values where it does not. Without this
 * the negotiation drawer would open on empty fields and a member "keeping" an
 * object would wipe its terms by accident.
 */
export function counterDefaults(view: ArchiveDecisionView, target: Partial<ArchVersion> = {}): ArchVersion {
  const s = view.standing;
  return {
    name: s.name ?? target.name ?? view.targetName ?? null,
    descrip: s.descrip ?? target.descrip ?? null,
    hm: s.hm ?? target.hm ?? null,
    price: s.price ?? target.price ?? view.perhour ?? null,
    kindOf: s.kindOf ?? target.kindOf ?? null,
    sqadualed: s.sqadualed ?? target.sqadualed ?? null,
    sqadualedf: s.sqadualedf ?? target.sqadualedf ?? null,
  };
}
