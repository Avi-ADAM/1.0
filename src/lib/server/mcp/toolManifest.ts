/**
 * Every tool an authenticated MCP key can see, with its access policy
 * (PLAN_MCP_TOOLS_V2 §1.3). The route exposes exactly this list, each tool
 * through `wrapMcpTool`, so a tool is either here with a stated policy or not
 * exposed at all. `toolManifest.test.ts` fails when a tool takes a projectId
 * or missionId and its policy does not say how to guard it.
 *
 * Tiers, by blast radius:
 *   read         — queries.
 *   prepare      — returns a prefilled URL or a proposal, writes nothing real.
 *   selfWrite    — changes only the caller's own records (their timers/hours).
 *   consentWrite — lands something on another member that still waits for
 *                  them (an act needs its assignee's approval).
 *   communicate  — visible to others under the caller's name, binds nobody.
 *   sharedWrite  — creates obligations for other people. Needs `mcp:write`.
 *
 * The object key is the tool name MCP clients see — keep existing keys stable.
 */

import type { McpToolPolicy } from './guard.js';
import { timerActionTool } from '../../../mastra/tools/timerActionTool';
import {
  listUserMissionsTool,
  getActiveTimersTool,
  getMissionDetailsTool,
  getMissionStatsTool
} from '../../../mastra/tools/missionTimers';
import { getSitePagesTool } from '../../../mastra/tools/siteNavigationTool';
import { navigateToPageTool } from '../../../mastra/tools/navigateToPageTool';
import { findMissionTool } from '../../../mastra/tools/findMissionTool';
import { findUserProjectsTool } from '../../../mastra/tools/findUserProjectsTool';
import { getPageContextTool } from '../../../mastra/tools/pageContextTool';
import { createProjectTool } from '../../../mastra/tools/createProjectTool';
import { createTaskTool } from '../../../mastra/tools/createTaskTool';
import { getProjectMembersTool } from '../../../mastra/tools/getProjectMembersTool';
import { getMemberMissionsTool } from '../../../mastra/tools/getMemberMissionsTool';
import { prepareMissionTool } from '../../../mastra/tools/prepareMissionTool';
import { createMissionTool } from '../../../mastra/tools/createMissionTool';
import {
  createPlanBoardTool,
  planProjectWorkTool,
  scanProjectDirectionsTool
} from '../../../mastra/tools/planningTools';
import {
  searchCatalogTool,
  listMyWishesTool,
  getWishDetailsTool,
  listMyWishOffersTool,
  previewWishTool,
  draftWishTool,
  conciergeWriteEnabled
} from '../../../mastra/tools/conciergeTools';
import {
  listMyConversationsTool,
  readConversationTool,
  postConversationMessageTool
} from '../../../mastra/tools/forumTools';
import {
  getProjectDetailsTool,
  listProjectResourcesTool,
  getProjectStatsTool,
  proposeProjectLinkTool
} from '../../../mastra/tools/projectDetailsTools';

export interface McpManifestEntry extends McpToolPolicy {
  tool: { id: string; [k: string]: any };
  /** Feature flag. Absent ⇒ always exposed; false ⇒ the tool does not exist for the client. */
  enabled?: () => boolean;
}

export const MCP_WRITE_SCOPE = 'mcp:write';

// getTimerHistoryTool is deliberately absent: it calls a qid ('getTimerHistory')
// that was never written, so it can only ever fail. Re-add it with a real query.
export const MCP_TOOL_MANIFEST: Record<string, McpManifestEntry> = {
  // --- read ---
  findUserProjectsTool: { tool: findUserProjectsTool, tier: 'read' }, // narrows to the key scope itself
  getProjectDetailsTool: { tool: getProjectDetailsTool, tier: 'read', project: 'scope' }, // public face for non-members
  listProjectResourcesTool: { tool: listProjectResourcesTool, tier: 'read', project: 'member' },
  getProjectStatsTool: { tool: getProjectStatsTool, tier: 'read', project: 'member' },
  getProjectMembersTool: { tool: getProjectMembersTool, tier: 'read', project: 'member' },
  getMemberMissionsTool: { tool: getMemberMissionsTool, tier: 'read', project: 'member' },
  getMissionDetailsTool: { tool: getMissionDetailsTool, tier: 'read', mission: 'member' },
  // The caller's own missions across rikmot; projectId only filters them.
  listUserMissionsTool: { tool: listUserMissionsTool, tier: 'read', project: 'scope', scopedOutput: ['missions'] },
  findMissionTool: { tool: findMissionTool, tier: 'read', scopedOutput: ['missions'] },
  getActiveTimersTool: { tool: getActiveTimersTool, tier: 'read', scopedOutput: ['timers'] },
  // Aggregates can't be narrowed after the fact — a scoped key must name the rikma.
  getMissionStatsTool: { tool: getMissionStatsTool, tier: 'read', project: 'scope', scopedKeyNeeds: 'projectId' },
  // --- concierge reads (M7). No projectId: a wish belongs to a person, not to a
  // rikma, so each tool keys itself to the caller or checks the viewer inside.
  searchCatalogTool: { tool: searchCatalogTool, tier: 'read' },
  listMyWishesTool: { tool: listMyWishesTool, tier: 'read' },
  getWishDetailsTool: { tool: getWishDetailsTool, tier: 'read' },
  listMyWishOffersTool: { tool: listMyWishOffersTool, tier: 'read' },
  // Behind CONCIERGE_MCP_WRITE: one run costs Gemini tokens, the other writes a row.
  previewWishTool: { tool: previewWishTool, tier: 'read', ai: true, enabled: conciergeWriteEnabled },
  draftWishTool: { tool: draftWishTool, tier: 'selfWrite', enabled: conciergeWriteEnabled },

  // --- conversations (M4). A forum belongs to a mission/decision/haluka, not to
  // a rikma, so the rikma gate lives inside the tools (forumAllowedByKey) and the
  // participant check is the action's own `forumParticipant` rule.
  listMyConversationsTool: { tool: listMyConversationsTool, tier: 'read', project: 'scope' },
  readConversationTool: { tool: readConversationTool, tier: 'read' },
  postConversationMessageTool: { tool: postConversationMessageTool, tier: 'communicate' },

  getSitePagesTool: { tool: getSitePagesTool, tier: 'read' },
  getPageContextTool: { tool: getPageContextTool, tier: 'read' },

  // --- prepare ---
  navigateToPageTool: { tool: navigateToPageTool, tier: 'prepare' },
  createProjectTool: { tool: createProjectTool, tier: 'prepare' }, // returns a prefilled URL; the human creates it
  prepareMissionTool: { tool: prepareMissionTool, tier: 'prepare', project: 'member' },
  planProjectWorkTool: { tool: planProjectWorkTool, tier: 'prepare', project: 'member', ai: true },
  createPlanBoardTool: { tool: createPlanBoardTool, tier: 'prepare', project: 'member' }, // proposals only
  scanProjectDirectionsTool: { tool: scanProjectDirectionsTool, tier: 'prepare', project: 'member', ai: true },

  // --- selfWrite ---
  // The tool checks the caller holds the mission; the guard adds the key scope,
  // and a scoped key may not fall back to "whatever timer is running".
  timerActionTool: { tool: timerActionTool, tier: 'selfWrite', mission: 'scope', scopedKeyNeeds: 'missionId' },

  // --- consentWrite ---
  // createTask runs with the admin token but is projectMember-gated on the key's
  // owner, and nobody is bound by it until they accept it.
  // missionId (the running mission the act belongs to) is guarded too: without it
  // an act could be pinned to a mission of a rikma the caller has no part in.
  // Sets one rikma link. In a rikma with more than one member the action turns
  // the website/Facebook change into a Decision by itself — consent stays put.
  proposeProjectLinkTool: { tool: proposeProjectLinkTool, tier: 'consentWrite', project: 'member' },
  createTaskTool: { tool: createTaskTool, tier: 'consentWrite', project: 'member', mission: 'member' },

  // --- sharedWrite (needs MCP_WRITE_SCOPE) ---
  createMissionTool: { tool: createMissionTool, tier: 'sharedWrite', project: 'member' }
};

/** Whether an entry is switched on at all (feature flags). */
export function entryEnabled(entry: McpManifestEntry): boolean {
  return entry.enabled ? entry.enabled() : true;
}

/** Whether a key with these ops may see a tool of this tier. */
export function tierAllowed(tier: McpToolPolicy['tier'], ops: string[]): boolean {
  if (tier === 'sharedWrite') return ops.includes(MCP_WRITE_SCOPE);
  // D1: communicate is on by default; a key that lists ops opts in explicitly.
  if (tier === 'communicate') return ops.length === 0 || ops.includes('mcp:post');
  return true;
}
