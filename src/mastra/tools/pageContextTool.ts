import { createTool } from '@mastra/core';
import { z } from 'zod';
import { getContextForPath } from '../../lib/bot/pageContexts';

export const getPageContextTool = createTool({
    id: 'getPageContextTool',
    description: 'Get information about the current page the user is on, including available actions and page description.',
    inputSchema: z.object({
        path: z.string().describe('The URL path of the current page')
    }),
    execute: async ({ context }) => {
        console.log('🔍 getPageContextTool executing for path:', context.path);
        const contextData = getContextForPath(context.path);
        return {
            success: true,
            context: contextData
        };
    }
});
