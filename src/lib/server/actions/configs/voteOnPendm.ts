/**
 * Action Configuration: Vote on Pending Mission (Pendm)
 *
 * Handles agree (YES) and decline (NO) votes on a pending mission proposal.
 *
 * Server-authoritative logic:
 *  1. Fetches the current pendm from DB (votes + all OpenMission creation fields)
 *  2. Fetches project members to determine quorum
 *  3. Calculates `orderon` from DB (current round = highest existing vote order) — not trusted from client
 *  4. Adds / replaces the caller's vote at the current orderon
 *  5. On full YES consensus → creates OpenMission + archives pendm
 *     On full NO consensus → archives pendm
 *     Otherwise → saves the updated vote array
 *
 * Client only needs to send: { pendId, projectId, what, why? }
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { matchOpenMissionToUsers } from '$lib/server/matching/engine';

// Helper: normalise a vote component row to a plain object for GraphQL variables
function normalizeVote(v: any): Record<string, any> {
  const uid =
    v.users_permissions_user?.data?.id ??
    v.users_permissions_user?.id ??
    v.users_permissions_user;
  const row: Record<string, any> = {
    what: v.what ?? true,
    users_permissions_user: String(uid),
    order: v.order ?? 0,
    ide: parseInt(String(v.ide ?? uid), 10),
    zman: v.zman ?? new Date().toISOString(),
  };
  if (v.why) row.why = v.why;
  return row;
}

const voteOnPendmHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { pendId, projectId, what, why } = params;

  const now = new Date();

  // 1. Fetch pendm from DB — get vote array + all fields needed for OpenMission creation
  const pendmRes = await strapi.execute('142getPendmForVote', { id: pendId }, context.jwt, context.fetch);
  const pendmData = pendmRes?.data?.pendm?.data;
  if (!pendmData) throw new Error(`Pendm ${pendId} not found`);
  const attrs = pendmData.attributes;

  // 2. Fetch project members for quorum check
  const projectRes = await strapi.execute('3projectJSONQue', { pid: projectId }, context.jwt, context.fetch);
  const members = projectRes?.data?.project?.data?.attributes?.user_1s?.data ?? [];
  const memberIds: string[] = members.map((m: any) => String(m.id));
  const totalMembers = memberIds.length;

  // 3. Calculate orderon server-side (not trusted from client)
  //    orderon is the current negotiation round. Only a negotiation advances
  //    the round — submitNegoMission casts the negotiator's vote at ordern+1,
  //    so the highest vote order already reflects the latest negotiation.
  //    A plain agree/decline vote must join the current round, never invent a
  //    higher one. (Counting negopendmissions here would over-count when two
  //    members negotiate the same round before refreshing — two snapshots but
  //    only one new vote order — pushing orderon past every real vote so
  //    consensus can never be reached.)
  const existingVotes: any[] = attrs.users ?? [];
  const orderon: number = existingVotes.reduce(
    (max: number, v: any) => Math.max(max, v.order ?? 0),
    0,
  );

  // 4. Build new votes array:
  //    - strip any existing vote by this user at orderon (handles vote changes)
  //    - append the new vote
  const strUserId = String(context.userId);
  const previousVotes = existingVotes
    .filter((v: any) => {
      const uid =
        v.users_permissions_user?.data?.id ??
        v.users_permissions_user?.id ??
        v.users_permissions_user;
      return !(String(uid) === strUserId && (v.order ?? 0) === orderon);
    })
    .map(normalizeVote);

  const newVote: Record<string, any> = {
    what: Boolean(what),
    users_permissions_user: strUserId,
    order: orderon,
    ide: parseInt(strUserId, 10),
    zman: now.toISOString(),
  };
  if (why) newVote.why = why;

  const allVots = [...previousVotes, newVote];

  // Vote in Strapi-nested shape, so receiving clients (levSocketHandler →
  // pends store) can append it and let processPends() recompute the counts.
  const strapiVote: Record<string, any> = {
    what: Boolean(what),
    users_permissions_user: { data: { id: strUserId } },
    order: orderon,
    ide: parseInt(strUserId, 10),
    zman: now.toISOString(),
  };
  if (why) strapiVote.why = why;

  // 5. Count YES votes at orderon among project members
  const yesMemberCount = (() => {
    const yesSet = new Set(
      allVots
        .filter((v) => v.what === true && (v.order ?? 0) === orderon)
        .map((v) => String(v.users_permissions_user)),
    );
    return memberIds.filter((id) => yesSet.has(id)).length;
  })();

  if (what === true && yesMemberCount >= totalMembers && totalMembers > 0) {
    // ── Full YES consensus: create OpenMission + archive pendm + mark timegrama done ──
    const skillIds = (attrs.skills?.data ?? []).map((s: any) => s.id);
    const tafkidimIds = (attrs.tafkidims?.data ?? []).map((t: any) => t.id);
    const workwayIds = (attrs.work_ways?.data ?? []).map((w: any) => w.id);
    const vallueIds = (attrs.vallues?.data ?? []).map((v: any) => v.id);
    const missionId = attrs.mission?.data?.id;
    const timegramaId = attrs.timegrama?.data?.id;

    const sqadualedFrag = attrs.sqadualed ? `sqadualed: "${attrs.sqadualed}"` : '';
    const datesFrag = attrs.dates ? `dates: "${attrs.dates}"` : '';

    const strapiUrl = import.meta.env.VITE_URL ?? 'https://tovmeod.1lev1.com';
    const graphqlUrl = `${strapiUrl}/graphql`;
    const headers = {
      Authorization: `bearer ${context.jwt}`,
      'Content-Type': 'application/json',
    };

    // Serialise votes for inline GraphQL
    const votsStr = allVots
      .map((v) => {
        const parts = [
          `what:${v.what}`,
          `users_permissions_user:${parseInt(String(v.users_permissions_user), 10)}`,
          `order:${v.order ?? 0}`,
          `ide:${parseInt(String(v.ide ?? v.users_permissions_user), 10)}`,
          `zman:"${v.zman}"`,
        ];
        if (v.why) parts.push(`why:"${v.why}"`);
        return `{${parts.join(' ')}}`;
      })
      .join(',');

    // updateTimegrama fragment (only if timegrama exists)
    const timegramaFrag = timegramaId
      ? `updateTimegrama(id: "${timegramaId}", data: { done: true }) { data { id } }`
      : '';

    const combinedMutation = `mutation {
      createOpenMission(data: {
        project: "${projectId}",
        mission: "${missionId}",
        iskvua: ${attrs.iskvua ?? false},
        work_ways: [${workwayIds.join(',')}],
        hearotMeyuchadot: """${(attrs.hearotMeyuchadot ?? '').replace(/"""/g, '"')}""",
        name: "${(attrs.name ?? '').replace(/"/g, '\\"')}",
        publishedAt: "${now.toISOString()}",
        descrip: """${(attrs.descrip ?? '').replace(/"""/g, '"')}""",
        skills: [${skillIds.join(',')}],
        tafkidims: [${tafkidimIds.join(',')}],
        vallues: [${vallueIds.join(',')}],
        noofhours: ${attrs.noofhours ?? 0},
        perhour: ${attrs.perhour ?? 0},
        privatlinks: """${(attrs.privatlinks ?? '').replace(/"""/g, '"')}""",
        publicklinks: """${(attrs.publicklinks ?? '').replace(/"""/g, '"')}""",
        pendm: "${pendId}",
        ${sqadualedFrag}
        ${datesFrag}
      }) { data { id } }

      updatePendm(id: "${pendId}", data: {
        archived: true,
        users: [${votsStr}]
      }) { data { id } }

      ${timegramaFrag}
    }`;

    const res = await context.fetch(graphqlUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: combinedMutation }),
    });
    const responseData = await res.json();

    if (responseData.errors) {
      throw new Error(`voteOnPendm consensus mutation failed: ${JSON.stringify(responseData.errors)}`);
    }

    // The pendm matured into a real open mission — tag matching users with
    // suggestions and notify them by email.
    const newOpenMissionId = responseData.data?.createOpenMission?.data?.id;
    if (newOpenMissionId) {
      await matchOpenMissionToUsers(String(newOpenMissionId), 'missionCreated', {
        strapi,
        fetch: context.fetch,
        lang: context.lang
      });
    }

    // Consensus archives the pendm and creates an OpenMission — both the
    // disappearing pend and the new mission must reflect everywhere, so refresh.
    return {
      data: {
        openMissionId: responseData.data?.createOpenMission?.data?.id,
        pendId,
        consensus: true,
      },
      updateStrategy: { type: 'fullRefresh' },
    };
  }

  // ── No full YES consensus yet ─────────────────────────────────────────────

  // Check if all members voted NO → archive
  const noMemberCount = (() => {
    const noSet = new Set(
      allVots
        .filter((v) => v.what === false && (v.order ?? 0) === orderon)
        .map((v) => String(v.users_permissions_user)),
    );
    return memberIds.filter((id) => noSet.has(id)).length;
  })();

  const archiveOnNo = what === false && noMemberCount >= totalMembers && totalMembers > 0;

  if (archiveOnNo) {
    await strapi.execute('143archivePendmWithVotes', { id: pendId, users: allVots }, context.jwt, context.fetch);
    // Full NO consensus archives the pendm — it must disappear for everyone.
    return {
      data: { pendId, consensus: false, archived: true },
      updateStrategy: { type: 'fullRefresh' },
    };
  }

  await strapi.execute('85addVoteToPend', { id: pendId, users: allVots }, context.jwt, context.fetch);

  // Regular vote: broadcast the single new vote so every project member (and the
  // voter's other devices) appends it and re-derives the live vote counts.
  return {
    data: { id: pendId, newVote: strapiVote, consensus: false, archived: false },
    updateStrategy: { type: 'partialUpdate', config: { dataKeys: ['pends'] } },
  };
};

export const voteOnPendmConfig: ActionConfig = {
  key: 'voteOnPendm',
  description:
    'Vote on a pending mission (pendm). YES with full quorum creates OpenMission + archives pendm. NO archives on full rejection. Server fetches current state from DB — client only sends pendId + projectId + what (+ optional why).',
  graphqlOperation: voteOnPendmHandler,

  paramSchema: {
    pendId: { type: 'string', required: true, description: 'ID of the pendm record' },
    projectId: { type: 'string', required: true, description: 'Project ID' },
    what: { type: 'boolean', required: true, description: 'true = agree, false = decline' },
    why: { type: 'string', required: false, description: 'Optional decline reason' },
  },

  authRules: [
    { type: 'jwt' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Must be a project member to vote on a pending mission',
    },
  ],

  notification: {
    recipients: {
      type: 'projectMembers',
      config: { projectIdParam: 'projectId', excludeSender: false },
    },
    templates: {
      title: { he: 'הצבעה על הצעת משימה', en: 'Mission proposal vote' },
      body: { he: 'חבר צוות הצביע על הצעת משימה', en: 'A team member voted on a mission proposal' },
    },
    channels: ['socket'],
    metadata: { type: 'pendmVote', url: 'lev' },
  },

  updateStrategy: { type: 'none' },
};
