/**
 * The stock screen's resources (PLAN_SHOP_OPERATIONS §2.4, A3).
 *
 * Called from the `sales/manage/stock` loader after the moach layout's
 * membership check, so it reads with the service token. Until `1.0b` deploys
 * the A3 fields the query fails — `ready: false`, and the screen simply shows
 * the shop's own stock as before.
 */
import { strapiClient } from '$lib/server/actions';
import { resourceStockViews, type ResourceStockView } from '$lib/fulfillment/stockView';

export type { ResourceStockView };

export async function loadResourceStock(
  projectId: string,
  fetchFn?: typeof fetch
): Promise<{ ready: boolean; resources: ResourceStockView[] }> {
  try {
    const res = await strapiClient.execute('stockResources', { pid: projectId }, undefined, fetchFn);
    return { ready: true, resources: resourceStockViews(res?.data?.mashabetahaliches?.data ?? []) };
  } catch (e) {
    console.warn('[stock] resources unavailable (schema not deployed?):', (e as Error)?.message ?? e);
    return { ready: false, resources: [] };
  }
}
