/**
 * Action Configuration: Add Vote
 * 
 * Action כללי להוספת הצבעה לסוגים שונים של פריטים
 * תומך ב-pend (users component) ו-sheirutpend (vots component)
 */

import type { ActionConfig, ActionExecutionHandler } from '../types';
import { createSheirutFromPendingConfig } from './createSheirutFromPending';
import { ensureCandidacyTimegrama } from '../../nego/timegrama';

/**
 * Custom handler לבניית קומפוננטות ועדכון
 */
const addVoteHandler: ActionExecutionHandler = async (params, context, util) => {
  const { type, id, projectId, order } = params;
  const { userId } = context;
  const { strapi } = util;

  // Validation
  if (!type || !['pend', 'sheirutpend', 'ask', 'decision', 'weFinnish', 'tosplit'].includes(type)) {
    throw new Error('Invalid type. Must be "pend", "sheirutpend", "ask", "decision", "weFinnish", or "tosplit"');
  }

  if (!id || !projectId) {
    throw new Error('Missing required parameters: id and projectId');
  }

  const voteOrder = order || 0;

  // --- Logic for Ask (Component Based, 3+ members simple vote) ---
  if (type === 'ask') {
    const { existingComponentData } = params;

    const now = new Date();
    const newVote = {
      what: true,
      users_permissions_user: userId,
      ide: parseInt(String(userId), 10),
      zman: now.toISOString()
    };

    const existingVots = Array.isArray(existingComponentData)
      ? existingComponentData.map((v: any) => {
          const raw = {
            what: v.what ?? v.attributes?.what,
            users_permissions_user:
              v.users_permissions_user?.data?.id ??
              v.users_permissions_user?.id ??
              v.users_permissions_user,
            ide: v.ide ?? v.attributes?.ide,
            zman: v.zman ?? v.attributes?.zman,
            order: v.order ?? v.attributes?.order ?? 0
          };
          if (raw.ide !== undefined && raw.ide !== null) {
            raw.ide = parseInt(String(raw.ide), 10);
          }
          return raw;
        })
      : [];

    const allVots = [...existingVots, newVote];

    const result = await strapi.execute('120addVoteToAsk', { askId: id, vots: allVots }, context.jwt, context.fetch);

    if (!result || result.errors) {
      throw new Error(`AddVoteToAsk failed: ${JSON.stringify(result?.errors || 'Unknown error')}`);
    }

    // A rikma member has now engaged with this candidacy → start the auto-approval
    // clock if it isn't already running (external-candidate timegrama is deferred
    // to here; Path A/B1). No-op-safe; never blocks the vote.
    await ensureCandidacyTimegrama(strapi, context, { side: 'ask', id });

    const strapiVote = {
      what: true,
      users_permissions_user: { data: { id: String(userId) } },
      ide: parseInt(String(userId), 10),
      zman: now.toISOString(),
      order: 0
    };

    return {
      data: { id, newVote: strapiVote },
      updateStrategy: {
        type: 'partialUpdate',
        config: {
          dataKeys: ['asked'],
          updateFunction: 'appendVote'
        }
      }
    };
  }

  // --- Logic for Decision (Component Based, project config vote) ---
  if (type === 'decision') {
    const { existingComponentData } = params;

    const now = new Date();
    const newVote = {
      what: true,
      users_permissions_user: userId,
      ide: parseInt(String(userId), 10),
      zman: now.toISOString(),
      order: 0
    };

    const existingVots = Array.isArray(existingComponentData)
      ? existingComponentData.map((v: any) => {
          const raw = {
            what: v.what ?? v.attributes?.what,
            users_permissions_user:
              v.users_permissions_user?.data?.id ??
              v.users_permissions_user?.id ??
              v.users_permissions_user,
            ide: v.ide ?? v.attributes?.ide,
            zman: v.zman ?? v.attributes?.zman,
            order: v.order ?? v.attributes?.order ?? 0
          };
          if (raw.ide !== undefined && raw.ide !== null) {
            raw.ide = parseInt(String(raw.ide), 10);
          }
          return raw;
        })
      : [];

    const allVots = [...existingVots, newVote];

    const result = await strapi.execute('121addVoteToDecision', { decisionId: id, vots: allVots }, context.jwt, context.fetch);

    if (!result || result.errors) {
      throw new Error(`AddVoteToDecision failed: ${JSON.stringify(result?.errors || 'Unknown error')}`);
    }

    // Return new vote in Strapi nested format so socket handler can append to store
    const strapiVote = {
      what: true,
      users_permissions_user: { data: { id: String(userId) } },
      ide: parseInt(String(userId), 10),
      zman: now.toISOString(),
      order: 0
    };

    return {
      data: { id, newVote: strapiVote },
      updateStrategy: {
        type: 'partialUpdate',
        config: {
          dataKeys: ['decisions'],
          updateFunction: 'appendVote'
        }
      }
    };
  }

  // --- Logic for SheirutPend (Relation Based) ---
  if (type === 'sheirutpend') {
    // 1. Fetch current sheirutpend to get votes and calculate order from DB (more reliable than params)
    const sheirutpendRes = await strapi.execute('72getSheirutpendById', { id }, context.jwt, context.fetch);
    const sheirutpendData = sheirutpendRes?.data?.sheirutpend?.data?.attributes;

    if (!sheirutpendData) {
      throw new Error(`Sheirutpend ${id} not found`);
    }

    const currentVots = sheirutpendData.votes?.data || [];

    // Calculate max order from existing votes in DB
    const maxOrder = currentVots.reduce((max: number, v: any) => {
      const vOrder = v.attributes.order !== undefined && v.attributes.order !== null ? Number(v.attributes.order) : 0;
      return Math.max(max, vOrder);
    }, 0);

    // If order was passed in params, use it. Otherwise use the current max order.
    const finalVoteOrder = order !== undefined ? Number(order) : maxOrder;

    // 2. Create Vote via Mutation
    const createVariables = {
      sheirutpend: id,
      user: userId,
      what: true,
      order: finalVoteOrder,
      why: ''
    };

    try {
      await strapi.execute('86addVoteToSheirutpend_v2', createVariables, context.jwt, context.fetch);
    } catch (error: any) {
      console.error('[AddVote Action] Strapi Mutation Failed:', JSON.stringify(error, null, 2));
      throw new Error(`Strapi Mutation Failed: ${error.message || 'Unknown error'}`);
    }

    // 3. Consensus Logic Check
    // Fetch Project Members to get count
    const projectRes = await strapi.execute('3projectJSONQue', { pid: projectId }, context.jwt, context.fetch);
    const members = projectRes?.data?.project?.data?.attributes?.user_1s?.data || [];
    const totalMembers = members.length;

    // Add our new vote temporarily for calculation (since DB might not be refreshed yet in local state)
    const newVoteObj = {
      attributes: {
        order: finalVoteOrder,
        what: true,
        users_permissions_user: { data: { id: String(userId) } }
      }
    };

    // Combine previous votes with our new vote
    const otherVotes = currentVots.filter((v: any) => {
      const vUserId = v.users_permissions_user?.data?.id || v.users_permissions_user?.id || v.ide;
      return String(vUserId) !== String(userId);
    });
    const allVotes = [...otherVotes, newVoteObj];

    // Filter by the order we just voted on
    const votesAtOrder = allVotes.filter((v: any) => {
      const vOrder = v.attributes.order !== undefined && v.attributes.order !== null ? Number(v.attributes.order) : 0;
      return vOrder === finalVoteOrder;
    });

    // Count Positive Project Member Votes
    const memberIds = members.map((m: any) => String(m.id));
    const positiveMemberVotes = votesAtOrder.filter((v: any) => {
      const isPositive = v.attributes.what === true || v.attributes.what === 'true' || v.attributes.what === 1;
      const voterId = String(v.attributes.users_permissions_user?.data?.id || v.attributes.users_permissions_user?.id || v.attributes.ide);
      return isPositive && memberIds.includes(voterId);
    });

    console.log(`[Consensus Check] Project: ${projectId}, SheirutPend: ${id}, Order: ${finalVoteOrder}`);
    console.log(`[Consensus Check] Members: ${memberIds.join(', ')}`);
    console.log(`[Consensus Check] Positive Member Votes: ${positiveMemberVotes.length} / ${totalMembers}`);

    // Check Full Consensus
    if (positiveMemberVotes.length >= totalMembers && totalMembers > 0) {
      console.log(`[Consensus] Full consensus reached for sheirutpend ${id} at order ${finalVoteOrder}`);

      try {
        const handler = createSheirutFromPendingConfig.graphqlOperation as ActionExecutionHandler;
        const clientId = sheirutpendData.users_permissions_user?.data?.id;

        // Calculate all recipients: Project Members + Client
        const recipientIds = Array.from(new Set([...memberIds, String(clientId)])).filter(Boolean);

        console.log('[Consensus] Triggering createSheirutFromPending...');
        return await handler({
          sheirutpendId: id,
          projectId: projectId,
          clientId: clientId,
          recipientIds: recipientIds
        }, context, util);

      } catch (err) {
        console.error('[Consensus] Auto-creation failed:', err);
        // Continue to return vote success
      }
    }

    return {
      data: { id, vots: allVotes, success: true, message: 'Vote recorded' },
      updateStrategy: {
        type: 'partialUpdate',
        config: {
          dataKeys: ['sheirutpends'], // Client should refresh this list
          updateFunction: 'refreshVotes'
        }
      }
    };
  }

  // --- Logic for weFinnish (Relation Based - Sheirut delivery confirmation) ---
  if (type === 'weFinnish') {
    const result = await strapi.execute(
      '122addWeFinnishVote',
      { sheirut: id, user: userId },
      context.jwt,
      context.fetch
    );

    if (!result || result.errors) {
      throw new Error(`CreateWeFinnishVote failed: ${JSON.stringify(result?.errors || 'Unknown error')}`);
    }

    const newVoteId = result.data?.createVote?.data?.id;

    return {
      data: {
        id,
        newVoteId,
        userId,
        success: true
      },
      updateStrategy: {
        type: 'partialUpdate',
        config: {
          dataKeys: ['sheiruts'],
          updateFunction: 'refreshVotes'
        }
      }
    };
  }

  // --- Logic for Tosplit (Component Based - partial vote, not yet allVoted) ---
  // Supports both positive (default) and negative (decline) votes:
  // pass `what: false` + `why: "..."` to record a decline.
  if (type === 'tosplit') {
    const { existingComponentData, what, why } = params;
    const newWhat = typeof what === 'boolean' ? what : true;
    const newWhy = typeof why === 'string' ? why : '';

    const existingVots = Array.isArray(existingComponentData)
      ? existingComponentData.map((v: any) => {
          const mapped: any = {
            what: v.what ?? v.attributes?.what ?? true,
            users_permissions_user:
              v.users_permissions_user?.data?.id ??
              v.users_permissions_user?.id ??
              v.users_permissions_user,
          };
          const existingWhy = v.why ?? v.attributes?.why;
          if (typeof existingWhy === 'string' && existingWhy.length > 0) {
            mapped.why = existingWhy;
          }
          return mapped;
        })
      : [];

    const newVote: any = { what: newWhat, users_permissions_user: userId };
    if (newWhy.length > 0) newVote.why = newWhy;
    const allVots = [...existingVots, newVote];

    const result = await strapi.execute(
      '124addVoteToTosplit',
      { id, vots: allVots },
      context.jwt,
      context.fetch
    );

    if (!result || result.errors) {
      throw new Error(`AddVoteToTosplit failed: ${JSON.stringify(result?.errors || 'Unknown error')}`);
    }

    return {
      data: { id, success: true, what: newWhat },
      updateStrategy: { type: 'none' }
    };
  }

  // --- Logic for Pend (Component Based - Legacy) ---

  // בניית קומפוננטה חדשה של הצבעה
  const now = new Date();
  const newVote: any = {
    what: true, // approve
    users_permissions_user: userId,
    order: voteOrder,
    ide: userId,
    zman: now.toISOString()
  };

  // בניית מערך קומפוננטות מעודכן
  const existingComponents = Array.isArray(existingComponentData)
    ? existingComponentData.map((comp: any) => {
      if (comp.data && comp.data.attributes) {
        return {
          what: comp.data.attributes.what ?? comp.what,
          users_permissions_user: comp.data.attributes.users_permissions_user?.data?.id ?? comp.users_permissions_user?.data?.id ?? comp.users_permissions_user,
          order: comp.data.attributes.order ?? comp.order ?? 0,
          ide: comp.data.attributes.ide ?? comp.ide,
          zman: comp.data.attributes.zman ?? comp.zman
        };
      }
      if (comp.users_permissions_user?.data?.id) {
        return {
          ...comp,
          users_permissions_user: comp.users_permissions_user.data.id
        };
      }
      return comp;
    })
    : [];

  const updatedComponents = [...existingComponents, newVote];

  const qid = '85addVoteToPend';
  const variableName = 'users';

  const variables: any = {
    id: id,
    [variableName]: updatedComponents
  };

  const result = await strapi.execute(qid, variables, context.jwt, context.fetch);

  if (!result || result.errors) {
    throw new Error(`GraphQL mutation failed: ${JSON.stringify(result?.errors || 'Unknown error')}`);
  }

  return {
    data: result.data || result,
    updateStrategy: {
      type: 'partialUpdate',
      config: {
        dataKeys: ['sheirutpends'],
        updateFunction: 'refreshVotes'
      }
    }
  };
};

export const addVoteConfig: ActionConfig = {
  key: 'addVote',
  description: 'Add a vote to a pend or sheirutpend item',
  graphqlOperation: addVoteHandler,

  paramSchema: {
    type: {
      type: 'string',
      required: true,
      validate: (value) => ['pend', 'sheirutpend', 'ask', 'decision', 'weFinnish', 'tosplit'].includes(value),
      description: 'Type of item: "pend", "sheirutpend", "ask", "decision", "weFinnish", or "tosplit"'
    },
    id: {
      type: 'string',
      required: true,
      description: 'ID of the item to vote on'
    },
    projectId: {
      type: 'string',
      required: true,
      description: 'ID of the project'
    },
    existingComponentData: {
      type: 'array',
      required: false,
      description: 'Existing component data (users for pend)'
    },
    order: {
      type: 'number',
      required: false,
      description: 'Order number for the vote (defaults to 0)'
    },
    what: {
      type: 'boolean',
      required: false,
      description: 'Vote value: true (approve, default) or false (decline). Currently supported by type=tosplit.'
    },
    why: {
      type: 'string',
      required: false,
      description: 'Optional reason text for the vote (used with what=false). Currently supported by type=tosplit.'
    }
  },

  authRules: [
    {
      type: 'jwt',
      errorMessage: 'Must be authenticated to vote'
    },
    {
      type: 'projectMember',
      config: {
        projectIdParam: 'projectId'
      },
      errorMessage: 'Must be a project member to vote'
    }
  ],

  notification: {
    recipients: {
      type: 'projectMembers',
      config: {
        projectIdParam: 'projectId',
        excludeSender: false
      }
    },
    templates: {
      title: {
        he: 'הצבעה חדשה',
        en: 'New vote',
        ar: 'تصويت جديد'
      },
      body: {
        he: 'משתמש הצביע על פריט בפרויקט',
        en: 'A user voted on an item in the project',
        ar: 'صوت مستخدم على عنصر في المشروع'
      }
    },
    channels: ['socket'],
    metadata: {
      type: 'voteUpdate',
      url: 'lev'
    }
  },

  // updateStrategy מוגדר דינמית ב-handler בהתבסס על type

  // Phase 1 shadow signing (PLAN_action_migration_vs_p2p §6.3, Phase 1 of
  // PLAN_user_sovereign_consent). Only the tosplit branch ratifies a group
  // decision today — pendm/pmash already track their own consensus separately
  // and will get their own consentSpec as they migrate to weighted-unanimous.
  consentSpec: {
    action: (params: Record<string, unknown>) => {
      const type = params.type as string | undefined;
      if (type === 'tosplit')     return 'tosplit.vote';
      if (type === 'pend')        return 'pendm.vote';
      if (type === 'sheirutpend') return 'sheirutpend.vote';
      if (type === 'ask')         return 'ask.vote';
      if (type === 'decision')    return 'decision.vote';
      if (type === 'weFinnish')   return 'mission.approve.vote';
      return null;
    },
    subjectType: (params: Record<string, unknown>) => String(params.type ?? 'unknown'),
    subjectIdParam: 'id',
    requireConsensus: true,
    restimeFrom: 'project',
    predicateFromParams: (params) => ({
      what: params.what ?? true,
      why: params.why,
      order: params.order ?? 0
    })
  }
};
