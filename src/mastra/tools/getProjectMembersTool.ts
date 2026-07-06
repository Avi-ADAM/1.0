import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { sendToSer } from '../../lib/send/sendToSer';
import { getMcpContext } from '../../lib/server/mcpContext.js';

export interface ProjectPerson {
  id: string;
  username: string;
}

export interface ProjectRole {
  id: string;
  roleDescription: string;
}

/**
 * Fetch the members (people) and roles (tafkidim) of a project.
 *
 * Shared by the website chat, MCP and Telegram flows so a task assignee
 * ("for a person or a role") can be resolved by name to the ID the
 * createTask action expects.
 */
export async function fetchProjectPeopleAndRoles(
  projectId: string,
  fetchInstance: any,
  isServerRequest = true
): Promise<{ projectName: string; people: ProjectPerson[]; roles: ProjectRole[] }> {
  const res = await sendToSer({ pid: projectId }, 'getProjectPeopleAndRoles', 0, 0, isServerRequest, fetchInstance);
  const attrs = res?.data?.project?.data?.attributes;

  const people: ProjectPerson[] = (attrs?.user_1s?.data ?? []).map((u: any) => ({
    id: u.id,
    username: u.attributes?.username ?? `#${u.id}`
  }));

  const roles: ProjectRole[] = (attrs?.tafkidims?.data ?? []).map((r: any) => ({
    id: r.id,
    // Prefer a localized role name when one exists, otherwise the base description.
    roleDescription:
      r.attributes?.localizations?.data?.[0]?.attributes?.roleDescription ||
      r.attributes?.roleDescription ||
      `#${r.id}`
  }));

  return { projectName: attrs?.projectName ?? '', people, roles };
}

export const getProjectMembersTool = createTool({
  id: 'getProjectMembersTool',
  description:
    'List the people (members) and roles (tafkidim) of a project. Use this to resolve a task assignee — a person or a role — to its ID before calling createTaskTool.',
  inputSchema: z.object({
    projectId: z.string().describe('ID of the project'),
    query: z
      .string()
      .optional()
      .describe('Optional text to filter people or roles by name')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    projectName: z.string().optional(),
    people: z
      .array(z.object({ id: z.string(), username: z.string() }))
      .describe('Members of the project (candidate task assignees)'),
    roles: z
      .array(z.object({ id: z.string(), roleDescription: z.string() }))
      .describe('Roles (tafkidim) of the project (candidate task assignees)'),
    message: z.string().optional()
  }),
  execute: async (inputData) => {
    const { projectId, query } = inputData;
    const ctx = getMcpContext() || ({} as any);
    const fetchInstance = ctx.fetchInstance;
    const isServerRequest = !ctx.isInternalBot;

    if (!projectId || !fetchInstance) {
      return {
        success: false,
        people: [],
        roles: [],
        message: 'Missing project context. A projectId and authenticated session are required.'
      };
    }

    try {
      const { projectName, people, roles } = await fetchProjectPeopleAndRoles(
        projectId,
        fetchInstance,
        isServerRequest
      );

      let filteredPeople = people;
      let filteredRoles = roles;
      if (query && query.trim()) {
        const term = query.toLowerCase().trim();
        filteredPeople = people.filter((p) => p.username.toLowerCase().includes(term));
        filteredRoles = roles.filter((r) => r.roleDescription.toLowerCase().includes(term));
      }

      return {
        success: true,
        projectName,
        people: filteredPeople,
        roles: filteredRoles,
        message: `Found ${filteredPeople.length} people and ${filteredRoles.length} roles`
      };
    } catch (error: any) {
      console.error('❌ getProjectMembersTool Error:', error);
      return {
        success: false,
        people: [],
        roles: [],
        message: `Failed to retrieve project members: ${error.message}`
      };
    }
  }
});
