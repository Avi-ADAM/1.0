/**
 * The tool list an anonymous caller sees under lazy authentication
 * (MCP_PUBLIC_MODE=lazy, see $lib/server/oauth/challenge.ts).
 *
 * Claude asks a person to sign in only when it calls a tool and the HTTP
 * request comes back 401 — so the account tools have to be *listed* before
 * sign-in, or nothing ever calls one and the connector stays anonymous. They
 * are listed exactly as a signed-in key with no scopes sees them (the OAuth
 * key carries none), so the list does not change under Claude after sign-in.
 *
 * These entries never run: /api/mcp answers a tools/call for any name outside
 * the public set with the 401 before the MCP server is built. The stub body is
 * the second fence, for a transport that somehow got past it — it must never
 * reach the real tool, which would act on whatever context it found.
 */

import { createTool } from '@mastra/core/tools';
import {
  MCP_TOOL_MANIFEST,
  entryEnabled,
  mcpAnnotations,
  mcpDescription,
  tierAllowed
} from './toolManifest';

export const SIGN_IN_REQUIRED = {
  success: false,
  signInRequired: true,
  message:
    'This tool needs a 1lev1 account. Ask the person to connect 1lev1 (sign in, or sign up in the same window), ' +
    'then call it again.'
} as const;

/** Names of the tools a no-scope key sees — the set a sign-in unlocks. */
export function signInToolNames(): string[] {
  return Object.entries(MCP_TOOL_MANIFEST)
    .filter(([, entry]) => entryEnabled(entry) && tierAllowed(entry.tier, []))
    .map(([name]) => name);
}

/** Listing-only copies of those tools: same name, description, schema and annotations. */
export function signInListing(): Record<string, any> {
  const out: Record<string, any> = {};
  for (const name of signInToolNames()) {
    const entry = MCP_TOOL_MANIFEST[name];
    out[name] = createTool({
      id: (entry.tool as any).id ?? name,
      description: mcpDescription(name, entry),
      inputSchema: (entry.tool as any).inputSchema,
      mcp: { annotations: { ...mcpAnnotations(entry) } },
      execute: async () => SIGN_IN_REQUIRED
    });
  }
  return out;
}
