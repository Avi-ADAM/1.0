/**
 * The MCP access guard (PLAN_MCP_TOOLS_V2 §1).
 *
 * External MCP tools run on the service token, so Strapi enforces nothing on
 * their behalf: a tool that forgets to check membership reads any rikma by id.
 * Several did exactly that. Instead of trusting every tool to remember, the MCP
 * route exposes each tool through `wrapMcpTool` with the policy written next to
 * it in `toolManifest.ts`, so a new tool cannot skip the checks by omission.
 *
 * In order, for every call:
 *  1. rate limit  — per key, by bucket (read / write / ai);
 *  2. key scope   — a key minted for rikma 89 (`scopes.projects`) never reaches 90;
 *  3. membership  — the key's owner must be a member of the rikma (directly by
 *                   projectId, or through the rikma a missionId belongs to);
 *  4. the tool itself;
 *  5. scoped output — lists of the caller's own records narrowed to the key scope;
 *  6. audit       — writes, AI runs and every refusal are logged.
 */

import { createTool } from '@mastra/core/tools';
import { getMcpContext } from '../mcpContext.js';
import { sendToSer } from '../../send/sendToSer.js';
import { consume, type McpBucket } from './rateLimit.js';
import { audit } from './audit.js';

/** A refusal raised inside the checks; the wrapper turns it into a result the agent reads. */
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

/**
 * Throws McpDenied unless the current MCP caller may act on `projectId`.
 * The internal (JWT) bot is out of scope — it never goes through /api/mcp.
 */
export async function assertProjectAccess(projectId: string, requireMember = true): Promise<void> {
  const ctx = getMcpContext();
  if (!ctx?.userId || !ctx.fetchInstance) throw new McpDenied('Not authenticated.');
  if (ctx.isInternalBot) return;

  if (!keyAllowsProject(ctx.keyProjects, projectId)) {
    throw new McpDenied(`This API key is limited to other rikmas and cannot reach rikma ${projectId}.`);
  }
  if (!requireMember) return;

  const members = await fetchProjectMemberIds(String(projectId), ctx.fetchInstance);
  // Same answer for "no such rikma" and "not yours": ids must not be probeable.
  if (!members || !members.has(String(ctx.userId))) {
    throw new McpDenied(`You are not a member of rikma ${projectId}, so this is not available.`);
  }
}

/**
 * The same gate for a mission in progress, through the rikma it belongs to.
 * `requireMember:false` still enforces the key scope — for tools that already
 * check that the caller holds the mission themselves.
 */
export async function assertMissionAccess(missionId: string, requireMember = true): Promise<void> {
  const ctx = getMcpContext();
  if (!ctx?.userId || !ctx.fetchInstance) throw new McpDenied('Not authenticated.');
  if (ctx.isInternalBot) return;
  // An unscoped key that the tool itself checks needs no lookup at all.
  if (!requireMember && !ctx.keyProjects?.length) return;

  const res: any = await sendToSer({ missionId }, '36getMissionTimer', 0, 0, true, ctx.fetchInstance);
  const projectId = res?.data?.mesimabetahalich?.data?.attributes?.project?.data?.id;
  if (!projectId) {
    throw new McpDenied(`Mission ${missionId} is not available.`);
  }
  try {
    await assertProjectAccess(String(projectId), requireMember);
  } catch (e) {
    // Do not reveal which rikma a foreign mission belongs to.
    if (e instanceof McpDenied) throw new McpDenied(`Mission ${missionId} is not available.`);
    throw e;
  }
}

export type McpTier = 'read' | 'prepare' | 'selfWrite' | 'consentWrite' | 'communicate' | 'sharedWrite';

export interface McpToolPolicy {
  tier: McpTier;
  /** Calls a language model — its own, much smaller rate bucket. */
  ai?: boolean;
  /** projectId input: `member` = must be a member; `scope` = key scope only. */
  project?: 'member' | 'scope';
  /** missionId input, resolved to its rikma: same two levels. */
  mission?: 'member' | 'scope';
  /**
   * For a key limited to some rikmot, the call must name one: an omitted
   * projectId is filled in when the key has exactly one rikma and refused
   * otherwise; an omitted missionId is refused.
   */
  scopedKeyNeeds?: 'projectId' | 'missionId';
  /** Output arrays whose items carry `projectId`, narrowed to the key scope. */
  scopedOutput?: string[];
}

export function bucketFor(policy: McpToolPolicy): McpBucket {
  if (policy.ai) return 'ai';
  return policy.tier === 'read' || policy.tier === 'prepare' ? 'read' : 'write';
}

/** Narrows the named arrays of a tool result to the key's rikmot. */
export function narrowOutput(out: any, fields: string[] | undefined, keyProjects: string[] | undefined): any {
  if (!fields?.length || !keyProjects?.length || !out || typeof out !== 'object') return out;
  const allowed = new Set(keyProjects.map(String));
  const next = { ...out };
  for (const field of fields) {
    if (!Array.isArray(next[field])) continue;
    const kept = next[field].filter((row: any) => row?.projectId != null && allowed.has(String(row.projectId)));
    if (kept.length !== next[field].length) {
      next[field] = kept;
      for (const countField of ['totalCount', 'totalActive']) {
        if (typeof next[countField] === 'number') next[countField] = kept.length;
      }
    }
  }
  return next;
}

async function checkPolicy(policy: McpToolPolicy, input: any): Promise<any> {
  const ctx = getMcpContext();
  const keyProjects = ctx?.keyProjects;
  let effective = input;

  if (keyProjects?.length && policy.scopedKeyNeeds) {
    const field = policy.scopedKeyNeeds;
    const given = input?.[field];
    if (given == null || String(given) === '') {
      if (field === 'projectId' && keyProjects.length === 1) {
        effective = { ...input, projectId: keyProjects[0] };
      } else {
        throw new McpDenied(
          `This API key is limited to specific rikmas, so pass ${field} explicitly` +
            (field === 'projectId' ? ` (one of: ${keyProjects.join(', ')}).` : '.')
        );
      }
    }
  }

  const projectId = effective?.projectId;
  if (policy.project && projectId != null && String(projectId) !== '') {
    await assertProjectAccess(String(projectId), policy.project === 'member');
  }
  const missionId = effective?.missionId;
  if (policy.mission && missionId != null && String(missionId) !== '') {
    await assertMissionAccess(String(missionId), policy.mission === 'member');
  }
  return effective;
}

/**
 * Returns a copy of `tool` that runs the policy around it. The original object
 * is left untouched, because the in-app bot shares it.
 *
 * A refusal is returned, not thrown: Mastra re-throws from execute, and an
 * agent reads `{ success:false, denied:true, message }` the same way it reads
 * every other tool failure here. The outer tool declares no outputSchema so the
 * refusal is not rejected as malformed output; the inner tool still validates
 * its own result.
 */
export function wrapMcpTool<T extends { id: string }>(tool: T, policy: McpToolPolicy): T {
  const inner = tool as any;
  const bucket = bucketFor(policy);
  const audited = policy.tier !== 'read' && policy.tier !== 'prepare';

  return createTool({
    id: inner.id,
    description: inner.description,
    inputSchema: inner.inputSchema,
    execute: async (input: any, context: any) => {
      const started = Date.now();
      const ctx = getMcpContext();
      const record = (outcome: string, extra: Record<string, unknown> = {}) =>
        audit({
          keyId: ctx?.keyId,
          userId: ctx?.userId,
          tool: inner.id,
          tier: policy.tier,
          projectId: input?.projectId,
          missionId: input?.missionId,
          outcome,
          ms: Date.now() - started,
          ...extra
        });

      if (!ctx?.isInternalBot) {
        const limit = consume(ctx?.keyId || `user:${ctx?.userId ?? 'anon'}`, bucket);
        if (!limit.ok) {
          const retryAfterSeconds = limit.retryAfterSeconds ?? 1;
          record('rateLimited', { bucket });
          return {
            success: false,
            rateLimited: true,
            retryAfterSeconds,
            message: `Too many ${bucket} calls from this key. Try again in ${retryAfterSeconds}s.`
          };
        }
      }

      let effective = input;
      try {
        effective = await checkPolicy(policy, input);
      } catch (e) {
        if (e instanceof McpDenied) {
          record('denied');
          return { success: false, denied: true, message: e.message };
        }
        console.error('[mcp guard] access check failed:', e);
        record('checkFailed');
        return { success: false, message: 'Could not verify access right now. Try again shortly.' };
      }

      try {
        const out = await inner.execute(effective, context);
        if (audited || policy.ai) record(out?.success === false ? 'failed' : 'ok');
        return narrowOutput(out, policy.scopedOutput, ctx?.isInternalBot ? undefined : ctx?.keyProjects);
      } catch (e) {
        record('error');
        throw e;
      }
    }
  } as any) as unknown as T;
}
