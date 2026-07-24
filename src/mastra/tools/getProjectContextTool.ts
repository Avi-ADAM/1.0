import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { getMcpContext } from '../../lib/server/mcpContext.js';
import {
  getProjectContext,
  summarizeProjectContext,
  type ProjectContext
} from '../../lib/server/ai/projectContext.js';

/**
 * getProjectContextTool (PLAN_AI_ERA — Stage 1)
 *
 * Gives an agent a live snapshot of what is happening inside a project:
 * identity + values, members, open missions, the caller's own in-progress
 * missions (with live timers), and products. Exposed to the internal chat
 * agents and — because it reads real project data — to external MCP agents too.
 *
 * Access:
 *  - Internal JWT bot (`isInternalBot`) is trusted; the userId was already
 *    verified by the SvelteKit session.
 *  - External MCP (API key) callers only get the full picture for projects they
 *    are a member of. For non-members we still return public identity but flag
 *    `isMember: false` and omit the caller's private mission view (there is none
 *    to leak — myMissions is scoped to the caller's own missions anyway).
 */
export const getProjectContextTool = createTool({
  id: 'getProjectContextTool',
  description:
    "Get a live summary of what's happening in a project: its name, values, members, open missions, the current user's in-progress missions (with active timers), and products. Use this when the user asks about the state of a project (\"what's going on here?\", \"what's open?\", \"what am I working on?\") — especially when they're on a /moach/[projectId] page.",
  inputSchema: z.object({
    projectId: z
      .string()
      .describe('ID of the project to summarize (the number in /moach/<id>)')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    projectId: z.string().optional(),
    projectName: z.string().optional(),
    isMember: z.boolean().optional(),
    summary: z
      .string()
      .optional()
      .describe('Compact human-readable summary to relay or reason over'),
    context: z.any().optional().describe('Structured ProjectContext object'),
    message: z.string().optional()
  }),
  execute: async (inputData) => {
    const { projectId } = inputData;
    const ctx = getMcpContext() || ({} as any);
    const fetchInstance = ctx.fetchInstance;
    const userId = ctx.userId ?? '';
    const lang = ctx.lang ?? 'he';
    // Internal bot uses the cookie/JWT path (isSer=false); external MCP uses the
    // service path (isSer=true) — same convention as the other tools.
    const isServerRequest = !ctx.isInternalBot;

    if (!projectId || !fetchInstance) {
      return {
        success: false,
        message: 'Missing project context. A projectId and authenticated session are required.'
      };
    }

    try {
      const projectContext: ProjectContext = await getProjectContext(
        String(projectId),
        String(userId),
        fetchInstance,
        { isServerRequest }
      );

      // External (API-key) callers may only inspect projects they belong to.
      if (!ctx.isInternalBot && !projectContext.isMember) {
        return {
          success: false,
          projectId: String(projectId),
          projectName: projectContext.projectName,
          isMember: false,
          message:
            'You are not a member of this project, so its detailed context is not available.'
        };
      }

      return {
        success: true,
        projectId: projectContext.projectId,
        projectName: projectContext.projectName,
        isMember: projectContext.isMember,
        summary: summarizeProjectContext(projectContext, lang),
        context: projectContext
      };
    } catch (error: any) {
      console.error('❌ getProjectContextTool Error:', error);
      return {
        success: false,
        message: `Failed to build project context: ${error?.message ?? error}`
      };
    }
  }
});
