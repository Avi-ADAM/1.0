/**
 * Assistant sessions — the living list the site chat and an outside agent
 * both edit (docs/PLAN_AI_SIGNUP_CONCIERGE.md §3, §4, §9.2).
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
import type { AssistantItem, AssistantKind, AssistantVia } from '$lib/assistant/types.js';
import type { ActionConfig, ActionContext, ActionExecutionHandler } from '../types.js';
import {
  createSession,
  findLatestSession,
  loadSession,
  ownsSession,
  publicView,
  saveSession,
  type SessionRow,
  type StrapiLike
} from '$lib/server/assistant/session.js';

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
  return {
    data: { session: { ...publicView(row), ...(row.kind === 'rikma' ? { reviewUrl: reviewUrl(row) } : {}) } },
    updateStrategy: { type: 'none' as const }
  };
};

export const getAssistantSessionConfig: ActionConfig = {
  key: 'getAssistantSession',
  description: "Read one of the caller's assistant sessions (by id, or the latest of a kind).",
  graphqlOperation: getHandler,
  paramSchema: {
    sessionId: { type: 'string', required: false },
    kind: { type: 'string', required: false, description: 'profile | rikma | wish — latest session of this kind' }
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

export const assistantActions: ActionConfig[] = [
  proposeRikmaBlueprintConfig,
  getAssistantSessionConfig,
  setAssistantItemsConfig,
  undoAssistantRevisionConfig,
  materializeRikmaBlueprintConfig
];
