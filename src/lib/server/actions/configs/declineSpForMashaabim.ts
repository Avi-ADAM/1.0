/**
 * Action Configuration: Decline an Sp (resource-share suggestion) for a Mashaabim request
 *
 * Fired by a project member when they reject a particular Sp that was offered
 * for one of their openMashaabim slots. Adds the openMashaabim id to the Sp's
 * `declinedm` list (mirrors qid `126updateSpDeclined`).
 *
 * Auth: caller must be authenticated and a member of the project that owns
 * the openMashaabim.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { dismissSuggestion } from '$lib/server/matching/engine';

const declineSpForMashaabimHandler: ActionExecutionHandler = async (
  params,
  context,
  { strapi }
) => {
  const { spId, openMashaabimId } = params;

  await strapi.execute(
    '126updateSpDeclined',
    { id: String(spId), openMashaabimId: String(openMashaabimId) },
    context.jwt,
    context.fetch
  );

  // Keep the caller's precomputed resource suggestion in sync with the decline
  // (the lev huca card fires this action with the caller's own sp).
  await dismissSuggestion(
    String(context.userId),
    { openMashaabimId: String(openMashaabimId) },
    { strapi, fetch: context.fetch, lang: context.lang }
  );

  return {
    data: { spId, openMashaabimId },
    updateStrategy: { type: 'none' },
  };
};

export const declineSpForMashaabimConfig: ActionConfig = {
  key: 'declineSpForMashaabim',
  description:
    'Decline an Sp (resource-share) suggestion for a Mashaabim slot: appends the openMashaabim id to Sp.declinedm.',
  graphqlOperation: declineSpForMashaabimHandler,

  paramSchema: {
    spId: { type: 'string', required: true },
    openMashaabimId: { type: 'string', required: true },
    projectId: { type: 'string', required: true },
  },

  authRules: [
    { type: 'jwt' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Must be a project member to decline a resource suggestion',
    },
  ],

  updateStrategy: { type: 'none' },
};
