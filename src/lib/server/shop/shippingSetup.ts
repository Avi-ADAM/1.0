/**
 * What the "Shipping" tab of the sales screen reads
 * (docs/inprogress/PLAN_SHOP_SHIPPING.md §6): the rikma's config, its products
 * (for per-product rules), Israel's districts (for zones), and which
 * fulfilment rules already deliver to which zone.
 *
 * Called from a `sales/manage/*` loader after the moach layout's membership
 * check, so it reads with the service token. Until `1.0b` deploys the
 * columns this is `ready: false`, and the tab says so instead of erroring.
 */
import { strapiClient } from '$lib/server/actions';
import { readShippingConfig } from './shippingConfig.js';
import { districtsOf, localities } from '$lib/server/places/israel.js';
import { loadFulfillmentSetup } from '$lib/server/fulfillment/setup.js';
import { emptyShippingConfig, type ShippingConfig } from '$lib/shop/shipping';

export interface ShippingSetup {
  ready: boolean;
  config: ShippingConfig;
  currency: string;
  products: Array<{ id: string; name: string }>;
  districts: string[];
  /** Live or proposed fulfilment rules narrowed to zones — "who delivers there". */
  rules: Array<{ id: string; name: string; zones: string[]; who: string | null }>;
  updatedByName: string | null;
}

export async function loadShippingSetup(projectId: string, fetchFn?: typeof fetch): Promise<ShippingSetup> {
  const run = (qid: string, vars: Record<string, unknown>) => strapiClient.execute(qid, vars, undefined, fetchFn);
  let shipping;
  try {
    shipping = await readShippingConfig(run, projectId);
  } catch (e) {
    console.warn('[shipping] config unavailable:', (e as Error)?.message ?? e);
    shipping = { live: false, config: emptyShippingConfig(), currency: 'ILS' };
  }
  if (!shipping.live) {
    return { ready: false, config: shipping.config, currency: shipping.currency, products: [], districts: [], rules: [], updatedByName: null };
  }

  const [productsRes, places, fulfillment] = await Promise.all([
    run('shippingProducts', { pid: projectId }).catch(() => null),
    localities(fetchFn ?? fetch),
    loadFulfillmentSetup(projectId, fetchFn).catch(() => null)
  ]);
  const members = new Map<string, string>((fulfillment?.members ?? []).map((m) => [String(m.id), String(m.name ?? '')]));
  return {
    ready: true,
    config: shipping.config,
    currency: shipping.currency,
    products: (productsRes?.data?.matanots?.data ?? []).map((n: any) => ({
      id: String(n.id),
      name: String(n.attributes?.name ?? '')
    })),
    districts: districtsOf(places),
    rules: (fulfillment?.steps ?? [])
      .filter((s) => s.when.shippingZones?.length && s.consentState !== 'paused')
      .map((s) => ({
        id: s.id,
        name: s.name,
        zones: s.when.shippingZones ?? [],
        who: s.missionName ?? s.roleName ?? s.memberName ?? null
      })),
    updatedByName: shipping.config.updatedBy ? (members.get(shipping.config.updatedBy) ?? null) : null
  };
}
