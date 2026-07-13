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
 */

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
