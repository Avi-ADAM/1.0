/**
 * Action Configuration: Approve a resource-share request (Askm)
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import {
  runResourceAskmAcceptance,
  activateRecurringEngine,
} from '../helpers/runResourceAskmAcceptance.js';

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
    const existingVots = (existingVotes as any[]).map((v: any) => ({
      what: v.what ?? true,
      users_permissions_user:
        v.users_permissions_user?.data?.id ?? v.users_permissions_user?.id ?? v.users_permissions_user,
    }));
    const allVots = [...existingVots, { what: true, users_permissions_user: context.userId }];

    await strapi.execute('133addVoteToAskm', { id: askmId, vots: allVots }, context.jwt, context.fetch);

    if (isFirstVote) {
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

  const canSkipOm = isSelfProposal === true;
  if (!canSkipOm && !openMashaabimId) {
    throw new Error('openMashaabimId is required for non-self-proposal Askm acceptance');
  }

  if (!canSkipOm) {
    await runResourceAskmAcceptance(strapi, context, {
      askmId: String(askmId),
      openMashaabimId: String(openMashaabimId),
      projectId: String(projectId),
      spId: String(spId),
      missionName: String(missionName ?? ''),
      acceptedUserId: String(acceptedUserId),
      existingMemberIds: (existingMemberIds as string[]).map(String),
      existingVotes: existingVotes as unknown[],
    });
  } else {
    // isSelfProposal + pmash — OM/Maap path differs; keep inline until migrated
    const maapRes: any = await strapi.execute(
      '141createMaap',
      {
        data: {
          project: projectId,
          name: missionName,
          sp: spId,
          publishedAt: now.toISOString(),
        },
      },
      context.jwt,
      context.fetch
    );

    // Recurring expense? Activate the draft engine and make this Maap cycle #1.
    await activateRecurringEngine(strapi, context, {
      projectId: String(projectId),
      resourceName: String(missionName ?? ''),
      acceptedUserId: String(acceptedUserId),
      maapId: maapRes?.data?.createMaap?.data?.id,
    });

    const existingVots = (existingVotes as any[]).map((v: any) => ({
      what: v.what ?? true,
      users_permissions_user:
        v.users_permissions_user?.data?.id ?? v.users_permissions_user?.id ?? v.users_permissions_user,
    }));
    const allVots = [...existingVots, { what: true, users_permissions_user: context.userId }];
    await strapi.execute('132archiveAskmWithVotes', { id: askmId, vots: allVots }, context.jwt, context.fetch);
  }

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
