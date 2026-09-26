/**
 * Rikmas close to a person even when none of them has an open mission that
 * matches (docs/inprogress/PLAN_AI_SIGNUP_CONCIERGE.md §6.2, decision §0.1).
 *
 * The match-suggestion engine only sees open missions and resources, so a
 * rikma that could use exactly this person — but has not written it down as a
 * mission yet — never shows up. Here closeness is what the person and the
 * rikma share: values, and skills its members already have (a UX designer is
 * close to a rikma that already has one — they will speak the same language).
 * The action is "offer yourself" (self-nomination), which the rikma decides on.
 *
 * Pure and bounded: at most 5, each with the reasons as data for the UI.
 */

export interface NearbyProject {
  id: string;
  name: string;
  valueIds: string[];
  valueNames: Record<string, string>;
  memberIds: string[];
  memberSkillIds: string[];
  memberSkillNames: Record<string, string>;
}

export interface NearbyRikma {
  id: string;
  name: string;
  score: number;
  sharedValues: string[];
  sharedSkills: string[];
}

export const NEARBY_MAX = 5;

export function nearbyRikmas(
  me: { userId: string; valueIds: string[]; skillIds: string[]; excludeProjectIds?: string[] },
  projects: readonly NearbyProject[],
  max = NEARBY_MAX
): NearbyRikma[] {
  const myValues = new Set(me.valueIds.map(String));
  const mySkills = new Set(me.skillIds.map(String));
  const exclude = new Set((me.excludeProjectIds ?? []).map(String));

  return projects
    .filter((p) => !exclude.has(p.id) && !p.memberIds.includes(String(me.userId)))
    .map((p) => {
      const sharedValues = [...new Set(p.valueIds)].filter((id) => myValues.has(id));
      const sharedSkills = [...new Set(p.memberSkillIds)].filter((id) => mySkills.has(id));
      // A shared value weighs more than a shared skill: values are why people
      // stay in a partnership; a skill already on the team is a neighbour.
      const score = sharedValues.length * 2 + sharedSkills.length;
      return {
        id: p.id,
        name: p.name,
        score,
        sharedValues: sharedValues.map((id) => p.valueNames[id]).filter(Boolean),
        sharedSkills: sharedSkills.map((id) => p.memberSkillNames[id]).filter(Boolean)
      };
    })
    .filter((r) => r.score >= 2)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, max);
}

/** qid 382 node → NearbyProject. */
export function nearbyProjectOf(n: any): NearbyProject {
  const a = n?.attributes ?? {};
  const valueNames: Record<string, string> = {};
  const valueIds = (a.vallues?.data ?? []).map((v: any) => {
    valueNames[String(v.id)] = v?.attributes?.valueName ?? '';
    return String(v.id);
  });
  const memberSkillNames: Record<string, string> = {};
  const memberSkillIds: string[] = [];
  const memberIds: string[] = [];
  for (const u of a.user_1s?.data ?? []) {
    memberIds.push(String(u.id));
    for (const s of u?.attributes?.skills?.data ?? []) {
      memberSkillNames[String(s.id)] = s?.attributes?.skillName ?? '';
      memberSkillIds.push(String(s.id));
    }
  }
  return { id: String(n.id), name: String(a.projectName ?? ''), valueIds, valueNames, memberIds, memberSkillIds, memberSkillNames };
}
