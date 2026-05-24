import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { EmailService } from '../../notifications/EmailService.js';

function formatVotesForInline(votes: any[]): string {
  if (!Array.isArray(votes) || votes.length === 0) return '';
  return votes.map((v: any) => {
    const attrs = v.attributes || v;
    const what = attrs.what ?? false;
    const uid =
      attrs.users_permissions_user?.data?.id ??
      attrs.users_permissions_user?.id ??
      attrs.users_permissions_user ??
      '';
    const order = attrs.order ?? 0;
    const ide = attrs.ide ?? uid;
    const zman = attrs.zman ?? new Date().toISOString();
    return `{what:${what} users_permissions_user:${uid} order:${order} ide:${ide} zman:"${zman}"}`;
  }).join(',');
}

const finalizeJoinAcceptanceHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const {
    variant,               // 'solo' | 'allVoted'
    projectId,
    missId,
    openMid,
    askId,
    acceptedUserId,
    acceptedUserName = '',
    openmissionName = '',
    missionDetails = '',
    nhours = 0,
    valph = 0,
    iskvua = false,
    privatlinks = '',
    publicklinks = '',
    hearotMeyuchadot = '',
    tafkidims = [],
    sqedualed,
    deadline,
    timegramaId,
    existingMemberIds = [],  // project.user_1s ids BEFORE acceptance
    existingVotes = [],
    projectName = '',
    projectSrc = '',
  } = params;

  const voterUserId = context.userId;
  const d = new Date();
  const now = d.toISOString();

  const newnew = !existingMemberIds.map(String).includes(String(acceptedUserId));

  const votesStr = formatVotesForInline(existingVotes);

  const dateFragment = deadline ? `admaticedai: "${deadline}"` : '';
  const sdateFragment = sqedualed ? `start: "${sqedualed}"` : '';
  const tafkidimsStr = Array.isArray(tafkidims) ? tafkidims.join(',') : '';
  const otherAsksFragment = variant === 'allVoted' ? 'asks { data { id } } acts { data { id } }' : 'acts { data { id } }';

  const welcomeFragment = newnew
    ? `createWelcomTop(data: {
        users_permissions_user: "${acceptedUserId}",
        project: "${projectId}",
        publishedAt: "${now}"
      }) { data { id } }`
    : '';

  const newMemberIds = newnew
    ? [...existingMemberIds.map(String), String(acceptedUserId)]
    : [];

  const adduserFragment = newnew
    ? `updateProject(id: "${projectId}", data: { user_1s: [${newMemberIds.map(id => `"${id}"`).join(',')}] }) {
        data { attributes { user_1s { data { id attributes { email lang username } } } } }
      }`
    : '';

  const strapiUrl = process.env.VITE_URL || 'https://tovmeod.1lev1.com';
  const graphqlUrl = `${strapiUrl}/graphql`;
  const headers = {
    Authorization: `bearer ${context.jwt}`,
    'Content-Type': 'application/json',
  };

  const mainMutation = `mutation {
    createMesimabetahalich(data: {
      project: "${projectId}",
      mission: "${missId}",
      hearotMeyuchadot: "${hearotMeyuchadot}",
      name: "${openmissionName}",
      descrip: "${missionDetails}",
      hoursassinged: ${nhours},
      perhour: ${valph},
      iskvua: ${iskvua},
      privatlinks: "${privatlinks}",
      publicklinks: "${publicklinks}",
      users_permissions_user: "${acceptedUserId}",
      tafkidims: [${tafkidimsStr}],
      publishedAt: "${now}",
      open_missions: [${openMid}],
      ${dateFragment}
      ${sdateFragment}
    }) { data { id attributes { project { data { id } } } } }

    updateOpenMission(id: "${openMid}", data: { archived: true }) {
      data { id attributes { archived ${otherAsksFragment} } }
    }

    ${welcomeFragment}
    ${adduserFragment}

    updateAsk(id: "${askId}", data: {
      archived: true,
      vots: [${votesStr}${votesStr ? ',' : ''}{ what: true users_permissions_user: ${voterUserId} }]
    }) { data { id } }
  }`;

  const res = await context.fetch(graphqlUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query: mainMutation }),
  });
  const responseData = await res.json();

  if (responseData.errors) {
    throw new Error(`Mutation failed: ${JSON.stringify(responseData.errors)}`);
  }

  const chiluzh = responseData.data?.createMesimabetahalich?.data?.id;
  const openMissionAttrs = responseData.data?.updateOpenMission?.data?.attributes || {};
  const acts: any[] = openMissionAttrs.acts?.data || [];

  // Inherit process anchors from the OpenMission
  if (chiluzh && openMid) {
    try {
      const partofRes = await strapi.execute(
        '97getOpenMissionPartofs',
        { id: openMid },
        context.jwt,
        context.fetch
      );
      const partofIds: string[] =
        partofRes?.data?.openMission?.data?.attributes?.partofs?.data?.map((e: any) => String(e.id)) || [];
      if (partofIds.length > 0) {
        await strapi.execute(
          '95updateMesimabetahalichPartofs',
          { id: chiluzh, partofIds },
          context.jwt,
          context.fetch
        );
      }
    } catch {
      // Non-fatal: process anchors are best-effort
    }
  }

  // allVoted: archive other asks + optional createMonter
  if (variant === 'allVoted') {
    const otherAsks: any[] = openMissionAttrs.asks?.data || [];
    const startDate = sqedualed
      ? (new Date(sqedualed) > d ? sqedualed : now)
      : now;

    const monterFragment = iskvua && chiluzh
      ? `createMonter(data: {
          mesimabetahalich: "${chiluzh}",
          ani: "mesimabetahalich"
          start: "${startDate}"
          ${deadline ? `finish: "${deadline}"` : ''}
        }) { data { id } }`
      : '';

    if (otherAsks.length > 1) {
      for (let i = 0; i < otherAsks.length; i++) {
        const archiveQuery = `mutation {
          ${i === 0 ? monterFragment : ''}
          updateAsk(id: "${otherAsks[i].id}", data: { archived: true }) { data { id } }
        }`;
        await context.fetch(graphqlUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({ query: archiveQuery }),
        });
      }
    } else if (monterFragment) {
      await context.fetch(graphqlUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: `mutation { ${monterFragment} }` }),
      });
    }
  } else if (variant === 'solo' && iskvua && chiluzh) {
    // Solo + iskvua: still need Monter
    const startDate = sqedualed
      ? (new Date(sqedualed) > d ? sqedualed : now)
      : now;
    const monterQuery = `mutation {
      createMonter(data: {
        mesimabetahalich: "${chiluzh}",
        ani: "mesimabetahalich"
        start: "${startDate}"
        ${deadline ? `finish: "${deadline}"` : ''}
      }) { data { id } }
    }`;
    await context.fetch(graphqlUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: monterQuery }),
    });
  }

  // Update timegrama if provided
  if (timegramaId) {
    await strapi.execute(
      '35updateTimeGrama',
      { id: timegramaId, done: true },
      context.jwt,
      context.fetch
    );
  }

  // Update acts (tasks): mark as assigned
  for (const act of acts) {
    try {
      await strapi.execute(
        '31updateTask',
        {
          id: act.id,
          myIshur: true,
          isAssigned: true,
          uid: [String(voterUserId)],
          mesimabetahaliches: [chiluzh],
        },
        context.jwt,
        context.fetch
      );
    } catch {
      // Non-fatal
    }
  }

  // Send acceptance email to the newly added member
  if (newnew) {
    try {
      const userList: any[] = responseData.data?.updateProject?.data?.attributes?.user_1s?.data || [];
      const memberInfo = userList.find((u: any) => String(u.id) === String(acceptedUserId));

      if (memberInfo?.attributes?.email) {
        const attrs = memberInfo.attributes;
        const emailService = new EmailService();
        await emailService.sendBulk(
          [{
            id: String(acceptedUserId),
            username: acceptedUserName || attrs.username || '',
            email: attrs.email,
            lang: attrs.lang || context.lang || 'he',
            noMail: false,
            machshirs: [],
          }],
          {
            title: { he: 'התקבלת למשימה', en: 'You were accepted to a mission' },
            body: { he: `משימה: ${openmissionName}`, en: `Mission: ${openmissionName}` },
          },
          'MissionAccepted',
          context,
          {
            user: acceptedUserName || attrs.username || '',
            projectName,
            projectSrc,
            missionName: openmissionName,
          }
        );
      }
    } catch (emailErr) {
      console.error('[finalizeJoinAcceptance] email send failed:', emailErr);
    }
  }

  return {
    data: responseData.data,
    updateStrategy: { type: 'none' },
  };
};

export const finalizeJoinAcceptanceConfig: ActionConfig = {
  key: 'finalizeJoinAcceptance',
  description: 'Finalizes acceptance of a join-project mission request: creates Mesimabetahalich, archives OpenMission/Ask, adds new member to project.user_1s + WelcomTop, sends acceptance email',
  graphqlOperation: finalizeJoinAcceptanceHandler,

  paramSchema: {
    variant: {
      type: 'string',
      required: true,
      validate: (v) => v === 'solo' || v === 'allVoted',
      description: '"solo" for single-member project, "allVoted" when all members have voted yes'
    },
    projectId: { type: 'string', required: true },
    missId: { type: 'string', required: true },
    openMid: { type: 'string', required: true },
    askId: { type: 'string', required: true },
    acceptedUserId: { type: 'string', required: true },
    acceptedUserName: { type: 'string', required: false },
    openmissionName: { type: 'string', required: true },
    missionDetails: { type: 'string', required: false },
    nhours: { type: 'number', required: false },
    valph: { type: 'number', required: false },
    iskvua: { type: 'boolean', required: false },
    privatlinks: { type: 'string', required: false },
    publicklinks: { type: 'string', required: false },
    hearotMeyuchadot: { type: 'string', required: false },
    tafkidims: { type: 'array', required: false },
    sqedualed: { type: 'string', required: false },
    deadline: { type: 'string', required: false },
    timegramaId: { type: 'string', required: false },
    existingMemberIds: { type: 'array', required: true },
    existingVotes: { type: 'array', required: false },
    projectName: { type: 'string', required: false },
    projectSrc: { type: 'string', required: false },
  },

  authRules: [
    { type: 'jwt' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Must be a project member to finalize join acceptance'
    }
  ],

  notification: {
    recipients: {
      type: 'projectMembers',
      config: { projectIdParam: 'projectId', excludeSender: false }
    },
    templates: {
      title: { he: 'חבר חדש הצטרף לפרויקט', en: 'New member joined the project' },
      body: { he: 'משימה חדשה נוצרה לחבר צוות', en: 'A new mission was created for a team member' }
    },
    channels: ['socket'],
    metadata: { type: 'missionCreated', url: 'lev' }
  },

  updateStrategy: { type: 'none' }
};
