/**
 * Rikma import over MCP — the supply side (docs/PLAN_AI_SIGNUP_CONCIERGE.md §4, §10).
 *
 * The agent (Claude) already read the business's site or heard the person
 * describe their partnership or idea. These tools let it hand that over as a
 * *rikma blueprint* — the rikma, its products (first), missions, resources and
 * partners — refine it with the person in the conversation, and give them one
 * review link. Creating happens there, by the person, in one click (§0.1):
 * no tool here creates a rikma, a product or a mission.
 *
 * Behind ASSISTANT_MCP_ENABLED (off by default), like CONCIERGE_MCP_WRITE:
 * turning it on in production is a deliberate act, and it needs the
 * `assistant-session` collection deployed first.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { env } from '$env/dynamic/private';
import { getMcpContext } from '../../lib/server/mcpContext.js';
import { BlueprintInputSchema } from '../../lib/assistant/blueprint.js';

export function assistantMcpEnabled(): boolean {
  return env.ASSISTANT_MCP_ENABLED === 'true';
}

async function run(actionKey: string, params: Record<string, unknown>) {
  const ctx = getMcpContext();
  if (!ctx?.userId || !ctx.fetchInstance) return { success: false as const, message: 'Not authenticated.' };
  const [{ actionService }, { adminToken }] = await Promise.all([
    import('../../lib/server/actions/index.js'),
    import('../../lib/server/adminToken.js')
  ]);
  // The session qids are service-only and every handler checks ownership
  // against ctx.userId — the key's owner — itself.
  const result = await actionService.executeAction(actionKey, params, {
    userId: ctx.userId,
    jwt: adminToken(),
    lang: ctx.lang ?? 'he',
    fetch: ctx.fetchInstance
  });
  if (!result.success) {
    return { success: false as const, message: result.error?.message ?? 'The request failed.' };
  }
  return { success: true as const, ...result.data };
}

const HOW_TO_PRESENT =
  'Show the rows to the person in the conversation, ask about anything you guessed (prices especially), ' +
  'fix what they say with setAssistantItems, then give them reviewUrl: on that page they tick what to create ' +
  'and create it with one click. Nothing exists on the platform until they do - never say it was created.';

export const proposeRikmaBlueprintTool = createTool({
  id: 'proposeRikmaBlueprint',
  description:
    'Turn a business, an existing partnership or an idea into a draft rikma on 1lev1: the rikma, its PRODUCTS, ' +
    'missions, resources and partners. Use it when someone wants to add their business so the concierge can find ' +
    'and order from them, to see how their partnership would look on 1lev1, or to break an idea down and recruit ' +
    'partners. Build it yourself from the site you read or from the conversation:\n' +
    '- products FIRST: every distinct thing they sell is a product, with its price when it is stated (do not invent ' +
    'prices - leave price out and ask), and `keywords`: the words a customer would use for the need it answers, ' +
    'not the product name (a "brunch tray" answers "catering", "breakfast for guests").\n' +
    '- missions and resources only when they make a product (put their refs in the product recipe) or when someone ' +
    'is still needed (holder "open"). holder "me" = the person you are talking to does it; "partner" + partnerRef = ' +
    'a partner listed in `partners`.\n' +
    '- `why` on each row: one sentence of where it came from ("the site lists it at 180").\n' +
    'Pass projectId to add to a rikma the person is already a member of. ' +
    HOW_TO_PRESENT,
  inputSchema: BlueprintInputSchema.extend({
    projectId: z.string().optional().describe('An existing rikma of the caller to import into (from findUserProjectsTool).'),
    sourceText: z.string().max(20000).optional().describe('The site text or conversation summary this was drawn from.')
  }),
  execute: async (input) => {
    const { projectId, sourceText, ...blueprint } = input as Record<string, any>;
    const r = await run('proposeRikmaBlueprint', {
      blueprint,
      ...(projectId ? { projectId: String(projectId) } : {}),
      ...(sourceText ? { sourceText } : {}),
      via: 'agent'
    });
    if (!r.success) return r;
    return { ...r, next: HOW_TO_PRESENT };
  }
});

export const getAssistantTool = createTool({
  id: 'getAssistant',
  description:
    "Read the person's current draft list on 1lev1 - a rikma blueprint (kind 'rikma'), or later their profile or a " +
    'wish - with its rows, their keys and status, the version, and what was changed recently (also from the site). ' +
    'Call it before setAssistantItems when you are not sure you have the latest version.',
  inputSchema: z.object({
    kind: z.enum(['rikma', 'profile', 'wish']).optional().describe('Latest session of this kind.'),
    sessionId: z.string().optional()
  }),
  execute: async ({ kind, sessionId }) => {
    if (!kind && !sessionId) return { success: false, message: 'Pass kind or sessionId.' };
    return run('getAssistantSession', sessionId ? { sessionId } : { kind });
  }
});

const OpSchema = z.object({
  op: z.enum(['keep', 'drop', 'restore', 'add', 'rename', 'setSpec', 'link', 'setField']),
  key: z.string().optional().describe('Row key (keep/drop/restore/rename/setSpec).'),
  group: z
    .enum(['products', 'rikmaMissions', 'rikmaResources', 'partners', 'skills', 'roles', 'methods', 'vallues', 'missions', 'resources', 'wishMissions', 'wishResources'])
    .optional()
    .describe('add: which list.'),
  label: z.string().optional().describe('add / rename.'),
  why: z.string().optional(),
  spec: z.record(z.string(), z.any()).optional().describe('add / setSpec: e.g. { price, kindOf, keywords, hours, holder }. null removes a key.'),
  productKey: z.string().optional().describe('link: the product.'),
  missionKeys: z.array(z.string()).optional().describe('link: missions that make one unit.'),
  resourceKeys: z.array(z.string()).optional().describe('link: resources that make one unit.'),
  field: z.string().optional().describe('setField: name, publicDescription, descripFor, linkToWebsite, vals, location, currency, restime.'),
  value: z.any().optional()
});

export const setAssistantItemsTool = createTool({
  id: 'setAssistantItems',
  description:
    'Change the draft list with small ops - what the person just told you: keep ("that is right"), drop ("not now", ' +
    'reversible with restore), add, rename, setSpec (price, keywords, hours…), link (a product recipe), setField ' +
    '(the rikma name, description…). Refer to rows only by their key. Rows already created on the platform, or a ' +
    'wish row a supplier answered, cannot be changed here - you get reason "created"/"committed"; send the person ' +
    'to the site for those. Pass the version you last saw; conflict:true means it changed meanwhile (maybe on the ' +
    'site) - show the returned list and ask again.',
  inputSchema: z.object({
    sessionId: z.string(),
    expectedVersion: z.number().int(),
    ops: z.array(OpSchema).min(1).max(60),
    instruction: z.string().max(1000).optional().describe("The person's words, for the shared transcript."),
    say: z.string().max(1000).optional().describe('Your one-line summary of the change, for the transcript.')
  }),
  execute: async (input) => run('setAssistantItems', { ...input, via: 'agent' })
});

export const undoAssistantTool = createTool({
  id: 'undoAssistant',
  description: 'Undo the last change to the draft list (from here or from the site).',
  inputSchema: z.object({ sessionId: z.string(), expectedVersion: z.number().int() }),
  execute: async (input) => run('undoAssistantRevision', { ...input, via: 'agent' })
});
