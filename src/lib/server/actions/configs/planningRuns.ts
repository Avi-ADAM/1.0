/**
 * Planning AI runs — PLAN_PROJECT_PLANNING_BOARDS §1
 *
 * The two tiers that actually invoke a model, and persist what comes back.
 * Both are triggered by an explicit user action — **neither runs
 * automatically**, and neither creates a real mission/act/resource. They only
 * produce proposals a human then approves in the normal creation form.
 *
 *  - `scanProjectDirections` (tier 1, thin/cheap): reads the project's real
 *    state and proposes 3–5 directions as `suggested` boards with no items.
 *  - `expandPlanBoard` (tier 2, the big run): breaks ONE direction into
 *    concrete rows, deduplicated against what the project already has.
 *
 * `createPlanBoardFromText` is the free-text entry point: it creates a board
 * and expands it in a single step.
 *
 * `seedPlanBoards` is the onboarding entry point: it persists the starter
 * boards drafted from a business description into the rikma the member has
 * just approved (PLAN_ONBOARDING Track B).
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import type { ExpandedItem } from '../../planning/expandDirection.js';

/**
 * The planning engines are loaded lazily, inside the handlers.
 *
 * They pull in the embeddings/vector stack and the model clients, which read
 * `$env/static/private`. Importing them at module scope would drag all of that
 * into the action registry — and therefore into every consumer of
 * `/api/action` — at import time. Deferring keeps the registry cheap to load
 * and side-effect free until a planning run is actually requested.
 */
const loadQuickScan = () => import('../../planning/quickScan.js');
const loadExpandDirection = () => import('../../planning/expandDirection.js');

type Lang = 'he' | 'en' | 'ar';
type SiteMode = 'auto' | 'always' | 'never';

function asLang(v: unknown): Lang {
  return v === 'en' || v === 'ar' ? v : 'he';
}

/**
 * Whether this run may read the rikma's own website for context.
 *
 * `auto` is the default and the point of the feature: the site is read only
 * when the rikma's own description is too thin to plan from. `always` is the
 * member ticking the box; `never` is them unticking it. Anything else — an
 * older client, a confused agent — falls back to `auto`.
 */
function asSiteMode(v: unknown): SiteMode {
  if (v === 'always' || v === 'never') return v;
  if (v === true) return 'always';
  if (v === false) return 'never';
  return 'auto';
}

/** Persist one expansion row as a `project-plan-item`. */
async function persistItem(
  strapi: any,
  context: any,
  boardId: string,
  item: ExpandedItem
): Promise<void> {
  await strapi.execute(
    '289createPlanItem',
    {
      kind: item.kind,
      name: item.name,
      descrip: item.descrip ?? '',
      imp: item.imp === 'must' ? 'must' : 'nice',
      status: 'proposed',
      spec: item.spec ?? {},
      existingRef: item.existingRef ?? null,
      order: item.order ?? 0,
      boardId: String(boardId),
      publishedAt: new Date().toISOString()
    },
    context.jwt,
    context.fetch
  );
}

/** Load a board and assert it belongs to `projectId` (see planningBoards.ts). */
async function loadBoardInProject(
  strapi: any,
  context: any,
  boardId: string,
  projectId: string
): Promise<any> {
  const res = await strapi.execute('286getPlanBoard', { id: String(boardId) }, context.jwt, context.fetch);
  const board = res?.data?.projectPlanBoard?.data;
  if (!board) throw new Error(`Planning board ${boardId} not found`);
  if (String(board.attributes?.project?.data?.id) !== String(projectId)) {
    throw new Error('This planning board does not belong to the given project');
  }
  return board;
}

// ── Tier 1: scanProjectDirections ──────────────────────────────────────────

const scanHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { projectId, lang, siteMode } = params as Record<string, any>;

  const { scanProjectDirections } = await loadQuickScan();
  const scan = await scanProjectDirections(
    String(projectId),
    String(context.userId),
    context.fetch,
    { lang: asLang(lang), siteMode: asSiteMode(siteMode) }
  );

  // Persist each direction as a *suggested* board: thin, no items, waiting for
  // the user to accept it before anything is expanded.
  const created: any[] = [];
  for (const [i, d] of scan.directions.entries()) {
    const res = await strapi.execute(
      '287createPlanBoard',
      {
        title: d.title,
        descrip: d.descrip,
        rationale: d.rationale,
        origin: 'quickScan',
        status: 'suggested',
        sourceText: '',
        order: i,
        projectId: String(projectId),
        userId: String(context.userId),
        publishedAt: new Date().toISOString()
      },
      context.jwt,
      context.fetch
    );
    const node = res?.data?.createProjectPlanBoard?.data;
    if (node) created.push({ id: node.id, ...d });
  }

  return {
    stage: scan.stage,
    signals: scan.signals,
    boards: created,
    // Surfaced so the UI can explain an empty result instead of showing nothing.
    generated: scan.directions.length,
    // Told to the member, so "it read our site" is visible rather than magic.
    siteUsed: scan.siteUsed
  };
};

export const scanProjectDirectionsAction: ActionConfig = {
  key: 'scanProjectDirections',
  description:
    'Tier 1 - a thin, cheap scan of the project that proposes a few directions for advancing it, saved as suggested boards. Never runs automatically.',
  graphqlOperation: scanHandler,
  paramSchema: {
    projectId: { type: 'string', required: true, description: 'ID of the project to scan' },
    lang: { type: 'string', required: false, description: 'he | en | ar' },
    siteMode: {
      type: 'string',
      required: false,
      description:
        "Whether to read the rikma's own website for extra context: auto (default - only when its description is too thin) | always | never"
    }
  },
  access: ['user', 'serviceAdmin'],
  authRules: [
    { type: 'jwt', errorMessage: 'You must be logged in to plan' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'You must be a member of this project to scan it'
    }
  ]
};

// ── Tier 2: expandPlanBoard ────────────────────────────────────────────────

const expandHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { boardId, projectId, lang, revisionNote, siteMode } = params as Record<string, any>;

  const board = await loadBoardInProject(strapi, context, boardId, projectId);
  const attrs = board.attributes ?? {};

  // Everything the direction knows about itself becomes the brief. A revision
  // note (this run only) lets the user steer without rewriting the board.
  const brief = [attrs.title, attrs.descrip, attrs.sourceText, revisionNote]
    .filter((s: unknown) => typeof s === 'string' && s.trim())
    .join('\n');

  if (!brief.trim()) throw new Error('This board has no text to expand');

  const { expandDirection } = await loadExpandDirection();
  const expansion = await expandDirection(
    String(projectId),
    String(context.userId),
    brief,
    context.fetch,
    { lang: asLang(lang), siteMode: asSiteMode(siteMode) }
  );

  for (const item of expansion.items) {
    await persistItem(strapi, context, String(boardId), item);
  }

  // The board is now expanded — and accepted by definition, since the user
  // asked for this run.
  await strapi.execute(
    '288updatePlanBoard',
    {
      id: String(boardId),
      data: {
        status: 'expanded',
        expandedAt: new Date().toISOString(),
        ...(revisionNote ? { revisionNote: String(revisionNote) } : {})
      }
    },
    context.jwt,
    context.fetch
  );

  return {
    boardId: String(boardId),
    itemCount: expansion.items.length,
    duplicateCount: expansion.items.filter((i) => i.existingRef).length,
    hints: expansion.hints,
    siteUsed: expansion.siteUsed,
    usedFallback: expansion.usedFallback
  };
};

export const expandPlanBoardAction: ActionConfig = {
  key: 'expandPlanBoard',
  description:
    'Tier 2 - break one direction into concrete proposed rows (missions/resources), deduplicated against what the project already has. Runs only on explicit request.',
  graphqlOperation: expandHandler,
  paramSchema: {
    boardId: { type: 'string', required: true, description: 'ID of the board to expand' },
    projectId: { type: 'string', required: true, description: 'ID of the project the board belongs to' },
    lang: { type: 'string', required: false, description: 'he | en | ar' },
    revisionNote: {
      type: 'string',
      required: false,
      description: 'Free-text steer for this run ("more marketing, drop the budget ones")'
    },
    siteMode: {
      type: 'string',
      required: false,
      description:
        "Whether to read the rikma's own website for extra context: auto (default) | always | never"
    }
  },
  access: ['user', 'serviceAdmin'],
  authRules: [
    { type: 'jwt', errorMessage: 'You must be logged in to plan' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'You must be a member of this project to expand its planning boards'
    }
  ]
};

// ── Free-text entry point ──────────────────────────────────────────────────

const fromTextHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { projectId, text, title, lang, siteMode } = params as Record<string, any>;

  const brief = String(text || '').trim();
  if (brief.length < 20) {
    throw new Error('Write a little more so the plan has something to work with');
  }

  const { expandDirection } = await loadExpandDirection();
  const expansion = await expandDirection(
    String(projectId),
    String(context.userId),
    brief,
    context.fetch,
    { lang: asLang(lang), siteMode: asSiteMode(siteMode) }
  );

  const boardTitle =
    String(title || '').trim() ||
    expansion.titleSuggestion ||
    brief.slice(0, 60);

  const boardRes = await strapi.execute(
    '287createPlanBoard',
    {
      title: boardTitle,
      descrip: '',
      rationale: '',
      origin: 'freeText',
      // Free text arrives already expanded — the user wrote the direction.
      status: 'expanded',
      sourceText: brief,
      order: 0,
      projectId: String(projectId),
      userId: String(context.userId),
      publishedAt: new Date().toISOString()
    },
    context.jwt,
    context.fetch
  );

  const boardNode = boardRes?.data?.createProjectPlanBoard?.data;
  if (!boardNode) throw new Error('Failed to create planning board');

  for (const item of expansion.items) {
    await persistItem(strapi, context, String(boardNode.id), item);
  }

  return {
    boardId: String(boardNode.id),
    title: boardTitle,
    itemCount: expansion.items.length,
    duplicateCount: expansion.items.filter((i) => i.existingRef).length,
    hints: expansion.hints,
    siteUsed: expansion.siteUsed,
    usedFallback: expansion.usedFallback
  };
};

export const createPlanBoardFromTextAction: ActionConfig = {
  key: 'createPlanBoardFromText',
  description:
    'Create a planning board from free text the user wrote, expanded into proposed rows in one step.',
  graphqlOperation: fromTextHandler,
  paramSchema: {
    projectId: { type: 'string', required: true, description: 'ID of the project' },
    text: { type: 'string', required: true, description: 'What the user wrote' },
    title: { type: 'string', required: false, description: 'Optional board title (defaults to an AI suggestion)' },
    lang: { type: 'string', required: false, description: 'he | en | ar' },
    siteMode: {
      type: 'string',
      required: false,
      description:
        "Whether to read the rikma's own website for extra context: auto (default) | always | never"
    }
  },
  access: ['user', 'serviceAdmin'],
  authRules: [
    { type: 'jwt', errorMessage: 'You must be logged in to plan' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'You must be a member of this project to plan it'
    }
  ]
};

// ── Onboarding: seed a brand-new rikma with its starter boards ──────────────

const loadSeedPlan = () => import('../../planning/seedPlan.js');

/**
 * Persist the starter boards drafted during business onboarding.
 *
 * The plan is drafted by `/api/analyze-business` *before* the rikma exists —
 * boards need a project id, and the member has not approved the rikma yet — so
 * it makes a round trip through the browser. What arrives here is therefore
 * client-supplied and is re-validated by `normalizeSeedPlan` rather than
 * trusted: clamped text, capped counts, no assignees, no fields on the wrong
 * kind. A member could in any case create these boards by hand; what must not
 * happen is an unbounded blob reaching Strapi.
 *
 * Still nothing real: every row lands as `proposed`, and becomes a mission /
 * product / resource only when a human opens it in the creation form.
 */
const seedHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { projectId, plan, sourceUrl, lang } = params as Record<string, any>;

  const { normalizeSeedPlan, countSeedItems } = await loadSeedPlan();
  const boards = normalizeSeedPlan(plan);
  if (boards.length === 0) {
    return { boardIds: [], boardCount: 0, itemCount: 0, skipped: 'empty-plan' };
  }

  // The creation form does not take free-text vocabulary — it maps chips back
  // to catalogue ids and drops what it cannot find. Resolve every mission row's
  // skills/roles/work-ways to real entries (creating what does not exist yet)
  // before persisting, so the member's approval is not quietly trimmed.
  const { resolveRowVocabulary } = await loadExpandDirection();

  const boardIds: string[] = [];
  for (const [i, board] of boards.entries()) {
    const res = await strapi.execute(
      '287createPlanBoard',
      {
        title: board.title,
        descrip: board.descrip,
        rationale: board.rationale,
        origin: 'agent',
        // Seed boards arrive with their rows already in them, so they are
        // `expanded` from birth — there is nothing left to expand.
        status: 'expanded',
        sourceText: String(sourceUrl || ''),
        order: i,
        projectId: String(projectId),
        userId: String(context.userId),
        publishedAt: new Date().toISOString()
      },
      context.jwt,
      context.fetch
    );

    const node = res?.data?.createProjectPlanBoard?.data;
    if (!node) continue;
    boardIds.push(String(node.id));

    const rows: ExpandedItem[] = board.items.map((row, order) => ({
      kind: row.kind,
      name: row.name,
      descrip: row.descrip,
      imp: row.imp,
      spec: seedSpec(row),
      existingRef: null,
      order
    }));

    const resolved = await resolveRowVocabulary(rows, context.fetch, asLang(lang));
    for (const row of resolved) {
      await persistItem(strapi, context, String(node.id), row);
    }
  }

  return {
    boardIds,
    boardCount: boardIds.length,
    itemCount: countSeedItems(boards),
    firstBoardId: boardIds[0] ?? null
  };
};

/**
 * The prefill a seeded row carries into the real creation form. Same keys the
 * forms already read (`mission.svelte` via `initialSpec`, `ResourceCreator`,
 * `newmatana`), so nothing the draft suggested is lost at the form's door.
 */
function seedSpec(row: any): Record<string, unknown> {
  const spec: Record<string, unknown> = {};
  if (row.rationale) spec.rationale = row.rationale;
  if (row.kind === 'mission') {
    if (row.skills?.length) spec.skills = row.skills;
    if (row.roles?.length) spec.roles = row.roles;
    if (row.workways?.length) spec.workways = row.workways;
    if (row.nhours != null) spec.nhours = row.nhours;
    if (row.valph != null) spec.valph = row.valph;
  } else if (row.kind === 'resource' || row.kind === 'product') {
    if (row.kindOf) spec.kindOf = row.kindOf;
    if (row.price != null) spec.price = row.price;
    if (row.quantity != null) spec.quantity = row.quantity;
  }
  return spec;
}

export const seedPlanBoardsAction: ActionConfig = {
  key: 'seedPlanBoards',
  description:
    'Persist the starter planning boards drafted during business onboarding into a newly created rikma. Creates proposals only - no mission, resource or product is created.',
  graphqlOperation: seedHandler,
  paramSchema: {
    projectId: { type: 'string', required: true, description: 'ID of the rikma just created' },
    plan: {
      type: 'object',
      required: true,
      description: 'The drafted plan: { boards: [{ title, descrip, rationale, items: [...] }] }'
    },
    sourceUrl: {
      type: 'string',
      required: false,
      description: 'The website or note the plan was drafted from, kept on the board'
    },
    lang: {
      type: 'string',
      required: false,
      description: 'he | en | ar - the language new vocabulary entries are created in'
    }
  },
  access: ['user', 'serviceAdmin'],
  authRules: [
    { type: 'jwt', errorMessage: 'You must be logged in to plan' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'You must be a member of this rikma to seed its planning boards'
    }
  ]
};
