/**
 * Action Configuration: Vote on Decision (project-level decision entity)
 *
 * Handles the agree() function in decisionMaking.svelte for non-sheirutpend
 * kinds (currently: 'pic' — logo change vote, future: other project decisions).
 *
 * Server-authoritative: fetches the Decision's current vots from DB, deduplicates
 * any prior vote by the same user, appends the new YES vote, then checks consensus
 * by comparing the set of YES voters against the project's member list.
 *
 * Non-consensus: saves updated vots to Decision only.
 *
 * Consensus (all members voted YES):
 *   - Archives the Decision (archived:true, vots:[...])
 *   - If kind=='pic' and newpicid is provided: updates Project.profilePic
 *   - If timegramaId is provided: marks Timegrama as done
 *   - Returns { consensus: true }
 *
 * Client sends: { decisionId, projectId, kind, newpicid?, timegramaId? }
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { execFromContext } from '$lib/server/archive/exec.js';
import { signObjectChange } from '$lib/server/archive/vote.js';
import { signStipend } from '$lib/server/stipend/vote.js';
import {
  fetchSaleClaim,
  standingOrder,
  standingSaleVersion,
  bothPartiesSigned,
  normalizeVots,
  type SaleClaim
} from './saleClaimShared.js';

/**
 * saleClaim agree() branch (PLAN_sale_holder_consent — phase 2).
 *
 * A saleClaim Decision is bilateral: the only valid voters are the reporter
 * and the claimed holder. A YES vote signs the *standing* round (highest
 * negom round, or round 1 = the original claim). When BOTH parties have signed
 * the same standing round, the version matures onto the Sale:
 *   - values applied (unit/in/dates from the round's negom, or original for r1)
 *   - inventory delta reconciled if the quantity changed
 *   - holderStatus:'confirmed', confirmedBy:'vote'
 *   - Decision archived, timegrama done, both parties notified.
 */
async function handleSaleClaimVote(
  params: Record<string, any>,
  context: any,
  strapi: any,
  notifier: any,
) {
  const { decisionId } = params;
  const now = new Date();
  const userId = String(context.userId);

  const claim: SaleClaim = await fetchSaleClaim(strapi, context, decisionId);
  if (!claim) throw new Error(`saleClaim Decision ${decisionId} not found`);
  if (claim.archived) throw new Error('This sale claim is already resolved');

  // Only the two parties may vote (unlike ordinary rikma-wide decisions).
  if (userId !== claim.holderId && userId !== claim.reporterId) {
    throw new Error('Only the reporter or the claimed holder may vote on a sale claim');
  }

  const order = standingOrder(claim); // the round currently on the table
  const alreadySigned = claim.vots.some(
    (v) => String(v.userId) === userId && Number(v.order) === order && v.what,
  );
  if (alreadySigned) {
    throw new Error('You already agreed to the current version — waiting for the other side');
  }

  // Append this YES vote to the standing round.
  const newVote = {
    what: true,
    users_permissions_user: userId,
    ide: parseInt(userId, 10),
    zman: now.toISOString(),
    order,
  };
  const allVots = [...normalizeVots(claim.vots), newVote];

  if (!bothPartiesSigned(allVots, order, claim.holderId, claim.reporterId)) {
    // Not yet mutual — persist the vote and wait.
    await strapi.execute('121addVoteToDecision', { decisionId, vots: allVots }, context.jwt, context.fetch);
    return {
      data: { id: decisionId, consensus: false, kind: 'saleClaim' },
      updateStrategy: { type: 'partialUpdate', config: { dataKeys: ['decisions'] } },
    };
  }

  // ── MUTUAL CONSENSUS on the standing round → mature the version ───────────
  const version = standingSaleVersion(claim, order);

  // Reconcile inventory if the agreed quantity differs from what was reserved.
  if (version.unit != null && claim.matanotQuant != null && claim.matanotId) {
    const oldUnit = Number(claim.saleUnit ?? 0);
    const newUnit = Number(version.unit);
    if (newUnit !== oldUnit && Number(claim.matanotQuant) !== -1) {
      const adjustedQuant = Number(claim.matanotQuant) + (oldUnit - newUnit);
      try {
        await strapi.execute('updateMatanotQuant', { id: claim.matanotId, quant: adjustedQuant }, context.jwt, context.fetch);
      } catch (err) {
        console.warn('[saleClaim] inventory delta failed:', err);
      }
    }
  }

  // Apply the agreed version + stamp the holder outcome onto the Sale.
  await strapi.execute(
    'applySaleVersion',
    {
      id: claim.saleId,
      in: version.in,
      unit: version.unit,
      date: version.date ?? undefined,
      startDate: version.startDate ?? undefined,
      finishDate: version.finishDate ?? undefined,
      note: version.note ?? undefined,
      holderStatus: 'confirmed',
      confirmedBy: 'vote',
      holderDecidedAt: now.toISOString(),
    },
    context.jwt,
    context.fetch,
  );

  // Archive the Decision and mark the timegrama done.
  await strapi.execute('160archiveDecision', { id: decisionId, vots: allVots }, context.jwt, context.fetch);
  if (claim.timegramaId) {
    await strapi.execute('35updateTimeGrama', { id: String(claim.timegramaId), done: true }, context.jwt, context.fetch);
  }

  // Notify both parties that the sale is confirmed.
  if (notifier) {
    try {
      await notifier.notify(
        {
          recipients: { type: 'specificUsers', config: { userIdsParam: 'recipients' } },
          templates: {
            title: { he: 'המכירה אושרה', en: 'Sale confirmed' },
            body: {
              he: `הדיווח על מחזיק-הכסף אושר בהסכמת שני הצדדים${order > 1 ? ' (בגרסה המעודכנת)' : ''}.`,
              en: `The money-holder report was confirmed by both parties${order > 1 ? ' (updated version)' : ''}.`,
            },
          },
          channels: ['socket', 'push'],
          metadata: { type: 'saleClaimConfirmed', url: 'lev', priority: 'normal' },
        },
        { recipients: [claim.holderId, claim.reporterId], projectId: params.projectId, decisionId },
        { data: { id: decisionId } },
        context,
      );
    } catch (err) {
      console.warn('[saleClaim] confirm notification failed:', err);
    }
  }

  return {
    data: { decisionId, consensus: true, kind: 'saleClaim', confirmedBy: 'vote' },
    updateStrategy: { type: 'fullRefresh' },
  };
}

/**
 * archiveObject / editObject branch (PLAN_OBJECT_ARCHIVAL — phase 2).
 *
 * Consensus is rikma-wide and unanimous, the same bar the object's creation
 * had to clear. What differs from the other kinds is that a vote belongs to a
 * round: signing round 2 says nothing about round 1, and only the standing
 * round can mature.
 */
async function handleObjectChangeVote(
  params: Record<string, any>,
  context: any,
  notifier: any,
) {
  const decisionId = String(params.decisionId);
  const exec = execFromContext(context);
  const outcome = await signObjectChange(exec, decisionId, String(context.userId));

  if (notifier && params.projectId) {
    const applied = outcome.applied;
    const endedFor = applied?.membershipEnded?.userId;
    const recipients = outcome.consensus
      ? undefined // everyone in the rikma sees the result
      : outcome.awaiting;

    notifier
      .notify(
        {
          recipients: outcome.consensus
            ? { type: 'projectMembers', config: { projectIdParam: 'projectId', excludeSender: false } }
            : { type: 'specificUsers', config: { userIdsParam: 'recipients' } },
          templates: {
            title: outcome.consensus
              ? { he: 'ההצעה אושרה', en: 'The proposal was approved' }
              : { he: 'נדרשת תגובתך', en: 'Your response is needed' },
            body: outcome.consensus
              ? {
                  he: endedFor
                    ? 'ההצעה אושרה פה אחד. עם האובייקט הסתיימה גם חברותו של החבר בריקמה.'
                    : 'ההצעה אושרה פה אחד והוחלה.',
                  en: endedFor
                    ? 'Approved unanimously. The member’s membership of the rikma ended along with the object.'
                    : 'Approved unanimously and applied.',
                }
              : {
                  he: 'חבר נוסף חתם על הגרסה העומדת — נותרת תגובתך.',
                  en: 'Another member signed the standing version — yours is still open.',
                },
          },
          channels: ['socket'],
          metadata: { type: 'voteUpdate', url: 'lev' },
        },
        { recipients, projectId: params.projectId },
        { projectId: params.projectId, decisionId },
        context,
      )
      .catch((e: unknown) => console.warn('[voteOnDecision:archive] notification failed:', e));
  }

  return {
    data: {
      decisionId,
      kind: params.kind,
      order: outcome.order,
      consensus: outcome.consensus,
      awaiting: outcome.awaiting,
      applied: outcome.applied ?? null,
    },
    updateStrategy: { type: 'fullRefresh' as const },
  };
}

/**
 * stipendProgram / stipendPledge branch (PLAN_STIPEND §5).
 *
 * Same round-based signing as the archive kinds; what differs is only the set
 * of signers, and that set is derived from the terms, not stored: while the
 * rikma's total value does not move, only the two parties are asked.
 */
async function handleStipendVote(
  params: Record<string, any>,
  context: any,
  notifier: any,
) {
  const decisionId = String(params.decisionId);
  const exec = execFromContext(context);
  const outcome = await signStipend(exec, decisionId, String(context.userId));

  if (notifier && params.projectId) {
    notifier
      .notify(
        {
          recipients: outcome.consensus
            ? { type: 'projectMembers', config: { projectIdParam: 'projectId', excludeSender: false } }
            : { type: 'specificUsers', config: { userIdsParam: 'recipients' } },
          templates: {
            title: outcome.consensus
              ? { he: 'המלגה אושרה', en: 'The stipend was approved' }
              : { he: 'נדרשת תגובתך', en: 'Your response is needed' },
            body: outcome.consensus
              ? {
                  he: 'ההסכמה הושלמה וההתחייבות נכנסה לתוקף. התשלום מחושב מהשעות שאושרו בכל מחזור.',
                  en: 'Everyone signed and the pledge is live. Each cycle is paid from the hours the rikma approved.',
                }
              : {
                  he: 'צד נוסף חתם על הגרסה שעל השולחן — נותרה תגובתך.',
                  en: 'Another party signed the version on the table — yours is still open.',
                },
          },
          channels: ['socket'],
          metadata: { type: 'voteUpdate', url: 'lev' },
        },
        { recipients: outcome.consensus ? undefined : outcome.awaiting, projectId: params.projectId },
        { projectId: params.projectId, decisionId },
        context,
      )
      .catch((e: unknown) => console.warn('[voteOnDecision:stipend] notification failed:', e));
  }

  return {
    data: {
      decisionId,
      kind: params.kind,
      order: outcome.order,
      consensus: outcome.consensus,
      awaiting: outcome.awaiting,
      applied: outcome.applied ?? null,
    },
    updateStrategy: { type: 'fullRefresh' as const },
  };
}

const voteOnDecisionHandler: ActionExecutionHandler = async (params, context, { strapi, notifier }) => {
  const { decisionId, projectId, kind, newpicid, timegramaId } = params;
  const { userId } = context;
  const now = new Date();

  // Bilateral sale-holder consent rides a distinct branch (two parties only).
  if (kind === 'saleClaim') {
    return handleSaleClaimVote(params, context, strapi, notifier);
  }

  // Archive/edit proposals vote per *round*, not once per decision — the
  // question is which version you stand behind, and a counter opens a new one.
  if (kind === 'archiveObject' || kind === 'editObject') {
    return handleObjectChangeVote(params, context, notifier);
  }

  // Stipend proposals vote per round too, and their signer set depends on
  // whether the terms dilute anyone but the two parties.
  if (kind === 'stipendProgram' || kind === 'stipendPledge') {
    return handleStipendVote(params, context, notifier);
  }

  // 1. Fetch Decision with current vots
  const decisionRes = await strapi.execute(
    '159getDecisionForVote',
    { eid: decisionId },
    context.jwt,
    context.fetch,
  );
  const decisionData = decisionRes?.data?.decision?.data;
  if (!decisionData) throw new Error(`Decision ${decisionId} not found`);

  if (decisionData.attributes.archived) {
    throw new Error('Decision is already archived — voting is closed');
  }

  // 2. Fetch project members for consensus check
  const projectRes = await strapi.execute(
    '3projectJSONQue',
    { pid: projectId },
    context.jwt,
    context.fetch,
  );
  const members: any[] = projectRes?.data?.project?.data?.attributes?.user_1s?.data ?? [];
  const totalMembers = members.length;
  const memberIds = members.map((m: any) => String(m.id));

  // 3. Build normalized vots array — strip prior vote by this user (dedup)
  const existingVots: any[] = decisionData.attributes.vots ?? [];
  const filteredVots = existingVots
    .filter((v: any) => {
      const vid = String(v.users_permissions_user?.data?.id ?? v.ide ?? '');
      return vid !== String(userId);
    })
    .map((v: any) => ({
      what: v.what ?? true,
      users_permissions_user: String(v.users_permissions_user?.data?.id ?? v.ide ?? ''),
      ide: v.ide != null ? parseInt(String(v.ide), 10) : parseInt(String(userId), 10),
      zman: v.zman ?? now.toISOString(),
      order: v.order ?? 0,
    }));

  // 4. Append this user's YES vote
  const newVote = {
    what: true,
    users_permissions_user: String(userId),
    ide: parseInt(String(userId), 10),
    zman: now.toISOString(),
    order: 0,
  };
  const allVots = [...filteredVots, newVote];

  // 5. Consensus check: all project members have a YES vote in allVots
  const yesVoterIds = new Set(
    allVots
      .filter((v) => v.what === true)
      .map((v) => String(v.users_permissions_user)),
  );
  const allMembersVoted =
    totalMembers > 0 && memberIds.every((mid) => yesVoterIds.has(mid));

  if (allMembersVoted) {
    // ── CONSENSUS ────────────────────────────────────────────────────────────
    // Archive the Decision with full vots
    await strapi.execute(
      '160archiveDecision',
      { id: decisionId, vots: allVots },
      context.jwt,
      context.fetch,
    );

    const da = decisionData.attributes;

    // Apply the approved change based on kind
    if (kind === 'pic') {
      const picId = newpicid ?? da.newpic?.data?.id;
      if (picId) {
        await strapi.execute(
          '43updateProfilePic',
          { projectId, imageId: String(picId) },
          context.jwt,
          context.fetch,
        );
      }
    } else if (kind === 'name' && da.newname) {
      await strapi.execute(
        'updateProjectDetails',
        { id: projectId, projectName: da.newname },
        context.jwt,
        context.fetch,
      );
    } else if (kind === 'pubdes') {
      await strapi.execute(
        'updateProjectDetails',
        { id: projectId, publicDescription: da.newpubdes ?? '' },
        context.jwt,
        context.fetch,
      );
    } else if (kind === 'prides') {
      await strapi.execute(
        'updateProjectDetails',
        { id: projectId, descripFor: da.newprides ?? '' },
        context.jwt,
        context.fetch,
      );
    } else if (kind === 'newFlink') {
      await strapi.execute(
        'updateProjectDetails',
        { id: projectId, fblink: da.newFlink ?? '' },
        context.jwt,
        context.fetch,
      );
    } else if (kind === 'newWlink') {
      await strapi.execute(
        'updateProjectDetails',
        { id: projectId, linkToWebsite: da.newWlink ?? '' },
        context.jwt,
        context.fetch,
      );
    } else if (kind === 'timtoM' && da.timtoM) {
      await strapi.execute(
        'updateProjectDetails',
        { id: projectId, restime: da.timtoM },
        context.jwt,
        context.fetch,
      );
    } else if (kind === 'vallueadd' || kind === 'vallueles') {
      // Fetch current project vallue IDs
      const projRes2 = await strapi.execute(
        'getProjectBaseInfo',
        { pid: projectId },
        context.jwt,
        context.fetch,
      );
      const currentVallues: any[] =
        projRes2?.data?.project?.data?.attributes?.vallues?.data ?? [];
      const currentIds: string[] = currentVallues.map((v: any) => String(v.id));

      let newVallueIds: string[];
      if (kind === 'vallueadd') {
        const toAdd: string[] = (da.valluesadd?.data ?? []).map((v: any) => String(v.id));
        newVallueIds = Array.from(new Set([...currentIds, ...toAdd]));
      } else {
        const toRemove = new Set(
          (da.valluesles?.data ?? []).map((v: any) => String(v.id)),
        );
        newVallueIds = currentIds.filter((id) => !toRemove.has(id));
      }

      await strapi.execute(
        'updateProjectDetails',
        { id: projectId, vallues: newVallueIds },
        context.jwt,
        context.fetch,
      );
    }

    // Mark timegrama as done
    const tgId = timegramaId ?? da.timegrama?.data?.id;
    if (tgId) {
      await strapi.execute(
        '35updateTimeGrama',
        { id: String(tgId), done: true },
        context.jwt,
        context.fetch,
      );
    }

    // Consensus archives the Decision and applies the project change — refresh everywhere.
    return {
      data: { decisionId, consensus: true, kind },
      updateStrategy: { type: 'fullRefresh' },
    };
  } else {
    // ── NON-CONSENSUS: save updated vots ─────────────────────────────────────
    await strapi.execute(
      '121addVoteToDecision',
      { decisionId, vots: allVots },
      context.jwt,
      context.fetch,
    );

    // Vote in Strapi-nested shape so the decisions store can append it and
    // processDecisions() recomputes the live counts for every member + device.
    const strapiVote = {
      what: true,
      users_permissions_user: { data: { id: String(userId) } },
      ide: parseInt(String(userId), 10),
      zman: now.toISOString(),
      order: 0,
    };

    return {
      data: { id: decisionId, newVote: strapiVote, consensus: false, kind },
      updateStrategy: { type: 'partialUpdate', config: { dataKeys: ['decisions'] } },
    };
  }
};

export const voteOnDecisionConfig: ActionConfig = {
  key: 'voteOnDecision',
  description:
    'Vote YES on a project Decision entity. Server-authoritative: fetches current vots from DB, deduplicates, checks member consensus. On consensus: archives Decision, updates Project.profilePic (kind=pic), marks Timegrama done.',
  graphqlOperation: voteOnDecisionHandler,

  paramSchema: {
    decisionId: { type: 'string', required: true, description: 'Decision entity ID' },
    projectId: { type: 'string', required: true, description: 'Project ID (for auth + member list)' },
    kind: {
      type: 'string',
      required: true,
      description: 'Decision kind: "pic" (logo change) or other future kinds',
    },
    newpicid: {
      type: 'string',
      required: false,
      description: 'Upload file ID of the new project picture (required when kind="pic")',
    },
    timegramaId: {
      type: 'string',
      required: false,
      description: 'Timegrama ID to mark done on consensus',
    },
  },

  authRules: [
    { type: 'jwt' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Must be a project member to vote on a decision',
    },
  ],

  notification: {
    recipients: {
      type: 'projectMembers',
      config: { projectIdParam: 'projectId', excludeSender: false },
    },
    templates: {
      title: { he: 'הצבעה על החלטת פרויקט', en: 'Project decision vote' },
      body: { he: 'חבר הצביע על שינוי בפרויקט', en: 'A member voted on a project change' },
    },
    channels: ['socket'],
    metadata: { type: 'decisionVote', url: 'lev' },
  },

  updateStrategy: { type: 'none' },
};
