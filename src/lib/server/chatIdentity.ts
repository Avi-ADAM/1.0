/**
 * Who the chat bot acts as.
 *
 * The chat routes (`/api/chat`, `/api/mastra-v2`, `/api/mastra`) hand the
 * agents an MCP context with `isInternalBot: true`, which tells
 * `src/lib/server/mcp/guard.ts` and the tools that the user id was verified by
 * the session — ownership and membership checks are skipped, and several tools
 * run actions in-process with the admin token as that id. So the id must come
 * from the signed JWT (`locals.uid`, set in hooks.server.js) and from nothing
 * else. The `userId` / `user.id` the client puts in the body used to be taken
 * as-is, which let anyone — signed in or not — have the bot act as any member
 * (PLAN_PROXY_SECURITY §14).
 *
 * The body value is kept only to be logged when it disagrees with the session.
 */

export interface ChatIdentity {
  /** The verified caller, or null for a guest (the unregistered-bot path). */
  userId: string | null;
  /** What the client claimed in the body, for logging only. */
  claimedUserId: string | null;
  /** The client named someone other than the session user. */
  mismatch: boolean;
}

function idOf(value: unknown): string | null {
  if (value === null || value === undefined || value === false) return null;
  const s = String(value).trim();
  return s && s !== 'anonymous' && s !== 'null' && s !== 'undefined' ? s : null;
}

export function resolveChatIdentity(
  locals: { uid?: unknown } | null | undefined,
  claimed?: unknown
): ChatIdentity {
  const userId = idOf(locals?.uid);
  const claimedUserId = idOf(claimed);
  const mismatch = claimedUserId !== null && claimedUserId !== userId;
  if (mismatch) {
    console.warn(
      `[chat-identity] body named user ${claimedUserId}, session is ${userId ?? 'guest'} — using the session`
    );
  }
  return { userId, claimedUserId, mismatch };
}
