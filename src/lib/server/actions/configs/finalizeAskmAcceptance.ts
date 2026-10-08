/**
 * Action Configuration: Approve a resource-share request (Askm)
 *
 * The server decides — from the askm as the DB holds it — whether this yes
 * completes the rikma's agreement, never the card. `variant` is still accepted
 * and means only "the card thinks so" (`'partial'` = it does not):
 *
 *   - the yes is merged over the DB's vots at the standing round
 *     (nego/candidacyVote.ts) — the card's `existingVotes` is not written back,
 *     because it dropped every vote cast since it loaded and every row's `order`;
 *   - materialization needs the candidate's yes to the standing round, every
 *     paying customer's (QA C-19), and every other member's — `allVoted` used to
 *     be the card's arithmetic (`noofpu === noofusersOk`), taken on trust;
 *   - short of that the yes is recorded and the restime clock runs, so silence
 *     still completes it (api/timegrama/askm);
 *   - the other members' askm cards re-read their slice through the socket
 *     (`refetchScope`), so nobody signs a stale copy of these terms.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import {
  runResourceAskmAcceptance,
  activateRecurringEngine,
} from '../helpers/runResourceAskmAcceptance.js';
import { ensureCandidacyTimegrama } from '../../nego/timegrama.js';
import { evaluateCandidacyVote, assertStandingRound } from '../../nego/candidacyVote.js';
import { loadCandidacyDeal } from '$lib/server/deal/offerDeal.js';
import { ActionError } from '../errors.js';

const finalizeAskmAcceptanceHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const {
    variant,           // 'solo' | 'allVoted' | 'partial' — the card's guess, see above
    openMashaabimId,
    isSelfProposal = false,
    askmId,
    projectId,
    spId,
    missionName,
    acceptedUserId,
    existingMemberIds: clientMemberIds = [],
    expectRound,
  } = params;

  const now = new Date();
  const run = (qid: string, vars: Record<string, unknown>) =>
    strapi.execute(qid, vars, context.jwt, context.fetch);

  const read: any = await run('getAskmForFinalize', { id: String(askmId) });
  const attrs = read?.data?.askm?.data?.attributes;
  if (!attrs) throw new Error(`Askm ${askmId} could not be loaded - acceptance aborted`);
  if (attrs.archived === true) {
    throw new ActionError('ALREADY_RESOLVED', `Askm ${askmId} was already resolved`);
  }
  const askmProject = attrs.project?.data?.id;
  if (askmProject != null && String(askmProject) !== String(projectId)) {
    throw new ActionError('FORBIDDEN', `Askm ${askmId} does not belong to project ${projectId}`);
  }

  // A gap of a customer's deal (QA C-19): she pays for whatever this ends on, so
  // she signs it too. A read error throws — it must not pass for "nobody pays".
  const offerDeal = await loadCandidacyDeal(run, 'askm', String(askmId));
  const vote = evaluateCandidacyVote({
    attrs,
    side: 'askm',
    callerId: context.userId,
    clientIds: offerDeal?.clientIds ?? [],
    now,
  });
  assertStandingRound(expectRound, vote.L);

  if (acceptedUserId != null && vote.takerId && String(acceptedUserId) !== vote.takerId) {
    throw new Error(`acceptedUserId ${acceptedUserId} is not the candidate of askm ${askmId}`);
  }

  const refetch = {
    type: 'refetchScope' as const,
    config: { dataKeys: ['askedResources'], projectId: String(projectId) },
  };

  // What materializing needs, from the DB first. A `partial` call from the card
  // carries none of it, and the card's copy may be stale anyway.
  const omId = attrs.open_mashaabim?.data?.id ? String(attrs.open_mashaabim.data.id) : null;
  const selfProposal = !omId && isSelfProposal === true;
  const canMaterialize = !!omId || selfProposal;

  const ready = vote.gate.takerYes && vote.gate.clientYes && vote.allMembersYes;
  if (!ready || !canMaterialize) {
    await run('133addVoteToAskm', { id: askmId, vots: vote.vots });
    await ensureCandidacyTimegrama(strapi, context, { side: 'askm', id: String(askmId) });
    return {
      data: {
        askmId,
        materialized: false,
        pending: !vote.gate.takerYes
          ? 'candidateConsent'
          : !vote.gate.clientYes
            ? 'clientConsent'
            : !vote.allMembersYes
              ? 'members'
              : null,
        membersPending: vote.membersPending,
        ordern: vote.L,
        variant,
      },
      updateStrategy: refetch,
    };
  }

  const takerId = vote.takerId || String(acceptedUserId ?? '');
  const memberIds = vote.memberIds.length ? vote.memberIds : (clientMemberIds as unknown[]).map(String);

  if (omId) {
    await runResourceAskmAcceptance(strapi, context, {
      askmId: String(askmId),
      openMashaabimId: omId,
      projectId: String(projectId),
      spId: String(attrs.sp?.data?.id ?? spId ?? ''),
      missionName: String(missionName || attrs.open_mashaabim?.data?.attributes?.name || ''),
      acceptedUserId: takerId,
      existingMemberIds: memberIds,
      existingVotes: vote.vots,
    });
  } else {
    // isSelfProposal + pmash — OM/Maap path differs; keep inline until migrated
    const maapRes: any = await run('141createMaap', {
      data: {
        project: projectId,
        name: missionName,
        sp: attrs.sp?.data?.id ?? spId,
        publishedAt: now.toISOString(),
      },
    });

    // Recurring expense? Activate the draft engine and make this Maap cycle #1.
    await activateRecurringEngine(strapi, context, {
      projectId: String(projectId),
      resourceName: String(missionName ?? ''),
      acceptedUserId: takerId,
      maapId: maapRes?.data?.createMaap?.data?.id,
    });

    await run('132archiveAskmWithVotes', { id: askmId, vots: vote.vots });
  }

  return {
    data: { askmId, openMashaabimId: omId, materialized: true },
    updateStrategy: refetch,
  };
};

export const finalizeAskmAcceptanceConfig: ActionConfig = {
  key: 'finalizeAskmAcceptance',
  description: 'Approve a resource-share request (Askm): creates Maap, archives OpenMashaabim + Askm, optionally onboards new member. The server decides from the DB whether every member, the offerer and any paying customer agreed; otherwise it records the vote at the standing round.',
  graphqlOperation: finalizeAskmAcceptanceHandler,

  paramSchema: {
    variant: { type: 'string', required: true },
    openMashaabimId: { type: 'string', required: false },
    isSelfProposal: { type: 'boolean', required: false },
    pmashId: { type: 'string', required: false },
    askmId: { type: 'string', required: true },
    projectId: { type: 'string', required: true },
    spId: { type: 'string', required: false },
    missionName: { type: 'string', required: false },
    acceptedUserId: { type: 'string', required: false },
    existingMemberIds: { type: 'array', required: false },
    existingVotes: { type: 'array', required: false },
    isFirstVote: { type: 'boolean', required: false },
    // The round the caller was shown; ROUND_MOVED when it is no longer the standing one.
    expectRound: { type: 'number', required: false },
  },

  authRules: [
    { type: 'jwt' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Must be a project member to accept a resource request'
    }
  ],

  notification: {
    recipients: { type: 'projectMembers', config: { projectIdParam: 'projectId' } },
    templates: {
      title: { he: 'בקשת משאב אושרה', en: 'Resource request approved' },
      body: { he: 'בקשת שיתוף משאב אושרה', en: 'A resource sharing request was approved' },
    },
    channels: ['socket'],
    metadata: { type: 'askmAccepted', url: 'lev' },
  },

  updateStrategy: { type: 'none' },
};
