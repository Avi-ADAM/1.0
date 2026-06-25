import type { ActionConfig } from '../types.js';

/**
 * Ensure a chat forum exists for a pendm (mission vote) or pmash (resource vote)
 * and return its forumId. Mirrors ensureSheirutpendForum: the forum is created
 * with a direct project link so forumAccess resolves participants = project
 * members (the voters), and linked back to the pendm/pmash via its `forums`
 * relation so we never create a second forum for the same card.
 *
 * Once a forumId exists, the card sends through the generic `createChatMessage`
 * action (realtime socket + push/email/telegram), replacing the old per-card
 * `diun` discussion store.
 */
export const ensureVoteForumConfig: ActionConfig = {
  key: 'ensureVoteForum',
  description:
    'Ensure a chat forum exists for a pendm/pmash vote card and return its forumId',
  graphqlOperation: async (params, context, { strapi }) => {
    const { entityType, entityId, forumId } = params;
    const publishedAt = new Date().toISOString();

    if (entityType !== 'pendm' && entityType !== 'pmash') {
      throw new Error('entityType must be "pendm" or "pmash"');
    }
    if (!entityId) throw new Error('entityId is required');

    // Short-circuit when the caller already knows the forum.
    if (forumId) {
      return {
        success: true,
        forumId: String(forumId),
        created: false,
        entityType,
        entityId: String(entityId)
      };
    }

    const getQid =
      entityType === 'pendm' ? 'getPendmChatForum' : 'getPmashChatForum';
    const linkQid =
      entityType === 'pendm' ? 'linkForumToPendm' : 'linkForumToPmash';

    const getRes = await strapi.execute(
      getQid,
      { id: String(entityId) },
      context.jwt,
      context.fetch
    );
    const entity = getRes?.data?.[entityType]?.data;
    if (!entity) throw new Error(`${entityType} not found`);

    const existingForumId = entity.attributes?.forums?.data?.[0]?.id;
    const projectId =
      params.projectId || entity.attributes?.project?.data?.id || null;

    if (existingForumId) {
      return {
        success: true,
        forumId: String(existingForumId),
        created: false,
        entityType,
        entityId: String(entityId),
        projectId: projectId ? String(projectId) : null
      };
    }

    if (!projectId) throw new Error('Project ID could not be resolved');

    const subject = entity.attributes?.name
      ? `${entity.attributes.name}`
      : entityType === 'pendm'
        ? 'Mission vote chat'
        : 'Resource vote chat';

    const createRes = await strapi.execute(
      '66CreateForumForAsk',
      { publishedAt, subject, pid: String(projectId) },
      context.jwt,
      context.fetch
    );
    if (createRes?.errors) {
      console.error('Failed to create vote forum:', createRes.errors);
      throw new Error('Failed to create forum');
    }

    const newForumId = createRes?.data?.createForum?.data?.id;
    if (!newForumId) throw new Error('Failed to create forum');

    const linkRes = await strapi.execute(
      linkQid,
      { id: String(entityId), forumId: newForumId },
      context.jwt,
      context.fetch
    );
    if (linkRes?.errors) {
      console.error(`Failed to link forum to ${entityType}:`, linkRes.errors);
      throw new Error(`Failed to link forum to ${entityType}`);
    }

    return {
      success: true,
      forumId: String(newForumId),
      created: true,
      entityType,
      entityId: String(entityId),
      projectId: String(projectId)
    };
  },
  paramSchema: {
    entityType: { type: 'string', required: true },
    entityId: { type: 'string', required: true },
    projectId: { type: 'string', required: false },
    forumId: { type: 'string', required: false }
  },
  authRules: [
    { type: 'jwt' },
    { type: 'projectMember', config: { projectIdParam: 'projectId' } }
  ],
  updateStrategy: {
    type: 'none',
    config: {}
  }
};
