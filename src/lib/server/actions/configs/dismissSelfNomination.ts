/**
 * Action: dismissSelfNomination (PLAN_SELF_NOMINATION §3.3)
 *
 * The one place the self-nomination machine differs from regular candidacy:
 * because the OpenMission/OpenMashaabim was authored by the candidate — it was
 * never the rikma's — a member may remove the whole thing ("not a fit right
 * now"), and the candidate may withdraw it. Both archive the Ask/Askm, cancel
 * any active timegrama, and archive the open entity itself.
 *
 * This is NOT a veto on content (there is no absolute no): content always gets
 * approve / chat / counter. It is a removal of an externally-initiated
 * proposal, the same family as declined/usersNotRelevant.
 *
 * Guardrail: refuses to run on anything whose source is not 'selfNomination' —
 * regular offers keep their existing decline actions (which archive the
 * Ask/Askm only).
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { cancelCandidacyTimegrama } from '../../nego/timegrama';

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { side, id, mode = 'dismiss' } = params;
  const requesterId = String(context.userId);
  const isMissionSide = side === 'mission';

  // 1. Load the open entity with its project + open asks.
  const ctxRes = await strapi.execute(
    isMissionSide ? '216getSelfNomMissionContext' : '217getSelfNomMashaabimContext',
    { id },
    context.jwt,
    context.fetch
  );
  const entity = isMissionSide ? ctxRes?.data?.openMission?.data : ctxRes?.data?.openMashaabim?.data;
  const attrs = entity?.attributes;
  if (!attrs) throw new Error('Open entity not found');

  if (attrs.source !== 'selfNomination') {
    throw new Error('dismissSelfNomination only applies to self-nominated proposals');
  }
  if (attrs.archived === true) {
    return { data: { id, alreadyArchived: true }, updateStrategy: { type: 'none' } };
  }

  const memberIds: string[] = (attrs.project?.data?.attributes?.user_1s?.data ?? []).map(
    (m: any) => String(m.id)
  );
  const asks: any[] = (isMissionSide ? attrs.asks?.data : attrs.askms?.data) ?? [];
  const candidateIds = asks
    .map((a: any) => a?.attributes?.users_permissions_user?.data?.id)
    .filter(Boolean)
    .map(String);

  // 2. Authorization: dismiss = a rikma member; withdraw = the candidate.
  if (mode === 'withdraw') {
    if (!candidateIds.includes(requesterId)) {
      throw new Error('Only the candidate can withdraw their self-nomination');
    }
  } else if (!memberIds.includes(requesterId)) {
    throw new Error('Only a rikma member can dismiss a self-nomination');
  }

  // 3. Cancel timegrama + archive Ask/Askm, then the open entity itself.
  const timegramaSide = isMissionSide ? 'ask' : 'askm';
  for (const ask of asks) {
    const askId = String(ask.id);
    await cancelCandidacyTimegrama(strapi, context, timegramaSide, askId);
    await strapi.execute(
      isMissionSide ? '76archiveAsk' : '131bArchiveAskm',
      isMissionSide ? { askId } : { id: askId },
      context.jwt,
      context.fetch
    );
  }
  await strapi.execute(
    isMissionSide ? '73archiveOpenMission' : '131archiveOpenMashaabim',
    isMissionSide ? { openMid: String(entity.id) } : { id: String(entity.id) },
    context.jwt,
    context.fetch
  );

  // 4. Who gets told: dismiss → the candidate (respectfully); withdraw → members.
  const recipientIds =
    mode === 'withdraw'
      ? Array.from(new Set(memberIds))
      : Array.from(new Set(candidateIds.filter((cid) => cid !== requesterId)));

  return {
    data: {
      id: String(entity.id),
      side,
      mode,
      projectName: attrs.project?.data?.attributes?.projectName ?? '',
    },
    recipientIds,
    updateStrategy: { type: 'none' },
  };
};

export const dismissSelfNominationConfig: ActionConfig = {
  key: 'dismissSelfNomination',
  description:
    "Fully archive a self-nominated proposal (OpenMission/OpenMashaabim + Ask/Askm + timegrama). mode:'dismiss' by a rikma member, mode:'withdraw' by the candidate. Refuses non-selfNomination sources.",
  graphqlOperation: handler,

  paramSchema: {
    side: { type: 'string', required: true, description: "'mission' | 'resource'" },
    id: { type: 'string', required: true, description: 'OpenMission/OpenMashaabim id' },
    mode: { type: 'string', required: false, description: "'dismiss' (default) | 'withdraw'" },
  },

  authRules: [{ type: 'jwt' }],

  notification: {
    recipients: { type: 'specificUsers', config: { userIdsParam: 'recipientIds' } },
    templates: {
      title: {
        he: 'עדכון על הצעה עצמית',
        en: 'Self-nomination update',
        ar: 'تحديث على الترشيح الذاتي',
      },
      body: {
        he: 'ההצעה העצמית נסגרה. תודה על הפתיחות — מוזמנים להמשיך לעקוב ולהציע שוב בעתיד 💗',
        en: 'The self-nomination was closed. Thank you for reaching out — feel free to follow along and propose again in the future 💗',
        ar: 'تم إغلاق الترشيح الذاتي. شكرًا على المبادرة — يمكنكم المتابعة والاقتراح مجددًا مستقبلاً 💗',
      },
    },
    channels: ['socket', 'email', 'push'],
    metadata: { type: 'selfNomination', url: 'lev' },
  },

  updateStrategy: { type: 'none' },
};
