import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { confirmPartReceived, loadParts } from '$lib/server/deal/partsReceived.js';

/**
 * The two Sheirut flags a deal's status is derived from (`dealsService.ts`):
 *
 *  - `iGotIt` — the customer says the product arrived. Customer only.
 *  - `moneyTransfered` — the seller side says the money arrived. Only someone
 *    listed in `iCanGetMonay` (a member who registered as a receiver).
 *
 * A bare passthrough would let any signed-in user flip either flag on any deal,
 * so the entity check is per flag and both flags only ever go `true` — undoing
 * a confirmation is a conversation, not a toggle.
 */
const updateSheirutHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { id, iGotIt, moneyTransfered } = params;
  const userId = String(context.userId);

  if (iGotIt !== true && moneyTransfered !== true) {
    throw new Error('updateSheirut: nothing to update (iGotIt or moneyTransfered must be true)');
  }

  const data: Record<string, boolean> = {};

  if (iGotIt === true) {
    const res = await strapi.execute(
      '65checkSheirutCustomer',
      { uid: userId, sheirutId: String(id) },
      context.jwt,
      context.fetch
    );
    if ((res?.data?.sheirutpends?.data ?? []).length === 0) {
      throw new Error('Only the customer of this deal can confirm receipt');
    }
    data.iGotIt = true;
  }

  if (moneyTransfered === true) {
    // A wish deal is paid when every provider has their part (QA C-19): "the money
    // arrived" is the caller's own confirmation, and the deal flag follows the last one.
    const run = (qid: string, vars: Record<string, unknown>) => strapi.execute(qid, vars, context.jwt, context.fetch);
    if (await loadParts(run, String(id))) {
      if (iGotIt === true) throw new Error('updateSheirut: confirm receipt and payment separately on a wish deal');
      const { state, becamePaid } = await confirmPartReceived(run, String(id), userId);
      return {
        data: { id: String(id), partReceived: true, paid: state.allConfirmed, becamePaid, pending: state.pending },
        updateStrategy: { type: 'none' as const }
      };
    }

    const res = await strapi.execute('2cGetMoneyReceivers', { id: String(id) }, context.jwt, context.fetch);
    const receivers: { id: string }[] = res?.data?.sheirut?.data?.attributes?.iCanGetMonay?.data ?? [];
    if (!receivers.some((r) => String(r.id) === userId)) {
      throw new Error('Only a registered money receiver of this deal can confirm the payment');
    }
    data.moneyTransfered = true;
  }

  const result = await strapi.execute('213updateSheirut', { id: String(id), data }, context.jwt, context.fetch);
  if (!result || result.errors) {
    throw new Error(`updateSheirut failed: ${JSON.stringify(result?.errors || 'Unknown')}`);
  }

  return {
    data: { id: String(id), ...data },
    updateStrategy: { type: 'none' as const }
  };
};

export const updateSheirutConfig: ActionConfig = {
  key: 'updateSheirut',
  description:
    'Confirm a deal milestone: the customer confirms receipt (iGotIt) or a registered money receiver confirms the payment (moneyTransfered). Flags only move to true.',
  graphqlOperation: updateSheirutHandler,

  paramSchema: {
    id: { type: 'string', required: true, description: 'Sheirut ID' },
    projectId: { type: 'string', required: false, description: 'Project ID (client-side routing only)' },
    iGotIt: { type: 'boolean', required: false, description: 'Customer confirms receipt' },
    moneyTransfered: { type: 'boolean', required: false, description: 'Receiver confirms the money arrived' }
  },

  authRules: [{ type: 'jwt', errorMessage: 'Must be authenticated' }],

  updateStrategy: { type: 'none' }
};
