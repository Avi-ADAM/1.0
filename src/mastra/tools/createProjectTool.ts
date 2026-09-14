import { createTool } from '@mastra/core/tools'
import { z } from 'zod';
import { MAX_DRAFT_PARAM, SITE_ORIGIN } from '../../lib/prefill/draftCodec';
import { PROFIT_IDS, RES_IDS, encodeProjectDraft } from '../../lib/prefill/projectDraft';

/**
 * Nothing is created here — this prepares the creation form for a human to
 * review and approve. The whole draft travels as one opaque `draft` parameter
 * (see $lib/prefill/projectDraft.ts for why the per-field query string lost
 * `details` and `vals` silently).
 */
export const createProjectTool = createTool({
  id: 'createProjectTool',
  description:
    'Prepare the "create a Partnership" form (a Partnership is also called an Embroidery, or "ריקמה") and return a link that opens it pre-filled. ' +
    'Nothing is created yet: status is "prepared" until the user opens the link and approves the form. ' +
    'Give the user `url` exactly as returned — do not decode, shorten or rebuild it. ' +
    'A public-benefit or nonprofit initiative is a normal Partnership, not a failed business: every Partnership has a public support page ' +
    '(/project/<id>/support) where anyone can donate to it or fund a specific mission, so the public can cover the members\' work hours even when nothing is ever sold.',
  inputSchema: z.object({
    name: z.string().describe('The name of the new Partnership. Required.'),
    desc: z.string().optional().describe('A short public description (plain text, one or two sentences).'),
    details: z
      .string()
      .optional()
      .describe(
        'Detailed description as raw HTML, e.g. `<h2>Title</h2><p>Body</p>`. ' +
          'Allowed tags: h1, h2, h3, p, ul, ol, li, strong, em, u, s, a, br, blockquote. ' +
          'Do NOT HTML-escape it (send `<p>`, not `&lt;p&gt;`).'
      ),
    url: z.string().optional().describe('A link to a website related to the project.'),
    vals: z.array(z.string()).optional().describe('Values and goals of the partnership, as their names. A value may contain commas.'),
    res: z.enum(RES_IDS).optional().describe('Response time ID: feh (48h), sth (72h), nsh (96h), sevend (1 week).'),
    profit: z
      .enum(PROFIT_IDS)
      .optional()
      .describe(
        'When the Partnership expects to earn from sales: already, week, month, threeM, sixM, oneY, twoY, more, or never. ' +
          '`never` is the correct value for a nonprofit / public-benefit initiative - it means "selling is not the goal", not "it will fail". ' +
          'Such a Partnership is funded through its public support page, where donors can cover the work hours.'
      ),
    ont: z.boolean().optional().describe('Whether the partnership is continuous (true) or a one-time event (false).'),
  }),
  outputSchema: z.object({
    success: z.boolean().describe('The link was prepared. It does NOT mean the partnership exists.'),
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
    const draft = await encodeProjectDraft(inputData);

    if (draft.length > MAX_DRAFT_PARAM) {
      // Refused here, where the agent can act on it, rather than as a 414 at
      // the proxy or a form that quietly opens half-empty.
      return {
        success: false,
        status: 'tooLong' as const,
        message:
          `The draft is too long to fit in a link (${draft.length} > ${MAX_DRAFT_PARAM} encoded characters). ` +
          'Shorten `details` and call createProjectTool again; the user can add more text in the form afterwards.',
      };
    }

    const path = `/me?${new URLSearchParams({ action: 'createproject', draft })}`;
    console.log(`🚀 Prepared project creation form for partnership: ${inputData.name} (${path.length} chars)`);

    return {
      success: true,
      status: 'prepared' as const,
      url: `${SITE_ORIGIN}${path}`,
      message:
        'Form prepared, nothing created yet. Ask the user to open the link, review the fields and approve it.',
      // Relative: the site's own bots `goto()` it inside the app.
      navigation: {
        url: path,
        pageName: 'Create Partnership',
      },
    };
  },
});
