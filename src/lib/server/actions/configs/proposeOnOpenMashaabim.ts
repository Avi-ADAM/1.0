/**
 * Action Configuration: Candidate proposes parallel terms on an open resource.
 *
 * Unlike the internal pmash negotiation (submitNegoMash) — which is between
 * rights-holders and overwrites the live pmash — an open resource can attract
 * several candidates at once. Overwriting the shared OpenMashaabim would clobber
 * one candidate's offer with another's. So each candidate gets their own Askm,
 * and their proposed terms are stored as a NegoMash round bound to that Askm.
 * The OpenMashaabim stays untouched as the rikma's baseline for comparison.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { normalizeLocationInput } from './actionUtils.js';

/** Candidate's own "in favor" vote on their own proposed terms (round 0). */
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

const resMs: Record<string, number> = {
  feh: 48 * 3_600_000,
  sth: 72 * 3_600_000,
  nsh: 96 * 3_600_000,
  sevend: 168 * 3_600_000,
};

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { openMashaabimId, projectId, spId } = params;
  const newValues = (params.newValues ?? {}) as Record<string, any>;

  const now = new Date();
  const nowISO = now.toISOString();
  const requesterId = String(context.userId);

  // 1. Project members + restime (for the deadline timegrama + notifications).
  const projectRes = await strapi.execute(
    '128getProjectMembersAndRestime',
    { pid: projectId },
    context.jwt,
    context.fetch
  );
  const projectAttrs = (projectRes as any)?.data?.project?.data?.attributes;
  const memberIds: string[] = (projectAttrs?.user_1s?.data || []).map((m: any) => String(m.id));
  const restime: string = projectAttrs?.restime ?? '';

  // 2. Create the Askm in "negotiating" state with the candidate's round-0 vote.
  //    turn = project: the rights-holders are the ones who now respond.
  const askmRes = await strapi.execute(
    'createAskmWithNego',
    {
      publishedAt: nowISO,
      openMashaabimId,
      projectId,
      spId,
      userId: requesterId,
      vots: [buildRequesterVote(requesterId, now)],
      negotiationStatus: 'negotiating',
      turn: 'project',
      currentRound: 0,
    },
    context.jwt,
    context.fetch
  );
  const askmId = (askmRes as any)?.data?.createAskm?.data?.id;
  if (!askmId) throw new Error('Failed to create Askm');

  // 3. Store the candidate's proposed terms as a NegoMash round bound to the
  //    Askm + OpenMashaabim. The OpenMashaabim itself is NOT modified.
  const loc = normalizeLocationInput(newValues.location);
  await strapi.execute(
    'negoCreateNegoMashRound',
    {
      publishedAt: nowISO,
      userId: requesterId,
      open_mashaabim: openMashaabimId,
      askm: askmId,
      ordern: 0,
      proposedBy: 'candidate',
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
      location: loc ? [loc] : null,
    },
    context.jwt,
    context.fetch
  );

  // 4. Mark the Sp as applied so it drops out of the suggestion feed.
  await strapi
    .execute('126updateSpDeclined', { id: spId, openMashaabimId }, context.jwt, context.fetch)
    .catch(() => null);

  // 5. Deadline timegrama (same windows as createMashaabimRequest).
  const offsetMs = resMs[restime] ?? 0;
  if (offsetMs > 0) {
    const deadline = new Date(now.getTime() + offsetMs);
    await strapi.execute(
      '127createTimegramaForAskm',
      { date: deadline.toISOString(), askmId },
      context.jwt,
      context.fetch
    );
  }

  const recipientIds = Array.from(new Set([...memberIds, requesterId].filter(Boolean)));

  return {
    data: { askmId, openMashaabimId, spId },
    recipientIds,
    updateStrategy: { type: 'none' },
  };
};

export const proposeOnOpenMashaabimConfig: ActionConfig = {
  key: 'proposeOnOpenMashaabim',
  description:
    "Candidate proposes parallel (counter) terms on an open resource. Creates an Askm in negotiating state plus a NegoMash round holding the proposed terms — without overwriting the shared OpenMashaabim. The rights-holders then vote or counter.",
  graphqlOperation: handler,

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
