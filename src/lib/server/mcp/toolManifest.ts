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
 * `title` plus the tier become the MCP tool annotations (see mcpAnnotations);
 * the Claude Directory requires them on every tool.
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
  searchContentTool,
  previewWishTool,
  draftWishTool,
  conciergeWriteEnabled
} from '../../../mastra/tools/conciergeTools';
import {
  listRikmaProcessesTool,
  startProcessTool,
  attachToProcessTool
} from '../../../mastra/tools/processTools';
import {
  listMyConversationsTool,
  readConversationTool,
  postConversationMessageTool,
  openRikmaConversationTool
} from '../../../mastra/tools/forumTools';
import {
  proposeRikmaBlueprintTool,
  getAssistantTool,
  setAssistantItemsTool,
  undoAssistantTool,
  shareRikmaPreviewTool,
  startAssistantTool,
  reviseAssistantTool,
  applyAssistantTool,
  dismissOfferTool,
  assistantMcpEnabled
} from '../../../mastra/tools/assistantTools';
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
  /** Human-readable name MCP clients show (the `title` annotation). */
  title: string;
  /** A `prepare` tool that saves nothing at all — it only computes a URL or a proposal. */
  pure?: true;
  /** Can remove or overwrite something the caller already had, not only add. */
  destructive?: true;
  /**
   * What an outside agent reads instead of the tool's own description. For the
   * tools the in-app bot shares, whose wording assumes the bot sits inside the
   * page ("the current page the user is on").
   */
  description?: string;
}

/** Public reference for every tool, generated from this manifest (src/routes/mcp). */
export const MCP_DOCS_URL = 'https://1lev1.com/mcp';

/** The description an MCP client sees: the tool's own words, then its entry in the public reference. */
export function mcpDescription(name: string, entry: Pick<McpManifestEntry, 'tool' | 'description'>): string {
  const base = (entry.description ?? entry.tool.description ?? '').trim();
  return `${base} Docs: ${MCP_DOCS_URL}#${name}`;
}

/** MCP tool annotations (spec 2025-03-26): what a client shows and when it asks before calling. */
export interface McpToolAnnotations {
  title: string;
  readOnlyHint: boolean;
  destructiveHint: boolean;
  idempotentHint: boolean;
  openWorldHint: boolean;
}

/**
 * Annotations follow the tier, so a tool cannot claim to be read-only while its
 * tier says it writes. `prepare` is read-only only when marked `pure`: most
 * prepare tools save a draft or a board even though they bind nobody.
 * The platform is a closed domain — no tool reaches the open web — so
 * openWorldHint is false throughout.
 */
export function mcpAnnotations(entry: Pick<McpManifestEntry, 'tier' | 'title' | 'pure' | 'destructive'>): McpToolAnnotations {
  const readOnly = entry.tier === 'read' || (entry.tier === 'prepare' && entry.pure === true);
  return {
    title: entry.title,
    readOnlyHint: readOnly,
    destructiveHint: !readOnly && entry.destructive === true,
    idempotentHint: readOnly,
    openWorldHint: false
  };
}

export const MCP_WRITE_SCOPE = 'mcp:write';

// getTimerHistoryTool is deliberately absent: it calls a qid ('getTimerHistory')
// that was never written, so it can only ever fail. Re-add it with a real query.
export const MCP_TOOL_MANIFEST: Record<string, McpManifestEntry> = {
  // --- read ---
  findUserProjectsTool: { tool: findUserProjectsTool, title: "Find my rikmas", tier: 'read' }, // narrows to the key scope itself
  getProjectDetailsTool: { tool: getProjectDetailsTool, title: "Get rikma details", tier: 'read', project: 'scope' }, // public face for non-members
  listProjectResourcesTool: { tool: listProjectResourcesTool, title: "List rikma resources", tier: 'read', project: 'member' },
  getProjectStatsTool: { tool: getProjectStatsTool, title: "Get rikma stats", tier: 'read', project: 'member' },
  getProjectMembersTool: { tool: getProjectMembersTool, title: "List rikma members", tier: 'read', project: 'member' },
  getMemberMissionsTool: { tool: getMemberMissionsTool, title: "List a member's missions", tier: 'read', project: 'member' },
  getMissionDetailsTool: { tool: getMissionDetailsTool, title: "Get mission details", tier: 'read', mission: 'member' },
  // The caller's own missions across rikmot; projectId only filters them.
  listUserMissionsTool: { tool: listUserMissionsTool, title: "List my missions", tier: 'read', project: 'scope', scopedOutput: ['missions'] },
  findMissionTool: { tool: findMissionTool, title: "Find a mission", tier: 'read', scopedOutput: ['missions'] },
  getActiveTimersTool: { tool: getActiveTimersTool, title: "Get running timers", tier: 'read', scopedOutput: ['timers'] },
  // Aggregates can't be narrowed after the fact — a scoped key must name the rikma.
  getMissionStatsTool: { tool: getMissionStatsTool, title: "Get mission stats", tier: 'read', project: 'scope', scopedKeyNeeds: 'projectId' },
  // --- concierge reads (M7). No projectId: a wish belongs to a person, not to a
  // rikma, so each tool keys itself to the caller or checks the viewer inside.
  searchCatalogTool: { tool: searchCatalogTool, title: "Search the catalog", tier: 'read' },
  // Its query filters by membership itself; the key scope is applied in the tool,
  // because the rows come from seven collections at once.
  searchContentTool: { tool: searchContentTool, title: "Search my rikmas", tier: 'read' },
  listMyWishesTool: { tool: listMyWishesTool, title: "List my wishes", tier: 'read' },
  getWishDetailsTool: { tool: getWishDetailsTool, title: "Get wish details", tier: 'read' },
  listMyWishOffersTool: { tool: listMyWishOffersTool, title: "List offers on my wishes", tier: 'read' },
  // Behind CONCIERGE_MCP_WRITE: one run costs Gemini tokens, the other writes a row.
  previewWishTool: { tool: previewWishTool, title: "Preview a wish breakdown", tier: 'read', ai: true, enabled: conciergeWriteEnabled },
  draftWishTool: { tool: draftWishTool, title: "Save a draft wish", tier: 'selfWrite', enabled: conciergeWriteEnabled },

  // --- rikma import (PLAN_AI_SIGNUP_CONCIERGE §4, §10), behind ASSISTANT_MCP_ENABLED.
  // All four touch only the caller's own draft; creating happens on the review
  // page, by the person. No model call: the agent does the decomposition.
  proposeRikmaBlueprintTool: { tool: proposeRikmaBlueprintTool, title: "Draft a rikma from a blueprint", tier: 'prepare', project: 'member', enabled: assistantMcpEnabled },
  getAssistantTool: { tool: getAssistantTool, title: "Get a draft list", tier: 'read', enabled: assistantMcpEnabled },
  setAssistantItemsTool: { tool: setAssistantItemsTool, title: "Edit a draft list", tier: 'prepare', enabled: assistantMcpEnabled },
  undoAssistantTool: { tool: undoAssistantTool, title: "Undo a draft list change", tier: 'prepare', enabled: assistantMcpEnabled },
  shareRikmaPreviewTool: { tool: shareRikmaPreviewTool, title: "Share a rikma preview link", tier: 'prepare', enabled: assistantMcpEnabled },
  // Profile / wish lists (§6, §7): the person's own profile and draft, saved
  // from the chat by decision §0.1; reading a text or revising runs a model.
  startAssistantTool: { tool: startAssistantTool, title: "Start a profile or wish list", tier: 'selfWrite', ai: true, enabled: assistantMcpEnabled },
  reviseAssistantTool: { tool: reviseAssistantTool, title: "Revise a list from free text", tier: 'selfWrite', ai: true, enabled: assistantMcpEnabled },
  applyAssistantTool: { tool: applyAssistantTool, title: "Save a list", destructive: true, tier: 'selfWrite', enabled: assistantMcpEnabled },
  dismissOfferTool: { tool: dismissOfferTool, title: "Stop suggesting a mission", tier: 'selfWrite', enabled: assistantMcpEnabled },

  // --- conversations (M4). A forum belongs to a mission/decision/haluka, not to
  // a rikma, so the rikma gate lives inside the tools (forumAllowedByKey) and the
  // participant check is the action's own `forumParticipant` rule.
  listMyConversationsTool: { tool: listMyConversationsTool, title: "List my conversations", tier: 'read', project: 'scope' },
  readConversationTool: { tool: readConversationTool, title: "Read a conversation", tier: 'read' },
  postConversationMessageTool: { tool: postConversationMessageTool, title: "Post to a conversation", tier: 'communicate' },
  // Creates the rikma-wide thread on first use (the only forum that is not
  // attached to some object), then hands its id to the two tools above.
  openRikmaConversationTool: { tool: openRikmaConversationTool, title: "Open the rikma conversation", tier: 'communicate', project: 'member' },

  getSitePagesTool: { tool: getSitePagesTool, title: "List site pages", tier: 'read' },
  // getPageContextTool is deliberately absent: its table (src/lib/bot/pageContexts.js)
  // knows three pages, in Hebrew, and answers every other path with a placeholder.
  // It stays for the in-app bot; an outside agent gets getSitePagesTool instead.

  // --- processes (M6). What a rikma is pursuing before it is a mission yet.
  listRikmaProcessesTool: { tool: listRikmaProcessesTool, title: "List rikma processes", tier: 'read', project: 'member' },

  // --- prepare ---
  navigateToPageTool: {
    tool: navigateToPageTool,
    title: "Link to a site page",
    description:
      'Turn a 1lev1.com page into a link to give the user - it does not open anything by itself. Pass the path ' +
      '(e.g. "/lev", or "/moach/<projectId>" with idPr) and a short name for it; the result carries the path to put ' +
      'after https://1lev1.com. getSitePagesTool lists the valid paths.',
    pure: true,
    tier: 'prepare'
  },
  createProjectTool: { tool: createProjectTool, title: "Prepare a new rikma", pure: true, tier: 'prepare' }, // returns a prefilled URL; the human creates it
  prepareMissionTool: { tool: prepareMissionTool, title: "Prepare a mission", pure: true, tier: 'prepare', project: 'member' },
  planProjectWorkTool: { tool: planProjectWorkTool, title: "Plan rikma work from an idea", tier: 'prepare', project: 'member', ai: true },
  createPlanBoardTool: { tool: createPlanBoardTool, title: "Save a planning board", tier: 'prepare', project: 'member' }, // proposals only
  scanProjectDirectionsTool: { tool: scanProjectDirectionsTool, title: "Scan rikma directions", tier: 'prepare', project: 'member', ai: true },

  // --- selfWrite ---
  // The tool checks the caller holds the mission; the guard adds the key scope,
  // and a scoped key may not fall back to "whatever timer is running".
  timerActionTool: { tool: timerActionTool, title: "Start or stop a mission timer", tier: 'selfWrite', mission: 'scope', scopedKeyNeeds: 'missionId' },

  // --- consentWrite ---
  // createTask runs with the admin token but is projectMember-gated on the key's
  // owner, and nobody is bound by it until they accept it.
  // missionId (the running mission the act belongs to) is guarded too: without it
  // an act could be pinned to a mission of a rikma the caller has no part in.
  // Sets one rikma link. In a rikma with more than one member the action turns
  // the website/Facebook change into a Decision by itself — consent stays put.
  proposeProjectLinkTool: { tool: proposeProjectLinkTool, title: "Propose a rikma link", tier: 'consentWrite', project: 'member' },
  // Both open or extend a shared object of the rikma, and bind nobody.
  startProcessTool: { tool: startProcessTool, title: "Start a process", tier: 'communicate', project: 'member' },
  attachToProcessTool: { tool: attachToProcessTool, title: "Attach to a process", tier: 'communicate', project: 'member' },
  createTaskTool: { tool: createTaskTool, title: "Propose a task", tier: 'consentWrite', project: 'member', mission: 'member' },

  // --- sharedWrite (needs MCP_WRITE_SCOPE) ---
  createMissionTool: { tool: createMissionTool, title: "Create an open mission", tier: 'sharedWrite', project: 'member' }
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
