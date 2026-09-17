/**
 * The MCP access guard (PLAN_MCP_TOOLS_V2 §1).
 *
 * External MCP tools run on the service token, so Strapi enforces nothing on
 * their behalf: a tool that forgets to check membership reads any rikma by id.
 * Two tools did exactly that. Instead of trusting every tool to remember, the
 * MCP route wraps each project-scoped tool here, at the point of exposure, so a
 * new tool cannot skip the check by omission.
 *
 * Two independent gates:
 *  1. key scope  — a key minted for rikma 89 (`scopes.projects`) never reaches 90;
 *  2. membership — the key's owner must be a member of the rikma.
 */

import { createTool } from '@mastra/core/tools';
import { getMcpContext } from '../mcpContext.js';
import { sendToSer } from '../../send/sendToSer.js';

/** A refusal from assertProjectAccess; guardProjectTool turns it into a result the agent reads. */
export class McpDenied extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'McpDenied';
  }
}

/** True when the key has no project limit, or the rikma is inside it. */
export function keyAllowsProject(keyProjects: string[] | undefined, projectId: string): boolean {
  if (!keyProjects || keyProjects.length === 0) return true;
  return keyProjects.includes(String(projectId));
}

/** Narrows a list of rikmot to the key's project limit. */
export function filterToKeyProjects<T extends { id: string }>(
  rows: T[],
  keyProjects: string[] | undefined
): T[] {
  if (!keyProjects || keyProjects.length === 0) return rows;
  const allowed = new Set(keyProjects.map(String));
  return rows.filter((r) => allowed.has(String(r.id)));
}

// Short on purpose: someone removed from a rikma should lose access within
// seconds, not minutes. It only saves the repeat lookups of one agent turn.
const MEMBER_TTL_MS = 30 * 1000;
const memberCache = new Map<string, { ids: Set<string>; at: number }>();

/** Member ids of a rikma, or null when it does not exist. */
export async function fetchProjectMemberIds(
  projectId: string,
  fetchInstance: typeof fetch
): Promise<Set<string> | null> {
  const hit = memberCache.get(projectId);
  if (hit && Date.now() - hit.at < MEMBER_TTL_MS) return hit.ids;

  const res: any = await sendToSer({ pid: projectId }, 'getProjectPeopleAndRoles', 0, 0, true, fetchInstance);
  const project = res?.data?.project?.data;
  if (!project) return null;
  const ids = new Set<string>((project.attributes?.user_1s?.data ?? []).map((u: any) => String(u.id)));
  memberCache.set(projectId, { ids, at: Date.now() });
  return ids;
}

/** Test/ops helper. */
export function clearMemberCache(): void {
  memberCache.clear();
}

export interface ProjectGuardOptions {
  /** Input field holding the rikma id. */
  param?: string;
  /**
   * false ⇒ only the key scope is checked. For tools that already degrade to
   * public data for a non-member, or whose projectId only filters the caller's
   * own records.
   */
  requireMember?: boolean;
}

/**
 * Throws McpDenied unless the current MCP caller may act on `projectId`.
 * The internal (JWT) bot is out of scope — it never goes through /api/mcp.
 */
export async function assertProjectAccess(projectId: string, requireMember = true): Promise<void> {
  const ctx = getMcpContext();
  if (!ctx?.userId || !ctx.fetchInstance) throw new McpDenied('Not authenticated.');
  if (ctx.isInternalBot) return;

  if (!keyAllowsProject(ctx.keyProjects, projectId)) {
    throw new McpDenied(
      `This API key is limited to other rikmas and cannot reach rikma ${projectId}.`
    );
  }
  if (!requireMember) return;

  const members = await fetchProjectMemberIds(String(projectId), ctx.fetchInstance);
  // Same answer for "no such rikma" and "not yours": ids must not be probeable.
  if (!members || !members.has(String(ctx.userId))) {
    throw new McpDenied(`You are not a member of rikma ${projectId}, so this is not available.`);
  }
}

/**
 * Returns a copy of `tool` whose execute runs the project gate first. The
 * original object is left untouched, because the in-app bot shares it.
 *
 * A refusal is returned, not thrown: Mastra re-throws from execute, and an
 * agent reads `{ success:false, denied:true, message }` the same way it reads
 * every other tool failure here. The outer tool declares no outputSchema so the
 * refusal is not rejected as malformed output; the inner tool still validates
 * its own result.
 */
export function guardProjectTool<T extends { id: string; execute?: (...args: any[]) => any }>(
  tool: T,
  { param = 'projectId', requireMember = true }: ProjectGuardOptions = {}
): T {
  const inner = tool as any;
  return createTool({
    id: inner.id,
    description: inner.description,
    inputSchema: inner.inputSchema,
    execute: async (input: any, context: any) => {
      const projectId = input?.[param];
      // An optional project filter that was left out is not a project call.
      if (projectId != null && String(projectId) !== '') {
        try {
          await assertProjectAccess(String(projectId), requireMember);
        } catch (e) {
          if (e instanceof McpDenied) return { success: false, denied: true, message: e.message };
          console.error('[mcp guard] access check failed:', e);
          return { success: false, message: 'Could not verify access right now. Try again shortly.' };
        }
      }
      return inner.execute(input, context);
    }
  } as any) as unknown as T;
}
