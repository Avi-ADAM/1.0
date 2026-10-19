import { schemaProbe, type ProbeRun } from '$lib/server/apiPublic/schemaProbe.js';
import { rikmaCurrency } from '$lib/money/resolve.js';
import { emptyShippingConfig, normalizeShippingConfig, type ShippingConfig } from '$lib/shop/shipping';

/**
 * A rikma's shipping config, read (docs/inprogress/PLAN_SHOP_SHIPPING.md).
 *
 * Its own module with no catalog import, so action configs can read it without
 * pulling the catalog — and, through it, the action registry — into a cycle.
 * The quoting half is `./shipping.ts`.
 *
 * Every read asks `shippingSchemaLive` first — until `1.0b` deploys
 * `Project.shipping` / `Order.shipping` a rikma simply has no shipping config,
 * and the storefront keeps the per-product delivery options it had.
 */

const shippingSchema = schemaProbe({
  qid: 'rikmaApiShippingSchema',
  isLive: (res) => Array.isArray(res?.data?.projects?.data) && Array.isArray(res?.data?.orders?.data),
  meanwhile: 'shipping answers as not configured'
});

export function shippingSchemaLive(run: ProbeRun): Promise<boolean> {
  return shippingSchema.live(run);
}

/** Test seam. */
export function resetShippingSchemaVerdict(): void {
  shippingSchema.reset();
}

export interface RikmaShipping {
  /** The columns are deployed — the config can be saved. */
  live: boolean;
  config: ShippingConfig;
  /** Fees are in this currency. */
  currency: string;
}

export async function readShippingConfig(run: ProbeRun, projectId: string): Promise<RikmaShipping> {
  if (!(await shippingSchemaLive(run))) {
    return { live: false, config: emptyShippingConfig(), currency: rikmaCurrency({}) };
  }
  const res = await run('shippingConfigGet', { pid: String(projectId) });
  const attrs = res?.data?.project?.data?.attributes ?? {};
  return { live: true, config: normalizeShippingConfig(attrs.shipping), currency: rikmaCurrency(attrs) };
}
