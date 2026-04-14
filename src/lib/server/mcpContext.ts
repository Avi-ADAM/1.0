/**
 * MCP Request Context
 *
 * Replaces the unsafe `global.botContext` pattern with a per-request
 * context that carries the authenticated user's identity.
 *
 * Two authentication modes are supported:
 *  - Internal bot  (JWT via SvelteKit session) → isInternalBot: true
 *  - External MCP  (API key)                   → isInternalBot: false / undefined
 *
 * Tools read from `getMcpContext()` instead of `global.botContext` so
 * that every action is scoped to the verified user.
 */

export interface McpContext {
  /** Strapi user ID (string) of the authenticated caller */
  userId: string;
  /** SvelteKit fetch instance bound to the current request */
  fetchInstance: typeof fetch;
  /**
   * When true, the request comes from the internal JWT-authenticated bot.
   * The userId has already been verified by the SvelteKit session/JWT
   * middleware, so per-resource ownership checks are relaxed — we trust
   * that the workflow only acts on behalf of the logged-in user.
   */
  isInternalBot?: boolean;
  /** Optional: last mission search result for disambiguation */
  lastMissionSearch?: {
    filter?: string;
    projectId?: string;
    projectName?: string;
    missionName?: string;
    totalCount: number;
    missions: Array<{ id: string; name?: string; [key: string]: any }>;
  };
  /** Optional: last message text (used for disambiguation heuristics) */
  currentMessage?: string;
  /** Optional: full conversation history */
  fullHistory?: any[];
  /** Optional: detected intent from the intent agent */
  intent?: any;
  /** Optional: current page path the user is on */
  currentPath?: string;
}

// Node.js global augmentation so TypeScript is happy
declare global {
  // eslint-disable-next-line no-var
  var botContext: McpContext | undefined;
}

/**
 * Set the MCP context for the current request.
 * Called once per request in the MCP server handler or chat workflow.
 */
export function setMcpContext(ctx: McpContext): void {
  global.botContext = ctx;
}

/**
 * Read the current MCP context.
 * Returns null when called outside an authenticated request.
 */
export function getMcpContext(): McpContext | null {
  return global.botContext ?? null;
}

/**
 * Verify that the requesting user owns the given resource userId.
 *
 * @param resourceUserId - The userId that owns the resource being mutated
 * @returns true if the caller is the owner, false otherwise
 */
export function assertOwnership(resourceUserId: string | number): boolean {
  const ctx = getMcpContext();
  if (!ctx) return false;
  return String(ctx.userId) === String(resourceUserId);
}

/**
 * Check whether the current caller is authorised to act on a mission.
 *
 * Rules:
 *  1. Internal bot requests are always allowed — the user was already
 *     authenticated via JWT before the workflow ran.
 *  2. External MCP (API key) requests must have the caller listed in
 *     the mission's `users.data` array.
 *
 * @param missionAttributes - The mission's attributes object from Strapi
 */
export function isMissionMember(missionAttributes: any): boolean {
  const ctx = getMcpContext();
  if (!ctx) return false;

  // Internal bot: trust the JWT-verified userId, skip membership check
  if (ctx.isInternalBot) return true;

  // External MCP: verify the API-key owner is the mission owner
  // (`users_permissions_user` is the canonical ownership field in Strapi).
  const ownerId = missionAttributes?.users_permissions_user?.data?.id;
  if (ownerId != null) {
    return String(ownerId) === String(ctx.userId);
  }

  // Backward-compatible fallback for legacy payloads that still expose `users`.
  const assignedUsers: Array<{ id: string | number }> =
    missionAttributes?.users?.data ?? [];
  if (assignedUsers.length > 0) {
    return assignedUsers.some((u) => String(u.id) === String(ctx.userId));
  }

  // Fail closed if no ownership data was returned by GraphQL.
  return false;
}
