/**
 * The customer marks a part of her fixed-price deal as work at her place
 * (PLAN_DEAL_PRICING_TRACKS §3.4) — or unmarks it.
 *
 * Marked, whoever takes the part needs her yes too: who comes into her home, works with
 * her children or her papers is hers to trust, at any price, 0 included. It changes who
 * signs, never what she pays. Only an open part (no one holds it yet) can be marked, only
 * on a fixed price (on at-cost she signs every candidacy anyway), and only by a customer
 * of the deal.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { readDealOffers } from '$lib/server/deal/dealOffers.js';
import { loadDealTrack } from '$lib/server/sheirut/dealTrack.js';
import { writeAtCustomer } from '$lib/server/deal/atCustomer.js';
import { scope, scopeList } from '$lib/realtime/scopes.js';

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const sheirutId = params.sheirutId != null ? String(params.sheirutId) : '';
  const kind = params.kind === 'mission' ? 'mission' : params.kind === 'resource' ? 'resource' : null;
  const lineId = params.lineId != null ? String(params.lineId) : '';
  const atCustomer = params.atCustomer !== false;
  if (!sheirutId || !kind || !lineId) throw new Error("markDealLineAtCustomer: sheirutId, kind ('mission' | 'resource') and lineId are required");

  const me = String(context.userId);
  const run = (qid: string, vars: Record<string, unknown>) => strapi.execute(qid, vars, context.jwt, context.fetch);

  if ((await loadDealTrack(run, sheirutId)) !== 'fixed') {
    throw new Error('Only a fixed-price deal needs this — on an at-cost deal you already approve whoever takes a part');
  }
  const res = await run('417dealOpenOffers', { id: sheirutId });
  if (res?.errors?.length) throw new Error(`Could not read the deal: ${JSON.stringify(res.errors).slice(0, 300)}`);
  const view = readDealOffers(res, me, 'fixed');
  if (!view.customerIds.includes(me)) throw new Error('Only the customer of this deal can mark where its work happens');
  const offer = view.offers.find((o) => o.kind === kind && o.lineId === lineId);
  if (!offer) throw new Error('Only a part nobody holds yet can be marked');

  await writeAtCustomer(run, kind, lineId, atCustomer);
  const projectId =
    (res?.data?.sheirut ?? res?.sheirut)?.data?.attributes?.project?.data?.id != null
      ? String((res?.data?.sheirut ?? res?.sheirut).data.attributes.project.data.id)
      : null;

  return {
    data: { sheirutId, kind, lineId, atCustomer, offerId: offer.offerId, projectId },
    updateStrategy: { type: 'none' as const }
  };
};

export const markDealLineAtCustomerConfig: ActionConfig = {
  key: 'markDealLineAtCustomer',
  description:
    "The customer of a fixed-price deal marks an open part as work at her place (or unmarks it): whoever takes it then needs her yes — trust, not money (PLAN_DEAL_PRICING_TRACKS §3.4).",
  graphqlOperation: handler,
  paramSchema: {
    sheirutId: { type: 'string', required: true, description: 'The deal (Sheirut) id' },
    kind: { type: 'string', required: true, description: "'mission' or 'resource'" },
    lineId: { type: 'string', required: true, description: 'The plan line (MatanotRecipeMission / Resource) id' },
    atCustomer: { type: 'boolean', required: false, description: 'true marks it (default), false unmarks it' }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in' }],
  updateStrategy: { type: 'none' },
  realtime: {
    scopes: (p, r) => scopeList([scope('deal', p.sheirutId), scope('project', r?.data?.projectId), scope('deal', r?.data?.offerId)])
  }
};
