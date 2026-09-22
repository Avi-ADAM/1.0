/**
 * headcount — "how many people does this open mission still need?"
 * (docs/PLAN_SHIFTS.md §2).
 *
 * `OpenMission.howMeny` has been in the schema — and written by the pendm
 * finalizer — since long before anything read it. Both acceptance finalizers
 * archived the OpenMission and every sibling Ask after the *first* acceptance,
 * so a mission created for five people closed on one and the other four
 * candidates had their standing request archived without a word. This module
 * is the single answer to "is it full yet?", so the finalizers, the cards and
 * the open board can never disagree about it.
 *
 * Three rules carry the module:
 *
 *  1. **Filled is derived, never stored.** What is stored is the set of
 *     missions-in-progress hanging off the OpenMission; "full" is computed.
 *     There is no `filled` column to drift out of sync.
 *  2. **NULL lifecycle means legacy means active.** Every pre-archival row has
 *     `lifecycle: null`, and a bare `!== 'archived'` test in SQL drops NULLs —
 *     which would report every historical mission as unstaffed and reopen
 *     recruitment across the whole platform (PLAN_OBJECT_ARCHIVAL).
 *  3. **Over-filling is a state, not an error.** Two approvers racing on the
 *     last slot both win; nobody is thrown out of a mission they were told
 *     they had joined. `overfilled` is surfaced so the UI can say so plainly
 *     (PLAN_SHIFTS §2.3).
 *
 * Pure: the caller fetches (qid `327getOpenMissionHeadcount`) and passes the
 * attributes in, so this stays unit-testable and usable from both finalizers.
 */

/** A Strapi relation payload, or an already-unwrapped array. */
type RelationLike<T> = { data?: T[] | null } | T[] | null | undefined;

interface EntityLike<A> {
  id?: string | number | null;
  attributes?: A | null;
}

export interface MissionInProgressLike {
  lifecycle?: string | null;
  finnished?: boolean | null;
}

export interface AskLike {
  archived?: boolean | null;
}

export interface OpenMissionHeadcountLike {
  howMeny?: number | string | bigint | null;
  archived?: boolean | null;
  mesimabetahaliches?: RelationLike<EntityLike<MissionInProgressLike>>;
  asks?: RelationLike<EntityLike<AskLike>>;
}

export interface HeadcountView {
  /** How many people the mission asked for. `howMeny` unset ⇒ 1. */
  need: number;
  /** Missions-in-progress still standing on this OpenMission. */
  filled: number;
  /** Seats still to fill. Never negative — see `overfilled`. */
  remaining: number;
  /** No seat left. The OpenMission may be archived. */
  isFull: boolean;
  /** More people joined than were asked for (a race, §2.3). Not an error. */
  overfilled: boolean;
  /** Candidacies still on the table (un-archived Asks). */
  candidates: number;
  /** Seats with nobody even applying for them — what recruitment must close. */
  shortfall: number;
}

/** Lifecycle values that mean "this person is still on the mission". */
const ACTIVE_LIFECYCLES = new Set(['active', 'archiveProposed']);

function rows<T>(rel: RelationLike<EntityLike<T>>): EntityLike<T>[] {
  if (rel == null) return [];
  if (Array.isArray(rel)) return rel;
  const data = (rel as { data?: EntityLike<T>[] | null }).data;
  return Array.isArray(data) ? data : [];
}

/** Read an entity's attributes whether or not the caller already unwrapped them. */
function attrs<T>(row: EntityLike<T> | T): T {
  const wrapped = (row as EntityLike<T>)?.attributes;
  return (wrapped ?? row ?? {}) as T;
}

/**
 * `howMeny` is a Strapi `biginteger`, which arrives over GraphQL as a string
 * (and, through some clients, as a BigInt). Anything unparseable, zero or
 * negative means "one person" — a mission always needs at least one.
 */
export function normalizeNeed(howMeny: number | string | bigint | null | undefined): number {
  if (howMeny == null) return 1;
  const n = typeof howMeny === 'bigint' ? Number(howMeny) : Number(howMeny);
  if (!Number.isFinite(n)) return 1;
  const floored = Math.floor(n);
  return floored > 0 ? floored : 1;
}

/**
 * Is this mission-in-progress still holding a seat?
 *
 * `archiveProposed` counts: the archival has only been *proposed*, and
 * recruiting a replacement before the rikma has agreed to the removal would
 * pre-empt a decision that is still open.
 */
export function holdsSeat(mission: MissionInProgressLike): boolean {
  if (mission?.finnished === true) return false;
  const lifecycle = mission?.lifecycle;
  if (lifecycle == null) return true; // legacy row — active
  return ACTIVE_LIFECYCLES.has(String(lifecycle));
}

export function computeHeadcount(openMission: OpenMissionHeadcountLike | null | undefined): HeadcountView {
  const om = openMission ?? {};
  const need = normalizeNeed(om.howMeny);

  const filled = rows(om.mesimabetahaliches).filter((row) =>
    holdsSeat(attrs<MissionInProgressLike>(row))
  ).length;

  const candidates = rows(om.asks).filter(
    (row) => attrs<AskLike>(row)?.archived !== true
  ).length;

  const remaining = Math.max(0, need - filled);

  return {
    need,
    filled,
    remaining,
    isFull: remaining === 0,
    overfilled: filled > need,
    candidates,
    shortfall: Math.max(0, remaining - candidates)
  };
}

/**
 * The question the two finalizers ask: this acceptance is about to add one
 * person — does the OpenMission close now?
 *
 * Returns the whole decision rather than a boolean, because the sibling Asks
 * and the OpenMission must always be archived *together*. Archiving the
 * mission while leaving candidacies open would strand them on a listing nobody
 * can reach; archiving the candidacies while leaving the mission open would
 * advertise a seat with no way to apply for it.
 */
export interface AcceptanceEffect {
  /** Seats filled once this acceptance lands. */
  filledAfter: number;
  /** Close the OpenMission (and, with it, the losing candidacies)? */
  archiveOpenMission: boolean;
  /** Archive the other candidates' Asks? Always tracks `archiveOpenMission`. */
  archiveSiblingAsks: boolean;
  /** Seats still open after this acceptance — for the notification copy. */
  remainingAfter: number;
  /** The pre-acceptance view, for callers that want to explain themselves. */
  before: HeadcountView;
}

export function effectOfAcceptance(
  openMission: OpenMissionHeadcountLike | null | undefined,
  options: { enabled?: boolean } = {}
): AcceptanceEffect {
  const before = computeHeadcount(openMission);
  const filledAfter = before.filled + 1;

  // The escape hatch (`MISSION_HEADCOUNT=off`): behave exactly as the code did
  // before this module existed — every acceptance closes the mission.
  const enabled = options.enabled !== false;
  const archive = enabled ? filledAfter >= before.need : true;

  return {
    filledAfter,
    archiveOpenMission: archive,
    archiveSiblingAsks: archive,
    remainingAfter: Math.max(0, before.need - filledAfter),
    before
  };
}
