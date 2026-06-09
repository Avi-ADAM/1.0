import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { actionService } from '../../lib/server/actions/index.js';
import { getMcpContext } from '../../lib/server/mcpContext.js';

export const createTaskTool = createTool({
  id: 'createTaskTool',
  description: 'Create a new task (Act) in a project. Requires a project ID.',
  inputSchema: z.object({
    projectId: z.string().describe('ID of the project where the task will be created'),
    name: z.string().describe('Short name/title of the task'),
    description: z.string().optional().describe('Detailed description of the task'),
    link: z.string().optional().describe('Optional URL related to the task'),
    assignedUserId: z.string().optional().describe('ID of the user to assign this task to. If not provided, it remains unassigned or assigned to a role.'),
    missionId: z.string().optional().describe('ID of the specific mission (mesimabetahaliches) this task belongs to'),
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
    const adminToken = process.env.ADMINMONTHER || '';

    console.log(`[createTaskTool] Executing for user: ${userId}`, inputData);

    try {
      const result = await actionService.executeAction(
        'createTask',
        inputData,
        {
          userId,
          jwt: adminToken, // Use admin token to perform action on behalf of user
          lang: 'he',
          fetch: fetchInstance
        }
      );

      if (result.success) {
        return {
          success: true,
          message: `Task "${inputData.name}" created successfully.`,
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
