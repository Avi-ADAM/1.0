import type { ActionConfig } from '../types.js';

function buildProcessSubject(processId: string, name: string): string {
  return `PROCESS::${processId}::${name.trim()}`;
}

export const createProcessConfig: ActionConfig = {
  key: 'createProcess',
  description: 'Create a process anchor for a project and its main forum',
  graphqlOperation: async (params, context, { strapi }) => {
    const { projectId, name, description = '' } = params;
    const publishedAt = new Date().toISOString();

    const partofRes = await strapi.execute(
      '91createPartof',
      { default: false },
      context.jwt,
      context.fetch
    );
    const processId = partofRes?.data?.createPartof?.data?.id;
    if (!processId) {
      throw new Error('Failed to create process anchor');
    }

    const forumRes = await strapi.execute(
      '2forumCrBasic',
      { pid: projectId, da: publishedAt },
      context.jwt,
      context.fetch
    );
    const mainForumId = forumRes?.data?.createForum?.data?.id;
    if (!mainForumId) {
      throw new Error('Failed to create main process forum');
    }

    await strapi.execute(
      '92updateForumSubject',
      {
        id: mainForumId,
        subject: buildProcessSubject(String(processId), String(name)),
        spec: 'general',
        done: false
      },
      context.jwt,
      context.fetch
    );

    if (description && String(description).trim()) {
      await strapi.execute(
        '1chatsend',
        {
          fid: mainForumId,
          fidn: parseInt(mainForumId, 10),
          idL: context.userId,
          da: publishedAt,
          mes: String(description).trim()
        },
        context.jwt,
        context.fetch
      );
    }

    return {
      success: true,
      processId: String(processId),
      mainForumId: String(mainForumId),
      projectId: String(projectId),
      name: String(name).trim(),
      description: String(description || '').trim()
    };
  },
  paramSchema: {
    projectId: { type: 'string', required: true },
    name: { type: 'string', required: true },
    description: { type: 'string', required: false }
  },
  authRules: [
    { type: 'jwt' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' }
    }
  ],
  updateStrategy: {
    type: 'partialUpdate',
    config: {
      dataKeys: ['processes']
    }
  }
};
