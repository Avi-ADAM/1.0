/**
 * ensureProjectForum — the rikma's own conversation (PLAN_MCP_TOOLS_V2 §M4b).
 *
 * Every other forum belongs to a *thing*: a mission, an act, a decision, a
 * profit split. There was no room for the rikma itself — "what are we doing
 * next?" had nowhere to go, so it went into whatever thread was open.
 *
 * No schema change was needed for it. `Forum.project` already exists, and
 * `forumKind` already falls through to `'project'`, whose participants are the
 * rikma's members; `104getUserForumSources` already collects a rikma's forums
 * into each member's list. So a general forum is a forum with a project, a
 * stable subject, and nothing else attached.
 *
 * It is created lazily — the first time someone actually opens it — so a rikma
 * that never wants one never gets one.
 */

import type { ActionConfig } from '../types.js';

/** Stable, so "ensure" means ensure and a rikma never collects lobbies. */
export function projectForumSubject(projectId: string): string {
  return `RIKMA::${projectId}`;
}

export const ensureProjectForumConfig: ActionConfig = {
  key: 'ensureProjectForum',
  description: "Find, or create once, the rikma's general conversation",
  graphqlOperation: async (params, context, { strapi }) => {
    const projectId = String(params.projectId);
    const subject = projectForumSubject(projectId);

    const existing = await strapi.execute(
      '323projectGeneralForum',
      { pid: projectId, subject },
      context.jwt,
      context.fetch
    );
    const found = existing?.data?.forums?.data?.[0]?.id;
    if (found) {
      return { success: true, forumId: String(found), created: false, projectId };
    }

    const publishedAt = new Date().toISOString();
    const forumRes = await strapi.execute(
      '2forumCrBasic',
      { pid: projectId, da: publishedAt },
      context.jwt,
      context.fetch
    );
    const forumId = forumRes?.data?.createForum?.data?.id;
    if (!forumId) throw new Error('Failed to create the rikma conversation');

    await strapi.execute(
      '92updateForumSubject',
      { id: forumId, subject, spec: 'general', done: false },
      context.jwt,
      context.fetch
    );

    return { success: true, forumId: String(forumId), created: true, projectId };
  },
  paramSchema: {
    projectId: { type: 'string', required: true }
  },
  authRules: [
    { type: 'jwt' },
    { type: 'projectMember', config: { projectIdParam: 'projectId' } }
  ],
  updateStrategy: {
    type: 'partialUpdate',
    config: { dataKeys: ['app:forums'] }
  }
};
