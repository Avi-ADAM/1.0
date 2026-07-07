/**
 * Action: counterSaleClaim (PLAN_sale_holder_consent — phase 2).
 *
 * The precision/negotiation move on a bilateral saleClaim Decision. Instead of
 * a "reject" button, the party whose turn it is proposes a more accurate claim
 * (a negom precision round). This:
 *   - appends a negom entry with the refined values,
 *   - records the proposer's YES vote at the new round (proposing IS agreeing),
 *   - resets the silence clock: old timegrama done, a fresh one restime ahead,
 *   - notifies the other side that the ball is in their court.
 *
 * "I received nothing" is expressed as a counter to quantity/price 0 — there is
 * no absolute rejection (project super-principle).
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { proposalCounterConsentSpec } from '$lib/consent/specs/counterSaleClaim';
import {
  fetchSaleClaim,
  standingOrder,
  normalizeVots,
  restimeToMs,
  type SaleClaim,
  type NegomRound,
} from './saleClaimShared.js';

const handler: ActionExecutionHandler = async (params, context, { strapi, notifier }) => {
  const { decisionId, projectId, newValues } = params as {
    decisionId: string;
    projectId: string;
    newValues: NegomRound;
  };
  const now = new Date();
  const userId = String(context.userId);

  const claim: SaleClaim = await fetchSaleClaim(strapi, context, decisionId);
  if (!claim) throw new Error(`saleClaim Decision ${decisionId} not found`);
  if (claim.archived) throw new Error('This sale claim is already resolved');

  if (userId !== claim.holderId && userId !== claim.reporterId) {
    throw new Error('Only the reporter or the claimed holder may negotiate a sale claim');
  }

  const currentOrder = standingOrder(claim);
  // It is only your move if you have NOT already signed the standing round.
  const iSignedStanding = claim.vots.some(
    (v) => String(v.userId) === userId && Number(v.order) === currentOrder && v.what,
  );
  if (iSignedStanding) {
    throw new Error("It's the other side's turn — you already stand behind the current version");
  }

  const newOrder = currentOrder + 1;

  // Build the refined negom round from the proposed values. The projects.negom
  // component is numbers-only (hm/price/kindOf/dates) — it has no text field, so
  // any free-text "why" is not persisted here; clarification happens in the
  // decision's chat/forum, per the "chat, don't veto" principle.
  const round: NegomRound = {
    hm: newValues?.hm != null ? Number(newValues.hm) : null,
    price: newValues?.price != null ? Number(newValues.price) : null,
    kindOf: newValues?.kindOf ?? null,
    sqadualed: newValues?.sqadualed ?? null,
    sqadualedf: newValues?.sqadualedf ?? null,
  };
  const negom = [...claim.negom, round];

  // Proposer's vote at the new round (proposing = agreeing to it).
  const proposerVote = {
    what: true,
    users_permissions_user: userId,
    ide: parseInt(userId, 10),
    zman: now.toISOString(),
    order: newOrder,
  };
  const vots = [...normalizeVots(claim.vots), proposerVote];

  await strapi.execute('updateSaleClaimNego', { id: decisionId, negom, vots }, context.jwt, context.fetch);

  // Reset the silence-as-consent clock.
  if (claim.timegramaId) {
    try {
      await strapi.execute('35updateTimeGrama', { id: String(claim.timegramaId), done: true }, context.jwt, context.fetch);
    } catch (err) {
      console.warn('[counterSaleClaim] closing old timegrama failed:', err);
    }
  }
  try {
    const dueAt = new Date(Date.now() + restimeToMs(claim.restime)).toISOString();
    await strapi.execute('32createTimeGrama', { date: dueAt, whatami: 'decision', decision: decisionId }, context.jwt, context.fetch);
  } catch (err) {
    console.warn('[counterSaleClaim] new timegrama failed:', err);
  }

  // Notify the other party — it's their turn now.
  const otherId = userId === claim.holderId ? claim.reporterId : claim.holderId;
  if (notifier && otherId) {
    try {
      await notifier.notify(
        {
          recipients: { type: 'specificUsers', config: { userIdsParam: 'recipients' } },
          templates: {
            title: { he: 'התקבל דיוק על דיווח מכירה', en: 'A sale report was refined' },
            body: {
              he: 'הצד השני הציע גרסה מדויקת יותר. אפשר לאשר אותה, לדייק בחזרה או לברר. שעון התגובה אופס.',
              en: 'The other side proposed a more precise version. You can approve it, refine back, or discuss. The response clock was reset.',
            },
          },
          channels: ['socket', 'push'],
          metadata: { type: 'saleClaimCounter', url: 'lev', priority: 'normal' },
        },
        { recipients: [otherId], projectId, decisionId },
        { data: { id: decisionId } },
        context,
      );
    } catch (err) {
      console.warn('[counterSaleClaim] notification failed:', err);
    }
  }

  return {
    data: { decisionId, order: newOrder, consensus: false, kind: 'saleClaim' },
    updateStrategy: { type: 'partialUpdate', config: { dataKeys: ['decisions'] } },
  };
};

export const counterSaleClaimConfig: ActionConfig = {
  key: 'counterSaleClaim',
  description:
    'Propose a precision round (counter) on a bilateral saleClaim Decision: append a negom round with refined values, record the proposer\'s vote, reset the restime clock, and notify the other party.',
  graphqlOperation: handler,
  paramSchema: {
    decisionId: { type: 'string', required: true },
    projectId: { type: 'string', required: true },
    newValues: { type: 'object', required: true, description: 'Refined values: { hm, price, kindOf, sqadualed, sqadualedf, name, descrip }' },
    why: { type: 'string', required: false },
  },
  authRules: [
    { type: 'jwt' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Must be a project member to negotiate a sale claim',
    },
  ],
  consentSpec: proposalCounterConsentSpec,
};
