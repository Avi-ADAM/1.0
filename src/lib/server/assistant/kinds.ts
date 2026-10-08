/**
 * The Strapi / model side of profile and wish sessions
 * (docs/inprogress/PLAN_AI_SIGNUP_CONCIERGE.md §6, §7). The list logic is pure in
 * $lib/assistant/{profile,wish,revise}.ts; this file only reads, writes and
 * calls the model — the actions in configs/assistantSessions.ts decide who may.
 */

import type { AssistantKind, AssistantState, Revision } from '$lib/assistant/types.js';
import { markProfileApplied, planProfileApply, PROFILE_RELATIONS, type CvLike, type ProfileSnapshot } from '$lib/assistant/profile.js';
import { buildRevisePrompt, parseReviseReply } from '$lib/assistant/revise.js';
import type { StrapiLike } from './session.js';

type Lang = 'he' | 'en' | 'ar';
const asLang = (l: unknown): Lang => (l === 'en' || l === 'ar' ? l : 'he');

// ── Profile ────────────────────────────────────────────────────────────────

export async function loadProfile(
  strapi: StrapiLike,
  uid: string,
  fetchFn: typeof fetch
): Promise<{ snapshot: ProfileSnapshot; projectIds: string[] }> {
  const res = await strapi.execute('381getUserProfileForAssistant', { uid: String(uid) }, undefined, fetchFn);
  const a = res?.data?.usersPermissionsUser?.data?.attributes ?? {};
  const list = (rel: any, field: string) =>
    (rel?.data ?? []).map((n: any) => ({ id: String(n.id), name: String(n?.attributes?.[field] ?? '') })).filter((x: any) => x.name);
  return {
    snapshot: {
      skills: list(a.skills, 'skillName'),
      roles: list(a.tafkidims, 'roleDescription'),
      methods: list(a.work_ways, 'workWayName'),
      vallues: list(a.vallues, 'valueName'),
      resources: list(a.sps, 'name')
    },
    projectIds: (a.projects_1s?.data ?? []).map((p: any) => String(p.id))
  };
}

/** The onboarding's own text analysis (analyze-cv, the free-text path). */
export async function analyzeProfileText(text: string, lang: string): Promise<CvLike> {
  const { mastra } = await import('../../../mastra/index');
  const run = await mastra.getWorkflow('analyze-cv').createRun();
  const result: any = await run.start({ inputData: { rawText: text, lang: asLang(lang) } });
  if (result?.status !== 'success') throw new Error(result?.error?.message ?? 'The text could not be analysed');
  return result.result as CvLike;
}

/**
 * "Save to my profile" (§6.1): the relations that changed, written whole;
 * new resources as `sp` rows; then the match suggestions are refreshed, as
 * after any profile change.
 */
export async function applyProfile(
  strapi: StrapiLike,
  uid: string,
  state: AssistantState,
  ctx: { jwt: string; lang: string; fetch: typeof fetch }
): Promise<{ state: AssistantState; written: string[]; unresolved: string[] }> {
  const plan = planProfileApply(state);
  const lang = asLang(ctx.lang);
  const newIds: Record<string, string> = {};
  const unresolved: string[] = [];
  const data: Record<string, string[]> = {};

  const { resolveMissionSpec } = await import('$lib/server/mission/resolveMissionSpec.js');
  const { resolveIds, createSps } = await import('$lib/server/onboard/profileWrites.js');
  const specKey = { skills: 'skills', roles: 'roles', methods: 'workways', vallues: 'vallues' } as const;
  const catKey = { skills: 'skills', roles: 'roles', methods: 'workways', vallues: 'vallues' } as const;

  for (const [group, rel] of Object.entries(plan.relations) as [keyof typeof PROFILE_RELATIONS, NonNullable<(typeof plan.relations)[keyof typeof PROFILE_RELATIONS]>][]) {
    const ids = [...rel.ids];
    if (rel.newNames.length) {
      const names = rel.newNames.map((n) => n.name);
      // Match to the vocabulary first (a close existing term is the person's
      // term too); create only what matches nothing (§13.3).
      try {
        const r: any = await resolveMissionSpec({ name: names[0], [specKey[group]]: names, lang } as any, ctx.fetch);
        const cat = r[catKey[group]];
        const byName = new Map<string, string>();
        for (const t of cat?.resolved ?? []) byName.set(String(t.name).trim().toLowerCase(), String(t.id));
        for (const s of cat?.suggestions ?? []) if (s?.existingId) byName.set(String(s.input).trim().toLowerCase(), String(s.existingId));
        const leftovers: { key: string; name: string }[] = [];
        rel.newNames.forEach((n, i) => {
          const id = byName.get(n.name.trim().toLowerCase()) ?? (cat?.resolved?.length === names.length ? String(cat.resolved[i].id) : undefined);
          if (id) newIds[n.key] = id;
          else leftovers.push(n);
        });
        if (leftovers.length) {
          const created = await resolveIds(group, leftovers.map((n) => ({ name: n.name })), ctx.jwt, lang);
          leftovers.forEach((n, i) => (created[i] ? (newIds[n.key] = created[i]) : unresolved.push(n.name)));
        }
      } catch {
        // Vocabulary service down: the onboarding's own create path.
        const created = await resolveIds(group, rel.newNames.map((n) => ({ name: n.name })), ctx.jwt, lang);
        rel.newNames.forEach((n, i) => (created[i] ? (newIds[n.key] = created[i]) : unresolved.push(n.name)));
      }
      for (const n of rel.newNames) if (newIds[n.key] && !ids.includes(newIds[n.key])) ids.push(newIds[n.key]);
    }
    data[PROFILE_RELATIONS[group]] = ids;
  }

  const written: string[] = [];
  if (Object.keys(data).length) {
    await strapi.execute('383setUserProfileRelations', { uid: String(uid), data }, undefined, ctx.fetch);
    written.push(...Object.keys(data));
  }
  if (plan.newResources.length) {
    const spIds = await createSps(plan.newResources.map((r) => ({ name: r.name, descrip: r.descrip })), String(uid), ctx.jwt, lang);
    plan.newResources.forEach((r, i) => spIds[i] && (newIds[r.key] = spIds[i]));
    if (spIds.length) written.push('sps');
  }

  // Keys that could not be resolved are not "on the profile".
  const failedKeys = new Set(Object.values(plan.relations).flatMap((r) => r!.newNames.filter((n) => !newIds[n.key]).map((n) => n.key)));
  const applied = markProfileApplied(state, { ...plan, applying: plan.applying.filter((k) => !failedKeys.has(k)) }, newIds);

  if (written.length) {
    try {
      const [{ matchUserToOpenEntities }, { strapiClient }] = await Promise.all([
        import('$lib/server/matching/engine'),
        import('$lib/server/actions/index.js')
      ]);
      await matchUserToOpenEntities(String(uid), 'profileUpdated', { strapi: strapiClient, fetch: ctx.fetch, lang });
    } catch (e) {
      console.warn('[assistant] match refresh after profile apply failed', e);
    }
  }
  return { state: applied, written, unresolved };
}

/**
 * What the profile list shows next to itself (§6.2): open missions matched to
 * the person (the precomputed suggestions), and rikmas near them with no such
 * mission yet. Never stored in the session.
 */
export async function profileSuggestions(
  strapi: StrapiLike,
  uid: string,
  snapshot: ProfileSnapshot,
  projectIds: string[],
  fetchFn: typeof fetch
) {
  const [offersRes, projectsRes] = await Promise.all([
    strapi.execute('209levMatchSuggestions', { idL: String(uid) }, undefined, fetchFn).catch(() => null),
    strapi.execute('382projectsForNearby', { limit: 150 }, undefined, fetchFn).catch(() => null)
  ]);
  const offers = (offersRes?.data?.matchSuggestions?.data ?? []).slice(0, 8).map((n: any) => {
    const om = n?.attributes?.open_mission?.data;
    return {
      openMissionId: om?.id ? String(om.id) : null,
      name: String(om?.attributes?.name ?? ''),
      projectId: om?.attributes?.project?.data?.id ? String(om.attributes.project.data.id) : null,
      projectName: String(om?.attributes?.project?.data?.attributes?.projectName ?? ''),
      score: Number(n?.attributes?.score ?? 0)
    };
  }).filter((o: any) => o.openMissionId && o.name);

  const { nearbyRikmas, nearbyProjectOf } = await import('$lib/server/matching/nearbyRikmas.js');
  const nearby = nearbyRikmas(
    {
      userId: String(uid),
      valueIds: snapshot.vallues.map((v) => v.id),
      skillIds: snapshot.skills.map((s) => s.id),
      excludeProjectIds: [...projectIds, ...offers.map((o: any) => o.projectId).filter(Boolean)]
    },
    (projectsRes?.data?.projects?.data ?? []).map(nearbyProjectOf)
  );
  return { offers, nearby };
}

// ── Wish ───────────────────────────────────────────────────────────────────

/** A wish and its proposals — only for its owner. */
export async function loadOwnedWish(strapi: StrapiLike, ratsonId: string, uid: string, jwt: string | undefined, fetchFn: typeof fetch) {
  const res = await strapi.execute('105queryRatsonWithProposals', { id: String(ratsonId) }, jwt, fetchFn);
  const node = res?.data?.ratson?.data;
  const owners = node?.attributes?.users_permissions_users?.data ?? [];
  if (!node || !owners.some((o: any) => String(o.id) === String(uid))) throw new Error('Wish not found');
  return {
    attrs: node.attributes,
    proposals: res?.data?.ratsonProposals?.data ?? [],
    isDraft: node.attributes?.status_ratson === 'draft'
  };
}

// ── The model ──────────────────────────────────────────────────────────────

/** One refinement: the person's words → ops. Gemini, like the rest of the site's analysis. */
export async function runRevise(input: {
  kind: AssistantKind;
  state: AssistantState;
  revisions: Revision[];
  instruction: string;
  lang: string;
}): Promise<{ ops: unknown[]; say: string; questions: string[] }> {
  const { system, user } = buildRevisePrompt(input);
  const [{ Agent }, { createModelChain }] = await Promise.all([
    import('@mastra/core/agent'),
    import('../../../mastra/lib/createModel')
  ]);
  const agent = new Agent({
    id: 'AssistantReviser',
    name: 'AssistantReviser',
    instructions: system,
    model: createModelChain()
  });
  const result = await agent.generate([{ role: 'user', content: user }]);
  return parseReviseReply(result.text ?? '');
}
