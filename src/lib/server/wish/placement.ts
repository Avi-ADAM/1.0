/**
 * Putting an agreed version into the wish's BOM slot (QA_CONCIERGE_E2E C-9).
 *
 * The slot a wisher authors for an invited provider is two rows: the recipe line
 * on the wish's draft product (`hoursPerUnit` × `ratePerHour`, or `quantityPerUnit`
 * × `pricePerUnit`) — which `materializeWish` sums into the deal's total — and the
 * spec behind it (a `pendm` / `pmash`) — which becomes the mission or resource the
 * provider actually holds. If the two sides negotiated other terms, both rows have
 * to say so before the provider is assigned, or the deal would be priced at one
 * number and carried out at another.
 */

import type { SlotKind } from './proposal.js';
import type { Version } from '$lib/wish/proposalRounds.js';

type Strapi = { execute: (qid: string, vars: any, jwt: string, fetch: any) => Promise<any> };
type Ctx = { jwt: string; fetch: any };

/**
 * Write `version` onto the recipe line `recipeId` of the product `matanotId` and its
 * spec. A version with no positive amount cannot be turned into a rate, so the rows
 * are left as authored (and the caller is told). Throws if a write fails: the
 * placement must not go ahead on terms the slot does not carry.
 */
export async function syncSlotToVersion(
  strapi: Strapi,
  context: Ctx,
  args: { matanotId: string | null; kind: SlotKind; recipeId: string; version: Version }
): Promise<{ synced: boolean }> {
  const { amount, price } = args.version;
  if (!args.matanotId || amount == null || amount <= 0 || price == null) return { synced: false };

  const res = await strapi.execute('168wishRecipeForMaterialize', { id: args.matanotId }, context.jwt, context.fetch);
  const attrs = res?.data?.matanot?.data?.attributes ?? {};
  const lines: any[] = (args.kind === 'mission' ? attrs.matanot_recipe_missions : attrs.matanot_recipe_resources)?.data ?? [];
  const line = lines.find((l) => String(l.id) === String(args.recipeId));
  if (!line) throw new Error(`The slot ${args.recipeId} is not on this wish's product`);

  const unit = price / amount;
  const fail = (what: string, r: any) => {
    if (!r || r.errors) throw new Error(`Could not update ${what}: ${JSON.stringify(r?.errors ?? 'Unknown')}`);
  };

  if (args.kind === 'mission') {
    fail(
      'the BOM line',
      await strapi.execute('126updateMatanotRecipeMission', { id: args.recipeId, hoursPerUnit: amount, ratePerHour: unit }, context.jwt, context.fetch)
    );
    const pendmId = line.attributes?.pendm?.data?.id;
    if (pendmId) {
      fail(
        'the mission spec',
        await strapi.execute('negoUpdatePendm', { id: String(pendmId), data: { noofhours: amount, perhour: unit } }, context.jwt, context.fetch)
      );
    }
  } else {
    fail(
      'the BOM line',
      await strapi.execute('129updateMatanotRecipeResource', { id: args.recipeId, quantityPerUnit: amount, pricePerUnit: unit }, context.jwt, context.fetch)
    );
    const pmashId = line.attributes?.pmash?.data?.id;
    if (pmashId) {
      fail(
        'the resource spec',
        await strapi.execute('negoUpdatePmash', { id: String(pmashId), data: { hm: amount, price: unit, easy: unit } }, context.jwt, context.fetch)
      );
    }
  }
  return { synced: true };
}
