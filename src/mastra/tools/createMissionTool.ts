/**
 * createMissionTool — direct-execution mission creation for MCP/bot.
 *
 * Mirrors createTaskTool but for missions. Uses `resolveMissionSpec` to
 * translate free-form names → Pinecone-matched IDs (creating new vocab
 * entries when needed), then calls `actionService.executeAction('createMission')`.
 *
 * Requires `projectId`. If not known, use findUserProjects first.
 * Requires an authenticated MCP context (getMcpContext).
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { actionService } from '../../lib/server/actions/index.js';
import { getMcpContext } from '../../lib/server/mcpContext.js';
import { resolveMissionSpec } from '../../lib/server/mission/resolveMissionSpec.js';

export const createMissionTool = createTool({
  id: 'createMissionTool',
  description:
    'Create a new mission directly in a project. ' +
    'Resolves skill/role/workway names to platform IDs via vector search (Pinecone), ' +
    'creating new vocabulary entries when needed. ' +
    'Use prepareMissionTool instead when you want the user to review the mission before publishing.',
  inputSchema: z.object({
    projectId:   z.string().describe('ID of the project where the mission will be created.'),
    missionName: z.string().describe('Name of the mission (required).'),
    descrip:     z.string().optional().describe('Mission description (plain text or HTML).'),
    skills:      z.array(z.string()).optional().describe('Skill names needed for the mission.'),
    roles:       z.array(z.string()).optional().describe('Role/position names for the mission.'),
    workways:    z.array(z.string()).optional().describe('Work mode names (remote, onsite, hybrid…).'),
    nhours:      z.number().optional().describe('Estimated hours.'),
    valph:       z.number().optional().describe('Value per hour (₪/$ per hour).'),
    iskvua:      z.boolean().optional().describe('True if this is a recurring monthly mission.'),
    dateStart:   z.string().optional().describe('Start date (ISO 8601).'),
    dateEnd:     z.string().optional().describe('End date (ISO 8601).'),
    assignedUserId: z.string().optional().describe('User ID to assign the mission to (omit for open/voted).'),
    checklist:   z.array(z.object({
      shem:  z.string(),
      des:   z.string().optional(),
      link:  z.string().optional(),
      dateS: z.string().optional(),
      dateF: z.string().optional(),
    })).optional().describe('Optional checklist tasks for the mission.'),
  }),
  execute: async (inputData) => {
    const ctx = getMcpContext();

    if (!ctx?.userId || !ctx?.fetchInstance) {
      return {
        success: false,
        message: 'Missing user context. API Key authentication required.',
      };
    }

    const userId = ctx.userId;
    const fetchInstance = ctx.fetchInstance;
    const adminToken = process.env.ADMINMONTHER ?? '';
    const lang = (ctx.lang as 'he' | 'en' | 'ar') ?? 'he';

    console.log(`[createMissionTool] Resolving spec for "${inputData.missionName}" in project ${inputData.projectId}`);

    // ── 1. Resolve names → IDs via Pinecone ──────────────────────────────────
    let resolved;
    try {
      resolved = await resolveMissionSpec(
        {
          name:     inputData.missionName,
          descrip:  inputData.descrip,
          skills:   inputData.skills  ?? [],
          roles:    inputData.roles   ?? [],
          workways: inputData.workways ?? [],
          vallues:  [],
          nhours:   inputData.nhours,
          valph:    inputData.valph,
          iskvua:   inputData.iskvua,
          dateStart: inputData.dateStart,
          dateEnd:   inputData.dateEnd,
          lang,
        },
        fetchInstance
      );
    } catch (resolveErr: any) {
      console.warn('[createMissionTool] resolveMissionSpec failed, proceeding with empty IDs:', resolveErr?.message);
      resolved = {
        skills:   { ids: [], suggestions: [], newlyCreated: [] },
        roles:    { ids: [], suggestions: [], newlyCreated: [] },
        workways: { ids: [], suggestions: [], newlyCreated: [] },
        vallues:  { ids: [], suggestions: [], newlyCreated: [] },
        matchedMissionId: undefined,
      };
    }

    console.log(`[createMissionTool] Resolved: skills=${resolved.skills.ids.length}, roles=${resolved.roles.ids.length}, workways=${resolved.workways.ids.length}`);

    // ── 2. Execute createMission action ──────────────────────────────────────
    try {
      const result = await actionService.executeAction(
        'createMission',
        {
          projectId:         inputData.projectId,
          existingMissionId: resolved.matchedMissionId,   // reuse catalog entry if found
          missionName:       inputData.missionName,
          descrip:           inputData.descrip ?? null,
          skillIds:          resolved.skills.ids,
          roleIds:           resolved.roles.ids,
          workwayIds:        resolved.workways.ids,
          vallueIds:         [],                          // project vallues not available here
          nhours:            inputData.nhours ?? 0,
          valph:             inputData.valph  ?? 0,
          iskvua:            inputData.iskvua ?? false,
          dateStart:         inputData.dateStart,
          dateEnd:           inputData.dateEnd,
          assignedUserId:    inputData.assignedUserId,
          checklist:         inputData.checklist ?? [],
        },
        {
          userId,
          jwt: adminToken,
          lang,
          fetch: fetchInstance,
        }
      );

      if (result.success) {
        const summary: string[] = [];
        if (resolved.skills.newlyCreated.length)   summary.push(`Created skills: ${resolved.skills.newlyCreated.join(', ')}`);
        if (resolved.roles.newlyCreated.length)    summary.push(`Created roles: ${resolved.roles.newlyCreated.join(', ')}`);
        if (resolved.workways.newlyCreated.length) summary.push(`Created work modes: ${resolved.workways.newlyCreated.join(', ')}`);
        if (resolved.matchedMissionId)             summary.push(`Reused existing mission template #${resolved.matchedMissionId}`);

        return {
          success: true,
          message: `Mission "${inputData.missionName}" created successfully.${summary.length ? ' ' + summary.join('. ') : ''}`,
          missionId: result.data?.missionId,
          createdEntityId: result.data?.createdEntityId,
          createdEntityType: result.data?.createdEntityType,
          data: result.data,
        };
      } else {
        return {
          success: false,
          message: `Failed to create mission: ${result.error?.message ?? 'Unknown error'}`,
          error: result.error,
        };
      }
    } catch (execErr: any) {
      console.error('[createMissionTool] executeAction error:', execErr);
      return {
        success: false,
        message: `An unexpected error occurred: ${execErr?.message ?? String(execErr)}`,
      };
    }
  },
});
