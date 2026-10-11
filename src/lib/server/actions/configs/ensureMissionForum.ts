/**
 * Open the conversation of a mission in progress — the first message of a chat
 * the footer starts on a mission that has none yet.
 *
 * It replaces the client writing `2forumCr` straight through /api/send
 * (docs/inprogress/PLAN_REALTIME_MIGRATION.md B9): here membership is checked,
 * and so is that the mission belongs to the rikma named — otherwise a member of
 * one rikma could hang a forum of theirs on another rikma's mission.
 */

import type { ActionConfig } from '../types.js';

export const ensureMissionForumConfig: ActionConfig = {
  key: 'ensureMissionForum',
  description: 'Create the forum of a mission in progress and return its forumId',
  graphqlOperation: async (params, context, { strapi }) => {
    const { missionId, projectId } = params;

    const res = await strapi.execute('110getMissionForTimerSave', { mId: String(missionId) }, context.jwt, context.fetch);
    const mission = res?.data?.mesimabetahalich?.data;
    if (!mission) throw new Error('Mission not found');
    const missionProject = mission.attributes?.project?.data?.id;
    if (String(missionProject) !== String(projectId)) {
      throw new Error('The mission does not belong to this rikma');
    }

    const created = await strapi.execute(
      '2forumCr',
      { pid: String(projectId), mbId: [String(missionId)], da: new Date().toISOString() },
      context.jwt,
      context.fetch
    );
    const forumId = created?.data?.createForum?.data?.id;
    if (!forumId) throw new Error(`Failed to create the mission forum: ${JSON.stringify(created?.errors ?? null)}`);

    return { success: true, data: { forumId: String(forumId), created: true, missionId: String(missionId) } };
  },
  paramSchema: {
    missionId: { type: 'string', required: true, description: 'Mesimabetahalich (mission in progress) id' },
    projectId: { type: 'string', required: true, description: 'The rikma the mission belongs to' }
  },
  authRules: [
    { type: 'jwt', errorMessage: 'Must be authenticated' },
    { type: 'projectMember', config: { projectIdParam: 'projectId' }, errorMessage: 'Only members of the rikma can open its mission chat' }
  ],
  updateStrategy: { type: 'none' },
  // An empty forum is on nobody's screen. The first message, sent right after
  // through createChatMessage, publishes `forum:<id>` to its participants.
  realtime: { scopes: () => [] }
};
