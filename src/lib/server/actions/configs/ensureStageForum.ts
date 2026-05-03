import type { ActionConfig } from '../types.js';

function stageSubject(
  entityType: string,
  processId: string,
  entityId: string,
  name?: string
): string {
  return `PROCESS_STAGE::${entityType}::${processId}::${entityId}::${(name || '').trim()}`;
}

async function createForum(
  strapi: any,
  projectId: string,
  jwt: string,
  fetchFn: typeof globalThis.fetch | undefined
) {
  const publishedAt = new Date().toISOString();
  const forumRes = await strapi.execute(
    '2forumCrBasic',
    { pid: projectId, da: publishedAt },
    jwt,
    fetchFn
  );
  return forumRes?.data?.createForum?.data?.id;
}

export const ensureStageForumConfig: ActionConfig = {
  key: 'ensureStageForum',
  description: 'Ensure a stage entity has a dedicated child forum',
  graphqlOperation: async (params, context, { strapi }) => {
    const { projectId, processId, entityType, entityId, forumId, name = '' } = params;
    if (forumId) {
      return { success: true, forumId: String(forumId), created: false };
    }

    const normalizedType = String(entityType);
    const normalizedEntityId = String(entityId);
    const normalizedProcessId = String(processId);
    let existingForumIds: string[] = [];

    if (normalizedType === 'ask') {
      const existing = await strapi.execute(
        '98getAskForums',
        { id: normalizedEntityId },
        context.jwt,
        context.fetch
      );
      existingForumIds =
        existing?.data?.ask?.data?.attributes?.forums?.data?.map((item: any) => String(item.id)) || [];
    } else if (normalizedType === 'mesimabetahalich') {
      const existing = await strapi.execute(
        '100getMesimabetahalichForums',
        { id: normalizedEntityId },
        context.jwt,
        context.fetch
      );
      existingForumIds =
        existing?.data?.mesimabetahalich?.data?.attributes?.forums?.data?.map((item: any) => String(item.id)) || [];
    } else {
      throw new Error(`Unsupported stage forum type: ${normalizedType}`);
    }

    if (existingForumIds.length > 0) {
      return { success: true, forumId: existingForumIds[0], created: false };
    }

    const newForumId = await createForum(strapi, String(projectId), context.jwt, context.fetch);
    if (!newForumId) {
      throw new Error('Failed to create stage forum');
    }

    await strapi.execute(
      '92updateForumSubject',
      {
        id: newForumId,
        subject: stageSubject(normalizedType, normalizedProcessId, normalizedEntityId, String(name)),
        spec: 'spesificm',
        done: false
      },
      context.jwt,
      context.fetch
    );

    if (normalizedType === 'ask') {
      await strapi.execute(
        '99updateAskForums',
        { id: normalizedEntityId, forumIds: [newForumId] },
        context.jwt,
        context.fetch
      );
    } else {
      await strapi.execute(
        '101updateMesimabetahalichForums',
        { id: normalizedEntityId, forumIds: [newForumId] },
        context.jwt,
        context.fetch
      );
    }

    return {
      success: true,
      forumId: String(newForumId),
      created: true,
      entityType: normalizedType,
      entityId: normalizedEntityId
    };
  },
  paramSchema: {
    projectId: { type: 'string', required: true },
    processId: { type: 'string', required: true },
    entityType: { type: 'string', required: true },
    entityId: { type: 'string', required: true },
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
