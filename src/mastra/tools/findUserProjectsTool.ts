import { createTool } from '@mastra/core';
import { z } from 'zod';
import { sendToSer } from '../../lib/send/sendToSer';

async function findUserProjects(userId: number, fetch: any) {
  try {
    const res = await sendToSer({ uid: userId }, "64getUserProjectList", userId, 0, false, fetch);
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
    userId: z.string().describe('userId to get its project list'),
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
  execute: async ({ context }) => {
    try {
      const { userId, query } = context;
      const globalContext = global.botContext || {};
      const fetchInstance = globalContext.fetchInstance;
      
      console.log('🔍 findUserProjectsTool - userId:', userId, 'query:', query);
      
      if (!userId || !fetchInstance) {
        return {
          projects: [],
          success: false,
          message: 'User context is required to find projects.'
        };
      }

      const projects = await findUserProjects(parseInt(userId), fetchInstance);
      console.log(`📋 Found ${projects.length} projects for user ${userId}`);
      
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