import type { ActionConfig } from '../types.js';

function buildProcessSubject(processId: string, name: string): string {
  return `PROCESS::${processId}::${name.trim()}`;
}

export const ensureProcessForumConfig: ActionConfig = {
  key: 'ensureProcessForum',
  description: 'Ensure a process has a main forum anchor',
  graphqlOperation: async (params, context, { strapi }) => {
    const { projectId, processId, forumId, name = '' } = params;
    if (forumId) {
      return {
        success: true,
        forumId: String(forumId),
        created: false,
        processId: String(processId)
      };
    }

    const publishedAt = new Date().toISOString();
    const forumRes = await strapi.execute(
      '2forumCrBasic',
      { pid: projectId, da: publishedAt },
      context.jwt,
      context.fetch
    );
    const newForumId = forumRes?.data?.createForum?.data?.id;
    if (!newForumId) {
      throw new Error('Failed to create process forum');
    }

    await strapi.execute(
      '92updateForumSubject',
      {
        id: newForumId,
        subject: buildProcessSubject(String(processId), String(name)),
        spec: 'general',
        done: false
      },
      context.jwt,
      context.fetch
    );

    return {
      success: true,
      forumId: String(newForumId),
      created: true,
      processId: String(processId)
    };
  },
  paramSchema: {
    processId: { type: 'string', required: true },
    projectId: { type: 'string', required: true },
    forumId: { type: 'string', required: false },
    name: { type: 'string', required: false }
  },
  authRules: [
    { type: 'jwt' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' }
    }
  ],
  updateStrategy: {
    type: 'none',
    config: {}
  }
};
