import type { ActionConfig } from '../types.js';

export const ensureSheirutpendForumConfig: ActionConfig = {
  key: 'ensureSheirutpendForum',
  description: 'Ensure a forum exists for a sheirutpend (product request) and return its forumId',
  graphqlOperation: async (params, context, { strapi }) => {
    const { projectId, sheirutpendId, forumId } = params;
    const publishedAt = new Date().toISOString();

    if (!projectId) throw new Error('Project ID is required');
    if (!sheirutpendId) throw new Error('Sheirutpend ID is required');

    if (forumId) {
      return {
        success: true,
        forumId: String(forumId),
        created: false,
        projectId: String(projectId),
        sheirutpendId: String(sheirutpendId)
      };
    }

    const createRes = await strapi.execute(
      '2forumCrBasic',
      { pid: projectId, da: publishedAt },
      context.jwt,
      context.fetch
    );

    if (createRes?.errors) {
      console.error('Failed to create forum:', createRes.errors);
      throw new Error('Failed to create forum');
    }

    const newForumId = createRes?.data?.createForum?.data?.id;
    if (!newForumId) throw new Error('Failed to create forum');

    const linkRes = await strapi.execute(
      '2linkForumToSheirutpend',
      { id: sheirutpendId, forumId: newForumId },
      context.jwt,
      context.fetch
    );

    if (linkRes?.errors) {
      console.error('Failed to link forum to sheirutpend:', linkRes.errors);
      throw new Error('Failed to link forum to sheirutpend');
    }

    return {
      success: true,
      forumId: String(newForumId),
      created: true,
      projectId: String(projectId),
      sheirutpendId: String(sheirutpendId)
    };
  },
  paramSchema: {
    projectId: { type: 'string', required: true },
    sheirutpendId: { type: 'string', required: true },
    forumId: { type: 'string', required: false }
  },
  authRules: [
    { type: 'jwt' },
    {
      type: 'or',
      errorMessage: 'User is not a project member or requester of this sheirutpend',
      config: {
        rules: [
          { type: 'projectMember', config: { projectIdParam: 'projectId' } },
          { type: 'sheirutpendRequester', config: { sheirutpendIdParam: 'sheirutpendId' } }
        ]
      }
    }
  ],
  updateStrategy: {
    type: 'none',
    config: {}
  }
};
