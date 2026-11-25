/**
 * Pure scoring logic for match suggestions.
 *
 * The raw score grew out of the legacy lev-page algorithm
 * (extractSuggestions + calculateScore in src/lib/utils/):
 *
 *   raw = matchedRoles + 2·matchedSkills + wwAdjustment
 *         − 2·missingSkills − missingRoles
 *
 * Two departures from it, both because the legacy rule hid a need from exactly
 * the professionals it was written for (2026-10-07: a carpenter and a computer
 * technician never saw the concierge missions "build a wooden table" / "assemble
 * a desktop PC", each scoring −1…−3 from one held skill against one AI-attached
 * role and an onsite work way):
 *
 *  1. A held skill always qualifies. Penalties still order the list, but they
 *     never push a skill match below MIN_SUGGESTION_SCORE. A match on roles
 *     alone keeps the old rule (raw ≥ MIN_SUGGESTION_SCORE), and with neither
 *     a skill nor a role in common nothing qualifies.
 *  2. Work ways are a soft signal: any mismatch costs −1 in total, not −2 per
 *     mission work way.
 *
 * `score` (what is stored, an Int) is the clamped value; `rawScore` is kept
 * for ordering among the clamped ones.
 *
 * The resource side adds one more dimension — `computeDateFit` at the bottom —
 * which the mission scoring above deliberately does not touch.
 */

import { checkAvailability, rangeDays } from '$lib/resources/availability.js';
import type { BookingLike, Range, ResourceLike } from '$lib/resources/types.js';

/** Anything date-shaped → a valid Date, or null. */
function toDate(value: string | Date | null | undefined): Date | null {
  if (value == null || value === '') return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export interface MissionRequirements {
  /** open-mission id */
  id: string;
  workWays: string[];
  skills: string[];
  roles: string[];
}

export interface UserCapabilities {
  workWays: string[];
  skills: string[];
  roles: string[];
}

export interface MatchResult {
  /** Whether this mission should be suggested to this user at all. */
  qualifies: boolean;
  /** Stored score: `rawScore`, lifted to MIN_SUGGESTION_SCORE for a skill match. */
  score: number;
  /** Unclamped score — the tie-breaker among clamped skill matches. */
  rawScore: number;
  matchedSkills: string[];
  matchedRoles: string[];
  matchedWorkWays: string[];
  missingSkills: string[];
  missingRoles: string[];
}

function intersect(a: string[], b: string[]): string[] {
  const set = new Set(b.map(String));
  return a.filter((x) => set.has(String(x)));
}

function difference(a: string[], b: string[]): string[] {
  const set = new Set(b.map(String));
  return a.filter((x) => !set.has(String(x)));
}

/**
 * Work-way adjustment — a rank signal, not a filter:
 *  - user has no work ways → 0
 *  - otherwise             → +matches, and −1 once if any mission work way
 *                            is not among the user's
 */
function workWayAdjustment(missionWW: string[], userWW: string[]): number {
  if (userWW.length === 0) return 0;
  const matches = intersect(missionWW, userWW).length;
  const mismatches = difference(missionWW, userWW).length;
  return matches - (mismatches > 0 ? 1 : 0);
}

/**
 * Score a mission for a user. Returns the score plus the matched/missing ID
 * sets (persisted as `matchedOn` so the UI can explain why it matched).
 *
 * Both engine paths — a new mission fanned out to users, and a user's
 * profile/backfill scan over open missions — call this with an `unheld` set
 * (see `computeUnheld`), so the two can never disagree about a pair.
 */
export function computeMissionMatchScore(
  mission: MissionRequirements,
  user: UserCapabilities,
  /**
   * Requirements nobody in the candidate pool holds. Missing one of those says
   * nothing about this user — everyone misses it — so it is not penalised
   * (QA_CONCIERGE_E2E C-8: four skills the AI had just coined took the one real
   * carpenter from +2 to −6, and the need reached nobody, silently).
   */
  unheld: { skills?: string[]; roles?: string[] } = {}
): MatchResult {
  const matchedRoles = intersect(mission.roles, user.roles);
  const matchedSkills = intersect(mission.skills, user.skills);
  const matchedWorkWays = intersect(mission.workWays, user.workWays);
  const missingSkills = difference(difference(mission.skills, user.skills), unheld.skills ?? []);
  const missingRoles = difference(difference(mission.roles, user.roles), unheld.roles ?? []);

  const rawScore =
    matchedRoles.length +
    2 * matchedSkills.length +
    workWayAdjustment(mission.workWays, user.workWays) -
    2 * missingSkills.length -
    missingRoles.length;

  // Work ways alone never qualify a mission: there must be a skill or a role in common.
  const skillMatch = matchedSkills.length > 0;
  const qualifies = skillMatch || (matchedRoles.length > 0 && rawScore >= MIN_SUGGESTION_SCORE);
  const score = skillMatch ? Math.max(rawScore, MIN_SUGGESTION_SCORE) : rawScore;

  return {
    qualifies,
    score,
    rawScore,
    matchedSkills,
    matchedRoles,
    matchedWorkWays,
    missingSkills,
    missingRoles
  };
}

/** A suggestion is only worth storing (and mailing about) above this. */
export const MIN_SUGGESTION_SCORE = 1;

/**
 * Requirements that nobody in `pool` holds. Missing one of those says nothing
 * about a particular user — everyone misses it — so `computeMissionMatchScore`
 * does not penalise it (QA_CONCIERGE_E2E C-8).
 */
export function computeUnheld(
  required: { skills: string[]; roles: string[] },
  pool: Array<{ skills: string[]; roles: string[] }>
): { skills: string[]; roles: string[] } {
  const heldSkills = new Set(pool.flatMap((u) => u.skills.map(String)));
  const heldRoles = new Set(pool.flatMap((u) => u.roles.map(String)));
  return {
    skills: required.skills.filter((s) => !heldSkills.has(String(s))),
    roles: required.roles.filter((r) => !heldRoles.has(String(r)))
  };
}

/** Qualifying matches first by stored score, then by the unclamped one. */
export function compareMatches(a: MatchResult, b: MatchResult): number {
  return b.score - a.score || b.rawScore - a.rawScore;
}

// ─────────────────────────────────────────────────────────────────────────────
// Date fit — the resource side (docs/inprogress/PLAN_RESOURCE_CALENDAR.md §7)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * How much of a requested window a holder can actually cover.
 *
 * Until this existed, matching had no time dimension at all: a rikma that needs
 * a projector for three days in April was offered one that is rented out until
 * December, and one whose owner stopped offering it two years ago.
 *
 * The scale is deliberately continuous rather than a yes/no. A partial overlap
 * is a real answer — "I have it for half of what you asked" — and the consent
 * model says that becomes a date counter-proposal, not a rejection. Only a
 * genuine zero (no shared day at all) removes the suggestion.
 */
export interface DateFitInput {
  /** The rikma's requested window (`open_mashaabim.sqadualed/sqadualedf`). */
  requestStart?: string | Date | null;
  requestEnd?: string | Date | null;
  /** The holder's offer window (`Sp.sdate/fdate`). */
  offerStart?: string | Date | null;
  offerEnd?: string | Date | null;
  /** Bookings already on the resource, once the ledger exists. */
  bookings?: BookingLike[];
  /** Occupancy model + capacity of the holder's resource. */
  resource?: ResourceLike | null;
  now?: Date;
}

/**
 * `1` = the whole request fits, `0` = nothing does, in between = the fraction
 * that does.
 *
 * Every missing input resolves to `1`, and that direction is chosen on purpose:
 * a request with no dates has nothing to clash with, and a holder who never
 * said when they are available has not said no. Guessing the other way would
 * silently delete suggestions that are perfectly fine.
 */
export function computeDateFit(input: DateFitInput): number {
  const requestStart = toDate(input.requestStart);
  if (!requestStart) return 1;

  const requestEnd = toDate(input.requestEnd);
  const request: Range = { start: requestStart, end: requestEnd };
  const requestedDays = rangeDays(request);
  if (!(requestedDays > 0) || !Number.isFinite(requestedDays)) return 1;

  const resource: ResourceLike = {
    ...(input.resource ?? {}),
    sdate: input.offerStart ?? input.resource?.sdate ?? null,
    fdate: input.offerEnd ?? input.resource?.fdate ?? null
  };

  const result = checkAvailability(resource, input.bookings ?? [], request, 1, {
    now: input.now ?? new Date()
  });
  return result.dateFit;
}
