/**
 * The tools that answer before anyone signs in (PLAN_AI_SIGNUP_CONCIERGE §5.1).
 *
 * One list for two readers: /api/mcp, which under lazy authentication lets
 * exactly these through without a token and answers every other tools/call
 * with the 401, and the public reference at /mcp, which documents them in
 * their own group. Adding a tool here is what makes it callable without an
 * account — so it must be safe without one.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { SITE_CONTEXT } from '$lib/bot/context';
import { MCP_INSTRUCTIONS } from './instructions';
import { MCP_DOCS_URL, mcpAnnotations } from './toolManifest';
import { assistantMcpEnabled, makePrepareSignupTool } from '../../../mastra/tools/assistantTools';

export const getPlatformInfoTool = createTool({
  id: 'getPlatformInfo',
  description:
    'Get general information about the 1lev1 platform, its goals, and features.' +
    ` Docs: ${MCP_DOCS_URL}#getPlatformInfo`,
  inputSchema: z.object({}),
  mcp: { annotations: mcpAnnotations({ tier: 'read', title: 'About 1lev1' }) },
  execute: async () => {
    return {
      info: SITE_CONTEXT,
      howAgentsShouldWorkHere: MCP_INSTRUCTIONS,
      message: 'This is general information about the 1lev1 platform.'
    };
  }
});

/**
 * The account-free tools, built per request: prepareSignup's rate limit keys
 * on the caller's address. prepareSignup exists only while
 * ASSISTANT_MCP_ENABLED is on.
 */
export function noAccountTools(clientIp: string, fetchFn: typeof fetch): Record<string, any> {
  const tools: Record<string, any> = { getPlatformInfo: getPlatformInfoTool };
  if (assistantMcpEnabled()) tools.prepareSignup = makePrepareSignupTool(clientIp, fetchFn);
  return tools;
}

/** What an anonymous caller may call under lazy auth; every other tools/call is the 401. */
export function noAccountToolNames(): Set<string> {
  const names = new Set(['getPlatformInfo']);
  if (assistantMcpEnabled()) names.add('prepareSignup');
  return names;
}
