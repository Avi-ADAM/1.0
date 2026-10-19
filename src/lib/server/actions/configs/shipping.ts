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
import { configProblems, normalizeShippingConfig } from '$lib/shop/shipping';

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
