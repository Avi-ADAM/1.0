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
    return `{what:${what} users_permissions_user:${parseInt(String(uid), 10)} order:${order} ide:${parseInt(String(ide), 10)} zman:"${zman}"}`;
  }).join(',');
}

const finalizeAskAcceptanceHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
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
    existingVotes = [],
    projectName = '',
    projectSrc = '',
  } = params;

  const voterUserId = context.userId;
  const d = new Date();
  const now = d.toISOString();

  // Apply the latest negotiated round (if any) to the Mesimabetahalich params.
  // Best-effort: if the query fails or there are no rounds, baseline params are kept.
  let finalName = openmissionName;
  let finalMissionDetails = missionDetails;
  let finalNhours = nhours;
  let finalValph = valph;
  let finalHearotMeyuchadot = hearotMeyuchadot;
  let finalTafkidims = Array.isArray(tafkidims) ? [...tafkidims] : [];
  let finalSqedualed = sqedualed;
  let finalDeadline = deadline;

  try {
    const roundsRes: any = await strapi.execute(
      'getAskNegoRounds',
      { id: String(askId) },
      context.jwt,
      context.fetch
    );
    const rounds = roundsRes?.data?.ask?.data?.attributes?.negopendmissions?.data ?? [];
    const latest = rounds[0]?.attributes; // ordern:desc → [0] is the latest round
    if (latest) {
      if (latest.name != null) finalName = latest.name;
      if (latest.descrip != null) finalMissionDetails = latest.descrip;
      if (latest.noofhours != null) finalNhours = latest.noofhours;
      if (latest.perhour != null) finalValph = latest.perhour;
      if (latest.hearotMeyuchadot != null) finalHearotMeyuchadot = latest.hearotMeyuchadot;
      if (latest.tafkidims?.data?.length > 0)
        finalTafkidims = latest.tafkidims.data.map((t: any) => String(t.id));
      if (latest.date != null) finalSqedualed = latest.date;
      if (latest.dates != null) finalDeadline = latest.dates;
    }
  } catch {
    /* negotiated terms are best-effort; baseline params still work */
  }

  const votesStr = formatVotesForInline(existingVotes);

  const dateFragment = finalDeadline ? `admaticedai: "${finalDeadline}"` : '';
  const sdateFragment = finalSqedualed ? `start: "${finalSqedualed}"` : '';
  const tafkidimsStr = finalTafkidims.join(',');
  const otherAsksFragment = variant === 'allVoted' ? 'asks { data { id } }' : '';

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
      hearotMeyuchadot: "${finalHearotMeyuchadot}",
      name: "${finalName}",
      descrip: "${finalMissionDetails}",
      hoursassinged: ${finalNhours},
      perhour: ${finalValph},
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

    updateAsk(id: "${askId}", data: {
      archived: true,
      vots: [${votesStr}${votesStr ? ',' : ''}{ what: true users_permissions_user: "${voterUserId}" }]
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

  // allVoted case: archive other asks + optional createMonter on first iteration
  if (variant === 'allVoted') {
    const chiluzh = responseData.data?.createMesimabetahalich?.data?.id;
    const otherAsks: any[] = responseData.data?.updateOpenMission?.data?.attributes?.asks?.data || [];

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
    }
  }

  // Fetch the accepted client's info and send acceptance email
  try {
    const userRes = await strapi.execute(
      '24userJSONQue',
      { uid: acceptedUserId },
      context.jwt,
      context.fetch
    );
    const userData = userRes?.usersPermissionsUser?.data;
    if (userData?.attributes?.email) {
      const attrs = userData.attributes;
      const emailService = new EmailService();
      await emailService.sendBulk(
        [{
          id: String(acceptedUserId),
          username: acceptedUserName || attrs.username || '',
          email: attrs.email,
          lang: attrs.lang || context.lang || 'he',
          noMail: attrs.noMail ?? false,
          machshirs: attrs.machshirs?.data ?? [],
        }],
        {
          title: { he: 'התקבלת לשירות', en: 'Your service request was accepted' },
          body: { he: `שירות: ${openmissionName}`, en: `Service: ${openmissionName}` },
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
    // Non-fatal: log but don't fail the action
    console.error('[finalizeAskAcceptance] email send failed:', emailErr);
  }

  return {
    data: responseData.data,
    updateStrategy: { type: 'none' },
  };
};

export const finalizeAskAcceptanceConfig: ActionConfig = {
  key: 'finalizeAskAcceptance',
  description: 'Finalizes acceptance of a service request: creates Mesimabetahalich, archives OpenMission/Ask, sends acceptance email to the client',
  graphqlOperation: finalizeAskAcceptanceHandler,

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
    existingVotes: { type: 'array', required: false },
    projectName: { type: 'string', required: false },
    projectSrc: { type: 'string', required: false },
  },

  authRules: [
    { type: 'jwt' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Must be a project member to finalize acceptance'
    }
  ],

  notification: {
    recipients: {
      type: 'projectMembers',
      config: { projectIdParam: 'projectId', excludeSender: false }
    },
    templates: {
      title: { he: 'בקשת שירות אושרה', en: 'Service request accepted' },
      body: { he: 'לקוח חדש מצטרף לשירות', en: 'A new client joined a service mission' }
    },
    channels: ['socket'],
    metadata: { type: 'missionCreated', url: 'lev' }
  },

  updateStrategy: { type: 'none' }
};
