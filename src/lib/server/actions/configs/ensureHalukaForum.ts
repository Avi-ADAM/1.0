import type { ActionConfig } from '../types.js';

export const ensureHalukaForumConfig: ActionConfig = {
  key: 'ensureHalukaForum',
  description: 'Ensure a private forum exists for a haluka (money transfer) and return its forumId',
  graphqlOperation: async (params, context, { strapi }) => {
    const { halukaId, projectId, forumId } = params;
    const publishedAt = new Date().toISOString();

    if (!halukaId) throw new Error('Haluka ID is required');
    if (!projectId) throw new Error('Project ID is required');

    if (forumId) {
      return { success: true, forumId: String(forumId), created: false, halukaId };
    }

    // Verify user is a participant (sender or receiver) of this haluka
    const getRes = await strapi.execute(
      '71.5getHaluka',
      { id: halukaId },
      context.jwt,
      context.fetch
    );

    const haluka = getRes?.data?.haluka?.data;
    if (!haluka) throw new Error('Haluka not found');

    // If the haluka already has a forum, return it
    const existingForumId = haluka.attributes?.forum?.data?.id;
    if (existingForumId) {
      return { success: true, forumId: String(existingForumId), created: false, halukaId };
    }

    const senderId = String(haluka.attributes.usersend?.data?.id);
    const receiverId = String(haluka.attributes.userrecive?.data?.id);
    const userId = String(context.userId);

    if (userId !== senderId && userId !== receiverId) {
      throw new Error('Only the sender or receiver can access the haluka forum');
    }

    const createRes = await strapi.execute(
      '2forumCrHaluka',
      { pid: projectId, halukId: halukaId, da: publishedAt },
      context.jwt,
      context.fetch
    );

    if (createRes?.errors) {
      throw new Error(`Failed to create haluka forum: ${JSON.stringify(createRes.errors)}`);
    }

    const newForumId = createRes?.data?.createForum?.data?.id;
    if (!newForumId) throw new Error('Failed to create haluka forum: no ID returned');

    return { success: true, forumId: String(newForumId), created: true, halukaId };
  },
  paramSchema: {
    halukaId: { type: 'string', required: true, description: 'Haluka ID' },
    projectId: { type: 'string', required: true, description: 'Project ID' },
    forumId: { type: 'string', required: false, description: 'Existing forum ID (if known)' }
  },
  authRules: [
    { type: 'jwt', errorMessage: 'Must be authenticated' }
  ],
  updateStrategy: { type: 'none' }
};
