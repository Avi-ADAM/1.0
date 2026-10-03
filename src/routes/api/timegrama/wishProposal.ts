/**
 * The silence clock of a wish proposal, as the timegrama dispatcher runs it
 * (QA_CONCIERGE_E2E C-9). The logic is `$lib/server/wish/matureProposal` — this only
 * wires it to the live Strapi, the service identity and the clock rows.
 */

import { ADMINMONTHER } from '$env/static/private';
import { SendToAdmin } from '$lib/server/sendToAdmin.js';
import { actionService, strapiClient } from '$lib/server/actions/index.js';
import { adminToken, serviceContext } from '$lib/server/github/service.js';
import { armProposalClock } from '$lib/server/wish/clock.js';
import { matureWishProposal } from '$lib/server/wish/matureProposal.js';

export async function WishProposal(id: string | number, taid: string | number, fetch: typeof globalThis.fetch) {
  try {
    const outcome = await matureWishProposal(String(id), String(taid), {
      strapi: strapiClient as any,
      jwt: adminToken(),
      fetch,
      runAction: async (key, params, userId) => {
        const res = await actionService.executeAction(key, params, serviceContext(userId, fetch));
        return { success: !!res.success, error: (res as any).error };
      },
      closeClock: async (t) => {
        await SendToAdmin(`mutation { updateTimegrama(id: ${t}, data: { done: true }) { data { id } } }`, ADMINMONTHER);
      },
      armClock: async (proposalId, at) => {
        // an exact moment: the wish's pace was already applied by the caller
        await armProposalClock(strapiClient as any, { jwt: adminToken(), fetch }, { proposalId, ratsonId: '', at });
      }
    });
    console.log(`[timegrama/wishProposal] proposal ${id} (clock #${taid}) — ${outcome}`);
  } catch (e) {
    // The clock stays open: the next run tries again rather than losing the proposal.
    console.error(`[timegrama/wishProposal] proposal ${id} failed:`, e);
  }
}
