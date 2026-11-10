/**
 * The rikma's shipping settings (docs/inprogress/PLAN_SHOP_SHIPPING.md):
 * zones, rates, pickup points and per-product rules, one JSON on the project.
 *
 *   saveShippingConfig — any member, like marking an order shipped: delivery
 *                        prices pass the cost of a parcel to the buyer and
 *                        move nobody's share. Who saved last and when is
 *                        stored on the config and shown on the tab.
 *
 * What it does *not* do is land work on anyone: "orders to the north open a
 * task for Dana" is a fulfilment rule, with its own consent (fulfillment.ts).
 */
import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { ActionError } from '../errors.js';
import { scope, scopeList } from '$lib/realtime/scopes.js';
import { readShippingConfig } from '$lib/server/shop/shippingConfig.js';
import { configProblems, normalizeShippingConfig, shippingProductIds } from '$lib/shop/shipping';

type Run = (qid: string, vars: Record<string, unknown>) => Promise<any>;

/**
 * A product that only carries a delivery fee is not something to browse, so
 * linking it takes it out of the public directory without anyone having to know
 * that switch exists. Only the rikma's own products: the ids arrive in the saved
 * config, so a foreign id must change nothing. Unlinking leaves the flag alone,
 * since a product hidden before it was linked must not surface by itself, and a
 * failure here never fails the save: the settings matter more than the listing.
 */
async function hideShippingProducts(run: Run, projectId: string, ids: string[]): Promise<void> {
  for (const id of ids) {
    try {
      const meta = await run('266getMatanotSellerMeta', { id });
      const attrs = meta?.data?.matanot?.data?.attributes;
      const ownRikma = (attrs?.projectcreates?.data ?? []).some((p: { id: unknown }) => String(p.id) === projectId);
      if (!ownRikma || attrs.hideFromDiscovery === true) continue;
      await run('285setMatanotDiscovery', { id, hideFromDiscovery: true });
    } catch (err) {
      console.error(`[saveShippingConfig] could not hide shipping product ${id} of project ${projectId}`, err);
    }
  }
}

const save: ActionExecutionHandler = async (params, context, { strapi }) => {
  const projectId = String(params.projectId);
  const run = (qid: string, vars: Record<string, unknown>) => strapi.execute(qid, vars, context.jwt, context.fetch);

  const current = await readShippingConfig(run, projectId);
  if (!current.live) {
    throw new ActionError('SHOP_NOT_READY', 'Shipping settings are not deployed yet');
  }
  const config = normalizeShippingConfig(params.config);
  const problems = configProblems(config);
  if (problems.length) {
    throw new ActionError('VALIDATION_FAILED', 'The shipping settings are not complete', { problems });
  }
  config.updatedAt = new Date().toISOString();
  config.updatedBy = String(context.userId);
  await run('shippingConfigSet', { pid: projectId, shipping: config });
  await hideShippingProducts(run, projectId, shippingProductIds(config));
  return { config };
};

export const saveShippingConfigConfig: ActionConfig = {
  key: 'saveShippingConfig',
  description:
    "Save the rikma's shipping settings: ordered delivery zones (country, district, city, postal prefix) with priced methods, pickup points, and per-product delivery rules.",
  graphqlOperation: save,
  paramSchema: {
    projectId: { type: 'string', required: true },
    config: { type: 'object', required: true, description: 'The whole ShippingConfig ($lib/shop/shipping)' }
  },
  authRules: [
    { type: 'jwt', errorMessage: 'Must be authenticated to change shipping settings' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Only rikma members can change shipping settings'
    }
  ],
  realtime: { scopes: (p) => scopeList([scope('project', p.projectId)]) }
};

export const shippingActionConfigs: ActionConfig[] = [saveShippingConfigConfig];
