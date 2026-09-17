/**
 * Planning tools for the bot and external MCP agents
 * (PLAN_PROJECT_PLANNING_BOARDS §7 step 9; PLAN_AI_ERA stage 2).
 *
 * These are the "propose, then send the human to approve" tools, applied to a
 * *set* of entities rather than one. Neither creates a mission, act or
 * resource: they write a planning board of **proposals** and hand back a
 * `reviewUrl`. The user opens that page, reviews each row, and approves it in
 * the real creation form — where the action runs under their own session.
 *
 * Both require a projectId and are membership-gated by the underlying actions'
 * `projectMember` rule, so an agent cannot plan inside a project its owner is
 * not part of.
 */

import { randomUUID } from 'node:crypto';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { actionService } from '../../lib/server/actions/index.js';
import { getMcpContext } from '../../lib/server/mcpContext.js';
import { adminToken } from '../../lib/server/adminToken.js';
import {
  MAX_AGENT_ITEMS,
  MAX_ROW_DESCRIP,
  normalizeAgentItems
} from '../../lib/server/planning/agentBoard.js';

/**
 * An external agent runs in a chat, not on the site, so a relative link is one
 * it has to guess the domain for. Local on purpose: keyDiagnosis carries the
 * same constant but imports the API-key store.
 */
const SITE_ORIGIN = 'https://1lev1.com';

/** Where a human reviews a planning board (site-relative). */
export function buildBoardReviewUrl(projectId: string, boardId?: string | null): string {
  const base = `/moach/${projectId}/create`;
  return boardId ? `${base}?board=${encodeURIComponent(String(boardId))}` : base;
}

/** Minimum brief the action accepts — checked here so the agent hears why. */
const MIN_BRIEF = 20;

/**
 * What an agent needs to decide its next step after a failure.
 *
 * "Database operation failed" alone left an agent three bad choices: retry in a
 * loop, give up, or invent an explanation. `retryable` settles the first,
 * `hint` says whose problem it is, and `requestId` is the line in the server
 * log that holds the real Strapi error.
 */
export interface ToolFailure {
  code: string;
  retryable: boolean;
  requestId: string;
  hint: string;
}

const failureSchema = z
  .object({
    code: z.string(),
    retryable: z.boolean().describe('true only when retrying the same call later may succeed'),
    requestId: z.string().describe('Quote this when reporting the problem'),
    hint: z.string()
  })
  .optional();

/**
 * Map an ActionService error to a ToolFailure. Pure — exported for tests.
 *
 * The action system flattens every Strapi failure into `STRAPI_ERROR`; the
 * distinction that matters to a caller survives in `details[0]`.
 */
export function describeActionFailure(
  error: { code?: string; message?: string; details?: any } | undefined,
  requestId: string
): ToolFailure {
  const first = Array.isArray(error?.details) ? error!.details[0] : undefined;
  const sub = first?.extensions?.code;
  const status = Number(first?.extensions?.status);
  const text = String(first?.message ?? '');

  switch (error?.code) {
    case 'UNAUTHORIZED':
      return {
        code: 'NOT_ALLOWED',
        retryable: false,
        requestId,
        hint:
          `${error.message ?? 'Not allowed'}. The user must be a member of this project - ` +
          'check the projectId with findUserProjectsTool.'
      };
    case 'VALIDATION_FAILED':
      return {
        code: 'INVALID_INPUT',
        retryable: false,
        requestId,
        hint: 'The parameters were rejected; fix the input and call again.'
      };
    case 'STRAPI_ERROR':
      if (sub === 'FORBIDDEN' || status === 401 || status === 403 || /forbidden/i.test(text)) {
        return {
          code: 'SERVER_PERMISSION_DENIED',
          retryable: false,
          requestId,
          hint:
            'The platform is not permitted to save planning boards. This is a server configuration problem, ' +
            'not your input - retrying will not help. Tell the user and quote the requestId.'
        };
      }
      if (sub === 'NETWORK_ERROR' || status >= 500) {
        return {
          code: 'SERVER_UNAVAILABLE',
          retryable: true,
          requestId,
          hint: 'The database was unreachable. Retry once after a minute; if it fails again, quote the requestId.'
        };
      }
      return {
        code: 'PLAN_SAVE_FAILED',
        retryable: false,
        requestId,
        hint:
          'The database rejected the planning board. This is a server-side problem, not your input - ' +
          'retrying will not help. Tell the user and quote the requestId.'
      };
    default:
      return {
        code: 'INTERNAL_ERROR',
        retryable: false,
        requestId,
        hint: 'Unexpected server error. Tell the user and quote the requestId.'
      };
  }
}

/** Log the real cause under the requestId — messages and codes only, no variables. */
function logFailure(tool: string, requestId: string, projectId: string, userId: string, error: any) {
  const details = Array.isArray(error?.details)
    ? error.details.map((d: any) => ({
        message: d?.message,
        code: d?.extensions?.code,
        status: d?.extensions?.status,
        queryId: d?.extensions?.queryId
      }))
    : error?.details;
  console.error(`❌ ${tool} failed`, {
    requestId,
    projectId,
    userId,
    code: error?.code,
    message: error?.message ?? String(error),
    details
  });
}

function failed(prefix: string, failure: ToolFailure) {
  return {
    success: false,
    error: failure,
    message: `${prefix} [${failure.code}, requestId ${failure.requestId}]: ${failure.hint}`
  };
}

/** A saved board row as the agent sees it — enough to discuss before opening the board. */
const rowSchema = z.object({
  id: z.string().nullable(),
  type: z.string().describe('mission | act | resource | product | note'),
  name: z.string(),
  descrip: z.string(),
  imp: z.string().describe('must | nice'),
  rationale: z.string(),
  alreadyExists: z
    .object({ type: z.string(), id: z.string(), name: z.string() })
    .nullable()
    .describe('Set when the project already has something very similar - the board flags it too.')
});

/** Exported for tests. */
export function toRowOutput(row: any): z.infer<typeof rowSchema> {
  const ref = row?.existingRef;
  return {
    id: row?.id != null ? String(row.id) : null,
    type: String(row?.kind ?? ''),
    name: String(row?.name ?? ''),
    descrip: String(row?.descrip ?? ''),
    imp: row?.imp === 'must' ? 'must' : 'nice',
    rationale: String(row?.rationale ?? ''),
    alreadyExists: ref ? { type: String(ref.type), id: String(ref.id), name: String(ref.name ?? '') } : null
  };
}

const rejectedSchema = z
  .array(z.object({ index: z.number(), name: z.string(), reason: z.string() }))
  .optional()
  .describe('Items that were NOT saved, by their position in your `items`, with why.');

/** Shared context/plumbing for all tools. */
function resolveCallContext() {
  const ctx = getMcpContext();
  if (!ctx?.userId || !ctx?.fetchInstance) return null;
  return {
    userId: ctx.userId,
    lang: ctx.lang ?? 'he',
    fetch: ctx.fetchInstance,
    jwt: adminToken()
  };
}

// ── Tier 2 / free text: build a plan the user reviews ──────────────────────

export const planProjectWorkTool = createTool({
  id: 'planProjectWorkTool',
  description:
    'Turn a free-text brief into a planning board for a project: proposed missions, chores (acts) and resources, deduplicated against what the project already has. ' +
    'Nothing is created - the tool returns a reviewUrl where the user approves each row in the real form. ' +
    'Use this when the user describes something they want the project to achieve in loose words. ' +
    'If the conversation already holds a concrete breakdown (tasks, scope, decisions), use createPlanBoardTool instead - it saves your rows as written. ' +
    'Requires a projectId (use findUserProjectsTool first if unknown). ' +
    'On failure, `error.retryable` says whether calling again can help.',
  inputSchema: z.object({
    projectId: z.string().describe('ID of the project to plan for.'),
    text: z
      .string()
      .describe(
        `What the user wants to advance, in their own words. At least ${MIN_BRIEF} characters - the richer the brief, the better the breakdown.`
      ),
    title: z.string().optional().describe('Optional title for the board; otherwise one is suggested.')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    boardId: z.string().optional(),
    title: z.string().optional(),
    itemCount: z.number().optional(),
    duplicateCount: z.number().optional(),
    items: z.array(rowSchema).optional().describe('The proposed rows, in board order. Show them to the user.'),
    reviewUrl: z.string().optional().describe('Absolute link to the board. Pass it to the user verbatim.'),
    navigation: z.object({ url: z.string(), pageName: z.string() }).optional(),
    error: failureSchema,
    message: z.string()
  }),
  execute: async (inputData) => {
    const call = resolveCallContext();
    if (!call) {
      return { success: false, message: 'Missing user context. Authentication required.' };
    }

    const { projectId, text, title } = inputData;
    const requestId = randomUUID();

    if (String(text ?? '').trim().length < MIN_BRIEF) {
      // The action throws a plain Error for this, which production collapses
      // into "An unexpected error occurred" — say it here instead.
      return failed('Could not build a plan', {
        code: 'INVALID_INPUT',
        retryable: false,
        requestId,
        hint: `The brief is too short. Send at least ${MIN_BRIEF} characters describing what the user wants to advance.`
      });
    }

    try {
      const result = await actionService.executeAction(
        'createPlanBoardFromText',
        { projectId, text, ...(title ? { title } : {}), lang: call.lang },
        { userId: call.userId, jwt: call.jwt, lang: call.lang, fetch: call.fetch }
      );

      if (!result.success) {
        logFailure('planProjectWorkTool', requestId, projectId, call.userId, result.error);
        return failed('Could not build a plan', describeActionFailure(result.error, requestId));
      }

      const { boardId, title: boardTitle, itemCount, duplicateCount, usedFallback } = result.data ?? {};
      const path = buildBoardReviewUrl(projectId, boardId);
      const reviewUrl = `${SITE_ORIGIN}${path}`;
      const items = (result.data?.items ?? []).map(toRowOutput);

      const dupNote =
        duplicateCount > 0
          ? ` ${duplicateCount} of them already exist in the project and are flagged as such.`
          : '';
      const fallbackNote = usedFallback
        ? ' The planner fell back to a simpler model, so rows may have no description - if you know the breakdown, createPlanBoardTool will save it as you write it.'
        : '';

      return {
        success: true,
        boardId: String(boardId),
        title: boardTitle,
        itemCount,
        duplicateCount,
        items,
        reviewUrl,
        // Relative: the site's own bots `goto()` it inside the app.
        navigation: { url: path, pageName: 'Planning board' },
        message:
          `Drafted a plan "${boardTitle}" with ${itemCount} proposed item(s).${dupNote}${fallbackNote} ` +
          'Show the user the rows (name and a line of each description) so they can react before opening the board. ' +
          `Nothing has been created yet - the user approves each row at ${reviewUrl}.`
      };
    } catch (error: any) {
      logFailure('planProjectWorkTool', requestId, projectId, call.userId, error);
      return failed('Could not build a plan', describeActionFailure(undefined, requestId));
    }
  }
});

// ── Structured: the agent already has the rows ─────────────────────────────

export const createPlanBoardTool = createTool({
  id: 'createPlanBoardTool',
  description:
    'Create a planning board from rows YOU already structured. Use this when the conversation already holds the breakdown - decisions, scope, a task list: ' +
    'your rows are saved as written, with no second model rewriting or dropping them. ' +
    'Nothing is created - every row is a proposal the user approves in the real creation form at the returned reviewUrl. ' +
    'Every row needs a name AND a descrip; rows without one are not saved and come back in `rejected`. ' +
    'Use planProjectWorkTool instead when the user only has a loose idea in free text. Requires a projectId. ' +
    'On failure, `error.retryable` says whether calling again can help.',
  inputSchema: z.object({
    projectId: z.string().describe('ID of the project to plan for.'),
    title: z.string().describe('Board title - the direction these rows advance.'),
    descrip: z.string().optional().describe('One or two plain-text sentences on what this board is for.'),
    items: z
      .array(
        z.object({
          type: z
            .enum(['mission', 'act', 'resource', 'product', 'note'])
            .describe(
              'mission = equity-bearing work a partner takes on; act = a chore for an existing member or role inside a running mission; ' +
                'resource = something the project needs (money, equipment, space, knowledge); product = something the project sells; note = a remark, no form.'
            ),
          name: z.string().describe('Short title.'),
          descrip: z
            .string()
            .describe(
              'REQUIRED. What has to be done, its scope, and what done looks like. ' +
                'For "mission" rows send rich HTML - a short intro <p> then a <ul> of concrete deliverables (allowed: p, h3, h4, ul, ol, li, strong, em, a, br). Do NOT HTML-escape it. ' +
                `Other types are saved as plain text (tags removed). Up to ${MAX_ROW_DESCRIP} characters.`
            ),
          imp: z.enum(['must', 'nice']).optional().describe('must = the direction fails without it. Default nice.'),
          rationale: z.string().optional().describe('One sentence on why this row, shown to the members.'),
          nhours: z.number().optional().describe('mission only: estimated hours.'),
          valph: z.number().optional().describe('mission only: value per hour.'),
          skills: z
            .array(z.string())
            .optional()
            .describe('mission only: skill names, free text. Matched to the platform catalogue; missing ones are created.'),
          roles: z.array(z.string()).optional().describe('mission only: role names, free text, matched or created like skills.'),
          workways: z
            .array(z.string())
            .optional()
            .describe('mission only: work-mode names (e.g. "remote"), free text, matched or created like skills.'),
          assigneeKind: z.enum(['person', 'role']).optional().describe('act only: whether the chore is for a person or a role.'),
          assigneeName: z
            .string()
            .optional()
            .describe('act only: a member username or role name, as getProjectMembersTool returns it.'),
          missionName: z
            .string()
            .optional()
            .describe('act only: the in-progress mission the chore belongs to (getMemberMissionsTool).'),
          kindOf: z
            .enum(['money', 'equipment', 'space', 'knowledge', 'other'])
            .optional()
            .describe('resource / product only.'),
          price: z.number().optional().describe('resource / product only.'),
          quantity: z.number().optional().describe('resource / product only.')
        })
      )
      .min(1)
      .max(MAX_AGENT_ITEMS)
      .describe(`The rows, in the order the user should see them. 1 to ${MAX_AGENT_ITEMS}.`)
  }),
  outputSchema: z.object({
    success: z.boolean(),
    boardId: z.string().optional(),
    title: z.string().optional(),
    itemCount: z.number().optional(),
    duplicateCount: z.number().optional(),
    items: z.array(rowSchema).optional().describe('The saved rows, with their ids.'),
    rejected: rejectedSchema,
    reviewUrl: z.string().optional().describe('Absolute link to the board. Pass it to the user verbatim.'),
    navigation: z.object({ url: z.string(), pageName: z.string() }).optional(),
    error: failureSchema,
    message: z.string()
  }),
  execute: async (inputData) => {
    const call = resolveCallContext();
    if (!call) {
      return { success: false, message: 'Missing user context. Authentication required.' };
    }

    const { projectId, title, descrip, items } = inputData;
    const requestId = randomUUID();

    // Checked here as well as in the action: the action's refusal is a plain
    // Error, which production collapses into "An unexpected error occurred".
    const { rows, rejected } = normalizeAgentItems(items);
    if (rows.length === 0) {
      return {
        ...failed('Could not create the planning board', {
          code: 'INVALID_INPUT',
          retryable: false,
          requestId,
          hint: 'No row was usable. Every item needs a name and a non-empty descrip - see `rejected`, fix them and call again.'
        }),
        rejected
      };
    }

    try {
      const result = await actionService.executeAction(
        'createPlanBoardFromItems',
        { projectId, title, ...(descrip ? { descrip } : {}), items, lang: call.lang },
        { userId: call.userId, jwt: call.jwt, lang: call.lang, fetch: call.fetch }
      );

      if (!result.success) {
        logFailure('createPlanBoardTool', requestId, projectId, call.userId, result.error);
        return failed('Could not create the planning board', describeActionFailure(result.error, requestId));
      }

      const data = result.data ?? {};
      const path = buildBoardReviewUrl(projectId, data.boardId);
      const reviewUrl = `${SITE_ORIGIN}${path}`;
      const saved = (data.items ?? []).map(toRowOutput);
      const skipped = data.rejected ?? rejected;

      const dupNote =
        data.duplicateCount > 0
          ? ` ${data.duplicateCount} of them resemble something the project already has and are flagged (alreadyExists).`
          : '';
      const rejectedNote =
        skipped.length > 0
          ? ` ${skipped.length} item(s) were NOT saved - see \`rejected\` and tell the user which, and why.`
          : '';

      return {
        success: true,
        boardId: String(data.boardId),
        title: data.title,
        itemCount: data.itemCount,
        duplicateCount: data.duplicateCount,
        items: saved,
        rejected: skipped,
        reviewUrl,
        navigation: { url: path, pageName: 'Planning board' },
        message:
          `Saved the planning board "${data.title}" with ${data.itemCount} proposed row(s).${dupNote}${rejectedNote} ` +
          `Nothing has been created yet - the user approves each row in the real form at ${reviewUrl}.`
      };
    } catch (error: any) {
      logFailure('createPlanBoardTool', requestId, projectId, call.userId, error);
      return failed('Could not create the planning board', describeActionFailure(undefined, requestId));
    }
  }
});

// ── Tier 1: the thin scan ──────────────────────────────────────────────────

export const scanProjectDirectionsTool = createTool({
  id: 'scanProjectDirectionsTool',
  description:
    "Cheaply scan a project's real current state and propose a few DIRECTIONS for advancing it - strategic angles, not task lists. " +
    'Use this when the user asks something open-ended like "what should we do next?" or "how do we move this forward?" and has not described a specific goal. ' +
    'These are saved as suggested directions only: nothing is created, and no mission, chore or resource comes out of this call. ' +
    'To break one direction down into concrete missions and resources afterwards, the user opens it on the returned reviewUrl and approves each row there. Requires a projectId. ' +
    'On failure, `error.retryable` says whether calling again can help.',
  inputSchema: z.object({
    projectId: z.string().describe('ID of the project to scan.')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    stage: z.string().optional().describe('"new" (nothing produced yet) or "established"'),
    directions: z
      .array(z.object({ id: z.string(), title: z.string(), descrip: z.string(), rationale: z.string() }))
      .optional(),
    reviewUrl: z.string().optional().describe('Absolute link to the planning boards. Pass it to the user verbatim.'),
    navigation: z.object({ url: z.string(), pageName: z.string() }).optional(),
    error: failureSchema,
    message: z.string()
  }),
  execute: async (inputData) => {
    const call = resolveCallContext();
    if (!call) {
      return { success: false, message: 'Missing user context. Authentication required.' };
    }

    const { projectId } = inputData;
    const requestId = randomUUID();

    try {
      const result = await actionService.executeAction(
        'scanProjectDirections',
        { projectId, lang: call.lang },
        { userId: call.userId, jwt: call.jwt, lang: call.lang, fetch: call.fetch }
      );

      if (!result.success) {
        logFailure('scanProjectDirectionsTool', requestId, projectId, call.userId, result.error);
        return failed('Could not scan the project', describeActionFailure(result.error, requestId));
      }

      const { stage, boards = [] } = result.data ?? {};
      const path = buildBoardReviewUrl(projectId);
      const reviewUrl = `${SITE_ORIGIN}${path}`;

      if (boards.length === 0) {
        return {
          success: true,
          stage,
          directions: [],
          reviewUrl,
          message:
            'The scan did not produce any directions this time. Ask the user what they want to advance, then use planProjectWorkTool with their answer.'
        };
      }

      return {
        success: true,
        stage,
        directions: boards.map((b: any) => ({
          id: String(b.id),
          title: b.title ?? '',
          descrip: b.descrip ?? '',
          rationale: b.rationale ?? ''
        })),
        reviewUrl,
        navigation: { url: path, pageName: 'Planning boards' },
        message:
          `Proposed ${boards.length} direction(s) for this ${stage === 'new' ? 'new' : 'established'} project. ` +
          `Relay them with their rationale. The user can open one at ${reviewUrl} to break it into concrete tasks.`
      };
    } catch (error: any) {
      logFailure('scanProjectDirectionsTool', requestId, projectId, call.userId, error);
      return failed('Could not scan the project', describeActionFailure(undefined, requestId));
    }
  }
});
