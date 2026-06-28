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

  // Apply the latest negotiated round's terms (if any) to the materialized
  // Mesimabetahalich. When a candidate proposed custom terms and the member
  // approves ("אישור"), the agreed (round) terms must win over the OpenMission
  // baseline that the client passes in. Resolved server-side so client props
  // can't make the materialization wrong.
  let fName = openmissionName;
  let fDescrip = missionDetails;
  let fHearot = hearotMeyuchadot;
  let fHours = nhours;
  let fPer = valph;
  let fTafkidims = Array.isArray(tafkidims) ? tafkidims.slice() : [];
  let fStart = sqedualed;
  let fDates = deadline;
  try {
    const roundsRes = await strapi.execute(
      'getAskNegoRounds',
      { id: askId },
      context.jwt,
      context.fetch
    );
    const latest =
      roundsRes?.data?.ask?.data?.attributes?.negopendmissions?.data?.[0]?.attributes ?? null;
    if (latest) {
      if (latest.name != null) fName = latest.name;
      if (latest.descrip != null) fDescrip = latest.descrip;
      if (latest.hearotMeyuchadot != null) fHearot = latest.hearotMeyuchadot;
      if (latest.noofhours != null) fHours = latest.noofhours;
      if (latest.perhour != null) fPer = latest.perhour;
      if (latest.tafkidims?.data?.length > 0) fTafkidims = latest.tafkidims.data.map((c: any) => c.id);
      if (latest.date != null) fStart = latest.date;
      if (latest.dates != null) fDates = latest.dates;
    }
  } catch (e) {
    console.error('[finalizeJoinAcceptance] nego rounds fetch failed:', e);
  }

  const dateFragment = fDates ? `admaticedai: "${fDates}"` : '';
  const sdateFragment = fStart ? `start: "${fStart}"` : '';
  const tafkidimsStr = Array.isArray(fTafkidims) ? fTafkidims.join(',') : '';
  // Always pull sibling asks so other candidates' offers get archived on
  // acceptance — in BOTH the solo and allVoted variants.
  const otherAsksFragment = 'asks { data { id } } acts { data { id } }';

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
      hearotMeyuchadot: """${fHearot}""",
      name: """${fName}""",
      descrip: """${fDescrip}""",
      hoursassinged: ${fHours},
      perhour: ${fPer},
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

  // Archive the other (losing) candidates' asks on this OpenMission, and spin
  // up a Monter for recurring missions. Runs for BOTH variants — a single-member
  // (solo) project still needs sibling candidate asks archived so they can no
  // longer be voted on.
  const otherAsks: any[] = openMissionAttrs.asks?.data || [];
  const siblingAsks = otherAsks.filter((a) => String(a.id) !== String(askId));
  const startDate = fStart
    ? (new Date(fStart) > d ? fStart : now)
    : now;
  const monterFragment = iskvua && chiluzh
    ? `createMonter(data: {
        mesimabetahalich: "${chiluzh}",
        ani: "mesimabetahalich"
        start: "${startDate}"
        ${fDates ? `finish: "${fDates}"` : ''}
      }) { data { id } }`
    : '';

  if (siblingAsks.length > 0) {
    for (let i = 0; i < siblingAsks.length; i++) {
      const archiveQuery = `mutation {
        ${i === 0 ? monterFragment : ''}
        updateAsk(id: "${siblingAsks[i].id}", data: { archived: true }) { data { id } }
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
            body: { he: `משימה: ${fName}`, en: `Mission: ${fName}` },
          },
          'MissionAccepted',
          context,
          {
            user: acceptedUserName || attrs.username || '',
            projectName,
            projectSrc,
            missionName: fName,
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
