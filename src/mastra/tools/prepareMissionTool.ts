/**
 * prepareMissionTool — mirrors createProjectTool for missions.
 *
 * Builds a URL that navigates the user to the mission creation form with all
 * fields pre-filled. The user sees the full mission.svelte form, including AI
 * suggestion chips, and can adjust before publishing.
 *
 * URL: /moach/{projectId}/create?action=createmission&name=...&descrip=...
 *
 * The consumer ($effect in create/+page.svelte) reads the params, populates
 * the form, and opens the mission creation UI.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const prepareMissionTool = createTool({
  id: 'prepareMissionTool',
  description:
    'Generate a URL that opens the mission creation form pre-filled with the provided details. ' +
    'Use this when you want the user to review and confirm the mission before it is published. ' +
    'Requires a projectId — use findUserProjects first if not known.',
  inputSchema: z.object({
    projectId: z.string().describe('ID of the project where the mission will be created.'),
    name: z.string().describe('Mission name (required).'),
    descrip: z.string().optional().describe('Mission description (plain text or simple HTML).'),
    skills: z.array(z.string()).optional().describe('Suggested skill names (will be shown as AI chips).'),
    roles: z.array(z.string()).optional().describe('Suggested role names.'),
    workways: z.array(z.string()).optional().describe('Suggested work-mode names.'),
    nhours: z.number().optional().describe('Estimated hours.'),
    valph: z.number().optional().describe('Value per hour.'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    url: z.string().describe('URL that opens the pre-filled mission creation form.'),
    navigation: z.object({
      url: z.string(),
      pageName: z.string(),
    }),
  }),
  execute: async (inputData) => {
    const { projectId, name, descrip, skills, roles, workways, nhours, valph } = inputData;

    const params = new URLSearchParams();
    params.set('action', 'createmission');
    params.set('name', name);

    if (descrip)                 params.set('descrip', descrip);
    if (skills?.length)          params.set('skills',  skills.join(','));
    if (roles?.length)           params.set('roles',   roles.join(','));
    if (workways?.length)        params.set('workways', workways.join(','));
    if (nhours != null)          params.set('nhours',  String(nhours));
    if (valph  != null)          params.set('valph',   String(valph));

    const finalUrl = `/moach/${projectId}/create?${params.toString()}`;

    console.log(`[prepareMissionTool] Generated mission URL for: "${name}" in project ${projectId}`);

    return {
      success: true,
      url: finalUrl,
      navigation: {
        url: finalUrl,
        pageName: 'Create Mission',
      },
    };
  },
});
