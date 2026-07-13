/**
 * Match-suggestion engine.
 *
 * Replaces the lev page's client-side matching (huge query 83 pulling every
 * open mission per skill/role + scoring in the browser) with server-side,
 * event-driven matching:
 *
 *  - when an open mission / open mashaabim is created (or matures out of a
 *    pendm/pmash vote), `matchOpenMissionToUsers` / `matchOpenMashaabimToUsers`
 *    tag every relevant user with a `match-suggestion` row and email them;
 *  - when a user updates their profile (skills / roles / work ways),
 *    `matchUserToOpenMissions` finds anything new for them;
 *  - the lev page then just reads the rows (qid 209levMatchSuggestions).
 *
 * All Strapi access goes through StrapiClient with the admin service token
 * (no user JWT passed), because suggestions are written for *other* users.
 * Every entry point swallows its own errors — matching must never fail the
 * action that triggered it.
 */

import {
  computeMissionMatchScore,
  MIN_SUGGESTION_SCORE,
  type MissionRequirements,
  type UserCapabilities
} from './scoring';
import { sendNewSuggestionEmails, type SuggestionRecipient } from './notify';
import { isLocationCompatible, type GeoLocation } from './geo';

/** Hard caps so one event can never fan out unboundedly. */
const MAX_CANDIDATES = 500;
const MAX_SUGGESTIONS_PER_EVENT = 50;
const CREATE_CONCURRENCY = 5;

export type SuggestionSource = 'missionCreated' | 'resourceCreated' | 'profileUpdated' | 'backfill';

export interface MatchDeps {
  /** StrapiClient instance (actionService's `strapi`) */
  strapi: { execute: (qid: string, vars: Record<string, any>, jwt?: string, fetchFn?: typeof fetch) => Promise<any> };
  /** SvelteKit event.fetch — needed for relative /api/sendMail calls */
  fetch: typeof globalThis.fetch;
  lang?: string;
}

const ids = (rel: any): string[] => (rel?.data ?? []).map((x: any) => String(x.id));
const oneId = (rel: any): string | null => (rel?.data?.id != null ? String(rel.data.id) : null);

/** Normalize a user's repeatable `location` component (array, object or null). */
function userLocations(attrs: any): GeoLocation[] {
  const loc = attrs?.location;
  if (!loc) return [];
  return Array.isArray(loc) ? loc : [loc];
}

async function inBatches<T>(items: T[], size: number, fn: (item: T) => Promise<void>): Promise<void> {
  for (let i = 0; i < items.length; i += size) {
    await Promise.allSettled(items.slice(i, i + size).map(fn));
  }
}

async function createSuggestion(
  deps: MatchDeps,
  data: {
    userId: string;
    openMissionId?: string | null;
    openMashaabimId?: string | null;
    kind: 'mission' | 'resource';
    score: number;
    status: 'new' | 'notified';
    source: SuggestionSource;
    matchedOn?: Record<string, unknown> | null;
  }
): Promise<boolean> {
  try {
    await deps.strapi.execute('207createMatchSuggestion', {
      userId: data.userId,
      openMissionId: data.openMissionId ?? null,
      openMashaabimId: data.openMashaabimId ?? null,
      kind: data.kind,
      score: Math.round(data.score),
      status: data.status,
      source: data.source,
      matchedOn: data.matchedOn ?? null,
      notifiedAt: data.status === 'notified' ? new Date().toISOString() : null
    });
    return true;
  } catch (err) {
    console.error(`[matching] failed to create ${data.kind} suggestion for user ${data.userId}:`, err);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Open mission created → tag relevant users
// ─────────────────────────────────────────────────────────────────────────────

export async function matchOpenMissionToUsers(
  openMissionId: string,
  source: SuggestionSource,
  deps: MatchDeps
): Promise<{ created: number }> {
  try {
    const ctxRes = await deps.strapi.execute('200matchOpenMissionContext', { omId: String(openMissionId) });
    const om = ctxRes?.data?.openMission?.data;
    const attrs = om?.attributes;
    if (!attrs || attrs.archived === true) return { created: 0 };

    const mission: MissionRequirements = {
      id: String(om.id),
      skills: ids(attrs.skills),
      roles: ids(attrs.tafkidims),
      workWays: ids(attrs.work_ways)
    };
    if (mission.skills.length === 0 && mission.roles.length === 0) return { created: 0 };

    const candRes = await deps.strapi.execute('201matchCandidateUsers', {
      skillIds: mission.skills,
      roleIds: mission.roles,
      limit: MAX_CANDIDATES
    });
    const candidates: any[] = candRes?.data?.usersPermissionsUsers?.data ?? [];

    const alreadySuggested = new Set(
      (attrs.match_suggestions?.data ?? [])
        .map((s: any) => oneId(s.attributes?.user))
        .filter(Boolean) as string[]
    );
    const notRelevant = oneId(attrs.usersNotRelevant);
    const rishon = oneId(attrs.rishon);

    const scored = candidates
      .filter((u) => {
        const uid = String(u.id);
        if (alreadySuggested.has(uid) || uid === notRelevant || uid === rishon) return false;
        // user already declined this mission
        if (ids(u.attributes?.declined).includes(mission.id)) return false;
        // physical mission → user must be within reach (see geo.ts rules)
        return isLocationCompatible(attrs.location, userLocations(u.attributes));
      })
      .map((u) => {
        const caps: UserCapabilities = {
          skills: ids(u.attributes?.skills),
          roles: ids(u.attributes?.tafkidims),
          workWays: ids(u.attributes?.work_ways)
        };
        return { user: u, match: computeMissionMatchScore(mission, caps) };
      })
      .filter((s) => s.match.score >= MIN_SUGGESTION_SCORE)
      .sort((a, b) => b.match.score - a.match.score)
      .slice(0, MAX_SUGGESTIONS_PER_EVENT);

    let created = 0;
    const emailable: SuggestionRecipient[] = [];
    await inBatches(scored, CREATE_CONCURRENCY, async ({ user, match }) => {
      const wantsMail = user.attributes?.noMail !== true && !!user.attributes?.email;
      const ok = await createSuggestion(deps, {
        userId: String(user.id),
        openMissionId: mission.id,
        kind: 'mission',
        score: match.score,
        status: wantsMail ? 'notified' : 'new',
        source,
        matchedOn: {
          skills: match.matchedSkills,
          roles: match.matchedRoles,
          workWays: match.matchedWorkWays
        }
      });
      if (ok) {
        created++;
        if (wantsMail) {
          emailable.push({
            id: String(user.id),
            username: user.attributes?.username,
            email: user.attributes?.email,
            lang: user.attributes?.lang,
            noMail: user.attributes?.noMail
          });
        }
      }
    });

    // fire-and-forget: mail must not delay the creating action
    void sendNewSuggestionEmails(
      emailable,
      'mission',
      attrs.name ?? '',
      attrs.project?.data?.attributes?.projectName ?? '',
      deps
    );

    console.log(`[matching] mission ${mission.id}: ${created} suggestions created (${source})`);
    return { created };
  } catch (err) {
    console.error(`[matching] matchOpenMissionToUsers(${openMissionId}) failed:`, err);
    return { created: 0 };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Open mashaabim (resource request) created → tag users who offer the resource
// ─────────────────────────────────────────────────────────────────────────────

export async function matchOpenMashaabimToUsers(
  openMashaabimId: string,
  source: SuggestionSource,
  deps: MatchDeps
): Promise<{ created: number }> {
  try {
    const ctxRes = await deps.strapi.execute('204matchOpenMashaabimContext', { omId: String(openMashaabimId) });
    const om = ctxRes?.data?.openMashaabim?.data;
    const attrs = om?.attributes;
    if (!attrs || attrs.archived === true) return { created: 0 };

    const mashId = oneId(attrs.mashaabim);
    if (!mashId) return { created: 0 };

    const usersRes = await deps.strapi.execute('205matchUsersByMashaabim', {
      mashId,
      limit: MAX_CANDIDATES
    });
    const candidates: any[] = usersRes?.data?.usersPermissionsUsers?.data ?? [];

    const alreadySuggested = new Set(
      (attrs.match_suggestions?.data ?? [])
        .map((s: any) => oneId(s.attributes?.user))
        .filter(Boolean) as string[]
    );
    const declinedSpIds = new Set(ids(attrs.declinedsps));

    const relevant = candidates
      .filter((u) => {
        if (alreadySuggested.has(String(u.id))) return false;
        // physical resource request → provider must be within reach
        if (!isLocationCompatible(attrs.location, userLocations(u.attributes))) return false;
        const spsData: any[] = u.attributes?.sps?.data ?? [];
        // the user's sp for this mashaabim must not be in the declined list
        return spsData.some(
          (sp) => oneId(sp.attributes?.mashaabim) === mashId && !declinedSpIds.has(String(sp.id))
        );
      })
      .slice(0, MAX_SUGGESTIONS_PER_EVENT);

    let created = 0;
    const emailable: SuggestionRecipient[] = [];
    await inBatches(relevant, CREATE_CONCURRENCY, async (user) => {
      const wantsMail = user.attributes?.noMail !== true && !!user.attributes?.email;
      const ok = await createSuggestion(deps, {
        userId: String(user.id),
        openMashaabimId: String(om.id),
        kind: 'resource',
        score: 1,
        status: wantsMail ? 'notified' : 'new',
        source,
        matchedOn: { mashaabim: mashId }
      });
      if (ok) {
        created++;
        if (wantsMail) {
          emailable.push({
            id: String(user.id),
            username: user.attributes?.username,
            email: user.attributes?.email,
            lang: user.attributes?.lang,
            noMail: user.attributes?.noMail
          });
        }
      }
    });

    void sendNewSuggestionEmails(
      emailable,
      'resource',
      attrs.name ?? '',
      attrs.project?.data?.attributes?.projectName ?? '',
      deps
    );

    console.log(`[matching] mashaabim ${om.id}: ${created} suggestions created (${source})`);
    return { created };
  } catch (err) {
    console.error(`[matching] matchOpenMashaabimToUsers(${openMashaabimId}) failed:`, err);
    return { created: 0 };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// User profile changed (or lev backfill) → find missions/resources for them
// ─────────────────────────────────────────────────────────────────────────────

export async function matchUserToOpenEntities(
  userId: string,
  source: SuggestionSource,
  deps: MatchDeps
): Promise<{ createdMissions: number; createdResources: number }> {
  let createdMissions = 0;
  let createdResources = 0;
  try {
    const ctxRes = await deps.strapi.execute('202matchUserContext', { uid: String(userId) });
    const user = ctxRes?.data?.usersPermissionsUser?.data;
    const uAttrs = user?.attributes;
    if (!uAttrs) return { createdMissions, createdResources };

    const caps: UserCapabilities = {
      skills: ids(uAttrs.skills),
      roles: ids(uAttrs.tafkidims),
      workWays: ids(uAttrs.work_ways)
    };

    const existing: any[] = uAttrs.match_suggestions?.data ?? [];
    const existingMissionIds = new Set(
      existing.map((s) => oneId(s.attributes?.open_mission)).filter(Boolean) as string[]
    );
    const existingMashaabimIds = new Set(
      existing.map((s) => oneId(s.attributes?.open_mashaabim)).filter(Boolean) as string[]
    );
    const declinedIds = new Set(ids(uAttrs.declined));
    const askedIds = new Set(ids(uAttrs.askeds));
    const myLocations = userLocations(uAttrs);

    // ── missions ────────────────────────────────────────────────────────────
    if (caps.skills.length > 0 || caps.roles.length > 0) {
      const omRes = await deps.strapi.execute('203matchOpenMissionsForUser', {
        skillIds: caps.skills,
        roleIds: caps.roles,
        limit: MAX_CANDIDATES
      });
      const missions: any[] = omRes?.data?.openMissions?.data ?? [];

      const scored = missions
        .filter((m) => {
          const mid = String(m.id);
          if (existingMissionIds.has(mid) || declinedIds.has(mid) || askedIds.has(mid)) return false;
          return isLocationCompatible(m.attributes?.location, myLocations);
        })
        .map((m) => ({
          mission: m,
          match: computeMissionMatchScore(
            {
              id: String(m.id),
              skills: ids(m.attributes?.skills),
              roles: ids(m.attributes?.tafkidims),
              workWays: ids(m.attributes?.work_ways)
            },
            caps
          )
        }))
        .filter((s) => s.match.score >= MIN_SUGGESTION_SCORE)
        .sort((a, b) => b.match.score - a.match.score)
        .slice(0, MAX_SUGGESTIONS_PER_EVENT);

      await inBatches(scored, CREATE_CONCURRENCY, async ({ mission, match }) => {
        const ok = await createSuggestion(deps, {
          userId: String(user.id),
          openMissionId: String(mission.id),
          kind: 'mission',
          score: match.score,
          status: 'new', // self-initiated: the user is already in the app, no mail
          source,
          matchedOn: {
            skills: match.matchedSkills,
            roles: match.matchedRoles,
            workWays: match.matchedWorkWays
          }
        });
        if (ok) createdMissions++;
      });
    }

    // ── resources ───────────────────────────────────────────────────────────
    const sps: any[] = uAttrs.sps?.data ?? [];
    const spByMashaabim = new Map<string, string>();
    for (const sp of sps) {
      const mid = oneId(sp.attributes?.mashaabim);
      if (mid) spByMashaabim.set(mid, String(sp.id));
    }
    if (spByMashaabim.size > 0) {
      const omashRes = await deps.strapi.execute('206matchOpenMashaabimsForUser', {
        mashIds: [...spByMashaabim.keys()],
        limit: MAX_CANDIDATES
      });
      const openMashaabims: any[] = omashRes?.data?.openMashaabims?.data ?? [];

      const relevant = openMashaabims
        .filter((om) => {
          if (existingMashaabimIds.has(String(om.id))) return false;
          if (!isLocationCompatible(om.attributes?.location, myLocations)) return false;
          const mashId = oneId(om.attributes?.mashaabim);
          const mySpId = mashId ? spByMashaabim.get(mashId) : undefined;
          if (!mySpId) return false;
          return !ids(om.attributes?.declinedsps).includes(mySpId);
        })
        .slice(0, MAX_SUGGESTIONS_PER_EVENT);

      await inBatches(relevant, CREATE_CONCURRENCY, async (om) => {
        const ok = await createSuggestion(deps, {
          userId: String(user.id),
          openMashaabimId: String(om.id),
          kind: 'resource',
          score: 1,
          status: 'new',
          source,
          matchedOn: { mashaabim: oneId(om.attributes?.mashaabim) }
        });
        if (ok) createdResources++;
      });
    }

    console.log(
      `[matching] user ${userId}: +${createdMissions} mission / +${createdResources} resource suggestions (${source})`
    );
    return { createdMissions, createdResources };
  } catch (err) {
    console.error(`[matching] matchUserToOpenEntities(${userId}) failed:`, err);
    return { createdMissions, createdResources };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Status transitions
// ─────────────────────────────────────────────────────────────────────────────

/** Mark this user's suggestion for a mission/resource as dismissed (on decline). */
export async function dismissSuggestion(
  userId: string,
  target: { openMissionId?: string; openMashaabimId?: string },
  deps: MatchDeps
): Promise<void> {
  try {
    const byMission = !!target.openMissionId;
    const res = await deps.strapi.execute(
      byMission ? '210findMatchSuggestionsByMission' : '211findMatchSuggestionsByMashaabim',
      byMission
        ? { uid: String(userId), omId: String(target.openMissionId) }
        : { uid: String(userId), omashId: String(target.openMashaabimId) }
    );
    const rows: any[] = res?.data?.matchSuggestions?.data ?? [];
    await inBatches(rows, CREATE_CONCURRENCY, async (row) => {
      await deps.strapi.execute('208updateMatchSuggestion', {
        id: String(row.id),
        status: 'dismissed'
      });
    });
  } catch (err) {
    console.error('[matching] dismissSuggestion failed:', err);
  }
}
