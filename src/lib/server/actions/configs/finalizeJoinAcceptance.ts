import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { EmailService } from '../../notifications/EmailService.js';
import { STRAPI_URL } from '$lib/server/strapiUrl.js';
import { evaluateAskAcceptance } from '$lib/server/nego/askAcceptance.js';
import { ensureCandidacyTimegrama } from '../../nego/timegrama.js';
import { resolveAcceptedActs } from '../helpers/roundActs.js';
import { touchDormancy } from '$lib/server/archive/dormancyClock.js';
import { execFromContext } from '$lib/server/archive/exec.js';
import { carryStipendToMission } from '$lib/server/stipend/fromMission.js';
import { gqlString } from './actionUtils.js';

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
    // `why` (the voter's words) is part of the vote — carry it through the
    // rewrite instead of dropping it on acceptance.
    const why = attrs.why ? ` why:${JSON.stringify(String(attrs.why))}` : '';
    return `{what:${what} users_permissions_user:${uid} order:${order} ide:${ide} zman:"${zman}"${why}}`;
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
    projectName = '',
    projectSrc = '',
  } = params;

  const voterUserId = context.userId;
  const d = new Date();
  const now = d.toISOString();

  const newnew = !existingMemberIds.map(String).includes(String(acceptedUserId));

  // Filled from the server's authoritative vote rows once the gate has run.
  let votesStr = '';

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
  // One fetch feeds both the consent gate and the negotiated terms. It must
  // succeed: without it we cannot tell an assigned offer from an application,
  // and materializing blind is exactly the failure this guard exists to stop.
  let askAttributes: any = null;
  try {
    const roundsRes = await strapi.execute(
      'getAskNegoRounds',
      { id: askId },
      context.jwt,
      context.fetch
    );
    askAttributes = roundsRes?.data?.ask?.data?.attributes ?? null;
  } catch (e) {
    console.error('[finalizeJoinAcceptance] ask fetch failed:', e);
  }
  if (!askAttributes) throw new Error(`Ask ${askId} could not be loaded — acceptance aborted`);

  // ── Consent gate ──────────────────────────────────────────────────────────
  // The same bilateral rule the timegrama finalizer applies at restime: an
  // ASSIGNED offer (open_mission.isRishon — a member created the mission on
  // someone else's behalf) may never be registered under the assignee's name
  // without their explicit yes. Client-computed vote counts are advisory only.
  const check = evaluateAskAcceptance({
    askAttributes,
    callerId: context.userId,
    acceptedUserId,
    now: d,
  });

  if (!check.allowed) {
    if (check.reason === 'awaitingAssigneeConsent') {
      // Not a failure: the approving member's yes is real and must be kept.
      // Store it at the current round and leave the Ask open — the assignee
      // still has until the timegrama expires to agree, counter or talk.
      await strapi.execute(
        '120addVoteToAsk',
        { askId: String(askId), vots: check.vots },
        context.jwt,
        context.fetch
      );
      await ensureCandidacyTimegrama(strapi, context, { side: 'ask', id: String(askId) });

      return {
        data: {
          askId: String(askId),
          materialized: false,
          pending: 'assigneeConsent',
          takerId: check.takerId,
        },
        updateStrategy: { type: 'fullRefresh' },
      };
    }
    if (check.reason === 'archived') {
      throw new Error(`Ask ${askId} was already resolved`);
    }
    throw new Error(`acceptedUserId ${acceptedUserId} is not the candidate of ask ${askId}`);
  }

  // Persist the server's own view of the votes (DB rows + this approver's yes
  // at the current round) rather than the client-supplied array.
  votesStr = formatVotesForInline(check.vots);

  const latest = askAttributes?.negopendmissions?.data?.[0]?.attributes ?? null;
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

  const strapiUrl = STRAPI_URL;
  const graphqlUrl = `${strapiUrl}/graphql`;
  const headers = {
    Authorization: `bearer ${context.jwt}`,
    'Content-Type': 'application/json',
  };

  const mainMutation = `mutation {
    createMesimabetahalich(data: {
      project: "${projectId}",
      mission: "${missId}",
      hearotMeyuchadot: ${gqlString(fHearot)},
      name: ${gqlString(fName)},
      descrip: ${gqlString(fDescrip)},
      hoursassinged: ${fHours},
      perhour: ${fPer},
      iskvua: ${iskvua},
      privatlinks: ${gqlString(privatlinks)},
      publicklinks: ${gqlString(publicklinks)},
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
      vots: [${votesStr}]
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
  // Start the dormancy clock: from here on, silence has a deadline
  // (PLAN_OBJECT_ARCHIVAL). Best-effort — a missing clock only means
  // the mission is never asked about, not a failed assignment.
  if (chiluzh) {
    await touchDormancy(execFromContext(context), String(chiluzh)).catch(() => null);
  }

  // A mission that was proposed with a subsistence stipend attached carries it
  // to whoever takes it (PLAN_STIPEND §13): the terms move onto the mission in
  // progress, and when a funder was already named the bilateral pledge opens
  // itself with their signature on it. Best-effort — the assignment stands
  // either way.
  if (chiluzh) {
    await carryStipendToMission(execFromContext(context), {
      openMissionId: String(openMid),
      mesimabetahalichId: String(chiluzh),
      projectId: String(projectId),
      recipientId: String(acceptedUserId),
      hours: Number(nhours) || null,
      iskvua: iskvua === true,
      missionName: String(openmissionName ?? ""),
    }).catch(() => null);
  }
  const openMissionAttrs = responseData.data?.updateOpenMission?.data?.attributes || {};
  // The accepted checklist: the winning round's list when it has one, else the
  // OpenMission baseline (see helpers/roundActs.ts).
  const actIds: string[] = resolveAcceptedActs(
    askAttributes?.negopendmissions?.data,
    openMissionAttrs.acts
  );

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
  for (const actId of actIds) {
    try {
      await strapi.execute(
        '31updateTask',
        {
          id: actId,
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
