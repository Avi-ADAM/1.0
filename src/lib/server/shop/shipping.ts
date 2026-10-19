import { errorText, type ProbeRun } from '$lib/server/apiPublic/schemaProbe.js';
import { fetchShopRows } from '$lib/server/apiPublic/catalog.js';
import { deliveryOf } from '$lib/server/apiPublic/shop.js';
import { districtOfCity } from '$lib/server/places/israel.js';
import { quoteShipping, type QuoteItem, type ShippingAddress, type ShippingQuote } from '$lib/shop/shipping';
import { readShippingConfig } from './shippingConfig.js';

export { readShippingConfig, shippingSchemaLive, type RikmaShipping } from './shippingConfig.js';

/**
 * The quoting half of shipping (docs/inprogress/PLAN_SHOP_SHIPPING.md): turn a
 * cart into the facts a quote needs, and quote it. Reading the config is
 * `./shippingConfig.ts` — import that one from action configs (this module
 * reaches the catalog).
 */

export interface CartLine {
  productId: string;
  variantId: string | null;
  quantity: number;
  unitPrice: number;
}

/** A cart's lines → what `quoteShipping` weighs and restricts by, read from the rikma's rows. */
export async function quoteItemsOf(run: ProbeRun, projectId: string, lines: CartLine[]): Promise<QuoteItem[]> {
  const productIds = [...new Set(lines.map((l) => l.productId))];
  const variantIds = [...new Set(lines.map((l) => l.variantId).filter((v): v is string => !!v))];
  const [shopRows, weightsRes] = await Promise.all([
    fetchShopRows(run, { projectId, productIds }).catch(() => new Map<string, Record<string, any>>()),
    variantIds.length
      ? run('shippingVariantWeights', { pid: String(projectId), ids: variantIds }).catch((e: unknown) => {
          console.warn('[shipping] variant weights could not be read:', errorText(e));
          return null;
        })
      : Promise.resolve(null)
  ]);
  const weights = new Map<string, number>();
  for (const v of weightsRes?.data?.productVariants?.data ?? []) {
    const g = Number(v?.attributes?.weightGrams);
    if (Number.isFinite(g) && g > 0) weights.set(String(v.id), g);
  }
  return lines.map((l) => ({
    productId: l.productId,
    variantId: l.variantId,
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    weightGrams: l.variantId ? (weights.get(l.variantId) ?? null) : null,
    productKinds: deliveryOf(shopRows.get(l.productId) ?? {}).map((d) => d.kind)
  }));
}

/** A buyer's address as a quote reads it — the district resolved here, never taken from them. */
export async function quoteAddressOf(raw: unknown, fetchFn: typeof fetch = fetch): Promise<ShippingAddress | null> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const v = raw as Record<string, unknown>;
  const s = (k: string, max: number) => (typeof v[k] === 'string' ? (v[k] as string).trim().slice(0, max) : '') || null;
  const country = (s('country', 2) ?? 'IL').toUpperCase();
  const city = s('city', 120);
  const zip = s('zip', 12);
  if (!city && !zip && !s('country', 2)) return null;
  const district = country === 'IL' && city ? await districtOfCity(city, fetchFn) : null;
  return { country, city, zip, district };
}

export interface RikmaQuote {
  configured: boolean;
  currency: string;
  quote: ShippingQuote | null;
}

/** "What would delivering this cart here cost?" — for the API, and for an order being recorded. */
export async function quoteForRikma(
  run: ProbeRun,
  projectId: string,
  lines: CartLine[],
  rawAddress: unknown,
  fetchFn: typeof fetch = fetch
): Promise<RikmaQuote> {
  const { config, currency } = await readShippingConfig(run, projectId);
  if (!config.enabled) return { configured: false, currency, quote: null };
  const [items, address] = await Promise.all([
    quoteItemsOf(run, projectId, lines),
    quoteAddressOf(rawAddress, fetchFn)
  ]);
  return { configured: true, currency, quote: quoteShipping(config, items, address) };
}
