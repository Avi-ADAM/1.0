/**
 * Logic for matching and scoring mission suggestions
 * Replicates the logic from the legacy +page.svelte showOpenPro function
 */

/**
 * Calculate intersection of two arrays (elements in both)
 */
function getIntersection(arr1: string[], arr2: string[]): string[] {
    return arr1.filter(x => arr2.includes(x));
}

/**
 * Calculate difference (elements in arr1 that are NOT in arr2)
 */
function getDifference(arr1: string[], arr2: string[]): string[] {
    return arr1.filter(x => !arr2.includes(x));
}

interface MissionRequirements {
    id: string;
    workWays: string[]; // IDs
    skills: string[]; // IDs
    roles: string[]; // IDs
}

interface UserCapabilities {
    workWays: string[]; // IDs
    skills: string[]; // IDs
    roles: string[]; // IDs
}

/**
 * Calculate the score for a specific mission based on user capabilities
 * 
 * @param mission - The mission requirements
 * @param user - The user capabilities
 * @param baseScore - Base score to start with (1 for Role loop, 2 for Skill loop)
 * @returns calculated score
 */
export function calculateScore(
    mission: MissionRequirements,
    user: UserCapabilities,
    baseScore: number
): number {
    let score = 0;

    // Work Ways Logic
    const missionWW = mission.workWays;
    const userWW = user.workWays;

    const matches = getIntersection(missionWW, userWW); // www
    const mismatches = getDifference(missionWW, userWW); // wwn

    if (userWW.length > 0) {
        if (matches.length > 0 && mismatches.length === 0) {
            // Perfect match
            score = baseScore + matches.length;
        } else if (matches.length > 0 && mismatches.length > 0) {
            // Partial match
            score = baseScore + matches.length - mismatches.length;
        } else if (matches.length === 0 && mismatches.length > 0) {
            // Mismatch
            score = baseScore - (2 * mismatches.length);
        } else {
            // No WW requirements or other case
            score = baseScore;
        }
    } else {
        // User has no work ways defined
        score = baseScore;
    }

    // Penalties for missing skills/roles
    const missingSkills = getDifference(mission.skills, user.skills); // skn
    const missingRoles = getDifference(mission.roles, user.roles); // tafn

    if (missingSkills.length > 0) {
        score -= (missingSkills.length * 2);
    }

    if (missingRoles.length > 0) {
        score -= missingRoles.length;
    }

    return score;
}
