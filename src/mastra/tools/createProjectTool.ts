import { createTool } from '@mastra/core/tools'
import { z } from 'zod';

export const createProjectTool = createTool({
  id: 'createProjectTool',
  description: 'Generate a URL to create a new Partnership (also known as "Embroidery" or "ריקמה"). This tool allows preparing all the project details for the user. שותפות היא ריקמה.',
  inputSchema: z.object({
    name: z.string().describe('The name of the new Partnership (Embroidery/ריקמה). This is required.'),
    desc: z.string().optional().describe('A short public description of the partnership.'),
    details: z.string().optional().describe('A detailed description of the partnership in HTML format.'),
    url: z.string().optional().describe('A link to a website related to the project.'),
    vals: z.array(z.string()).optional().describe('A list of values and goals for the partnership. Pass the actual value names.'),
    res: z.enum(['feh', 'sth', 'nsh', 'sevend']).optional().describe('Response time ID: feh (48h), sth (72h), nsh (96h), sevend (1 week).'),
    profit: z.enum(['already', 'week', 'month', 'threeM', 'sixM', 'oneY', 'twoY', 'more', 'never']).optional().describe('Time to profit ID.'),
    ont: z.boolean().optional().describe('Whether the partnership is continuous (true) or a one-time event (false).'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    url: z.string().describe('The URL that will open the pre-filled project creation form.'),
    navigation: z.object({
      url: z.string(),
      pageName: z.string(),
    }),
  }),
  execute: async (inputData, context) => {
    const { name, desc, details, url, vals, res, profit, ont } = inputData;

    const params = new URLSearchParams();
    params.set('action', 'createproject');
    params.set('name', name);

    if (desc) params.set('desc', desc);
    if (details) params.set('details', details);
    if (url) params.set('url', url);
    if (vals && vals.length > 0) params.set('vals', vals.join(','));
    if (res) params.set('res', res);
    if (profit) params.set('profit', profit);
    if (ont !== undefined) params.set('ont', ont.toString());

    const finalUrl = `/me?${params.toString()}`;

    console.log(`🚀 Generated project creation URL for partnership: ${name}`);

    return {
      success: true,
      url: finalUrl,
      navigation: {
        url: finalUrl,
        pageName: 'Create Partnership',
      },
    };
  },
});
