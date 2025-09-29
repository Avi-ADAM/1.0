import { createTool } from '@mastra/core';
import { z } from 'zod';
import { sendToSer } from '../../lib/send/sendToSer';
import { fuzzyMissionMatch, sortMissionsByRelevance } from '../../lib/utils/fuzzyMatch.js';

async function findUserMissions(userId: string, fetch: any, missionName?: string) {
  try {
    const res = await sendToSer({ id: userId }, '8getMissionsOnProgress', 0, 0, true, fetch);
    let missions = res?.data?.usersPermissionsUser?.data?.attributes?.mesimabetahaliches?.data ?? [];

    if (missionName) {
      // Enhanced fuzzy matching for mission names
      missions = missions.filter((item: any) => {
        const match = fuzzyMissionMatch(missionName, item.attributes.name || '');
        return match.matches;
      });
      
      // Sort by relevance using centralized sorting function
      missions = sortMissionsByRelevance(missions, missionName);
    }

    return missions.map((item: any) => ({
      id: item.id,
      name: item.attributes.name,
      projectId: item.attributes.project?.data?.id || null,
      projectName: item.attributes.project?.data?.attributes?.projectName || 'N/A',
    }));
  } catch (error) {
    console.error(`findUserMissions Error for user ${userId}:`, error);
    return [];
  }
}

export const findMissionTool = createTool({
  id: 'findMission',
  description: 'Find a specific mission for the user by its name.',
  inputSchema: z.object({
    missionName: z.string().describe('The name of the mission to find.'),
  }),
  outputSchema: z.object({
    missions: z.array(z.object({
      id: z.string(),
      name: z.string(),
      projectId: z.string().nullable(),
      projectName: z.string(),
    })).describe('A list of missions matching the search query.'),
  }),
  execute: async ({ context }) => {
    const { missionName } = context;
    const globalContext = global.botContext || {};
    const userId = globalContext.userId;
    const fetchInstance = globalContext.fetchInstance;
     
    if (!userId || !fetchInstance) {
      throw new Error('User context is required to find missions.');
    }
    const missions = await findUserMissions(userId, fetchInstance, missionName);
    return { missions };
  },
});
