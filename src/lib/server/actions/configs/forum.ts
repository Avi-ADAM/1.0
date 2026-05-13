import type { ActionConfig } from '../types.js';
import {
  collectForumEntitiesFromUserSources,
  normalizeForum,
  userCanAccessForum
} from '../forumAccess.js';

export const getUserForumsConfig: ActionConfig = {
  key: 'getUserForums',
  description: 'Get all forums available to the current user',
  graphqlOperation: async (_params, context, { strapi }) => {
    const result = await strapi.execute(
      '104getUserForumSources',
      { uid: context.userId },
      context.jwt,
      context.fetch
    );

    const byId = new Map<string, any>();
    for (const forum of collectForumEntitiesFromUserSources(result?.data)) {
      if (forum?.id) byId.set(String(forum.id), forum);
    }

    const forums = Array.from(byId.values())
      .filter((forum) => userCanAccessForum(forum, context.userId))
      .map((forum) => normalizeForum(forum, context.userId))
      .filter(Boolean)
      .sort((a: any, b: any) => {
        const at = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bt = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return bt - at;
      });

    return { forums };
  },
  paramSchema: {},
  authRules: [{ type: 'jwt' }],
  updateStrategy: {
    type: 'partialUpdate',
    config: {
      dataKeys: ['app:forums']
    }
  }
};

export const getForumThreadConfig: ActionConfig = {
  key: 'getForumThread',
  description: 'Get a single forum thread for an authorized participant',
  graphqlOperation: async (params, context, { strapi }) => {
    const result = await strapi.execute(
      '103getForumThreadById',
      { forumId: String(params.forumId) },
      context.jwt,
      context.fetch
    );
    const forum = result?.data?.forum?.data;

    if (!forum || !userCanAccessForum(forum, context.userId)) {
      throw new Error('Forum not found or not authorized');
    }

    return { forum: normalizeForum(forum, context.userId) };
  },
  paramSchema: {
    forumId: { type: 'string', required: true }
  },
  authRules: [
    { type: 'jwt' },
    { type: 'forumParticipant', config: { forumIdParam: 'forumId' } }
  ],
  updateStrategy: {
    type: 'partialUpdate',
    config: {
      dataKeys: ['app:forums']
    }
  }
};

export const forumReadActions = [getUserForumsConfig, getForumThreadConfig];
