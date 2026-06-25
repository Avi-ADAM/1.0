/**
 * Action Configuration: take / propose terms on an open resource.
 *
 * Unlike the internal pmash negotiation (submitNegoMash) — which is between
 * rights-holders and overwrites the live pmash — an open resource can attract
 * several candidates at once. Overwriting the shared OpenMashaabim would clobber
 * one candidate's offer with another's. So each candidate gets their own Askm,
 * and their proposed terms are stored as a NegoMash round bound to that Askm.
 * The OpenMashaabim stays untouched as the rikma's baseline for comparison.
 *
 * Membership is checked SERVER-SIDE and decides the path (so correctness never
 * depends on the client — e.g. public offer pages where the store isn't loaded):
 *   - rikma member  → Path D: round proposedBy='project', the clock starts now,
 *     and a solo-member project materializes immediately (on the member's terms),
 *   - non-member    → Path B: round proposedBy='candidate', no clock yet (it
 *     starts when a member first votes/counters).
 * `proposeOnOpenMashaabim` and `customizeOpenMashaabim` share this handler.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { normalizeLocationInput } from './actionUtils.js';
import {
  resolveOpenMashaabimName,
  runResourceAskmAcceptance,
} from '../helpers/runResourceAskmAcceptance.js';
import { ensureCandidacyTimegrama } from '../../nego/timegrama.js';

/** Requester's own "in favor" vote on the round (round 0). */
function buildRequesterVote(userId: string, at: Date) {
  const uid = String(userId);
  const parsedIde = parseInt(uid, 10);
  return {
    what: true,
    users_permissions_user: uid,
    order: 0,
    ...(Number.isFinite(parsedIde) ? { ide: parsedIde } : {}),
    zman: at.toISOString(),
  };
}

export const openMashaabimProposalHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { openMashaabimId, projectId, spId, missionName: missionNameParam } = params;
  const newValues = (params.newValues ?? {}) as Record<string, any>;

  const now = new Date();
  const nowISO = now.toISOString();
  const requesterId = String(context.userId);

  // 1. Members — the server-side source of truth for the path decision.
  const projectRes = await strapi.execute(
    '128getProjectMembersAndRestime',
    { pid: projectId },
    context.jwt,
    context.fetch
  );
  const projectAttrs = (projectRes as any)?.data?.project?.data?.attributes;
  const memberIds: string[] = (projectAttrs?.user_1s?.data || []).map((m: any) => String(m.id));
  const isMember = memberIds.includes(requesterId);
  const isSolo = isMember && memberIds.length === 1;
  const proposedBy = isMember ? 'project' : 'candidate';

  // 2. Create the Askm with the requester's round-0 vote. (Solo member → archived,
  //    it materializes right away below.)
  const askmRes = await strapi.execute(
    '125createAskm',
    {
      publishedAt: nowISO,
      openMashaabimId,
      projectId,
      spId,
      userId: requesterId,
      vots: [buildRequesterVote(requesterId, now)],
      ...(isSolo ? { archived: true } : {}),
    },
    context.jwt,
    context.fetch
  );
  const askmId = (askmRes as any)?.data?.createAskm?.data?.id;
  if (!askmId) throw new Error('Failed to create Askm');

  // 3. Proposed terms as a NegoMash round (proposedBy by membership). OpenMashaabim untouched.
  const loc = normalizeLocationInput(newValues.location);
  await strapi.execute(
    'negoCreateNegoMashRound',
    {
      publishedAt: nowISO,
      userId: requesterId,
      open_mashaabim: openMashaabimId,
      askm: askmId,
      ordern: 0,
      proposedBy,
      status: 'proposed',
      isOriginal: false,
      name: newValues.name ?? null,
      descrip: newValues.descrip ?? null,
      spnot: newValues.spnot ?? null,
      easy: newValues.easy ?? null,
      hm: newValues.hm ?? null,
      price: newValues.price ?? null,
      kindOf: newValues.kindOf ?? null,
      sqadualed: newValues.sqadualed ?? null,
      sqadualedf: newValues.sqadualedf ?? null,
      linkto: newValues.linkto ?? null,
      location: loc ? [loc] : [],
    },
    context.jwt,
    context.fetch
  );

  // 4. Mark the Sp as applied so it drops out of the suggestion feed.
  await strapi
    .execute('126updateSpDeclined', { id: spId, openMashaabimId }, context.jwt, context.fetch)
    .catch(() => null);

  // 5a. Solo member (Path D) → materialize now on the member's terms.
  if (isSolo) {
    const missionName = await resolveOpenMashaabimName(
      strapi,
      context,
      String(openMashaabimId),
      missionNameParam as string | undefined
    );
    await runResourceAskmAcceptance(strapi, context, {
      askmId: String(askmId),
      openMashaabimId: String(openMashaabimId),
      projectId: String(projectId),
      spId: String(spId),
      missionName,
      acceptedUserId: requesterId,
      existingMemberIds: memberIds,
      skipAskmArchive: true,
    });
    return {
      data: { askmId, openMashaabimId, spId, autoFinalized: true },
      recipientIds: memberIds,
      updateStrategy: { type: 'none' },
    };
  }

  // 5b. Member, multi (Path D) → start the auto-approval clock now (member engaged).
  //     Non-member (Path B) → defer; the clock starts when a member votes/counters.
  if (isMember) {
    await ensureCandidacyTimegrama(strapi, context, { side: 'askm', id: String(askmId) });
  }

  const recipientIds = Array.from(new Set([...memberIds, requesterId].filter(Boolean)));

  return {
    data: { askmId, openMashaabimId, spId, autoFinalized: false },
    recipientIds,
    updateStrategy: { type: 'none' },
  };
};

export const proposeOnOpenMashaabimConfig: ActionConfig = {
  key: 'proposeOnOpenMashaabim',
  description:
    'Take/propose terms on an open resource. Server checks membership: member → project round (Path D, clock now, solo materializes); non-member → candidate round (Path B, clock deferred). OpenMashaabim is never overwritten.',
  graphqlOperation: openMashaabimProposalHandler,

  paramSchema: {
    openMashaabimId: { type: 'string', required: true, description: 'ID of the open resource' },
    projectId: { type: 'string', required: true, description: 'Project (rikma) ID' },
    spId: { type: 'string', required: true, description: 'Candidate Sp (resource offer) ID' },
    missionName: { type: 'string', required: false, description: 'Resource name (for notifications)' },
    newValues: {
      type: 'object',
      required: false,
      description:
        'Proposed terms: name, descrip, spnot, easy, hm, price, kindOf, sqadualed, sqadualedf, linkto, location',
    },
    originalValues: {
      type: 'object',
      required: false,
      description: "The rikma's baseline terms (reference only — not written anywhere)",
    },
  },

  authRules: [{ type: 'jwt' }],

  notification: {
    recipients: {
      type: 'specificUsers',
      config: { userIdsParam: 'recipientIds' },
    },
    templates: {
      title: { he: 'הצעה מקבילה למשאב', en: 'Counter-proposal for a resource' },
      body: {
        he: 'מועמד הגיש הצעה מתוקנת למשאב בריקמה',
        en: 'A candidate submitted revised terms for a resource',
      },
    },
    channels: ['socket'],
    metadata: { type: 'mashaabimRequest', url: 'lev' },
  },

  updateStrategy: { type: 'none' },
};
