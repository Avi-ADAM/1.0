/**
 * Action: restore an assigned mission offer that lapsed.
 *
 * The member it was offered to ("I still want it") or any member of the rikma
 * ("offer it to them again") puts the offer back on the table while nobody else
 * has stepped in. The OpenMission goes back to being an offer for that member
 * (`isRishon` + `rishon`, which is also what carries the past months stored on
 * it), the Ask comes back with the presser's yes at the standing round, and the
 * rikma gets a full new restime. See $lib/server/nego/lapsedRevival.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { ActionError } from '../errors.js';
import { ensureCandidacyTimegrama } from '../../nego/timegrama.js';
import { planLapsedRevival, type RevivalRefusal } from '../../nego/lapsedRevival.js';
import { tellMatured } from '$lib/server/notifications/matured';
import { askOfferRestored } from '$lib/server/notifications/maturedNotices';
import { scope, decisionScope, scopeList } from '$lib/realtime/scopes.js';

const REFUSAL: Record<RevivalRefusal, string> = {
  notFound: 'The offer was not found',
  notLapsed: 'This offer did not lapse, so there is nothing to restore',
  missionTaken: 'The mission was already taken or offered to someone else',
  otherCandidate: 'Someone else has already applied for this mission',
  notAllowed: 'Only the member it was offered to, or a member of the rikma, can restore it'
};

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const askId = String(params.askId);
  const res = await strapi.execute('lapsedAskForRevival', { id: askId }, context.jwt, context.fetch);
  const plan = planLapsedRevival(res?.data?.ask?.data, String(context.userId));
  if ('reason' in plan) {
    const { reason } = plan;
    throw new ActionError(reason === 'notAllowed' ? 'FORBIDDEN' : 'NOT_REVIVABLE', REFUSAL[reason], { reason });
  }

  // OpenMission first: the mission leaves the open board before the offer comes
  // back, so nobody can apply for it in between.
  await strapi.execute(
    'negoUpdateOpenMission',
    { id: plan.openMissionId, data: { archived: true, isRishon: true, rishon: plan.takerId } },
    context.jwt,
    context.fetch
  );
  await strapi.execute(
    'reviveLapsedAsk',
    { askId: plan.askId, vots: plan.vots },
    context.jwt,
    context.fetch
  );

  // A full new response window for the rikma (the old clock is done).
  await ensureCandidacyTimegrama(strapi, context, {
    side: 'ask',
    id: plan.askId,
    restime: plan.restime,
    reset: true
  });

  await tellMatured(
    askOfferRestored({
      projectId: plan.projectId,
      name: plan.missionName,
      takerId: plan.takerId,
      takerName: plan.takerName,
      reviverId: String(context.userId),
      byTaker: plan.role === 'taker'
    }),
    context.fetch
  ).catch((e) => console.error('[reviveLapsedAsk] notice failed', plan.askId, e));

  return {
    data: { askId: plan.askId, openMissionId: plan.openMissionId, role: plan.role },
    updateStrategy: { type: 'none' }
  };
};

export const reviveLapsedAskConfig: ActionConfig = {
  key: 'reviveLapsedAsk',
  description:
    'Restore an assigned mission offer that lapsed because the invited member did not answer in time: by that member (their yes) or by a rikma member (offer it again). The rikma gets a full new restime.',
  graphqlOperation: handler,

  paramSchema: {
    askId: { type: 'string', required: true, description: 'The lapsed Ask' },
    projectId: { type: 'string', required: true, description: 'Project (rikma) ID - realtime scope' }
  },

  // Who may press it (the invited member or a rikma member) is decided from the
  // Ask itself in the handler, never from the params.
  authRules: [{ type: 'jwt' }],

  updateStrategy: { type: 'none' },

  realtime: {
    scopes: (p) => scopeList([scope('project', p.projectId), decisionScope('ask', p.askId)])
  }
};
