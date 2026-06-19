/**
 * Action Configuration: Vote on Pending Resource Request (Pmash)
 *
 * Handles agree (YES) and decline (NO) votes on a pending resource proposal.
 *
 * Server-authoritative logic:
 *  1. Fetches the current pmash from DB (votes + all OpenMashaabim creation fields)
 *  2. Fetches project members to determine quorum
 *  3. Calculates `orderon` from DB — not trusted from client
 *  4. Adds / replaces the caller's vote at the current orderon
 *  5. On full YES consensus → creates OpenMashaabim + archives pmash + marks timegrama done
 *     On full NO consensus  → archives pmash
 *     Otherwise             → saves the updated vote array
 *
 * Client only needs to send: { pmashId, projectId, what, why? }
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';

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

const voteOnPmashHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { pmashId, projectId, what, why } = params;

  const now = new Date();

  // 1. Fetch pmash from DB
  const pmashRes = await strapi.execute('144getPmashForVote', { id: pmashId }, context.jwt, context.fetch);
  const pmashData = pmashRes?.data?.pmash?.data;
  if (!pmashData) throw new Error(`Pmash ${pmashId} not found`);
  const attrs = pmashData.attributes;

  // 2. Fetch project members for quorum
  const projectRes = await strapi.execute('3projectJSONQue', { pid: projectId }, context.jwt, context.fetch);
  const members = projectRes?.data?.project?.data?.attributes?.user_1s?.data ?? [];
  const memberIds: string[] = members.map((m: any) => String(m.id));
  const totalMembers = memberIds.length;

  // 3. Calculate orderon server-side
  const existingVotes: any[] = attrs.users ?? [];
  const maxVoteOrder: number = existingVotes.reduce(
    (max: number, v: any) => Math.max(max, v.order ?? 0),
    0,
  );
  // pmash doesn't have negotiations, so orderon is just maxVoteOrder (defaults to 0)
  const orderon = maxVoteOrder;

  // 4. Build new votes array (replace any existing vote by this user at orderon)
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

  // Vote in Strapi-nested shape for the pmashes store (processPmash recomputes counts).
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
    // ── Full YES consensus: create OpenMashaabim + archive pmash + mark timegrama done ──
    const mshaabId = attrs.mashaabim?.data?.id;
    const timegramaId = attrs.timegrama?.data?.id;

    const sqadualedFrag = attrs.sqadualed
      ? `sqadualed: "${new Date(attrs.sqadualed).toISOString()}",`
      : '';
    const sqadualefFrag = attrs.sqadualedf
      ? `sqadualedf: "${new Date(attrs.sqadualedf).toISOString()}",`
      : '';

    // Carry the recurring-expense terms onto the OpenMashaabim so the resource
    // suggestion card (sugestma) can show "recurring / monthly approval" and the
    // estimated total. Only emitted when the pmash is recurring.
    const recurringFrag = attrs.recurring
      ? `recurring: true, cycleSize: ${parseInt(String(attrs.cycleSize ?? 1), 10) || 1},`
      : '';

    const strapiUrl = process.env.VITE_URL ?? 'https://tovmeod.1lev1.com';
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
      createOpenMashaabim(data: {
        project: "${projectId}",
        spnot: """${(attrs.spnot ?? '').replace(/"""/g, '"')}""",
        name: "${(attrs.name ?? '').replace(/"/g, '\\"')}",
        descrip: """${(attrs.descrip ?? '').replace(/"""/g, '"')}""",
        kindOf: ${attrs.kindOf ?? 'total'},
        hm: ${attrs.hm ?? 0},
        price: ${attrs.price ?? 0},
        easy: ${attrs.easy ?? 0},
        linkto: "${(attrs.linkto ?? '').replace(/"/g, '\\"')}",
        pmash: "${pmashId}",
        publishedAt: "${now.toISOString()}",
        mashaabim: "${mshaabId}",
        ${sqadualedFrag}
        ${sqadualefFrag}
        ${recurringFrag}
      }) { data { attributes { project { data { id } } } } }

      updatePmash(id: "${pmashId}", data: {
        archived: true,
        users: [${votsStr}]
      }) { data { attributes { users { users_permissions_user { data { id } } } } } }

      ${timegramaFrag}
    }`;

    const res = await context.fetch(graphqlUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: combinedMutation }),
    });
    const responseData = await res.json();

    if (responseData.errors) {
      throw new Error(`voteOnPmash consensus mutation failed: ${JSON.stringify(responseData.errors)}`);
    }

    // Consensus archives the pmash and creates an OpenMashaabim — refresh everywhere.
    return {
      data: { pmashId, consensus: true },
      updateStrategy: { type: 'fullRefresh' },
    };
  }

  // ── No full YES consensus ─────────────────────────────────────────────────

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
    await strapi.execute('145archivePmashWithVotes', { id: pmashId, users: allVots }, context.jwt, context.fetch);
    // Full NO consensus archives the pmash — it must disappear for everyone.
    return {
      data: { pmashId, consensus: false, archived: true },
      updateStrategy: { type: 'fullRefresh' },
    };
  }

  await strapi.execute('146addVoteToPmash', { id: pmashId, users: allVots }, context.jwt, context.fetch);

  // Regular vote: broadcast the single new vote for live count updates everywhere.
  return {
    data: { id: pmashId, newVote: strapiVote, consensus: false, archived: false },
    updateStrategy: { type: 'partialUpdate', config: { dataKeys: ['pmashes'] } },
  };
};

export const voteOnPmashConfig: ActionConfig = {
  key: 'voteOnPmash',
  description:
    'Vote on a pending resource request (pmash). YES with full quorum creates OpenMashaabim + archives pmash + marks timegrama done. NO archives on full rejection. Server fetches current state from DB.',
  graphqlOperation: voteOnPmashHandler,

  paramSchema: {
    pmashId: { type: 'string', required: true, description: 'ID of the pmash record' },
    projectId: { type: 'string', required: true, description: 'Project ID' },
    what: { type: 'boolean', required: true, description: 'true = agree, false = decline' },
    why: { type: 'string', required: false, description: 'Optional decline reason' },
  },

  authRules: [
    { type: 'jwt' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Must be a project member to vote on a pending resource',
    },
  ],

  notification: {
    recipients: {
      type: 'projectMembers',
      config: { projectIdParam: 'projectId', excludeSender: false },
    },
    templates: {
      title: { he: 'הצבעה על הצעת משאב', en: 'Resource proposal vote' },
      body: { he: 'חבר צוות הצביע על הצעת משאב', en: 'A team member voted on a resource proposal' },
    },
    channels: ['socket'],
    metadata: { type: 'pmashVote', url: 'lev' },
  },

  updateStrategy: { type: 'none' },
};
