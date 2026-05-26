import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const finalizeAskmAcceptanceHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const {
    variant,           // 'solo' | 'allVoted' | 'partial'
    openMashaabimId,
    isSelfProposal = false,
    pmashId,           // present when isSelfProposal=true; Askm has pmash relation instead of open_mashaabim
    askmId,
    projectId,
    spId,
    missionName,
    acceptedUserId,
    existingMemberIds = [],
    existingVotes = [],
    isFirstVote = false,
  } = params;

  const now = new Date();

  if (variant === 'partial') {
    // Just add a vote; optionally create Timegrama on first vote
    const existingVots = existingVotes.map((v: any) => ({
      what: v.what ?? true,
      users_permissions_user:
        v.users_permissions_user?.data?.id ?? v.users_permissions_user?.id ?? v.users_permissions_user,
    }));
    const allVots = [...existingVots, { what: true, users_permissions_user: context.userId }];

    await strapi.execute('133addVoteToAskm', { id: askmId, vots: allVots }, context.jwt, context.fetch);

    if (isFirstVote) {
      // Fetch project restime for the deadline
      const projectRes = await strapi.execute(
        '128getProjectMembersAndRestime',
        { pid: projectId },
        context.jwt,
        context.fetch
      );
      const restime: string = projectRes?.data?.project?.data?.attributes?.restime ?? '';
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

    return { data: { askmId }, updateStrategy: { type: 'none' } };
  }

  // solo or allVoted: full acceptance flow
  const newnew = !existingMemberIds.map(String).includes(String(acceptedUserId));

  // isSelfProposal Askms have a pmash relation instead of open_mashaabim — skip OM steps only then
  console.log('[finalizeAskmAcceptance] canSkipOm check:', { isSelfProposal, pmashId, openMashaabimId });
  const canSkipOm = isSelfProposal === true;
  if (!canSkipOm && !openMashaabimId) {
    throw new Error('openMashaabimId is required for non-self-proposal Askm acceptance');
  }

  // 1. Create Maap
  await strapi.execute(
    '141createMaap',
    {
      data: {
        project: projectId,
        name: missionName,
        sp: spId,
        publishedAt: now.toISOString(),
        ...(canSkipOm ? {} : { open_mashaabim: openMashaabimId }),
      },
    },
    context.jwt,
    context.fetch
  );

  // 2. Archive OpenMashaabim (skipped for isSelfProposal+pmash Askms — no OM exists)
  if (!canSkipOm) {
    await strapi.execute('131archiveOpenMashaabim', { id: openMashaabimId }, context.jwt, context.fetch);
  }

  // 3. If new member: createWelcomTop + addUserToProject
  if (newnew) {
    await strapi.execute(
      '75createWelcomeTop',
      { userId: acceptedUserId, projectId, publishedAt: now.toISOString() },
      context.jwt,
      context.fetch
    );
    const newMemberIds = [...existingMemberIds.map(String), String(acceptedUserId)];
    await strapi.execute(
      '74addUserToProject',
      { projectId, userIds: newMemberIds },
      context.jwt,
      context.fetch
    );
  }

  // 4. Archive Askm with votes (existing + current voter's yes vote)
  const existingVots = existingVotes.map((v: any) => ({
    what: v.what ?? true,
    users_permissions_user:
      v.users_permissions_user?.data?.id ?? v.users_permissions_user?.id ?? v.users_permissions_user,
  }));
  const allVots = [...existingVots, { what: true, users_permissions_user: context.userId }];
  await strapi.execute('132archiveAskmWithVotes', { id: askmId, vots: allVots }, context.jwt, context.fetch);

  return {
    data: { askmId, openMashaabimId },
    updateStrategy: { type: 'none' },
  };
};

export const finalizeAskmAcceptanceConfig: ActionConfig = {
  key: 'finalizeAskmAcceptance',
  description: 'Approve a resource-share request (Askm): creates Maap, archives OpenMashaabim + Askm, optionally onboards new member. For partial votes, just adds the vote.',
  graphqlOperation: finalizeAskmAcceptanceHandler,

  paramSchema: {
    variant: { type: 'string', required: true },
    openMashaabimId: { type: 'string', required: false },
    isSelfProposal: { type: 'boolean', required: false },
    pmashId: { type: 'string', required: false },
    askmId: { type: 'string', required: true },
    projectId: { type: 'string', required: true },
    spId: { type: 'string', required: false },
    missionName: { type: 'string', required: false },
    acceptedUserId: { type: 'string', required: false },
    existingMemberIds: { type: 'array', required: false },
    existingVotes: { type: 'array', required: false },
    isFirstVote: { type: 'boolean', required: false },
  },

  authRules: [
    { type: 'jwt' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Must be a project member to accept a resource request'
    }
  ],

  notification: {
    recipients: { type: 'projectMembers', config: { projectIdParam: 'projectId' } },
    templates: {
      title: { he: 'בקשת משאב אושרה', en: 'Resource request approved' },
      body: { he: 'בקשת שיתוף משאב אושרה', en: 'A resource sharing request was approved' },
    },
    channels: ['socket'],
    metadata: { type: 'askmAccepted', url: 'lev' },
  },

  updateStrategy: { type: 'none' },
};
