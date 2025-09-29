import { createTool } from '@mastra/core';
import { z } from 'zod';

export const navigateToPageTool = createTool({
  id: 'navigateToPageTool',
  description: 'Navigate to a specific page on the 1lev1.com site.',
  inputSchema: z.object({
    url: z.string().describe('The URL path to navigate to.'),
    pageName: z.string().describe('A descriptive name for the page being navigated to.'),
    idPr: z.string().optional().describe('The ID of the project to navigate to, if applicable.'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    navigation: z.object({
      url: z.string(),
      idPr: z.string().optional(),
    }),
  }),
  execute: async ({ context }) => {
    const { url, pageName, idPr } = context;
    console.log(`🧭 Navigating to page: ${pageName} at ${url}${idPr ? ' for project ID ' + idPr : ''}`);
    return {
      success: true,
      navigation: {
        url,
        idPr,
      },
    };
  },
});
