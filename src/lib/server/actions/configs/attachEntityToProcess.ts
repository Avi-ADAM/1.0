import type { ActionConfig } from '../types.js';

function mappingSubject(
  entityType: string,
  processId: string,
  entityId: string,
  name?: string
): string {
  return `PROCESS_ENTITY::${entityType}::${processId}::${entityId}::${(name || '').trim()}`;
}

export const attachEntityToProcessConfig: ActionConfig = {
  key: 'attachEntityToProcess',
  description: 'Attach an entity to an existing process anchor',
  graphqlOperation: async (params, context, { strapi }) => {
    const { processId, projectId, entityType, entityId, name = '' } = params;
    const normalizedType = String(entityType);
    const normalizedProcessId = String(processId);
    const normalizedEntityId = String(entityId);
    const publishedAt = new Date().toISOString();

    if (normalizedType === 'openMission') {
      await strapi.execute(
        '93updateOpenMissionPartofs',
        { id: normalizedEntityId, partofIds: [normalizedProcessId] },
        context.jwt,
        context.fetch
      );
      return { success: true, attachedVia: 'partof' };
    }

    if (normalizedType === 'openMashaabim') {
      await strapi.execute(
        '94updateOpenMashaabimPartofs',
        { id: normalizedEntityId, partofIds: [normalizedProcessId] },
        context.jwt,
        context.fetch
      );
      return { success: true, attachedVia: 'partof' };
    }

    if (normalizedType === 'mesimabetahalich') {
      await strapi.execute(
        '95updateMesimabetahalichPartofs',
        { id: normalizedEntityId, partofIds: [normalizedProcessId] },
        context.jwt,
        context.fetch
      );
      return { success: true, attachedVia: 'partof' };
    }

    if (normalizedType === 'maap') {
      await strapi.execute(
        '96updateMaapPartofs',
        { id: normalizedEntityId, partofIds: [normalizedProcessId] },
        context.jwt,
        context.fetch
      );
      return { success: true, attachedVia: 'partof' };
    }

    if (normalizedType === 'pendm' || normalizedType === 'pmash') {
      const forumRes = await strapi.execute(
        '2forumCrBasic',
        { pid: projectId, da: publishedAt },
        context.jwt,
        context.fetch
      );
      const mappingForumId = forumRes?.data?.createForum?.data?.id;
      if (!mappingForumId) {
        throw new Error('Failed to create process mapping forum');
      }

      await strapi.execute(
        '92updateForumSubject',
        {
          id: mappingForumId,
          subject: mappingSubject(
            normalizedType,
            normalizedProcessId,
            normalizedEntityId,
            String(name)
          ),
          spec: 'spesificm',
          done: true
        },
        context.jwt,
        context.fetch
      );

      return {
        success: true,
        attachedVia: 'mappingForum',
        mappingForumId: String(mappingForumId)
      };
    }

    throw new Error(`Unsupported entity type: ${normalizedType}`);
  },
  paramSchema: {
    processId: { type: 'string', required: true },
    projectId: { type: 'string', required: true },
    entityType: { type: 'string', required: true },
    entityId: { type: 'string', required: true },
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
    type: 'partialUpdate',
    config: {
      dataKeys: ['processes']
    }
  }
};
