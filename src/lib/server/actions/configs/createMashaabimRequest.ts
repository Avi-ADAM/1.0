import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const createMashaabimRequestHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const {
    openMashaabimId,
    projectId,
    spId,
  } = params;

  const now = new Date();

  // Step 1: create Askm + update Sp.declinedm
  const askmRes = await strapi.execute(
    '125createAskm',
    {
      publishedAt: now.toISOString(),
      openMashaabimId,
      projectId,
      spId,
      userId: context.userId,
    },
    context.jwt,
    context.fetch
  );

  const askmId = askmRes?.createAskm?.data?.id;
  if (!askmId) throw new Error('Failed to create Askm');

  await strapi.execute(
    '126updateSpDeclined',
    { id: spId, openMashaabimId },
    context.jwt,
    context.fetch
  );

  // Step 2: fetch project members + restime in one call
  const projectRes = await strapi.execute(
    '128getProjectMembersAndRestime',
    { pid: projectId },
    context.jwt,
    context.fetch
  );
  const projectAttrs = projectRes?.data?.project?.data?.attributes;
  const memberIds: string[] =
    (projectAttrs?.user_1s?.data || []).map((m: any) => String(m.id));
  const restime: string = projectAttrs?.restime ?? '';

  // Step 3: create Timegrama deadline
  const resMs: Record<string, number> = {
    feh: 48 * 3_600_000,
    sth: 72 * 3_600_000,
    nsh: 96 * 3_600_000,
    sevend: 168 * 3_600_000,
  };
  const offsetMs = resMs[restime] ?? 0;
  if (offsetMs > 0) {
    const deadline = new Date(now.getTime() + offsetMs);
    await strapi.execute(
      '127createTimegramaForAskm',
      { date: deadline.toISOString(), askmId },
      context.jwt,
      context.fetch
    );
  }

  // Suggester (current user) included in recipients for cross-device sync
  const recipientIds = Array.from(new Set([...memberIds, String(context.userId)].filter(Boolean)));

  return {
    data: { askmId, spId, openMashaabimId },
    recipientIds,
    updateStrategy: { type: 'none' },
  };
};

export const createMashaabimRequestConfig: ActionConfig = {
  key: 'createMashaabimRequest',
  description: 'Record a resource-offer request: creates Askm, marks Sp as applied, creates deadline Timegrama. Notifies project members + suggester via socket.',
  graphqlOperation: createMashaabimRequestHandler,

  paramSchema: {
    openMashaabimId: { type: 'string', required: true },
    projectId: { type: 'string', required: true },
    spId: { type: 'string', required: true },
  },

  authRules: [
    { type: 'jwt' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Must be a project member to request a resource'
    }
  ],

  notification: {
    recipients: {
      type: 'specificUsers',
      config: { userIdsParam: 'recipientIds' }
    },
    templates: {
      title: { he: 'בקשה למשאב', en: 'Resource request' },
      body: { he: `יש בקשה חדשה למשאב בפרויקט`, en: 'A new resource request was submitted' }
    },
    channels: ['socket'],
    metadata: { type: 'mashaabimRequest', url: 'lev' }
  },

  updateStrategy: { type: 'none' }
};
