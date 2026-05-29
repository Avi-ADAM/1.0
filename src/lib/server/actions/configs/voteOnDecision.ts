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

const voteOnDecisionHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { decisionId, projectId, kind, newpicid, timegramaId } = params;
  const { userId } = context;
  const now = new Date();

  // 1. Fetch Decision with current vots
  const decisionRes = await strapi.execute(
    '159getDecisionForVote',
    { id: decisionId },
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
