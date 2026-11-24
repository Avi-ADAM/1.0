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
import { TIMER_APP_URI } from './apps/index';
import { timerActionTool } from '../../../mastra/tools/timerActionTool';
import {
  listUserMissionsTool,
  getActiveTimersTool,
  getMissionDetailsTool,
  getMissionStatsTool
} from '../../../mastra/tools/missionTimers';
import { getSitePagesTool } from '../../../mastra/tools/siteNavigationTool';
import { getMyUpdatesTool } from '../../../mastra/tools/myUpdatesTool';
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
  searchRikmasTool,
  listMyWishesTool,
  getWishDetailsTool,
  listMyWishOffersTool,
  searchContentTool,
  previewWishTool,
  draftWishTool,
  conciergeWriteEnabled
} from '../../../mastra/tools/conciergeTools';
import { listMyMatchesTool } from '../../../mastra/tools/matchTools';
import { getMyStakeTool } from '../../../mastra/tools/stakeTools';
import { getDecisionTool } from '../../../mastra/tools/decisionTools';
import { applyToMissionTool, listMyApplicationsTool, withdrawCandidacyTool, mcpApplyEnabled } from '../../../mastra/tools/joinTools';
import { getRikmaLedgerTool } from '../../../mastra/tools/ledgerTools';
import { findPartnersTool } from '../../../mastra/tools/partnerTools';
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
import { listMyTasksTool, getTaskContextTool, claimTaskTool, reportTaskTool } from '../../../mastra/tools/agentTaskTools';
import { getRikmaContextTool } from '../../../mastra/tools/rikmaContextTool';
import { getPlaybookTool, proposePlaybookUpdateTool } from '../../../mastra/tools/playbookTools';
import {
  proposeRikmaBlueprintTool,
  getAssistantTool,
  setAssistantItemsTool,
  undoAssistantTool,
  shareRikmaPreviewTool,
  prepareForSomeoneElseTool,
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
import { listRikmaLeadsTool, getLeadTool, logLeadActivityTool } from '../../../mastra/tools/leadTools';
import {
  listRikmaProductsTool,
  getRikmaProductTool,
  getShopInventoryTool,
  listRikmaProductOptionsTool,
  listRikmaProductVariantsTool,
  listRikmaOrdersTool,
  getRikmaOrderTool,
  getShippingConfigTool,
  quoteShippingTool,
  createRikmaProductTool,
  updateRikmaProductTool,
  archiveRikmaProductTool,
  setShopStockTool,
  updateRikmaOrderStatusTool
} from '../../../mastra/tools/shopTools';
import {
  proposeProductEditTool,
  proposeProductEditsBatchTool,
  createUploadSessionTool,
  getUploadSessionTool,
  uploadMediaFromUrlTool,
  setProductImagesTool,
  upsertProductOptionsTool,
  upsertProductVariantsTool,
  listRikmaCategoriesTool,
  setProductCategoriesTool,
  createRikmaProductsBatchTool
} from '../../../mastra/tools/shopCatalogTools';
import {
  growthOverviewTool,
  growthGetBusinessTool,
  growthSaveBusinessTool,
  growthImportCsvTool,
  growthResearchTool,
  growthProfileTool,
  growthOutreachTool,
  growthPrepareOnboardingTool,
  growthLogTool,
  growthSetStageTool,
  growthCheckActiveTool,
  growthMcpEnabled
} from '../../../mastra/tools/growthTools';

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
  /**
   * The interactive view (MCP Apps, `ui://…`) a host draws for this tool's
   * result. One of `MCP_APP_URIS` in ./apps; the text result is unchanged.
   */
  ui?: string;
  /**
   * Listed only to this audience. `growthOperators` = members of the growth
   * rikma (checkGrowthOperator): the platform team's own tools, absent from the
   * public reference and from everyone else's tool list. Each tool still
   * re-checks on every call — the listing is not the gate.
   */
  audience?: 'growthOperators';
}

/** Whether an entry belongs in the public reference and the anonymous listing. */
export function entryPublic(entry: Pick<McpManifestEntry, 'audience'>): boolean {
  return !entry.audience;
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
  // Reads like discovery and is not: it only looks through missions the caller already holds.
  findMissionTool: {
    tool: findMissionTool,
    title: "Find one of my missions",
    tier: 'read',
    scopedOutput: ['missions'],
    description:
      'Find one of YOUR missions in progress (missions you already hold) by its name, to get its id for a timer or ' +
      'details. It does not search openings: to discover open missions and resources use searchCatalogTool, and ' +
      'for what fits this user use listMyMatchesTool.'
  },
  getActiveTimersTool: { tool: getActiveTimersTool, title: "Get running timers", tier: 'read', scopedOutput: ['timers'], ui: TIMER_APP_URI },
  // Aggregates can't be narrowed after the fact — a scoped key must name the rikma.
  getMissionStatsTool: { tool: getMissionStatsTool, title: "Get mission stats", tier: 'read', project: 'scope', scopedKeyNeeds: 'projectId' },
  // --- concierge reads (M7). No projectId: a wish belongs to a person, not to a
  // rikma, so each tool keys itself to the caller or checks the viewer inside.
  searchCatalogTool: { tool: searchCatalogTool, title: "Search the catalog", tier: 'read' },
  // --- a way in (PLAN_MCP_PARTNER_INTEGRATION P0.5–P0.7) ---
  // The public rikma directory, minus the hidden QA rikmas.
  searchRikmasTool: { tool: searchRikmasTool, title: "Search rikmas", tier: 'read' },
  // The caller's own precomputed suggestions; keyed to the key owner inside the tool.
  listMyMatchesTool: { tool: listMyMatchesTool, title: "List my matches", tier: 'read' },
  // Shares exactly as memberShares computes them; members only.
  getMyStakeTool: { tool: getMyStakeTool, title: "Get my share in a rikma", tier: 'read', project: 'member' },
  // --- the join loop (P1.3–P1.6) ---
  // The caller's own candidacies; keyed to the key owner, narrowed to the key scope inside.
  listMyApplicationsTool: { tool: listMyApplicationsTool, title: "List my applications", tier: 'read' },
  // Members only; a saleClaim only to its two parties (checked in the tool).
  getDecisionTool: { tool: getDecisionTool, title: "Get a decision", tier: 'read', project: 'member' },
  // Effective sales only; an open holder claim is a count, never an amount.
  getRikmaLedgerTool: { tool: getRikmaLedgerTool, title: "Get rikma sales and splits", tier: 'read', project: 'member' },
  // Opted-in people only (findableByAgents); no contact details ever leave.
  findPartnersTool: { tool: findPartnersTool, title: "Find partners by skill", tier: 'read' },
  // Its query filters by membership itself; the key scope is applied in the tool,
  // because the rows come from seven collections at once.
  searchContentTool: { tool: searchContentTool, title: "Search my rikmas", tier: 'read' },
  listMyWishesTool: { tool: listMyWishesTool, title: "List my wishes", tier: 'read' },
  getWishDetailsTool: { tool: getWishDetailsTool, title: "Get wish details", tier: 'read' },
  listMyWishOffersTool: { tool: listMyWishOffersTool, title: "List offers on my wishes", tier: 'read' },
  // What waits for the user, as ready sentences (PLAN_SMART_NOTICES §6.6). A key limited to
  // some rikmas sees only their items: `waiting` rows carry projectId (wish/deal rows have none).
  getMyUpdatesTool: { tool: getMyUpdatesTool, title: "What's waiting for me", tier: 'read', project: 'scope', scopedOutput: ['waiting'] },
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
  // §5.7: a pending draft for another person, binding nobody until they create it -
  // a signup link, or a receive link when they have an account. Refuses the caller's own email.
  prepareForSomeoneElseTool: { tool: prepareForSomeoneElseTool, title: "Prepare a rikma for someone else", tier: 'prepare', enabled: assistantMcpEnabled },
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

  // --- the task loop (PLAN_AGENT_WORK AW1). A task is named by its id, so the
  // rikma - and the key scope - is known only once it is loaded: the tools check
  // it themselves, and the two writes are actions with the real checks.
  listMyTasksTool: { tool: listMyTasksTool, title: "List my tasks", tier: 'read', project: 'scope', scopedOutput: ['tasks'] },
  getTaskContextTool: { tool: getTaskContextTool, title: "Get a task with its context", tier: 'read' },
  // AW2: projectId guards the rikma; missionId its own rikma; lead/process/act/product ids are checked inside.
  getRikmaContextTool: { tool: getRikmaContextTool, title: "Get a rikma's working context", tier: 'read', project: 'member', mission: 'member', scopedKeyNeeds: 'projectId' },
  getPlaybookTool: { tool: getPlaybookTool, title: "Read a rikma playbook", tier: 'read', project: 'member', scopedKeyNeeds: 'projectId' },
  // Opens a rikma-wide Decision that waits for the members (or writes directly in a rikma of one).
  proposePlaybookUpdateTool: { tool: proposePlaybookUpdateTool, title: "Propose a playbook change", tier: 'consentWrite', project: 'member', scopedKeyNeeds: 'projectId' },
  // Binds only the caller: an act handed to them, or open to their role, becomes theirs.
  claimTaskTool: { tool: claimTaskTool, title: "Take a task", tier: 'selfWrite', mission: 'member' },
  // "done" hands the act to its validator, whose check is awaited - consent lands on them.
  reportTaskTool: { tool: reportTaskTool, title: "Report on a task", tier: 'consentWrite' },

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
  timerActionTool: { tool: timerActionTool, title: "Start or stop a mission timer", tier: 'selfWrite', mission: 'scope', scopedKeyNeeds: 'missionId', ui: TIMER_APP_URI },

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
  // The person's own candidacy (P1.2): binds nobody until the rikma - and, for a deal
  // gap, every customer of that deal - signs. No projectId input: the rikma is read
  // from the opening, and the key scope is checked in the tool. On unless MCP_APPLY_ENABLED=false.
  applyToMissionTool: { tool: applyToMissionTool, title: "Apply to an open mission", tier: 'consentWrite', enabled: mcpApplyEnabled },
  // Takes that candidacy back: only the caller's own Ask/Askm (the action reads the
  // owner from the row), the key scope checked in the tool. Same kill switch.
  withdrawCandidacyTool: { tool: withdrawCandidacyTool, title: "Withdraw my candidacy", tier: 'selfWrite', enabled: mcpApplyEnabled },

  // --- sharedWrite (needs MCP_WRITE_SCOPE) ---
  createMissionTool: { tool: createMissionTool, title: "Create an open mission", tier: 'sharedWrite', project: 'member' },

  // --- shop: storefront & inventory (PLAN_SHOP_CUSTOMER_EXPERIENCE) ---
  // Reads: moachShop* qids (members-only payloads; buyer contact stays inside them, §5.6).
  // Writes: setShopStock + archivePersonalMatanot / setMatanotDiscovery + order lifecycle
  // actions — all projectMember-gated in their actions, idempotent where relevant.
  // Tiers mirror that reality: anyone in the rikma may count the shelf or mark
  // a parcel shipped, so selfWrite (no extra mcp:write scope) keeps the merchant
  // flow one token away; creation still lives here rather than behind sharedWrite
  // because the seller and the agent are the same person with the same consent.
  listRikmaProductsTool: { tool: listRikmaProductsTool, title: 'List rikma products', tier: 'read', project: 'member' },
  getRikmaProductTool: { tool: getRikmaProductTool, title: 'Get rikma product', tier: 'read', project: 'member' },
  getShopInventoryTool: { tool: getShopInventoryTool, title: 'Get shop inventory', tier: 'read', project: 'member' },
  listRikmaProductOptionsTool: { tool: listRikmaProductOptionsTool, title: 'List product options', tier: 'read', project: 'member' },
  listRikmaProductVariantsTool: { tool: listRikmaProductVariantsTool, title: 'List product variants', tier: 'read', project: 'member' },
  listRikmaOrdersTool: { tool: listRikmaOrdersTool, title: 'List rikma orders', tier: 'read', project: 'member' },
  getRikmaOrderTool: { tool: getRikmaOrderTool, title: 'Get rikma order', tier: 'read', project: 'member' },
  // Leads (PLAN_LEADS §4.4, L5): read the enquiries and log a conversation the member had.
  // No status tool — "won" follows money and "not now" is the member's own click.
  listRikmaLeadsTool: { tool: listRikmaLeadsTool, title: 'List rikma leads', tier: 'read', project: 'member' },
  getLeadTool: { tool: getLeadTool, title: 'Get a lead', tier: 'read', project: 'member' },
  logLeadActivityTool: { tool: logLeadActivityTool, title: 'Log a lead conversation', tier: 'selfWrite', project: 'member' },
  // Shipping (PLAN_SHOP_SHIPPING): the rikma's own config and a priced quote — reads, members only.
  getShippingConfigTool: { tool: getShippingConfigTool, title: 'Get shipping setup', tier: 'read', project: 'member' },
  quoteShippingTool: { tool: quoteShippingTool, title: 'Quote shipping', tier: 'read', project: 'member' },
  createRikmaProductTool: { tool: createRikmaProductTool, title: 'Create a rikma product', tier: 'selfWrite', project: 'member' },
  updateRikmaProductTool: { tool: updateRikmaProductTool, title: 'Update rikma product', tier: 'selfWrite', project: 'member' },
  archiveRikmaProductTool: { tool: archiveRikmaProductTool, title: 'Archive a rikma product', tier: 'selfWrite', destructive: true, project: 'member' },
  setShopStockTool: { tool: setShopStockTool, title: 'Set shop stock', tier: 'selfWrite', project: 'member' },
  updateRikmaOrderStatusTool: { tool: updateRikmaOrderStatusTool, title: 'Update order status', tier: 'selfWrite', project: 'member' },

  // --- shop: the catalogue from a chat (shopCatalogTools.ts → $lib/server/shop/storefrontAgent).
  // Every write is saveProductVariants / saveProductOptions / createPersonalMatanot, so a
  // rikma product's terms become an editObject proposal the partners answer — the
  // tools never vote. Same tier as the other shop writes (selfWrite: the seller and
  // the agent are the same person; consent is in the action, not the key).
  proposeProductEditTool: { tool: proposeProductEditTool, title: 'Propose a product edit', tier: 'selfWrite', project: 'member' },
  proposeProductEditsBatchTool: { tool: proposeProductEditsBatchTool, title: 'Propose product edits (batch)', tier: 'selfWrite', project: 'member' },
  setProductImagesTool: { tool: setProductImagesTool, title: 'Set product pictures', tier: 'selfWrite', project: 'member' },
  upsertProductOptionsTool: { tool: upsertProductOptionsTool, title: 'Create or extend product options', tier: 'selfWrite', project: 'member' },
  upsertProductVariantsTool: { tool: upsertProductVariantsTool, title: 'Create or update product variants', tier: 'selfWrite', project: 'member' },
  listRikmaCategoriesTool: { tool: listRikmaCategoriesTool, title: 'List product categories', tier: 'read', project: 'member' },
  setProductCategoriesTool: { tool: setProductCategoriesTool, title: 'Set product categories', tier: 'selfWrite', project: 'member' },
  createRikmaProductsBatchTool: { tool: createRikmaProductsBatchTool, title: 'Create products (batch)', tier: 'selfWrite', project: 'member' },
  // Media ($lib/server/media): a signed, 60-minute upload link the user opens on
  // their phone, and server-side upload from a public URL (SSRF-guarded) or base64.
  // getUploadSession has no projectId: the signed token names the rikma, and the
  // tool checks the caller made it and the key reaches that rikma.
  createUploadSessionTool: { tool: createUploadSessionTool, title: 'Create a picture upload link', tier: 'selfWrite', project: 'member' },
  getUploadSessionTool: { tool: getUploadSessionTool, title: 'Read an upload link', tier: 'read' },
  uploadMediaFromUrlTool: { tool: uploadMediaFromUrlTool, title: 'Upload a picture from a URL', tier: 'selfWrite', project: 'member' },

  // --- Growth Agent (PLAN_GROWTH_AGENT §8.5): the platform team's business-acquisition
  // pipeline. No projectId input — the rikma is GROWTH_PROJECT_ID — so each tool checks
  // the key scope on that rikma and the operator rule itself, and every write is a
  // growth* action with its own operator rule. Nothing in it contacts a business.
  growthOverviewTool: { tool: growthOverviewTool, title: 'Growth: pipeline overview', tier: 'read', audience: 'growthOperators', enabled: growthMcpEnabled },
  growthGetBusinessTool: { tool: growthGetBusinessTool, title: 'Growth: read a business', tier: 'read', audience: 'growthOperators', enabled: growthMcpEnabled },
  growthSaveBusinessTool: { tool: growthSaveBusinessTool, title: 'Growth: add or edit a business', tier: 'selfWrite', audience: 'growthOperators', enabled: growthMcpEnabled },
  growthImportCsvTool: { tool: growthImportCsvTool, title: 'Growth: import businesses (CSV)', tier: 'selfWrite', audience: 'growthOperators', enabled: growthMcpEnabled },
  growthResearchTool: { tool: growthResearchTool, title: 'Growth: research a business', tier: 'prepare', ai: true, audience: 'growthOperators', enabled: growthMcpEnabled },
  growthProfileTool: { tool: growthProfileTool, title: 'Growth: draft or approve a profile', tier: 'prepare', audience: 'growthOperators', enabled: growthMcpEnabled },
  growthOutreachTool: { tool: growthOutreachTool, title: 'Growth: draft or approve an invitation', tier: 'prepare', ai: true, audience: 'growthOperators', enabled: growthMcpEnabled },
  growthPrepareOnboardingTool: { tool: growthPrepareOnboardingTool, title: "Growth: prepare the owner's join link", tier: 'prepare', audience: 'growthOperators', enabled: growthMcpEnabled },
  growthLogTool: { tool: growthLogTool, title: 'Growth: log contact, response or follow-up', tier: 'selfWrite', destructive: true, audience: 'growthOperators', enabled: growthMcpEnabled },
  growthSetStageTool: { tool: growthSetStageTool, title: 'Growth: set a stage', tier: 'selfWrite', destructive: true, audience: 'growthOperators', enabled: growthMcpEnabled },
  growthCheckActiveTool: { tool: growthCheckActiveTool, title: 'Growth: check active providers', tier: 'selfWrite', audience: 'growthOperators', enabled: growthMcpEnabled }
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
