/**
 * Pure scoring logic for match suggestions.
 *
 * Closed-form equivalent of the legacy lev-page algorithm
 * (extractSuggestions + calculateScore in src/lib/utils/):
 * there, a mission first seen via a matching role got base 1, via a matching
 * skill base 2, then +1 per additional matching role and +2 per additional
 * matching skill, plus work-way adjustments and penalties for requirements
 * the user lacks. Summed up that is exactly:
 *
 *   score = matchedRoles + 2·matchedSkills + wwAdjustment
 *           − 2·missingSkills − missingRoles
 *
 * which is what this module computes directly from the two ID sets.
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
  score: number;
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
 * Work-way adjustment, identical to the legacy calculateScore work-way block
 * (with the base folded out):
 *  - user has no work ways        → 0
 *  - some match, none mismatch    → +matches
 *  - some match, some mismatch    → matches − mismatches
 *  - none match, some mismatch    → −2·mismatches
 */
function workWayAdjustment(missionWW: string[], userWW: string[]): number {
  if (userWW.length === 0) return 0;
  const matches = intersect(missionWW, userWW);
  const mismatches = difference(missionWW, userWW);
  if (matches.length > 0 && mismatches.length === 0) return matches.length;
  if (matches.length > 0 && mismatches.length > 0) return matches.length - mismatches.length;
  if (matches.length === 0 && mismatches.length > 0) return -2 * mismatches.length;
  return 0;
}

/**
 * Score a mission for a user. Returns the score plus the matched/missing ID
 * sets (persisted as `matchedOn` so the UI can explain why it matched).
 */
export function computeMissionMatchScore(
  mission: MissionRequirements,
  user: UserCapabilities
): MatchResult {
  const matchedRoles = intersect(mission.roles, user.roles);
  const matchedSkills = intersect(mission.skills, user.skills);
  const matchedWorkWays = intersect(mission.workWays, user.workWays);
  const missingSkills = difference(mission.skills, user.skills);
  const missingRoles = difference(mission.roles, user.roles);

  const score =
    matchedRoles.length +
    2 * matchedSkills.length +
    workWayAdjustment(mission.workWays, user.workWays) -
    2 * missingSkills.length -
    missingRoles.length;

  return { score, matchedSkills, matchedRoles, matchedWorkWays, missingSkills, missingRoles };
}

/** A suggestion is only worth storing (and mailing about) above this. */
export const MIN_SUGGESTION_SCORE = 1;

// ─────────────────────────────────────────────────────────────────────────────
// Date fit — the resource side (docs/PLAN_RESOURCE_CALENDAR.md §7)
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
