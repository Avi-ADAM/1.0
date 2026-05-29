/**
 * Action Configuration: Vote on Resource Application (Maap)
 *
 * Handles agree (YES) and decline (NO) votes on a resource application (Maap/weget).
 *
 * Server-authoritative logic:
 *  1. Fetches the Maap from DB — gets current vots array + all data needed for Rikmash creation
 *     (sp, open_mashaabim relations)
 *  2. Fetches project members to determine quorum
 *  3. Strips any existing vote by this user (handles vote changes cleanly)
 *  4. Appends the new vote
 *  5. On full YES (all members voted YES):
 *       → creates Rikmash + archives Maap + marks Sp.panui = false  (inline combined mutation)
 *     On NO vote:
 *       → saves updated vots (no archive — a single NO just logs disagreement)
 *
 * Client only needs to send: { askId, projectId, what, why? }
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';

function normalizeVote(v: any): Record<string, any> {
  const uid =
    v.users_permissions_user?.data?.id ??
    v.users_permissions_user?.id ??
    v.users_permissions_user;
  const row: Record<string, any> = {
    what: Boolean(v.what),
    users_permissions_user: String(uid),
  };
  if (v.why) row.why = v.why;
  return row;
}

// Compute Rikmash `total` server-side from kindOf + agprice + hm + optional date range
function computeTotal(kindOf: string, agprice: number, hm: number, sqadualed?: string, sqadualedf?: string): number {
  if (kindOf === 'perUnit') {
    return agprice * hm;
  } else if (kindOf === 'total' || kindOf === 'rent') {
    return agprice;
  } else if (kindOf === 'monthly' && sqadualed && sqadualedf) {
    const msPerMonth = (1000 * 60 * 60 * 24 * 365.25) / 12;
    const monts = (new Date(sqadualedf).getTime() - new Date(sqadualed).getTime()) / msPerMonth;
    return agprice * monts;
  } else if (kindOf === 'yearly' && sqadualed && sqadualedf) {
    const msPerYear = 1000 * 60 * 60 * 24 * 365.25;
    const yers = (new Date(sqadualedf).getTime() - new Date(sqadualed).getTime()) / msPerYear;
    return agprice * yers;
  }
  return agprice;
}

const voteOnMaapHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { askId, projectId, what, why } = params;

  const now = new Date();

  // 1. Fetch Maap from DB — get vots + all fields needed for Rikmash creation
  const maapRes = await strapi.execute('151getMaapForVote', { id: askId }, context.jwt, context.fetch);
  const maapData = maapRes?.data?.maap?.data;
  if (!maapData) throw new Error(`Maap ${askId} not found`);
  const attrs = maapData.attributes;

  const sp = attrs.sp?.data;
  const om = attrs.open_mashaabim?.data;

  if (!sp) throw new Error(`Maap ${askId} has no associated Sp — cannot proceed`);
  // om (open_mashaabim) is optional: some Maaps come from Pmash/Sherut flows and have no om.
  // If present → full Rikmash with om data.
  // If absent but sp present → Rikmash with Sp+Maap data only (no open_mashaabim link).

  const spId: string = sp.id;

  // Fields from Sp
  const myp: number = sp.attributes?.myp ?? 0;
  const hm: number = sp.attributes?.unit ?? 1;
  const applicantId: string = String(sp.attributes?.users_permissions_user?.data?.id ?? '');

  // 2. Fetch project members for quorum
  const projectRes = await strapi.execute('3projectJSONQue', { pid: projectId }, context.jwt, context.fetch);
  const members = projectRes?.data?.project?.data?.attributes?.user_1s?.data ?? [];
  const memberIds: string[] = members.map((m: any) => String(m.id));
  const totalMembers = memberIds.length;

  // 3. Build updated vots array (deduplicated — strip any prior vote by this user)
  const existingVots: any[] = attrs.vots ?? [];
  const strUserId = String(context.userId);

  const previousVotes = existingVots
    .filter((v: any) => {
      const uid =
        v.users_permissions_user?.data?.id ??
        v.users_permissions_user?.id ??
        v.users_permissions_user;
      return String(uid) !== strUserId;
    })
    .map(normalizeVote);

  const newVote: Record<string, any> = {
    what: Boolean(what),
    users_permissions_user: strUserId,
  };
  if (why) newVote.why = why;

  const allVots = [...previousVotes, newVote];

  // Vote in Strapi-nested shape for the wegets store (processWeget recomputes counts).
  const strapiVote: Record<string, any> = {
    what: Boolean(what),
    users_permissions_user: { data: { id: strUserId } },
    ide: parseInt(strUserId, 10),
    zman: now.toISOString(),
  };
  if (why) strapiVote.why = why;

  // 4. Check YES consensus: all project members voted YES
  if (what === true) {
    const yesCount = allVots.filter(
      (v) => v.what === true && memberIds.includes(String(v.users_permissions_user)),
    ).length;

    if (yesCount >= totalMembers && totalMembers > 0) {
      // ── Full YES consensus: create Rikmash + archive Maap + mark Sp.panui=false ──────
      // om (open_mashaabim) may be absent on Maaps created from Pmash/Sherut flows;
      // in that case we fall back to Sp data + Maap name. No om = no open_mashaabim link.

      const omAttrs = om?.attributes ?? {};
      const easy: number = omAttrs.easy ?? 0;
      const price: number = omAttrs.price ?? 0;
      const kindOf: string = omAttrs.kindOf ?? 'total';
      const spnot: string = omAttrs.spnot ?? '';
      // Prefer om.name; fall back to the Maap's own name field
      const missionBName: string = ((omAttrs.name ?? attrs.name ?? '') as string).replace(/"/g, '\\"');
      const sqadualed: string | undefined = omAttrs.sqadualed;
      const sqadualedf: string | undefined = omAttrs.sqadualedf;

      // agprice: average of applicant offer (myp) and project offer (easy).
      // Without om, easy=0 so agprice = myp/2 would be wrong — use myp directly.
      const agprice = om ? (myp + easy) / 2 : myp;
      const total = computeTotal(kindOf, agprice, hm, sqadualed, sqadualedf);

      const strapiUrl = process.env.VITE_URL ?? 'https://tovmeod.1lev1.com';
      const graphqlUrl = `${strapiUrl}/graphql`;
      const headers = {
        Authorization: `bearer ${context.jwt}`,
        'Content-Type': 'application/json',
      };

      // Serialise vots for inline GraphQL
      const votsStr = allVots
        .map((v) => {
          const parts = [`what:${v.what}`, `users_permissions_user:${parseInt(String(v.users_permissions_user), 10)}`];
          if (v.why) parts.push(`why:"${v.why.replace(/"/g, '\\"')}"`);
          return `{${parts.join(' ')}}`;
        })
        .join(',');

      // Optional fragments — omit fields that have no data
      const openMidFrag = om ? `open_mashaabim: "${om.id}",` : '';
      const sqadualedFrag = sqadualed
        ? `sqadualed: "${new Date(sqadualed).toISOString()}",`
        : '';
      // Rikmash uses "sqadualef" (end date field name, without trailing 'd')
      const sqadualefFrag = sqadualedf
        ? `sqadualef: "${new Date(sqadualedf).toISOString()}",`
        : '';

      const combinedMutation = `mutation {
        createRikmash(data: {
          publishedAt: "${now.toISOString()}",
          total: ${total},
          name: "${missionBName}",
          kindOf: ${kindOf},
          price: ${price},
          agprice: ${agprice},
          project: "${projectId}",
          hm: ${hm},
          ${openMidFrag}
          spnot: """${spnot.replace(/"""/g, '"')}""",
          maaps: ["${askId}"],
          users_permissions_user: "${applicantId}",
          sp: "${spId}",
          ${sqadualedFrag}
          ${sqadualefFrag}
        }) { data { id } }

        updateMaap(id: "${askId}", data: {
          archived: true,
          vots: [${votsStr}]
        }) { data { id } }

        updateSp(id: "${spId}", data: { panui: false }) { data { id } }
      }`;

      const res = await context.fetch(graphqlUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: combinedMutation }),
      });
      const responseData = await res.json();

      if (responseData.errors) {
        throw new Error(`voteOnMaap consensus mutation failed: ${JSON.stringify(responseData.errors)}`);
      }

      // Consensus archives the Maap and creates a Rikmash — refresh everywhere.
      return {
        data: {
          askId,
          rikmashId: responseData.data?.createRikmash?.data?.id,
          consensus: true,
        },
        updateStrategy: { type: 'fullRefresh' },
      };
    }
  }

  // ── No full YES consensus (or this is a NO vote) — save updated vots ──────
  await strapi.execute('153addVoteToMaap', { id: askId, vots: allVots }, context.jwt, context.fetch);

  // Regular vote: broadcast the single new vote for live count updates everywhere.
  return {
    data: { id: askId, newVote: strapiVote, consensus: false },
    updateStrategy: { type: 'partialUpdate', config: { dataKeys: ['wegets'] } },
  };
};

export const voteOnMaapConfig: ActionConfig = {
  key: 'voteOnMaap',
  description:
    'Vote on a resource application (Maap/weget). YES with full project-member quorum creates Rikmash + archives Maap + marks Sp.panui=false. NO votes are recorded. Server fetches all data from DB — client only sends askId + projectId + what (+ optional why).',
  graphqlOperation: voteOnMaapHandler,

  paramSchema: {
    askId: { type: 'string', required: true, description: 'ID of the Maap record' },
    projectId: { type: 'string', required: true, description: 'Project ID' },
    what: { type: 'boolean', required: true, description: 'true = agree, false = decline' },
    why: { type: 'string', required: false, description: 'Optional decline reason' },
  },

  authRules: [
    { type: 'jwt' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Must be a project member to vote on a resource application',
    },
  ],

  notification: {
    recipients: {
      type: 'projectMembers',
      config: { projectIdParam: 'projectId', excludeSender: false },
    },
    templates: {
      title: { he: 'הצבעה על בקשת משאב', en: 'Resource application vote' },
      body: { he: 'חבר צוות הצביע על בקשת קבלת משאב', en: 'A team member voted on a resource application' },
    },
    channels: ['socket'],
    metadata: { type: 'maapVote', url: 'lev' },
  },

  updateStrategy: { type: 'none' },
};
