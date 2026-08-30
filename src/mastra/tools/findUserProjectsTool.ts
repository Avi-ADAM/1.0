import { createTool } from '@mastra/core/tools'
import { z } from 'zod';
import { sendToSer } from '../../lib/send/sendToSer';
import { getMcpContext } from '../../lib/server/mcpContext.js';

async function findUserProjects(userId: number, fetch: any, isServerRequest = false) {
  try {
    const res = await sendToSer({ uid: userId }, "64getUserProjectList", userId, 0, isServerRequest, fetch);
    console.log('📡 sendToSer response:', JSON.stringify(res, null, 2));
    const projectsData = res?.data?.usersPermissionsUser?.data?.attributes?.projects_1s?.data;
    
    if (!Array.isArray(projectsData)) {
      console.log('⚠️ No projects data found or data is not an array');
      return [];
    }
    
    return projectsData.map((item: any) => ({
      id: item.id,
      idPr: item.id, // Add both id and idPr for compatibility
      name: item.attributes.projectName,
    }));
  } catch (error) {
    console.error(`❌ findUserProjects Error for user ${userId}:`, error);
    return [];
  }
}

export const findUserProjectsTool = createTool({
  id: 'findUserProjects',
  description: 'Find all projects associated with the current user. Use this when user mentions a project by name or wants to navigate to a specific project.',
  inputSchema: z.object({
    // Optional on purpose: an external MCP client has no way to know its own
    // Strapi user id, and this is the first call of almost every flow
    // ("which rikmot do I have?"). When omitted we use the identity the API
    // key was verified as — which is also the only identity it may ever read.
    userId: z.string().optional().describe('User id to list projects for. Omit to use the authenticated caller.'),
    query: z.string().optional().describe('Optional search query to filter projects by name'),
  }),
  outputSchema: z.object({
    projects: z.array(z.object({
      id: z.string(),
      idPr: z.string(),
      name: z.string(),
    })).describe('A list of the user\'s projects with their IDs and names.'),
    success: z.boolean(),
    message: z.string().optional()
  }),
  execute: async (inputData, context) => {
    try {
      const { userId, query } = inputData;
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

      console.log('🔍 findUserProjectsTool - userId:', effectiveUserId, 'query:', query);

      if (!effectiveUserId || !fetchInstance) {
        return {
          projects: [],
          success: false,
          message: 'User context is required to find projects.'
        };
      }

      const projects = await findUserProjects(parseInt(String(effectiveUserId)), fetchInstance, isServerRequest);
      console.log(`📋 Found ${projects.length} projects for user ${effectiveUserId}`);
      
      // Filter projects if query provided
      let filteredProjects = projects;
      if (query && query.trim()) {
        const searchTerm = query.toLowerCase().trim();
        filteredProjects = projects.filter((project: any) => 
          project.name.toLowerCase().includes(searchTerm)
        );
      }

      return {
        projects: filteredProjects,
        success: true,
        message: query ? 
          `Found ${filteredProjects.length} projects matching "${query}"` : 
          `Found ${filteredProjects.length} projects`
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