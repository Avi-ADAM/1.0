/**
 * Action Configuration: Approve a resource-share request (Askm)
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import {
  runResourceAskmAcceptance,
  activateRecurringEngine,
} from '../helpers/runResourceAskmAcceptance.js';
import { ensureCandidacyTimegrama } from '../../nego/timegrama.js';
import { computeNegoGate, normId } from '../../nego/negoGate.js';

/**
 * Does this Askm still owe the offerer's yes on the standing round?
 *
 * Returns null when it may be materialized (the ordinary case: a bare
 * application, or a round the candidate authored/signed), and otherwise the
 * vote array to persist instead — the approver's yes at the standing round,
 * merged over the DB's own rows rather than the client's.
 *
 * Read failures return null: an unreachable Askm must not block an approval
 * that was legitimate before this check existed.
 */
async function awaitingCandidateConsent(
  strapi: { execute: (q: string, v: Record<string, unknown>, jwt?: string, f?: typeof globalThis.fetch) => Promise<any> },
  context: { userId: string | number; jwt?: string; fetch?: typeof globalThis.fetch },
  askmId: string
): Promise<{ L: number; vots: Array<Record<string, unknown>> } | null> {
  let attrs: any = null;
  try {
    const res: any = await strapi.execute('getAskmForFinalize', { id: askmId }, context.jwt, context.fetch);
    attrs = res?.data?.askm?.data?.attributes ?? null;
  } catch (e) {
    console.warn('[finalizeAskmAcceptance] consent check could not read the askm:', e);
    return null;
  }
  if (!attrs) return null;

  const rounds = (attrs.nego_mashes?.data ?? []).map((r: any) => ({
    ordern: r?.attributes?.ordern,
    proposedBy: r?.attributes?.proposedBy,
  }));
  const L = rounds.reduce((max: number, r: any) => Math.max(max, Number(r?.ordern ?? 0)), 0);
  const dbVots = (attrs.vots ?? [])
    .map((v: any) => ({
      what: v?.what !== false,
      order: Number(v?.order ?? 0),
      users_permissions_user: normId(v?.users_permissions_user),
    }))
    .filter((v: any) => v.users_permissions_user !== '');

  const caller = String(context.userId);
  const merged = [
    ...dbVots.filter((v: any) => !(v.users_permissions_user === caller && v.order === L)),
    { what: true, order: L, users_permissions_user: caller },
  ];

  const gate = computeNegoGate({
    rounds,
    vots: merged,
    takerId: normId(attrs.users_permissions_user),
    memberIds: (attrs.project?.data?.attributes?.user_1s?.data ?? []).map((m: any) => String(m.id)),
  });
  if (gate.takerYes) return null;

  return {
    L,
    vots: merged.map((v: any) => ({
      what: v.what,
      order: v.order,
      users_permissions_user: v.users_permissions_user,
      ide: Number.isNaN(parseInt(v.users_permissions_user, 10))
        ? null
        : parseInt(v.users_permissions_user, 10),
    })),
  };
}

const finalizeAskmAcceptanceHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const {
    variant,           // 'solo' | 'allVoted' | 'partial'
    openMashaabimId,
    isSelfProposal = false,
    pmashId,           // present when isSelfProposal=true; Askm has pmash relation instead of open_mashaabim
    askmId,
    projectId,
    spId,
    missionName,
    acceptedUserId,
    existingMemberIds = [],
    existingVotes = [],
    isFirstVote = false,
  } = params;

  const now = new Date();

  if (variant === 'partial') {
    const existingVots = (existingVotes as any[]).map((v: any) => ({
      what: v.what ?? true,
      users_permissions_user:
        v.users_permissions_user?.data?.id ?? v.users_permissions_user?.id ?? v.users_permissions_user,
    }));
    const allVots = [...existingVots, { what: true, users_permissions_user: context.userId }];

    await strapi.execute('133addVoteToAskm', { id: askmId, vots: allVots }, context.jwt, context.fetch);

    // A rikma member has engaged → ensure the auto-approval clock is running
    // (deferred from the external candidate's proposal; also recreates one that a
    // candidate-counter cancelled). isFirstVote retained for back-compat callers.
    void isFirstVote;
    await ensureCandidacyTimegrama(strapi, context, { side: 'askm', id: String(askmId) });

    return { data: { askmId }, updateStrategy: { type: 'none' } };
  }

  // Bilateral gate — the resource-side twin of `evaluateAskAcceptance`, and of
  // what askm.svelte already enforces when the clock runs out. Nothing is
  // registered under the offerer's name while a project-side round is standing
  // unanswered: a counter, or the round an `editObject` sends to pending
  // candidacies when the rikma changes the terms they offered against
  // (src/lib/server/archive/pendingOffers.ts). Without this the silence path is
  // protected and a member pressing approve is not.
  const pending = await awaitingCandidateConsent(strapi, context, String(askmId));
  if (pending) {
    await strapi.execute(
      '133addVoteToAskm',
      { id: askmId, vots: pending.vots },
      context.jwt,
      context.fetch
    );
    await ensureCandidacyTimegrama(strapi, context, { side: 'askm', id: String(askmId) });
    return {
      data: { askmId, materialized: false, pending: 'candidateConsent', ordern: pending.L },
      updateStrategy: { type: 'none' },
    };
  }

  const canSkipOm = isSelfProposal === true;
  if (!canSkipOm && !openMashaabimId) {
    throw new Error('openMashaabimId is required for non-self-proposal Askm acceptance');
  }

  if (!canSkipOm) {
    await runResourceAskmAcceptance(strapi, context, {
      askmId: String(askmId),
      openMashaabimId: String(openMashaabimId),
      projectId: String(projectId),
      spId: String(spId),
      missionName: String(missionName ?? ''),
      acceptedUserId: String(acceptedUserId),
      existingMemberIds: (existingMemberIds as string[]).map(String),
      existingVotes: existingVotes as unknown[],
    });
  } else {
    // isSelfProposal + pmash — OM/Maap path differs; keep inline until migrated
    const maapRes: any = await strapi.execute(
      '141createMaap',
      {
        data: {
          project: projectId,
          name: missionName,
          sp: spId,
          publishedAt: now.toISOString(),
        },
      },
      context.jwt,
      context.fetch
    );

    // Recurring expense? Activate the draft engine and make this Maap cycle #1.
    await activateRecurringEngine(strapi, context, {
      projectId: String(projectId),
      resourceName: String(missionName ?? ''),
      acceptedUserId: String(acceptedUserId),
      maapId: maapRes?.data?.createMaap?.data?.id,
    });

    const existingVots = (existingVotes as any[]).map((v: any) => ({
      what: v.what ?? true,
      users_permissions_user:
        v.users_permissions_user?.data?.id ?? v.users_permissions_user?.id ?? v.users_permissions_user,
    }));
    const allVots = [...existingVots, { what: true, users_permissions_user: context.userId }];
    await strapi.execute('132archiveAskmWithVotes', { id: askmId, vots: allVots }, context.jwt, context.fetch);
  }

  return {
    data: { askmId, openMashaabimId },
    updateStrategy: { type: 'none' },
  };
};

export const finalizeAskmAcceptanceConfig: ActionConfig = {
  key: 'finalizeAskmAcceptance',
  description: 'Approve a resource-share request (Askm): creates Maap, archives OpenMashaabim + Askm, optionally onboards new member. For partial votes, just adds the vote.',
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
