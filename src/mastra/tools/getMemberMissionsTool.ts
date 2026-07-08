import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { sendToSer } from '../../lib/send/sendToSer';
import { getMcpContext } from '../../lib/server/mcpContext.js';

export interface MemberMission {
  id: string;
  name: string;
}

/**
 * Fetch a member's in-progress missions (mesimabetahaliches) within a project.
 *
 * A task (Act) is linked to a mission-in-progress that the assignee performs,
 * so this resolves the candidate missions to link a task to once an assignee
 * has been chosen. "In progress" = not finished and not awaiting approval,
 * matching the `8getMissionsOnProgress` filter.
 */
export async function fetchMemberMissionsInProject(
  memberId: string,
  projectId: string,
  fetchInstance: any
): Promise<MemberMission[]> {
  // Cross-user read → use the service token (isSer=true) so it works regardless
  // of which member the task is being assigned to.
  const res = await sendToSer({ id: memberId }, '8getMissionsOnProgress', 0, 0, true, fetchInstance);
  const missions = res?.data?.usersPermissionsUser?.data?.attributes?.mesimabetahaliches?.data ?? [];
  return missions
    .filter((m: any) => String(m.attributes?.project?.data?.id) === String(projectId))
    .map((m: any) => ({
      id: m.id,
      name: m.attributes?.name || m.attributes?.stname || `#${m.id}`
    }));
}

export const getMemberMissionsTool = createTool({
  id: 'getMemberMissionsTool',
  description:
    "List a project member's in-progress missions. A task is linked to a mission-in-progress the assignee performs, so call this after choosing the assignee (a person) to pick the missionId to pass to createTaskTool.",
  inputSchema: z.object({
    projectId: z.string().describe('ID of the project'),
    userId: z.string().describe('ID of the member (assignee) whose in-progress missions to list')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    missions: z
      .array(z.object({ id: z.string(), name: z.string() }))
      .describe('The member\'s in-progress missions in this project'),
    message: z.string().optional()
  }),
  execute: async (inputData) => {
    const { projectId, userId } = inputData;
    const ctx = getMcpContext() || ({} as any);
    const fetchInstance = ctx.fetchInstance;

    if (!projectId || !userId || !fetchInstance) {
      return {
        success: false,
        missions: [],
        message: 'Missing context. projectId, userId and an authenticated session are required.'
      };
    }

    try {
      const missions = await fetchMemberMissionsInProject(userId, projectId, fetchInstance);
      return {
        success: true,
        missions,
        message: `Found ${missions.length} in-progress mission(s)`
      };
    } catch (error: any) {
      console.error('❌ getMemberMissionsTool Error:', error);
      return {
        success: false,
        missions: [],
        message: `Failed to retrieve missions: ${error.message}`
      };
    }
  }
});
