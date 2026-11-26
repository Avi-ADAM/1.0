/**
 * Which tools a page of 1lev1.com registers with the browser's agent
 * (WebMCP, docs/inprogress/PLAN_WEBMCP.md §3.1–3.2).
 *
 * No new tools: every name here is an entry of MCP_TOOL_MANIFEST (or the
 * account-free getPlatformInfo), and the call goes through the same
 * wrapMcpTool guard as an MCP key. This file only decides the *subset* a page
 * offers — a browser agent picks badly from a long list, and Chrome's
 * Lighthouse audit warns above 40 tools per page.
 *
 * Pure: no env, no fetch. The mode comes in as an argument.
 */

import type { McpTier } from '../mcp/guard.js';

/** `off` = nothing registered, the endpoint is 404; `read` = reads + pure links; `on` = up to the tier ceiling. */
export type WebMcpMode = 'off' | 'read' | 'on';

/** The account-free tool that is not a manifest entry (publicTools.ts). */
export const PLATFORM_INFO = 'getPlatformInfo';

/** Guests: what the public site already shows anyone. */
export const GUEST_TOOLS = [PLATFORM_INFO, 'getSitePagesTool', 'searchCatalogTool', 'searchRikmasTool'] as const;

/** Signed in, on any page. */
export const MEMBER_TOOLS = [
  'getMyUpdatesTool',
  'findUserProjectsTool',
  'getActiveTimersTool',
  'listUserMissionsTool',
  'listMyMatchesTool',
  'searchContentTool',
  'navigateToPageTool'
] as const;

interface RouteSurface {
  /** Matched against the pathname with any locale prefix removed. */
  match: RegExp;
  tools: readonly string[];
}

/** Signed-in extras by route. A rikma page fills `projectId` from the URL. */
export const ROUTE_SURFACES: readonly RouteSurface[] = [
  {
    match: /^\/(moach|project)\/\d+(\/|$)/,
    tools: [
      'getProjectDetailsTool',
      'getProjectMembersTool',
      'listProjectResourcesTool',
      'listRikmaProcessesTool',
      'getMyStakeTool',
      'listRikmaProductsTool',
      'prepareMissionTool',
      'planProjectWorkTool'
    ]
  },
  {
    match: /^\/lev(\/|$)/,
    tools: ['timerActionTool', 'getMissionDetailsTool', 'listMyConversationsTool', 'listMyApplicationsTool']
  },
  {
    match: /^\/(concierge|made-for-you|wish)(\/|$)/,
    tools: ['listMyWishesTool', 'getWishDetailsTool', 'listMyWishOffersTool', 'previewWishTool']
  }
];

/** Well under Chrome's warning at 40 — more tools means worse choices by the agent. */
export const MAX_TOOLS_PER_PAGE = 25;

/**
 * The tier ceiling (§3.2). consentWrite / communicate wait for the in-page
 * confirmation dialog (W2b) — until it exists they are not offered at all,
 * because `consequentialHint` is only a hint an agent may ignore. sharedWrite,
 * money, votes and approvals are never offered: an agent prepares a link and a
 * person clicks.
 */
export function tierAllowedOnWeb(tier: McpTier, pure: boolean, mode: WebMcpMode): boolean {
  if (mode === 'off') return false;
  if (tier === 'read') return true;
  if (tier === 'prepare') return pure || mode === 'on';
  if (tier === 'selfWrite') return mode === 'on';
  return false;
}

const LOCALE_PREFIX = /^\/(he|en|ar|ru|es)(?=\/|$)/;

/** The pathname without a locale prefix, never empty. */
export function normalizePath(pathname: string): string {
  const p = String(pathname || '/').split(/[?#]/)[0].replace(LOCALE_PREFIX, '');
  return p.startsWith('/') ? p : `/${p}`;
}

/** The rikma a page belongs to, when its URL names one. */
export function projectIdFromPath(pathname: string): string | undefined {
  return /^\/(?:moach|project)\/(\d+)(?:\/|$)/.exec(normalizePath(pathname))?.[1];
}

/** Candidate tool names for a page, before the manifest and the tier ceiling filter them. */
export function candidateTools(pathname: string, signedIn: boolean): string[] {
  if (!signedIn) return [...GUEST_TOOLS];
  const path = normalizePath(pathname);
  const names = new Set<string>([...GUEST_TOOLS, ...MEMBER_TOOLS]);
  for (const route of ROUTE_SURFACES) {
    if (route.match.test(path)) for (const n of route.tools) names.add(n);
  }
  return [...names];
}

/** What surfaceTools needs to know about a manifest entry. */
export interface SurfaceEntry {
  tier: McpTier;
  pure?: boolean;
  enabled: boolean;
  /** Listed to a narrower audience (growth operators) — never on a page. */
  restricted: boolean;
}

/**
 * The tool names a page registers: candidates that exist, are switched on,
 * are public, and fit the tier ceiling of the mode.
 */
export function surfaceTools(
  pathname: string,
  signedIn: boolean,
  mode: WebMcpMode,
  lookup: (name: string) => SurfaceEntry | undefined
): string[] {
  if (mode === 'off') return [];
  return candidateTools(pathname, signedIn).filter((name) => {
    const entry = lookup(name);
    if (!entry || !entry.enabled || entry.restricted) return false;
    return tierAllowedOnWeb(entry.tier, entry.pure === true, mode);
  });
}

/**
 * Tools whose result carries only platform text, never what members wrote.
 * Every other tool is marked `untrustedContentHint`, so the agent knows a
 * rikma description or a forum message is data, not an instruction to it.
 */
export const PLATFORM_TEXT_ONLY = new Set([PLATFORM_INFO, 'getSitePagesTool', 'navigateToPageTool']);
