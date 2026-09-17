import { createTool } from '@mastra/core/tools'
import { z } from 'zod';
import { sendToSer } from '../../lib/send/sendToSer';
import { getMcpContext } from '../../lib/server/mcpContext.js';
import { filterToKeyProjects } from '../../lib/server/mcp/guard.js';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

type ProjectRow = { id: string; idPr: string; name: string; createdAt: string | null };

async function findUserProjects(userId: number, fetch: any, isServerRequest = false): Promise<ProjectRow[]> {
  try {
    const res: any = await sendToSer({ uid: userId }, "64getUserProjectList", userId, 0, isServerRequest, fetch);
    const projectsData = res?.data?.usersPermissionsUser?.data?.attributes?.projects_1s?.data;

    if (!Array.isArray(projectsData)) {
      console.log('⚠️ No projects data found or data is not an array');
      return [];
    }

    return projectsData.map((item: any) => ({
      id: String(item.id),
      idPr: String(item.id), // alias of id — the in-app navigation agent reads idPr
      name: item.attributes?.projectName ?? '',
      createdAt: item.attributes?.createdAt ?? null,
    }));
  } catch (error) {
    console.error(`❌ findUserProjects Error for user ${userId}:`, error);
    return [];
  }
}

/**
 * Newest first: "what did I just create?" is the most common question after a
 * creation, and it is also how two rikmot with the same name tell apart.
 * A row without createdAt falls back to its id, which Strapi assigns in order.
 */
export function sortNewestFirst<T extends { id: string; createdAt: string | null }>(rows: T[]): T[] {
  const time = (r: T) => (r.createdAt ? Date.parse(r.createdAt) : NaN);
  return [...rows].sort((a, b) => {
    const ta = time(a);
    const tb = time(b);
    if (Number.isFinite(ta) && Number.isFinite(tb) && ta !== tb) return tb - ta;
    if (Number.isFinite(ta) !== Number.isFinite(tb)) return Number.isFinite(ta) ? -1 : 1;
    return Number(b.id) - Number(a.id);
  });
}

export const findUserProjectsTool = createTool({
  id: 'findUserProjects',
  description:
    'Find the projects (rikmot) the current user belongs to, newest first, with their creation time. ' +
    'Use this when the user mentions a project by name, wants to navigate to one, or just created one. ' +
    'Results are paginated: when hasMore is true, call again with offset=nextOffset.',
  inputSchema: z.object({
    // Optional on purpose: an external MCP client has no way to know its own
    // Strapi user id, and this is the first call of almost every flow
    // ("which rikmot do I have?"). When omitted we use the identity the API
    // key was verified as — which is also the only identity it may ever read.
    userId: z.string().optional().describe('User id to list projects for. Omit to use the authenticated caller.'),
    query: z.string().optional().describe('Optional search query to filter projects by name (case-insensitive substring).'),
    limit: z.number().int().min(1).max(MAX_LIMIT).optional().describe(`Page size, default ${DEFAULT_LIMIT}.`),
    offset: z.number().int().min(0).optional().describe('How many results to skip, default 0.'),
  }),
  outputSchema: z.object({
    projects: z.array(z.object({
      id: z.string().describe('Project id - pass this to other tools.'),
      idPr: z.string().describe('Same value as id; kept for backward compatibility.'),
      name: z.string(),
      createdAt: z.string().nullable().describe('ISO creation time; tells apart projects with similar names.'),
    })).describe('The user\'s projects, newest first.'),
    total: z.number().optional().describe('Number of matching projects across all pages.'),
    hasMore: z.boolean().optional(),
    nextOffset: z.number().optional(),
    success: z.boolean(),
    message: z.string().optional()
  }),
  execute: async (inputData, context) => {
    try {
      const { userId, query, limit, offset } = inputData;
      const globalContext = getMcpContext() || ({} as any);
      const fetchInstance = globalContext.fetchInstance;
      const isServerRequest = !globalContext.isInternalBot;
      const ctxUserId = globalContext.userId;

      // External (API-key) requests run against the service token, so an
      // arbitrary `userId` here would happily list somebody else's rikmot.
      // Such a caller is only ever allowed to read the identity its key was
      // verified as; the internal bot, already JWT-authenticated, may pass one.
      if (!globalContext.isInternalBot && userId && String(userId) !== String(ctxUserId)) {
        return {
          projects: [],
          success: false,
          message: 'You can only list the projects of the authenticated user.'
        };
      }

      // Omitting userId is the normal case for an external client: it has no
      // way to know its own Strapi id.
      const effectiveUserId = globalContext.isInternalBot ? (userId ?? ctxUserId) : ctxUserId;

      if (!effectiveUserId || !fetchInstance) {
        return {
          projects: [],
          success: false,
          message: 'User context is required to find projects.'
        };
      }

      const projects = await findUserProjects(parseInt(String(effectiveUserId)), fetchInstance, isServerRequest);

      // A key limited to some rikmot (scopes.projects) must not even list the others.
      let matching = globalContext.isInternalBot ? projects : filterToKeyProjects(projects, globalContext.keyProjects);
      if (query && query.trim()) {
        const searchTerm = query.toLowerCase().trim();
        matching = projects.filter((project) => project.name.toLowerCase().includes(searchTerm));
      }
      matching = sortNewestFirst(matching);

      const start = offset ?? 0;
      const size = limit ?? DEFAULT_LIMIT;
      const page = matching.slice(start, start + size);
      const hasMore = start + page.length < matching.length;

      const scope = query ? ` matching "${query}"` : '';
      return {
        projects: page,
        total: matching.length,
        hasMore,
        ...(hasMore ? { nextOffset: start + page.length } : {}),
        success: true,
        message: hasMore
          ? `Showing ${page.length} of ${matching.length} projects${scope}, newest first. Call again with offset=${start + page.length} for more.`
          : `Found ${matching.length} projects${scope}, newest first.`
      };
    } catch (error) {
      console.error('❌ findUserProjectsTool Error:', error);
      return {
        projects: [],
        success: false,
        message: 'Failed to retrieve projects'
      };
    }
  },
});
