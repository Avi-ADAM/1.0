import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { actionService } from '../../lib/server/actions/index.js';
import { getMcpContext } from '../../lib/server/mcpContext.js';
import { adminToken } from '../../lib/server/adminToken.js';

export const createTaskTool = createTool({
  id: 'createTaskTool',
  description:
    'Create a task (Act, "מטלה") in a project - the way a member gets something new done. Whenever the user wants something new to happen in a project, offer this option. Choose the shape:\n' +
    '- A mission in progress already covers the work: create an act linked to it - assignedUserId = the mission holder, missionId from getMemberMissionsTool.\n' +
    '- Nobody in the project does this kind of work, so an implementer must be found: this is not an act - prepare a mission with prepareMissionTool.\n' +
    '- No specific person yet: create the act with no assignee and pass tafkidims = the roles that fit it (IDs from getProjectMembersTool). The holders of those roles are notified and one of them picks it up.\n' +
    'An act assigned to another person waits for that person to approve it; nobody is bound until they accept. ' +
    'The caller must be a member of the project. Requires a project ID.',
  inputSchema: z.object({
    projectId: z.string().describe('ID of the project where the task will be created'),
    name: z.string().describe('Short name/title of the task'),
    description: z.string().optional().describe('What has to be done and what done looks like, as plain text. Strongly recommended - a title alone is hard to act on.'),
    link: z.string().optional().describe('Optional URL related to the task'),
    assignedUserId: z.string().optional().describe('ID of the person (project member) to assign this task to - usually the holder of the mission it belongs to. Use getProjectMembersTool to resolve a name to an ID. Mutually exclusive with tafkidims.'),
    tafkidims: z.array(z.string()).optional().describe('IDs of the roles (tafkidim) that fit the task, when no specific person is chosen; a holder of one of them picks it up. Use getProjectMembersTool to resolve role names to IDs. Mutually exclusive with assignedUserId.'),
    missionId: z.string().optional().describe('ID of the mission in progress (mesimabetahaliches) this task belongs to, from getMemberMissionsTool. Goes with assignedUserId.'),
    hashivut: z.enum(['white', 'green', 'yellow', 'red']).default('white').describe('Urgency level of the task'),
    dateS: z.string().optional().describe('Start date (ISO format)'),
    dateF: z.string().optional().describe('End date (ISO format)')
  }),
  execute: async (inputData) => {
    const ctx = getMcpContext();

    if (!ctx?.userId || !ctx?.fetchInstance) {
      return {
        success: false,
        message: 'Missing user context. API Key authentication required.'
      };
    }

    const userId = ctx.userId;
    const fetchInstance = ctx.fetchInstance;
    const jwt = adminToken();

    // A task is assigned to a specific person only when assignedUserId is given.
    // When roles (tafkidims) are provided instead, the underlying action stores
    // them as a role assignment (isAssigned = false).
    const hasRoles = Array.isArray(inputData.tafkidims) && inputData.tafkidims.length > 0;
    const actionParams = {
      ...inputData,
      isAssigned: inputData.assignedUserId ? true : !hasRoles
    };

    // Ids only: names and descriptions are member-written and stay out of the logs.
    console.log(`[createTaskTool] user ${userId} → project ${inputData.projectId}`);

    try {
      const result = await actionService.executeAction(
        'createTask',
        actionParams,
        {
          userId,
          jwt, // Use admin token to perform action on behalf of user
          lang: 'he',
          fetch: fetchInstance
        }
      );

      if (result.success) {
        const waitsFor =
          inputData.assignedUserId && String(inputData.assignedUserId) !== String(userId)
            ? ' It waits for the assignee to approve it.'
            : hasRoles
              ? ' The holders of the chosen roles were notified; one of them will pick it up.'
              : '';
        return {
          success: true,
          message: `Task "${inputData.name}" created.${waitsFor}`,
          taskId: result.data.id,
          data: result.data
        };
      } else {
        return {
          success: false,
          message: `Failed to create task: ${result.error?.message}`,
          error: result.error
        };
      }
    } catch (error: any) {
      console.error('[createTaskTool] Error:', error);
      return {
        success: false,
        message: `An unexpected error occurred: ${error.message}`
      };
    }
  }
});
