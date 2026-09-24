/**
 * Run a rikma blueprint — the "create" button of the review screen
 * (docs/PLAN_AI_SIGNUP_CONCIERGE.md §4.5).
 *
 * The plan (order, params) is decided purely in $lib/assistant/materializePlan;
 * this file only executes it, through the actions the site's own forms run, so
 * no consent branch is bypassed. Everything the run touches arrives through
 * `deps`, which keeps the executor testable and keeps it free of any import
 * that reaches Strapi.
 *
 * Idempotent by construction: after every successful step the row gets its
 * `createdRef` and the state is saved (`deps.saveProgress`). A run that dies in
 * the middle — a timeout, a Strapi hiccup — is simply run again; the planner
 * skips everything that already exists.
 */

import {
  leftoverBoards,
  missionParams,
  planMaterialization,
  productParams,
  resourceParams,
  rikmaParams,
  type MaterializePlan,
  type ParamContext
} from '$lib/assistant/materializePlan.js';
import type { AssistantItem, AssistantState } from '$lib/assistant/types.js';

export interface ActionLikeResult {
  success: boolean;
  data?: any;
  error?: { message?: string };
}

export interface MaterializeDeps {
  /** actionService.executeAction bound to the acting user's context. */
  runAction: (key: string, params: Record<string, unknown>) => Promise<ActionLikeResult>;
  /** Value names → existing ids + names createWeave must mint. */
  resolveVallues: (names: string[]) => Promise<{ ids: string[]; newNames: string[] }>;
  /** Skill/role/work-way names on a mission row → ids (resolveMissionSpec). */
  resolveMissionVocab: (
    item: AssistantItem
  ) => Promise<{ skillIds?: string[]; roleIds?: string[]; workwayIds?: string[] } | undefined>;
  /** Members of an existing rikma before the run. */
  memberCount: (projectId: string) => Promise<number>;
  projectName: (projectId: string) => Promise<string>;
  invitePartner: (
    email: string,
    targets: { openMissions: { id: string; name: string }[]; openMashaabims: { id: string; name: string }[] },
    projectName: string
  ) => Promise<{ result: string; created: number }>;
  /** Persist progress after each step; `projectId` once the rikma exists. */
  saveProgress: (state: AssistantState, projectId: string | null) => Promise<void>;
  leftoverTitle: string;
  lang: 'he' | 'en' | 'ar';
}

export interface MaterializeOutcome {
  projectId: string | null;
  created: { key: string; type: string; id: string }[];
  failed: { key: string; message: string }[];
  skipped: MaterializePlan['skipped'];
  invites: { key: string; result: string }[];
  /** Unticked rows kept as planning-board proposals / rows past the boards' capacity. */
  proposals: { boards: number; overflow: string[] };
  state: AssistantState;
}

function errorText(r: ActionLikeResult | undefined, fallback: string): string {
  return r?.error?.message || fallback;
}

export async function runMaterialization(
  input: AssistantState,
  selectedKeys: readonly string[],
  ctx: { projectId: string | null; userId: string },
  deps: MaterializeDeps
): Promise<MaterializeOutcome> {
  const state: AssistantState = {
    ...input,
    items: input.items.map((it) => ({ ...it })),
    ...(input.fields ? { fields: { ...input.fields } } : {})
  };
  const byKey = new Map(state.items.map((it) => [it.key, it]));
  const plan = planMaterialization(state, selectedKeys, !!ctx.projectId);

  const outcome: MaterializeOutcome = {
    projectId: ctx.projectId,
    created: [],
    failed: [],
    skipped: plan.skipped,
    invites: [],
    proposals: { boards: 0, overflow: [] },
    state
  };

  const mark = (item: AssistantItem, type: string, id: string) => {
    item.createdRef = { type, id };
    item.status = 'applied';
    delete item.droppedFrom;
    outcome.created.push({ key: item.key, type, id });
  };

  let projectId = ctx.projectId;
  // A rikma this run creates has exactly one member — the founder. An existing
  // one is asked once, before anything changes it.
  let memberCount = 1;
  let projectName = String(state.fields?.name ?? '');
  if (projectId && plan.steps.length) {
    memberCount = await deps.memberCount(projectId);
    projectName = (await deps.projectName(projectId)) || projectName;
  }

  for (const step of plan.steps) {
    if (step.type === 'createRikma') {
      const names = Array.isArray(state.fields?.vals) ? (state.fields!.vals as string[]) : [];
      const vallues = await deps.resolveVallues(names);
      const r = await deps.runAction('createWeave', rikmaParams(state, vallues));
      const id = r?.data?.projectId ? String(r.data.projectId) : null;
      if (!r?.success || !id) {
        // Nothing else can be created without the rikma.
        outcome.failed.push({ key: 'rikma', message: errorText(r, 'Creating the rikma failed') });
        return outcome;
      }
      projectId = id;
      outcome.projectId = id;
      await deps.saveProgress(state, projectId);
      continue;
    }

    if (!projectId) {
      outcome.failed.push({ key: 'rikma', message: 'No rikma to create into' });
      return outcome;
    }
    const pctx: ParamContext = { projectId, userId: ctx.userId, memberCount };

    if (step.type === 'mission') {
      const item = byKey.get(step.key)!;
      const vocab = await deps.resolveMissionVocab(item);
      const r = await deps.runAction('createMission', missionParams(item, { ...pctx, vocab: vocab ? { [item.key]: vocab } : {} }));
      const id = r?.data?.createdEntityId;
      if (r?.success && id) mark(item, String(r.data.createdEntityType ?? 'mission'), String(id));
      else outcome.failed.push({ key: item.key, message: errorText(r, 'Creating the mission failed') });
    } else if (step.type === 'resource') {
      const item = byKey.get(step.key)!;
      const r = await deps.runAction('createResource', resourceParams(item, pctx));
      const id = r?.data?.id;
      // createResource opens the resource in a one-member rikma and puts it to
      // a vote (pmash) otherwise — the same split the form has.
      if (r?.success && id) mark(item, memberCount > 1 ? 'pmash' : 'openMashaabim', String(id));
      else outcome.failed.push({ key: item.key, message: errorText(r, 'Creating the resource failed') });
    } else if (step.type === 'product') {
      const item = byKey.get(step.key)!;
      const missions = step.missionKeys.map((k) => byKey.get(k)!).filter(Boolean);
      const resources = step.resourceKeys.map((k) => byKey.get(k)!).filter(Boolean);
      const r = await deps.runAction('createComplexMatanot', productParams(item, { missions, resources }, state, pctx));
      const id = r?.data?.matanotId;
      if (r?.success && id) {
        mark(item, 'matanot', String(id));
        // The recipe rows now exist as this product's bill of materials.
        for (const row of [...missions, ...resources]) {
          if (!row.createdRef) {
            row.createdRef = { type: 'bom', id: String(id) };
            row.status = 'applied';
          }
        }
      } else {
        outcome.failed.push({ key: item.key, message: errorText(r, 'Creating the product failed') });
      }
    } else if (step.type === 'invite') {
      const partner = byKey.get(step.key)!;
      const email = typeof partner.spec?.email === 'string' ? partner.spec.email : '';
      const open = (keys: string[], type: string) =>
        keys
          .map((k) => byKey.get(k)!)
          .filter((row) => row?.createdRef?.type === type)
          .map((row) => ({ id: row.createdRef!.id, name: row.label }));
      const openMissions = open(step.missionKeys, 'openMission');
      const openMashaabims = open(step.resourceKeys, 'openMashaabim');
      let result: string;
      if (!email) result = 'noEmail';
      else if (!openMissions.length && !openMashaabims.length) {
        // In a rikma with more members these are still votes; the partner can
        // be invited once they open.
        result = step.missionKeys.length || step.resourceKeys.length ? 'pendingVote' : 'nothingToInvite';
      } else {
        result = (await deps.invitePartner(email, { openMissions, openMashaabims }, projectName)).result;
      }
      outcome.invites.push({ key: partner.key, result });
      if (result === 'invited') {
        partner.status = 'applied';
        partner.createdRef = { type: 'invite', id: email };
      }
    } else if (step.type === 'seedLeftovers') {
      const { plan: seed, overflow } = leftoverBoards(state, step.keys, deps.leftoverTitle);
      outcome.proposals.overflow = overflow;
      if (seed.boards.length) {
        const r = await deps.runAction('seedPlanBoards', { projectId, plan: seed, lang: deps.lang });
        if (r?.success) outcome.proposals.boards = Number(r.data?.boardCount ?? seed.boards.length);
        else outcome.failed.push({ key: 'proposals', message: errorText(r, 'Saving the remaining rows failed') });
      }
    }

    await deps.saveProgress(state, projectId);
  }

  return outcome;
}
