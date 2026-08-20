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

/** The fields a round can move, in the order the card lists them. */
export const TERM_FIELDS = [
  'name',
  'hm',
  'price',
  'sqadualed',
  'sqadualedf',
  'kindOf',
  'descrip',
] as const;

export type ArchTermField = (typeof TERM_FIELDS)[number];

const NUMERIC_FIELDS: readonly ArchTermField[] = ['hm', 'price'];
const DATE_FIELDS: readonly ArchTermField[] = ['sqadualed', 'sqadualedf'];

/**
 * One line of the card's terms table: what the object is today, and what the
 * standing round proposes it becomes. The vote is about the difference, so
 * `from` is never optional — a card that shows only `to` asks people to sign a
 * number they cannot place.
 */
export interface ArchTermRow {
  field: ArchTermField;
  /** The object's own live value. */
  from: string | number | null;
  /** The standing round's value — null when the round leaves this field alone. */
  to: string | number | null;
  changed: boolean;
  /** Signed difference, numeric fields only and only when both sides exist. */
  delta: number | null;
  isNumeric: boolean;
  isDate: boolean;
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
  /**
   * The object's values as they stand right now, normalised across the five
   * collections. This is what the standing round is compared against.
   */
  current: ArchVersion;
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
    current: currentOf(targetKind, ta),
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
  const c = view.current ?? ({} as ArchVersion);
  return {
    name: s.name ?? target.name ?? c.name ?? view.targetName ?? null,
    descrip: s.descrip ?? target.descrip ?? c.descrip ?? null,
    hm: s.hm ?? target.hm ?? c.hm ?? null,
    price: s.price ?? target.price ?? c.price ?? view.perhour ?? null,
    kindOf: s.kindOf ?? target.kindOf ?? c.kindOf ?? null,
    sqadualed: s.sqadualed ?? target.sqadualed ?? c.sqadualed ?? null,
    sqadualedf: s.sqadualedf ?? target.sqadualedf ?? c.sqadualedf ?? null,
  };
}

/**
 * The object's live values, normalised. Each collection spells the same three
 * ideas differently (`noofhours` / `hoursassinged` / `hm` / `quantityAssigned`
 * / `quant`), and this is the read-side mirror of `editFragment` in
 * `src/lib/server/archive/apply.ts` — the two must be changed together, or the
 * card would compare the proposal against a field the apply step never writes.
 */
function currentOf(kind: ArchTargetKind, ta: any): ArchVersion {
  const name = ta?.name ?? null;
  const descrip = typeof ta?.descrip === 'string' ? ta.descrip : null;
  switch (kind) {
    case 'openMission':
      return {
        name,
        descrip,
        hm: num(ta?.noofhours),
        price: num(ta?.perhour),
        kindOf: null,
        sqadualed: ta?.sqadualed ?? null,
        sqadualedf: ta?.dates ?? null,
      };
    case 'missionInProgress':
      return {
        name,
        descrip,
        hm: num(ta?.hoursassinged),
        price: num(ta?.perhour),
        kindOf: null,
        sqadualed: ta?.start ?? null,
        sqadualedf: ta?.dates ?? null,
      };
    case 'openResource':
      return {
        name,
        descrip,
        hm: num(ta?.hm),
        price: num(ta?.price),
        kindOf: ta?.kindOf ?? null,
        sqadualed: ta?.sqadualed ?? null,
        sqadualedf: ta?.sqadualedf ?? null,
      };
    case 'resourceInProgress':
      return {
        name,
        descrip,
        hm: num(ta?.quantityAssigned),
        price: num(ta?.pricePerUnit),
        kindOf: ta?.kindOf ?? null,
        sqadualed: ta?.start ?? null,
        sqadualedf: ta?.end ?? null,
      };
    case 'matanot':
      // `desc` is a JSON field on matanot; only a plain string is comparable.
      return {
        name,
        descrip: typeof ta?.desc === 'string' ? ta.desc : null,
        hm: num(ta?.quant),
        price: num(ta?.price),
        kindOf: ta?.kindOf ?? null,
        sqadualed: ta?.startDate ?? null,
        sqadualedf: ta?.finnishDate ?? null,
      };
  }
}

/** Same calendar day, whatever precision either side was stored with. */
function sameDay(a: unknown, b: unknown): boolean {
  const da = new Date(String(a));
  const db = new Date(String(b));
  if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) return String(a) === String(b);
  return da.toISOString().slice(0, 10) === db.toISOString().slice(0, 10);
}

/**
 * The terms table the card votes on: every field that either side has a value
 * for, current beside proposed. A round leaves most fields null — that is not
 * "clear it", it is "no opinion" — so an untouched field shows its current
 * value alone rather than a change to nothing.
 */
export function buildTermRows(view: ArchiveDecisionView | null | undefined): ArchTermRow[] {
  if (!view) return [];
  const current = view.current ?? ({} as ArchVersion);
  const standing = view.standing ?? ({} as ArchRoundView);
  // An 'archive' round carries settlement terms, not object values; anything
  // sitting in its value fields is leftover, and comparing against it would
  // invent changes nobody proposed.
  const proposes = standing.mode === 'keep';

  const rows: ArchTermRow[] = [];
  for (const field of TERM_FIELDS) {
    const isNumeric = NUMERIC_FIELDS.includes(field);
    const isDate = DATE_FIELDS.includes(field);
    const from = current?.[field] ?? null;
    const raw = proposes ? standing?.[field] ?? null : null;
    const to = raw === '' ? null : raw;
    if (from == null && to == null) continue;

    const changed =
      to != null &&
      from != null &&
      (isNumeric
        ? Number(from) !== Number(to)
        : isDate
          ? !sameDay(from, to)
          : String(from) !== String(to));
    // A field the object never had, that the round now sets, is also a change.
    const added = to != null && from == null;

    rows.push({
      field,
      from,
      to,
      changed: changed || added,
      delta:
        isNumeric && to != null && from != null ? Number(to) - Number(from) : null,
      isNumeric,
      isDate,
    });
  }
  return rows;
}

/** Only the lines that actually move — what the vote is really about. */
export function standingChanges(view: ArchiveDecisionView | null | undefined): ArchTermRow[] {
  return buildTermRows(view).filter((r) => r.changed);
}
