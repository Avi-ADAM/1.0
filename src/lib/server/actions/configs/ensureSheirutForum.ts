import type { ActionConfig } from '../types.js';

export const ensureSheirutForumConfig: ActionConfig = {
  key: 'ensureSheirutForum',
  description: 'Ensure a forum exists for a sheirut (sale) and return its forumId',
  graphqlOperation: async (params, context, { strapi }) => {
    const { projectId, sheirutId, forumId } = params;
    const publishedAt = new Date().toISOString();

    if (!projectId) throw new Error('Project ID is required');
    if (!sheirutId) throw new Error('Sheirut ID is required');

    // If already linked, just return it
    if (forumId) {
      return {
        success: true,
        forumId: String(forumId),
        created: false,
        projectId: String(projectId),
        sheirutId: String(sheirutId)
      };
    }

    // Create a basic forum, then link it to the sheirut (sale)
    const createRes = await strapi.execute(
      '2forumCrBasic',
      {
        pid: projectId,
        da: publishedAt
      },
      context.jwt,
      context.fetch
    );

    if (createRes?.errors) {
      console.error('Failed to create forum:', createRes.errors);
      throw new Error('Failed to create forum');
    }

    const newForumId = createRes?.data?.createForum?.data?.id;
    if (!newForumId) {
      throw new Error('Failed to create forum');
    }

    const linkRes = await strapi.execute(
      '2linkForumToSheirut',
      {
        id: sheirutId,
        forumId: newForumId
      },
      context.jwt,
      context.fetch
    );

    if (linkRes?.errors) {
      console.error('Failed to link forum to sheirut:', linkRes.errors);
      throw new Error('Failed to link forum to sheirut');
    }

    return {
      success: true,
      forumId: String(newForumId),
      created: true,
      projectId: String(projectId),
      sheirutId: String(sheirutId)
    };
  },
  paramSchema: {
    projectId: { type: 'string', required: true },
    sheirutId: { type: 'string', required: true },
    forumId: { type: 'string', required: false }
  },
  authRules: [
    { type: 'jwt' },
    {
      type: 'projectMember',
      config: {
        projectIdParam: 'projectId'
      }
    }
  ],
  updateStrategy: {
    type: 'none',
    config: {}
  }
};
