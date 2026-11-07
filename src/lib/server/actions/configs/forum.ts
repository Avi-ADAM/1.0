import type { ActionConfig } from '../types.js';
import {
  collectForumEntitiesFromUserSources,
  normalizeForum,
  userCanAccessForum,
  userCanAccessForumAsync
} from '../forumAccess.js';

/**
 * The conversations of the person who asked a rikma a question while signed
 * in (PLAN_LEADS L4): they are not a member, so the rikma's forums never
 * reach them through `104getUserForumSources`. Read with the admin token —
 * lead qids are serviceAdmin-only — and only for this user's own leads.
 * Before `Lead.forum` is deployed this read fails, and the list is as before.
 */
async function leadForumsOf(strapi: any, uid: string, context: any): Promise<any[]> {
  try {
    const { adminToken } = await import('../../adminToken.js');
    const res = await strapi.execute('leadForumsOfCustomer', { uid: String(uid) }, adminToken(), context.fetch);
    return ((res?.data?.leads?.data ?? []) as any[]).map((l) => l?.attributes?.forum?.data).filter((f) => f?.id);
  } catch {
    return [];
  }
}

export const getUserForumsConfig: ActionConfig = {
  key: 'getUserForums',
  description: 'Get all forums available to the current user',
  graphqlOperation: async (_params, context, { strapi }) => {
    const [result, asCustomer] = await Promise.all([
      strapi.execute('104getUserForumSources', { uid: context.userId }, context.jwt, context.fetch),
      leadForumsOf(strapi, context.userId, context)
    ]);

    const byId = new Map<string, any>();
    for (const forum of collectForumEntitiesFromUserSources(result?.data)) {
      if (forum?.id) byId.set(String(forum.id), forum);
    }
    // Their own leads' conversations are theirs by construction (the read is
    // filtered by customer_user = this user).
    const theirs = new Set<string>();
    for (const forum of asCustomer) {
      byId.set(String(forum.id), forum);
      theirs.add(String(forum.id));
    }

    const forums = Array.from(byId.values())
      .filter((forum) => theirs.has(String(forum.id)) || userCanAccessForum(forum, context.userId))
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

    if (!forum || !(await userCanAccessForumAsync(strapi, forum, context.userId, context))) {
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
