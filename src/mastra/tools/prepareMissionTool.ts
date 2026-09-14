/**
 * prepareMissionTool — mirrors createProjectTool for missions.
 *
 * Nothing is created here. It returns a link that opens the mission creation
 * form pre-filled; the member sees the full mission.svelte form, including AI
 * suggestion chips, and can adjust before publishing.
 *
 * URL: /moach/{projectId}/create?action=createmission&draft=…
 *
 * The whole draft travels as one opaque `draft` parameter — see
 * $lib/prefill/draftCodec.ts for how the per-field query string lost the
 * description and everything after it without an error. The consumer ($effect
 * in create/+page.svelte) decodes it, resolves the vocabulary and opens the form.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { MAX_DRAFT_PARAM, SITE_ORIGIN } from '../../lib/prefill/draftCodec';
import { encodeMissionDraft } from '../../lib/prefill/missionDraft';

export const prepareMissionTool = createTool({
  id: 'prepareMissionTool',
  description:
    'Prepare the mission creation form and return a link that opens it pre-filled. ' +
    'Use this when the user should review and confirm the mission before it is published. ' +
    'Nothing is created yet: status is "prepared" until the user opens the link and publishes. ' +
    'Give the user `url` exactly as returned — do not decode, shorten or rebuild it. ' +
    'Requires a projectId - use findUserProjects first if not known.',
  inputSchema: z.object({
    projectId: z.string().describe('ID of the project where the mission will be created.'),
    name: z.string().describe('Mission name (required).'),
    descrip: z
      .string()
      .optional()
      .describe(
        'Mission description: plain text, or raw HTML such as `<p>Body</p>` (h1, h3, p, ul, ol, li, strong, em, a, br). ' +
          'Do NOT HTML-escape it (send `<p>`, not `&lt;p&gt;`).'
      ),
    skills: z.array(z.string()).optional().describe('Suggested skill names (shown as AI chips). Up to 8.'),
    roles: z.array(z.string()).optional().describe('Suggested role names. Up to 8.'),
    workways: z.array(z.string()).optional().describe('Suggested work-mode names. Up to 8.'),
    nhours: z.number().optional().describe('Estimated hours.'),
    valph: z.number().optional().describe('Value per hour.'),
  }),
  outputSchema: z.object({
    success: z.boolean().describe('The link was prepared. It does NOT mean the mission exists.'),
    status: z.enum(['prepared', 'tooLong']),
    url: z.string().optional().describe('Absolute link that opens the pre-filled form. Pass it on verbatim.'),
    message: z.string(),
    navigation: z
      .object({
        url: z.string(),
        pageName: z.string(),
      })
      .optional(),
  }),
  execute: async (inputData) => {
    const { projectId, ...mission } = inputData;
    const draft = await encodeMissionDraft(mission);

    if (draft.length > MAX_DRAFT_PARAM) {
      // Refused here, where the agent can act on it, rather than as a 414 at
      // the proxy or a form that quietly opens half-empty.
      return {
        success: false,
        status: 'tooLong' as const,
        message:
          `The draft is too long to fit in a link (${draft.length} > ${MAX_DRAFT_PARAM} encoded characters). ` +
          'Shorten `descrip` and call prepareMissionTool again; the user can add more text in the form afterwards.',
      };
    }

    const path = `/moach/${encodeURIComponent(projectId)}/create?${new URLSearchParams({ action: 'createmission', draft })}`;
    console.log(`[prepareMissionTool] Prepared mission form for: "${mission.name}" in project ${projectId} (${path.length} chars)`);

    return {
      success: true,
      status: 'prepared' as const,
      url: `${SITE_ORIGIN}${path}`,
      message:
        'Form prepared, nothing created yet. Ask the user to open the link, review the fields and publish the mission.',
      // Relative: the site's own bots `goto()` it inside the app.
      navigation: {
        url: path,
        pageName: 'Create Mission',
      },
    };
  },
});
