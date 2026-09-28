/**
 * Assistant sessions — the living list the site chat and an outside agent
 * both edit (docs/inprogress/PLAN_AI_SIGNUP_CONCIERGE.md §3, §4, §9.2).
 *
 * This file carries the rikma-import half, the supply side that matters most:
 *
 *   proposeRikmaBlueprint   an agent (or the site) hands over a whole rikma —
 *                           products first — and gets a session back
 *   getAssistantSession     the current list + recent transcript
 *   setAssistantItems       ops, no model call (what Claude sends)
 *   undoAssistantRevision   exact undo of the last revision
 *   materializeRikmaBlueprint  the review screen's "create" — ONLY from there
 *
 * Every write is to the caller's own session. Nothing here creates a rikma,
 * a mission or a product except `materializeRikmaBlueprint`, which the owner
 * triggers from the prefilled review screen (decision §0.1) and which runs the
 * same actions the forms run.
 */

import { applyOps, revertChanges } from '$lib/assistant/applyOps.js';
import { blueprintToState, parseBlueprint } from '$lib/assistant/blueprint.js';
import { boardItemsToBlueprint, planItemOf, stampPlanItems } from '$lib/assistant/fromSeedPlan.js';
import { categoryResolver } from '$lib/server/assistant/categories.js';
import { landingFor } from '$lib/assistant/landing.js';
import type { AssistantItem, AssistantKind, AssistantVia } from '$lib/assistant/types.js';
import type { ActionConfig, ActionContext, ActionExecutionHandler } from '../types.js';
import {
  createSession,
  findLatestSession,
  findPendingByChezin,
  loadSession,
  ownsSession,
  publicView,
  saveSession,
  setShare,
  type SessionRow,
  type StrapiLike
} from '$lib/server/assistant/session.js';
import { nextShareExpiry } from '$lib/server/assistant/shareKey.js';

const SITE = 'https://www.1lev1.com';

/** Where the owner reviews and creates. The page itself is on www; it only calls /api. */
export function reviewUrl(row: Pick<SessionRow, 'id' | 'projectId'>): string {
  return row.projectId
    ? `${SITE}/moach/${row.projectId}/import/${row.id}`
    : `${SITE}/moach/import/${row.id}`;
}

const VIA = new Set(['site', 'agent']);
const via = (raw: unknown): AssistantVia => (VIA.has(String(raw)) ? (raw as AssistantVia) : 'site');
const KINDS = new Set(['profile', 'rikma', 'wish']);

function langOf(ctx: ActionContext): 'he' | 'en' | 'ar' {
  return ctx.lang === 'en' || ctx.lang === 'ar' ? ctx.lang : 'he';
}

async function projectContext(strapi: StrapiLike, projectId: string, fetchFn: typeof fetch) {
  const res = await strapi.execute('372assistantProjectContext', { pid: String(projectId) }, undefined, fetchFn);
  const p = res?.data?.project?.data;
  const members: string[] = (p?.attributes?.user_1s?.data ?? []).map((m: any) => String(m.id));
  return { exists: !!p?.id, name: String(p?.attributes?.projectName ?? ''), members };
}

/** Load a session and refuse anyone but its owner — one message for "absent" and "not yours". */
async function ownedSession(strapi: StrapiLike, sessionId: unknown, context: ActionContext): Promise<SessionRow> {
  const row = sessionId ? await loadSession(strapi, String(sessionId), context.fetch) : null;
  if (!ownsSession(row, context.userId)) throw new Error('Assistant session not found');
  return row;
}

// ── proposeRikmaBlueprint ───────────────────────────────────────────────────

const proposeHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const parsed = parseBlueprint(params.blueprint);
  // `in`, not `!parsed.ok`: without strictNullChecks the literal doesn't narrow.
  if ('issues' in parsed) {
    const where = parsed.issues.map((i) => `${i.path || '(root)'}: ${i.message}`).join('; ');
    throw new Error(`The blueprint is not valid — ${where}`);
  }

  const projectId = params.projectId ? String(params.projectId) : null;
  let projectName: string | null = null;
  if (projectId) {
    const ctx = await projectContext(strapi, projectId, context.fetch);
    if (!ctx.exists || !ctx.members.includes(String(context.userId))) {
      throw new Error('You can import into a rikma only as one of its members');
    }
    projectName = ctx.name;
  }

  const who = via(params.via);
  const { state, warnings } = blueprintToState(parsed.value, { origin: who === 'agent' ? 'agent' : 'manual' });
  const row = await createSession(
    strapi,
    {
      userId: String(context.userId),
      kind: 'rikma',
      state,
      startedVia: who,
      lang: langOf(context),
      projectId,
      sourceText: typeof params.sourceText === 'string' ? params.sourceText : null
    },
    context.fetch
  );

  return {
    data: {
      ...publicView({ ...row, projectName: row.projectName ?? projectName }),
      warnings,
      reviewUrl: reviewUrl(row)
    },
    updateStrategy: { type: 'none' as const }
  };
};

export const proposeRikmaBlueprintConfig: ActionConfig = {
  key: 'proposeRikmaBlueprint',
  description:
    'Save a rikma blueprint (the rikma with its products, missions, resources and partners) as a draft the owner reviews. Creates nothing on the platform; returns the review URL.',
  graphqlOperation: proposeHandler,
  paramSchema: {
    blueprint: { type: 'object', required: true, description: 'See BlueprintInputSchema in $lib/assistant/blueprint.ts' },
    projectId: { type: 'string', required: false, description: 'Import into this existing rikma (caller must be a member)' },
    sourceText: { type: 'string', required: false, description: 'What the blueprint was drawn from (site text / the conversation)' },
    via: { type: 'string', required: false, description: "'site' | 'agent'" }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Log in to import a rikma' }],
  updateStrategy: { type: 'none' }
};

// ── getAssistantSession ─────────────────────────────────────────────────────

const getHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  let row: SessionRow | null = null;
  if (params.sessionId) {
    row = await ownedSession(strapi, params.sessionId, context);
  } else {
    const kind = String(params.kind ?? '');
    if (!KINDS.has(kind)) throw new Error('Pass a sessionId or a kind (profile | rikma | wish)');
    row = await findLatestSession(strapi, String(context.userId), kind as AssistantKind, context.fetch);
  }
  if (!row) return { data: { session: null }, updateStrategy: { type: 'none' as const } };

  // A profile list shows, next to itself, what it could lead to (§6.2).
  let suggestions: unknown = undefined;
  if (row.kind === 'profile' && params.withSuggestions !== false) {
    try {
      const k = await import('$lib/server/assistant/kinds.js');
      const { snapshot, projectIds } = await k.loadProfile(strapi, String(context.userId), context.fetch);
      suggestions = await k.profileSuggestions(strapi, String(context.userId), snapshot, projectIds, context.fetch);
    } catch (e) {
      console.warn('[assistant] suggestions failed', e);
    }
  }
  return {
    data: {
      session: {
        ...publicView(row),
        ...(row.kind === 'rikma' ? { reviewUrl: reviewUrl(row) } : {}),
        ...(row.kind === 'wish' && row.ratsonId ? { ratsonId: row.ratsonId, siteUrl: `${SITE}/concierge/${row.ratsonId}` } : {}),
        ...(suggestions ? { suggestions } : {})
      }
    },
    updateStrategy: { type: 'none' as const }
  };
};

export const getAssistantSessionConfig: ActionConfig = {
  key: 'getAssistantSession',
  description: "Read one of the caller's assistant sessions (by id, or the latest of a kind).",
  graphqlOperation: getHandler,
  paramSchema: {
    sessionId: { type: 'string', required: false },
    kind: { type: 'string', required: false, description: 'profile | rikma | wish — latest session of this kind' },
    withSuggestions: { type: 'boolean', required: false, description: 'profile: also the matched offers and nearby rikmas (default true)' }
  },
  authRules: [{ type: 'jwt' }],
  updateStrategy: { type: 'none' }
};

// ── setAssistantItems ───────────────────────────────────────────────────────

const setHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const row = await ownedSession(strapi, params.sessionId, context);
  if (row.status === 'closed') throw new Error('This session is closed');
  const ops = Array.isArray(params.ops) ? params.ops : [];
  if (!ops.length) throw new Error('No ops to apply');

  const who = via(params.via);
  const r = applyOps(row.state, ops, { kind: row.kind, origin: who === 'agent' ? 'agent' : 'manual' });

  // Nothing applied → nothing to save, and no empty revision in the transcript.
  if (!r.applied.length) {
    return {
      data: { ...publicView(row), applied: 0, rejected: r.rejected, conflict: false },
      updateStrategy: { type: 'none' as const }
    };
  }

  const saved = await saveSession(
    strapi,
    row,
    {
      state: r.state,
      expectedVersion: Number(params.expectedVersion),
      revision: {
        at: new Date().toISOString(),
        via: who,
        ...(typeof params.instruction === 'string' ? { instruction: params.instruction.slice(0, 1000) } : {}),
        ...(typeof params.say === 'string' ? { say: params.say.slice(0, 1000) } : {}),
        ops: r.applied,
        changes: r.changes
      }
    },
    context.fetch
  );

  if ('conflict' in saved) {
    return {
      data: { ...publicView(saved.conflict), applied: 0, rejected: [], conflict: true },
      updateStrategy: { type: 'none' as const }
    };
  }
  return {
    data: { ...publicView(saved.row), applied: r.applied.length, rejected: r.rejected, conflict: false },
    updateStrategy: { type: 'none' as const }
  };
};

export const setAssistantItemsConfig: ActionConfig = {
  key: 'setAssistantItems',
  description:
    "Apply ops (keep/drop/restore/add/rename/setSpec/link/setField) to the caller's own assistant session. No model call. Returns the new list, or the current one with conflict:true when it changed since expectedVersion.",
  graphqlOperation: setHandler,
  paramSchema: {
    sessionId: { type: 'string', required: true },
    ops: { type: 'array', required: true },
    expectedVersion: { type: 'number', required: true, description: 'The version the caller last saw' },
    via: { type: 'string', required: false },
    instruction: { type: 'string', required: false, description: "The person's words this answers, for the transcript" },
    say: { type: 'string', required: false, description: 'What the assistant said back, for the transcript' }
  },
  authRules: [{ type: 'jwt' }],
  updateStrategy: { type: 'none' }
};

// ── undoAssistantRevision ───────────────────────────────────────────────────

const undoHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const row = await ownedSession(strapi, params.sessionId, context);
  const last = row.revisions.at(-1);
  if (!last || !Array.isArray(last.changes) || !last.changes.length) throw new Error('Nothing to undo');

  // Rows created since (materialize) are real now; undo must not un-create them.
  if (last.changes.some((c) => c.kind === 'item' && (c.after as AssistantItem | null)?.createdRef)) {
    throw new Error('That step created things on the platform — change them on the site');
  }

  const state = revertChanges(row.state, last.changes);
  const saved = await saveSession(
    strapi,
    row,
    {
      state,
      expectedVersion: Number(params.expectedVersion),
      revision: { at: new Date().toISOString(), via: via(params.via), instruction: 'undo', ops: [], changes: [] }
    },
    context.fetch
  );
  if ('conflict' in saved) {
    return { data: { ...publicView(saved.conflict), conflict: true }, updateStrategy: { type: 'none' as const } };
  }
  return { data: { ...publicView(saved.row), conflict: false }, updateStrategy: { type: 'none' as const } };
};

export const undoAssistantRevisionConfig: ActionConfig = {
  key: 'undoAssistantRevision',
  description: "Undo the last change to the caller's assistant session.",
  graphqlOperation: undoHandler,
  paramSchema: {
    sessionId: { type: 'string', required: true },
    expectedVersion: { type: 'number', required: true },
    via: { type: 'string', required: false }
  },
  authRules: [{ type: 'jwt' }],
  updateStrategy: { type: 'none' }
};

// ── materializeRikmaBlueprint ───────────────────────────────────────────────

const materializeHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const row = await ownedSession(strapi, params.sessionId, context);
  if (row.kind !== 'rikma') throw new Error('Only a rikma blueprint can be created');
  if (Number(params.expectedVersion) !== row.version) {
    return { data: { ...publicView(row), conflict: true }, updateStrategy: { type: 'none' as const } };
  }
  const selectedKeys = Array.isArray(params.selectedKeys) ? params.selectedKeys.map(String) : [];

  // Importing into a rikma is a member's act; re-checked here, at the moment
  // things are created, not only when the draft was made.
  if (row.projectId) {
    const ctx = await projectContext(strapi, row.projectId, context.fetch);
    if (!ctx.members.includes(String(context.userId))) {
      throw new Error('You can import into a rikma only as one of its members');
    }
  }

  // The review screen may have fixed names, prices, keywords in place: those
  // arrive as ops and are applied first, as one revision with the creation.
  let state = row.state;
  if (Array.isArray(params.ops) && params.ops.length) {
    state = applyOps(state, params.ops, { kind: 'rikma', origin: 'manual' }).state;
  }

  const [{ actionService }, { runMaterialization }, { resolveMissionSpec }, { invitePartnerToOpenEntities }] =
    await Promise.all([
      import('$lib/server/actions/index.js'),
      import('$lib/server/assistant/materialize.js'),
      import('$lib/server/mission/resolveMissionSpec.js'),
      import('$lib/server/matching/engine.js')
    ]);

  const lang = langOf(context);
  let current = row;
  const outcome = await runMaterialization(
    state,
    selectedKeys,
    { projectId: row.projectId, userId: String(context.userId) },
    {
      runAction: (key, p) => actionService.executeAction(key, p, context),
      resolveVallues: async (names) => {
        if (!names.length) return { ids: [], newNames: [] };
        try {
          const r = await resolveMissionSpec({ name: String(state.fields?.name ?? ''), vallues: names, lang }, context.fetch);
          return { ids: r.vallues.ids, newNames: [] };
        } catch {
          // Vocabulary service down: let createWeave mint them by name.
          return { ids: [], newNames: names };
        }
      },
      resolveMissionVocab: async (item) => {
        const s = item.spec ?? {};
        const list = (v: unknown) => (Array.isArray(v) ? (v as unknown[]).filter((x): x is string => typeof x === 'string') : []);
        const skills = list(s.skills);
        const roles = list(s.roles);
        const workways = list(s.workways);
        if (!skills.length && !roles.length && !workways.length) return undefined;
        try {
          const r = await resolveMissionSpec({ name: item.label, skills, roles, workways, lang }, context.fetch);
          return { skillIds: r.skills.ids, roleIds: r.roles.ids, workwayIds: r.workways.ids };
        } catch {
          return undefined;
        }
      },
      resolveCategories: categoryResolver(strapi, context.fetch),
      memberCount: async (pid) => (await projectContext(strapi, pid, context.fetch)).members.length || 1,
      projectName: async (pid) => (await projectContext(strapi, pid, context.fetch)).name,
      invitePartner: (email, targets, projectName) =>
        invitePartnerToOpenEntities(email, targets, projectName, {
          strapi,
          fetch: context.fetch,
          lang,
          invitedBy: String(context.userId)
        }),
      saveProgress: async (s, projectId) => {
        const saved = await saveSession(
          strapi,
          current,
          { state: s, ...(projectId && projectId !== current.projectId ? { patch: { projectId } } : {}) },
          context.fetch
        );
        if ('row' in saved) current = saved.row;
      },
      leftoverTitle: lang === 'en' ? 'More from the import' : lang === 'ar' ? 'المزيد من الاستيراد' : 'עוד מהייבוא',
      lang
    }
  );

  // One transcript entry for the whole run.
  const done = await saveSession(
    strapi,
    current,
    {
      state: outcome.state,
      patch: { appliedAt: new Date().toISOString(), ...(outcome.failed.length ? {} : { status: 'applied' as const }) },
      revision: {
        at: new Date().toISOString(),
        via: via(params.via),
        instruction: 'create',
        say: `created ${outcome.created.length}, failed ${outcome.failed.length}`,
        ops: [],
        changes: []
      }
    },
    context.fetch
  );
  const finalRow = 'row' in done ? done.row : current;

  // One structured line per run for the import funnel (§12 M13): which track,
  // from the site or an agent, and how much of the draft became real.
  console.log(
    '[assistant] materialize',
    JSON.stringify({
      session: row.id,
      track: String(state.fields?.track ?? ''),
      startedVia: row.startedVia,
      newRikma: !row.projectId,
      products: outcome.created.filter((c) => c.type === 'matanot').length,
      created: outcome.created.length,
      failed: outcome.failed.length
    })
  );

  // Rows imported from a planning board: mark them created there, the same
  // record "open in form" leaves. Best-effort — the entities exist either way,
  // and markPlanItemCreated is idempotent, so a re-run fixes a miss.
  if (outcome.projectId) {
    for (const item of outcome.state.items) {
      const ref = planItemOf(item);
      if (!ref || !item.createdRef) continue;
      const r = await actionService
        .executeAction(
          'markPlanItemCreated',
          {
            itemId: ref.itemId,
            boardId: ref.boardId,
            projectId: outcome.projectId,
            createdType: item.createdRef.type,
            createdId: item.createdRef.id
          },
          context
        )
        .catch((e: unknown) => ({ success: false, error: { message: String(e) } }));
      if (!r?.success) console.warn('[materializeRikmaBlueprint] could not mark plan item', ref.itemId, r?.error?.message);
    }
  }

  // A new supplier meets the wishes already waiting for it (§4.6.5). Not
  // awaited: it reads every open wish, and the owner is looking at the result
  // screen. It runs on the VPS, where the process outlives this response.
  const newProducts = outcome.created.filter((c) => c.type === 'matanot').map((c) => c.id);
  if (outcome.projectId && newProducts.length) {
    void actionService
      .executeAction('offerNewProductsToWishes', { projectId: outcome.projectId, matanotIds: newProducts }, context)
      .catch((e: unknown) => console.warn('[materializeRikmaBlueprint] wish offers failed', e));
  }

  return {
    data: {
      ...publicView(finalRow),
      projectId: outcome.projectId,
      projectUrl: outcome.projectId ? `${SITE}/moach/${outcome.projectId}` : null,
      created: outcome.created,
      failed: outcome.failed,
      skipped: outcome.skipped,
      invites: outcome.invites,
      proposals: outcome.proposals,
      conflict: false
    },
    updateStrategy: { type: 'none' as const }
  };
};

export const materializeRikmaBlueprintConfig: ActionConfig = {
  key: 'materializeRikmaBlueprint',
  description:
    "Create the ticked rows of the caller's rikma blueprint — the rikma (if new), missions, resources, products, partner invites — through the same actions the forms run. Triggered only from the review screen.",
  graphqlOperation: materializeHandler,
  paramSchema: {
    sessionId: { type: 'string', required: true },
    selectedKeys: { type: 'array', required: true, description: 'Keys of the rows the owner ticked' },
    expectedVersion: { type: 'number', required: true },
    ops: { type: 'array', required: false, description: 'Inline edits made on the review screen, applied first' },
    via: { type: 'string', required: false }
  },
  // Deliberately NOT exposed to api keys: an agent prepares, the person creates.
  access: ['user'],
  authRules: [{ type: 'jwt', errorMessage: 'Log in to create the rikma' }],
  updateStrategy: { type: 'fullRefresh' }
};

// ── shareRikmaPreview ───────────────────────────────────────────────────────

/** How long a preview link lives (§4.4). */
export const SHARE_DAYS = 30;

export function previewUrl(key: string): string {
  return `${SITE}/preview/rikma/${key}`;
}

/**
 * "Show my partners how it would look" (§4.4): a read-only link to the draft,
 * for people who may not have an account. A fresh key every call — making a
 * new link is how the owner revokes the old one; `revoke` just ends it.
 */
const shareHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const row = await ownedSession(strapi, params.sessionId, context);
  if (row.kind !== 'rikma') throw new Error('Only a rikma draft has a preview');
  if (params.revoke === true) {
    await setShare(strapi, row.id, null, context.fetch);
    return { data: { previewUrl: null, expiresAt: null }, updateStrategy: { type: 'none' as const } };
  }
  const expiresAt = nextShareExpiry(row.shareExpiresAt, new Date(), SHARE_DAYS);
  const key = (await setShare(strapi, row.id, { expiresAt }, context.fetch))!;
  return { data: { previewUrl: previewUrl(key), expiresAt }, updateStrategy: { type: 'none' as const } };
};

export const shareRikmaPreviewConfig: ActionConfig = {
  key: 'shareRikmaPreview',
  description:
    "Make (or end, with revoke) a read-only link to the caller's rikma draft, to show partners how it would look on 1lev1. A new call replaces the previous link.",
  graphqlOperation: shareHandler,
  paramSchema: {
    sessionId: { type: 'string', required: true },
    revoke: { type: 'boolean', required: false }
  },
  authRules: [{ type: 'jwt' }],
  updateStrategy: { type: 'none' }
};

// ── startAssistantSession (profile / wish) ─────────────────────────────────

const SITE_WISH = (id: string) => `${SITE}/concierge/${id}`;

/**
 * Open (or continue) the living list of a profile or a wish (§6, §7).
 *   profile: what is on the profile now, plus — with `text` — what the text
 *            says (the onboarding's own analysis). An agent-prepared profile
 *            session (`sessionId`) is seeded from the words it carries.
 *   wish:    `ratsonId` → its breakdown; `text` → a new draft wish, extracted.
 * Uses a model only when there is text to read.
 */
const startHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const kind = String(params.kind ?? '');
  const uid = String(context.userId);
  const lang = langOf(context);
  const text = typeof params.text === 'string' ? params.text.trim().slice(0, 8000) : '';
  const k = await import('$lib/server/assistant/kinds.js');

  if (kind === 'profile') {
    const { profileItems, mergeAnalysis } = await import('$lib/assistant/profile.js');
    let row: SessionRow | null = params.sessionId ? await ownedSession(strapi, params.sessionId, context) : null;
    if (row && row.kind !== 'profile') throw new Error('Not a profile session');
    row = row ?? (params.fresh === true ? null : await findLatestSession(strapi, uid, 'profile', context.fetch));

    const source = text || (row && !row.state.items.length ? (row.sourceText ?? '') : '');
    const { snapshot } = await k.loadProfile(strapi, uid, context.fetch);
    let state = row && row.state.items.length ? row.state : { items: profileItems(snapshot) };
    if (source.length >= 30) {
      const cv = await k.analyzeProfileText(source, lang);
      state = mergeAnalysis(state, cv);
    }

    if (!row) {
      row = await createSession(
        strapi,
        { userId: uid, kind: 'profile', state, startedVia: via(params.via), lang, sourceText: source || null },
        context.fetch
      );
    } else if (state !== row.state) {
      const saved = await saveSession(
        strapi,
        row,
        { state, revision: { at: new Date().toISOString(), via: via(params.via), instruction: source ? 'read text' : 'seed', ops: [], changes: [] } },
        context.fetch
      );
      if ('row' in saved) row = saved.row;
    }
    return { data: publicView(row), updateStrategy: { type: 'none' as const } };
  }

  if (kind === 'wish') {
    const { wishToState } = await import('$lib/assistant/wish.js');
    let ratsonId = params.ratsonId ? String(params.ratsonId) : '';
    if (!ratsonId) {
      if (text.length < 20) throw new Error('Pass a ratsonId, or the wish in words');
      // A new wish from words: extracted like the composer does, saved as a
      // DRAFT — publishing stays the person's own act (§7.2).
      const { extractWish } = await import('$lib/server/ai/extractWish.js');
      const ex = await extractWish(text);
      const { actionService } = await import('$lib/server/actions/index.js');
      const r = await actionService.executeAction(
        'createRatson',
        {
          name: (ex.titleSuggestion || text.split('\n')[0]).slice(0, 80),
          longDes: text,
          status_ratson: 'draft',
          access_mode: 'personal',
          language: lang,
          ai_meta: { categories: ex.categories ?? [] },
          extracted_missions: (ex.missions ?? []).map((m) => ({ name: m.name, importance: m.imp === 'must' ? 'must' : 'nice' })),
          extracted_resources: (ex.resources ?? []).map((m) => ({ name: m.name, importance: m.imp === 'must' ? 'must' : 'nice' }))
        },
        context
      );
      ratsonId = r?.success ? String((r.data as any)?.ratsonId ?? '') : '';
      if (!ratsonId) throw new Error(r?.error?.message || 'Could not save the wish');
    }
    const wish = await k.loadOwnedWish(strapi, ratsonId, uid, context.jwt, context.fetch);
    const existing = await findLatestSession(strapi, uid, 'wish', context.fetch);
    if (existing && existing.ratsonId === ratsonId) {
      return { data: { ...publicView(existing), siteUrl: SITE_WISH(ratsonId) }, updateStrategy: { type: 'none' as const } };
    }
    const row = await createSession(
      strapi,
      { userId: uid, kind: 'wish', state: wishToState(wish.attrs, wish.proposals), startedVia: via(params.via), lang, ratsonId, sourceText: text || null },
      context.fetch
    );
    return { data: { ...publicView(row), siteUrl: SITE_WISH(ratsonId) }, updateStrategy: { type: 'none' as const } };
  }

  throw new Error("kind must be 'profile' or 'wish' (a rikma starts with proposeRikmaBlueprint)");
};

export const startAssistantSessionConfig: ActionConfig = {
  key: 'startAssistantSession',
  description:
    "Open or continue the caller's living list of their profile (kind 'profile', optionally reading a text about them) or of a wish (kind 'wish': ratsonId, or text for a new draft wish).",
  graphqlOperation: startHandler,
  paramSchema: {
    kind: { type: 'string', required: true, description: "'profile' | 'wish'" },
    text: { type: 'string', required: false },
    ratsonId: { type: 'string', required: false },
    sessionId: { type: 'string', required: false, description: 'Continue this profile session (e.g. one an agent prepared)' },
    fresh: { type: 'boolean', required: false },
    via: { type: 'string', required: false }
  },
  authRules: [{ type: 'jwt' }],
  updateStrategy: { type: 'none' }
};

// ── reviseAssistantSession ─────────────────────────────────────────────────

/** The person's words → ops (the model), applied exactly like setAssistantItems. */
const reviseHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const row = await ownedSession(strapi, params.sessionId, context);
  if (row.status === 'closed') throw new Error('This session is closed');
  const instruction = typeof params.instruction === 'string' ? params.instruction.trim() : '';
  if (!instruction) throw new Error('Say what to change');

  const { runRevise } = await import('$lib/server/assistant/kinds.js');
  const reply = await runRevise({ kind: row.kind, state: row.state, revisions: row.revisions, instruction, lang: langOf(context) });
  const who = via(params.via);
  const r = applyOps(row.state, reply.ops as any[], { kind: row.kind, origin: 'revision' });
  const state = { ...r.state, questions: reply.questions };

  const saved = await saveSession(
    strapi,
    row,
    {
      state,
      expectedVersion: Number(params.expectedVersion),
      revision: { at: new Date().toISOString(), via: who, instruction: instruction.slice(0, 1000), say: reply.say, ops: r.applied, changes: r.changes }
    },
    context.fetch
  );
  if ('conflict' in saved) {
    return { data: { ...publicView(saved.conflict), conflict: true, say: '', rejected: [] }, updateStrategy: { type: 'none' as const } };
  }
  return {
    data: { ...publicView(saved.row), conflict: false, say: reply.say, applied: r.applied.length, rejected: r.rejected },
    updateStrategy: { type: 'none' as const }
  };
};

export const reviseAssistantSessionConfig: ActionConfig = {
  key: 'reviseAssistantSession',
  description: "Refine the caller's list in plain words (a model turns them into ops). Returns the new list, what was said back, and any questions.",
  graphqlOperation: reviseHandler,
  paramSchema: {
    sessionId: { type: 'string', required: true },
    instruction: { type: 'string', required: true },
    expectedVersion: { type: 'number', required: true },
    via: { type: 'string', required: false }
  },
  authRules: [{ type: 'jwt' }],
  updateStrategy: { type: 'none' }
};

// ── applyAssistantSession ──────────────────────────────────────────────────

/**
 * Make the list real where the chat may (decision §0.1):
 *   profile           → saved to the profile, straight away;
 *   wish (draft)      → the draft's breakdown is updated; publishing stays on the site;
 *   wish (published)  → my own rows are updated and matching re-runs; rows a
 *                        supplier answered are locked and never touched;
 *   rikma             → nothing here — it returns the review screen.
 */
const applyHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const row = await ownedSession(strapi, params.sessionId, context);
  if (row.kind === 'rikma') {
    return { data: { ...publicView(row), applied: false, reviewUrl: reviewUrl(row) }, updateStrategy: { type: 'none' as const } };
  }
  if (Number(params.expectedVersion) !== row.version) {
    return { data: { ...publicView(row), conflict: true }, updateStrategy: { type: 'none' as const } };
  }
  const k = await import('$lib/server/assistant/kinds.js');
  const uid = String(context.userId);

  if (row.kind === 'profile') {
    const out = await k.applyProfile(strapi, uid, row.state, { jwt: context.jwt ?? '', lang: langOf(context), fetch: context.fetch });
    const saved = await saveSession(
      strapi,
      row,
      {
        state: out.state,
        patch: { appliedAt: new Date().toISOString() },
        revision: { at: new Date().toISOString(), via: via(params.via), instruction: 'save to profile', say: out.written.join(','), ops: [], changes: [] }
      },
      context.fetch
    );
    const finalRow = 'row' in saved ? saved.row : row;
    return {
      data: { ...publicView(finalRow), applied: out.written.length > 0, written: out.written, unresolved: out.unresolved, conflict: false },
      updateStrategy: { type: 'none' as const }
    };
  }

  // wish
  if (!row.ratsonId) throw new Error('This list is not tied to a wish');
  const { planWishApply, wishToState } = await import('$lib/assistant/wish.js');
  const wish = await k.loadOwnedWish(strapi, row.ratsonId, uid, context.jwt, context.fetch);
  const plan = planWishApply(row.state, wish.attrs);
  const { actionService } = await import('$lib/server/actions/index.js');

  if (plan.changed) {
    const rows = { ratsonId: row.ratsonId, extracted_missions: plan.extracted_missions, extracted_resources: plan.extracted_resources };
    const r = wish.isDraft
      ? await actionService.executeAction('updateRatsonDraft', rows, context)
      : await actionService.executeAction('updateRatsonExtraction', rows, context);
    if (!r?.success) throw new Error(r?.error?.message || 'Could not update the wish');
    if (!wish.isDraft) {
      // New rows meet the suppliers who can answer them.
      await actionService
        .executeAction('refreshWishMatches', { ratsonId: row.ratsonId, rematch: true }, context)
        .catch((e: unknown) => console.warn('[assistant] refreshWishMatches after apply failed', e));
    }
  }

  // The saved wish is the truth now: reseed from it (positions and locks included).
  const fresh = await k.loadOwnedWish(strapi, row.ratsonId, uid, context.jwt, context.fetch);
  const saved = await saveSession(
    strapi,
    row,
    {
      state: { ...wishToState(fresh.attrs, fresh.proposals), questions: row.state.questions },
      patch: { appliedAt: new Date().toISOString() },
      revision: { at: new Date().toISOString(), via: via(params.via), instruction: 'save to wish', ops: [], changes: [] }
    },
    context.fetch
  );
  const finalRow = 'row' in saved ? saved.row : row;
  return {
    data: {
      ...publicView(finalRow),
      applied: plan.changed,
      keptBecauseAnswered: plan.kept.length,
      // Publishing, and anything about a row a supplier answered, happens there.
      siteUrl: SITE_WISH(row.ratsonId),
      conflict: false
    },
    updateStrategy: { type: 'none' as const }
  };
};

export const applyAssistantSessionConfig: ActionConfig = {
  key: 'applyAssistantSession',
  description:
    "Apply the caller's list: a profile is saved to their profile; a wish's own rows are saved to it (a draft stays a draft; rows a supplier answered are never changed). A rikma is not created here - the review URL comes back instead.",
  graphqlOperation: applyHandler,
  paramSchema: {
    sessionId: { type: 'string', required: true },
    expectedVersion: { type: 'number', required: true },
    via: { type: 'string', required: false }
  },
  authRules: [{ type: 'jwt' }],
  updateStrategy: { type: 'none' }
};

// ── claimAssistantSession ───────────────────────────────────────────────────

/**
 * The first thing after an agent-prepared signup (§5.4): the pending session
 * tied to the signatory row this account was created with becomes the
 * account's, and the caller learns where to continue. By the chezin row only —
 * text someone prepared with your email does not become yours by the email.
 *
 * Idempotent: once claimed nothing is pending, and the answer is `null` — so a
 * page may call it on every first visit without a cost to anyone.
 */
const claimHandler: ActionExecutionHandler = async (_params, context, { strapi }) => {
  const none = { data: { claimed: null }, updateStrategy: { type: 'none' as const } };
  const userRes = await strapi.execute('379getUserChezin', { uid: String(context.userId) }, undefined, context.fetch);
  const chezinId = userRes?.data?.usersPermissionsUser?.data?.attributes?.chezin?.data?.id;
  if (!chezinId) return none;

  const pending = await findPendingByChezin(strapi, String(chezinId), new Date(), context.fetch);
  const row = pending[0];
  if (!row) return none;

  let saved = await saveSession(strapi, row, { patch: { userId: String(context.userId), status: 'active' } }, context.fetch);
  let current = 'row' in saved ? saved.row : row;

  // An order: the words they told the agent become their draft wish, which the
  // composer opens — still a draft, published only by them.
  if (current.kind === 'wish' && !current.ratsonId && current.sourceText) {
    const { actionService } = await import('$lib/server/actions/index.js');
    const text = current.sourceText.trim();
    const r = await actionService
      .executeAction(
        'createRatson',
        { name: text.split('\n')[0].slice(0, 80), longDes: text, status_ratson: 'draft', access_mode: 'personal', language: current.lang ?? 'he' },
        context
      )
      .catch(() => null);
    const ratsonId = r?.success ? (r.data as any)?.ratsonId : null;
    if (ratsonId) {
      saved = await saveSession(strapi, current, { patch: { ratsonId: String(ratsonId) } }, context.fetch);
      if ('row' in saved) current = saved.row;
    }
  }

  return {
    data: {
      claimed: {
        sessionId: current.id,
        kind: current.kind,
        landing: landingFor({ id: current.id, kind: current.kind, itemCount: current.state.items.length, ratsonId: current.ratsonId })
      }
    },
    updateStrategy: { type: 'none' as const }
  };
};

export const claimAssistantSessionConfig: ActionConfig = {
  key: 'claimAssistantSession',
  description:
    "After an agent-prepared signup: make the pending session tied to the caller's signatory row theirs, and say where to continue. Returns claimed:null when there is nothing waiting.",
  graphqlOperation: claimHandler,
  paramSchema: {},
  access: ['user'],
  authRules: [{ type: 'jwt' }],
  updateStrategy: { type: 'none' }
};

// ── importPlanBoardRows ─────────────────────────────────────────────────────

/**
 * "Create all" on a planning board (§4.5): the board's open product, mission
 * and resource rows become a rikma-import session for the same review screen,
 * instead of being opened one by one in their forms. Nothing is created here;
 * the owner ticks and creates on the screen, and each created row is marked
 * `created` on its board.
 */
const importBoardHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const projectId = String(params.projectId ?? '');
  const boardId = String(params.boardId ?? '');
  const res = await strapi.execute('286getPlanBoard', { id: boardId }, context.jwt, context.fetch);
  const board = res?.data?.projectPlanBoard?.data;
  if (!board || String(board.attributes?.project?.data?.id ?? '') !== projectId) {
    throw new Error('This planning board does not belong to the given project');
  }

  const only = Array.isArray(params.itemIds) && params.itemIds.length ? new Set(params.itemIds.map(String)) : null;
  const items = (board.attributes?.items?.data ?? []).filter((it: any) => !only || only.has(String(it.id)));
  const built = boardItemsToBlueprint(items, {
    name: String(board.attributes?.project?.data?.attributes?.projectName ?? '')
  });
  if (!built) throw new Error('No product, mission or resource on this board is waiting to be created');

  const { state } = blueprintToState(built.blueprint, { origin: 'manual' });
  // A board import is not a new rikma: the fields only name the existing one.
  const row = await createSession(
    strapi,
    {
      userId: String(context.userId),
      kind: 'rikma',
      state: stampPlanItems(state, built.planItemIds, boardId),
      startedVia: 'site',
      lang: langOf(context),
      projectId,
      sourceText: String(board.attributes?.title ?? '').slice(0, 500) || null
    },
    context.fetch
  );

  return {
    data: { sessionId: row.id, reviewUrl: reviewUrl(row), reviewPath: `/moach/${projectId}/import/${row.id}` },
    updateStrategy: { type: 'none' as const }
  };
};

export const importPlanBoardRowsConfig: ActionConfig = {
  key: 'importPlanBoardRows',
  description:
    "Turn a planning board's open product / mission / resource rows into a rikma-import draft for the one-click review screen. Creates nothing; returns the review path.",
  graphqlOperation: importBoardHandler,
  paramSchema: {
    projectId: { type: 'string', required: true },
    boardId: { type: 'string', required: true },
    itemIds: { type: 'array', required: false, description: 'Only these rows (default: every open row)' }
  },
  access: ['user'],
  authRules: [
    { type: 'jwt', errorMessage: 'You must be logged in to plan' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'You must be a member of this project to create from its planning boards'
    }
  ],
  updateStrategy: { type: 'none' }
};

export const assistantActions: ActionConfig[] = [
  importPlanBoardRowsConfig,
  claimAssistantSessionConfig,
  startAssistantSessionConfig,
  reviseAssistantSessionConfig,
  applyAssistantSessionConfig,
  shareRikmaPreviewConfig,
  proposeRikmaBlueprintConfig,
  getAssistantSessionConfig,
  setAssistantItemsConfig,
  undoAssistantRevisionConfig,
  materializeRikmaBlueprintConfig
];
