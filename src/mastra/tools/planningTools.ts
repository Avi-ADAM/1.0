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
import { normalizeAdminToken } from '../../lib/server/adminToken.js';

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

/** Shared context/plumbing for both tools. */
function resolveCallContext() {
  const ctx = getMcpContext();
  if (!ctx?.userId || !ctx?.fetchInstance) return null;
  return {
    userId: ctx.userId,
    lang: ctx.lang ?? 'he',
    fetch: ctx.fetchInstance,
    jwt: normalizeAdminToken(process.env.ADMINMONTHER)
  };
}

// ── Tier 2 / free text: build a plan the user reviews ──────────────────────

export const planProjectWorkTool = createTool({
  id: 'planProjectWorkTool',
  description:
    'Turn a free-text brief into a planning board for a project: proposed missions, chores (acts) and resources, deduplicated against what the project already has. ' +
    'Nothing is created - the tool returns a reviewUrl where the user approves each row in the real form. ' +
    'Use this when the user describes something they want the project to achieve. Requires a projectId (use findUserProjectsTool first if unknown). ' +
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

      const { boardId, title: boardTitle, itemCount, duplicateCount } = result.data ?? {};
      const path = buildBoardReviewUrl(projectId, boardId);
      const reviewUrl = `${SITE_ORIGIN}${path}`;

      const dupNote =
        duplicateCount > 0
          ? ` ${duplicateCount} of them already exist in the project and are flagged as such.`
          : '';

      return {
        success: true,
        boardId: String(boardId),
        title: boardTitle,
        itemCount,
        duplicateCount,
        reviewUrl,
        // Relative: the site's own bots `goto()` it inside the app.
        navigation: { url: path, pageName: 'Planning board' },
        message:
          `Drafted a plan "${boardTitle}" with ${itemCount} proposed item(s).${dupNote} ` +
          `Nothing has been created yet - the user reviews and approves each row at ${reviewUrl}.`
      };
    } catch (error: any) {
      logFailure('planProjectWorkTool', requestId, projectId, call.userId, error);
      return failed('Could not build a plan', describeActionFailure(undefined, requestId));
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
