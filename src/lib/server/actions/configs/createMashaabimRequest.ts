import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import {
  resolveOpenMashaabimName,
  runResourceAskmAcceptance,
} from '../helpers/runResourceAskmAcceptance.js';

/** Initial "in favor" vote when the requester is already a project member (reqtom / availiableResorce pattern). */
function buildRequesterVote(userId: string, at: Date) {
  const uid = String(userId);
  const parsedIde = parseInt(uid, 10);
  return {
    what: true,
    users_permissions_user: uid,
    ...(Number.isFinite(parsedIde) ? { ide: parsedIde } : {}),
    zman: at.toISOString(),
  };
}

const createMashaabimRequestHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const {
    openMashaabimId,
    projectId,
    spId,
    missionName: missionNameParam,
  } = params;

  const now = new Date();
  const requesterId = String(context.userId);

  // Step 1: project members + restime
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
  const isProjectMember = memberIds.includes(requesterId);
  const isSoloMemberProject = isProjectMember && memberIds.length === 1;

  // Step 2: create Askm
  const askmVariables: Record<string, unknown> = {
    publishedAt: now.toISOString(),
    openMashaabimId,
    projectId,
    spId,
    userId: requesterId,
  };

  if (isProjectMember) {
    askmVariables.vots = [buildRequesterVote(requesterId, now)];
  }
  if (isSoloMemberProject) {
    askmVariables.archived = true;
  }

  const askmRes = await strapi.execute(
    '125createAskm',
    askmVariables,
    context.jwt,
    context.fetch
  );

  const askmId = askmRes?.data?.createAskm?.data?.id;
  if (!askmId) throw new Error('Failed to create Askm');

  await strapi.execute(
    '126updateSpDeclined',
    { id: spId, openMashaabimId },
    context.jwt,
    context.fetch
  );

  // Step 3: solo member — skip voting UI; run full acceptance (Maap + archive OM)
  if (isSoloMemberProject) {
    const missionName = await resolveOpenMashaabimName(
      strapi,
      context,
      String(openMashaabimId),
      missionNameParam
    );

    await runResourceAskmAcceptance(strapi, context, {
      askmId: String(askmId),
      openMashaabimId: String(openMashaabimId),
      projectId: String(projectId),
      spId: String(spId),
      missionName,
      acceptedUserId: requesterId,
      existingMemberIds: memberIds,
      skipAskmArchive: true,
    });

    const recipientIds = Array.from(new Set(memberIds.filter(Boolean)));

    return {
      data: {
        askmId,
        spId,
        openMashaabimId,
        isProjectMember: true,
        castInitialVote: true,
        autoFinalized: true,
      },
      recipientIds,
      updateStrategy: { type: 'none' },
    };
  }

  // Step 4: deadline Timegrama — only when the requester is a rikma member
  // (Path C: their favorable vote already exists, so the clock can run). For an
  // external candidate (Path A) it's deferred until a member first votes
  // (finalizeAskmAcceptance partial creates it on the first vote).
  if (isProjectMember) {
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
  }

  const recipientIds = Array.from(new Set([...memberIds, requesterId].filter(Boolean)));

  return {
    data: {
      askmId,
      spId,
      openMashaabimId,
      isProjectMember,
      castInitialVote: isProjectMember,
      autoFinalized: false,
    },
    recipientIds,
    updateStrategy: { type: 'none' },
  };
};

export const createMashaabimRequestConfig: ActionConfig = {
  key: 'createMashaabimRequest',
  description:
    'Record a resource-offer request: creates Askm, marks Sp as applied, creates deadline Timegrama. Project members get an initial in-favor vote. Solo-member projects auto-approve (archived Askm + Maap + archive OM).',
  graphqlOperation: createMashaabimRequestHandler,

  paramSchema: {
    openMashaabimId: { type: 'string', required: true },
    projectId: { type: 'string', required: true },
    spId: { type: 'string', required: true },
    missionName: { type: 'string', required: false },
  },

  authRules: [{ type: 'jwt' }],

  notification: {
    recipients: {
      type: 'specificUsers',
      config: { userIdsParam: 'recipientIds' },
    },
    templates: {
      title: { he: 'בקשה למשאב', en: 'Resource request' },
      body: { he: `יש בקשה חדשה למשאב בפרויקט`, en: 'A new resource request was submitted' },
    },
    channels: ['socket'],
    metadata: { type: 'mashaabimRequest', url: 'lev' },
  },

  updateStrategy: { type: 'none' },
};
