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

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { actionService } from '../../lib/server/actions/index.js';
import { getMcpContext } from '../../lib/server/mcpContext.js';
import { normalizeAdminToken } from '../../lib/server/adminToken.js';

/** Where a human reviews a planning board. */
export function buildBoardReviewUrl(projectId: string, boardId?: string | null): string {
  const base = `/moach/${projectId}/create`;
  return boardId ? `${base}?board=${encodeURIComponent(String(boardId))}` : base;
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
    'Nothing is created — the tool returns a reviewUrl where the user approves each row in the real form. ' +
    'Use this when the user describes something they want the project to achieve. Requires a projectId (use findUserProjectsTool first if unknown).',
  inputSchema: z.object({
    projectId: z.string().describe('ID of the project to plan for.'),
    text: z
      .string()
      .describe(
        'What the user wants to advance, in their own words. At least ~20 characters — the richer the brief, the better the breakdown.'
      ),
    title: z.string().optional().describe('Optional title for the board; otherwise one is suggested.')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    boardId: z.string().optional(),
    title: z.string().optional(),
    itemCount: z.number().optional(),
    duplicateCount: z.number().optional(),
    reviewUrl: z.string().optional(),
    navigation: z.object({ url: z.string(), pageName: z.string() }).optional(),
    message: z.string()
  }),
  execute: async (inputData) => {
    const call = resolveCallContext();
    if (!call) {
      return { success: false, message: 'Missing user context. Authentication required.' };
    }

    const { projectId, text, title } = inputData;

    try {
      const result = await actionService.executeAction(
        'createPlanBoardFromText',
        { projectId, text, ...(title ? { title } : {}), lang: call.lang },
        { userId: call.userId, jwt: call.jwt, lang: call.lang, fetch: call.fetch }
      );

      if (!result.success) {
        return {
          success: false,
          message: `Could not build a plan: ${result.error?.message ?? 'unknown error'}`
        };
      }

      const { boardId, title: boardTitle, itemCount, duplicateCount } = result.data ?? {};
      const reviewUrl = buildBoardReviewUrl(projectId, boardId);

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
        navigation: { url: reviewUrl, pageName: 'Planning board' },
        message:
          `Drafted a plan "${boardTitle}" with ${itemCount} proposed item(s).${dupNote} ` +
          `Nothing has been created yet — the user reviews and approves each row at ${reviewUrl}.`
      };
    } catch (error: any) {
      console.error('❌ planProjectWorkTool error:', error);
      return { success: false, message: `Could not build a plan: ${error?.message ?? error}` };
    }
  }
});

// ── Tier 1: the thin scan ──────────────────────────────────────────────────

export const scanProjectDirectionsTool = createTool({
  id: 'scanProjectDirectionsTool',
  description:
    "Cheaply scan a project's real current state and propose a few DIRECTIONS for advancing it — strategic angles, not task lists. " +
    'Use this when the user asks something open-ended like "what should we do next?" or "how do we move this forward?" and has not described a specific goal. ' +
    'These are saved as suggested directions only: nothing is created, and no mission, chore or resource comes out of this call. ' +
    'To break one direction down into concrete missions and resources afterwards, the user opens it on the returned reviewUrl and approves each row there. Requires a projectId.',
  inputSchema: z.object({
    projectId: z.string().describe('ID of the project to scan.')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    stage: z.string().optional().describe('"new" (nothing produced yet) or "established"'),
    directions: z
      .array(z.object({ id: z.string(), title: z.string(), descrip: z.string(), rationale: z.string() }))
      .optional(),
    reviewUrl: z.string().optional(),
    navigation: z.object({ url: z.string(), pageName: z.string() }).optional(),
    message: z.string()
  }),
  execute: async (inputData) => {
    const call = resolveCallContext();
    if (!call) {
      return { success: false, message: 'Missing user context. Authentication required.' };
    }

    const { projectId } = inputData;

    try {
      const result = await actionService.executeAction(
        'scanProjectDirections',
        { projectId, lang: call.lang },
        { userId: call.userId, jwt: call.jwt, lang: call.lang, fetch: call.fetch }
      );

      if (!result.success) {
        return {
          success: false,
          message: `Could not scan the project: ${result.error?.message ?? 'unknown error'}`
        };
      }

      const { stage, boards = [] } = result.data ?? {};
      const reviewUrl = buildBoardReviewUrl(projectId);

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
        navigation: { url: reviewUrl, pageName: 'Planning boards' },
        message:
          `Proposed ${boards.length} direction(s) for this ${stage === 'new' ? 'new' : 'established'} project. ` +
          `Relay them with their rationale. The user can open one at ${reviewUrl} to break it into concrete tasks.`
      };
    } catch (error: any) {
      console.error('❌ scanProjectDirectionsTool error:', error);
      return { success: false, message: `Could not scan the project: ${error?.message ?? error}` };
    }
  }
});
