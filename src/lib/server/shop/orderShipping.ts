import type { ProbeRun } from '$lib/server/apiPublic/schemaProbe.js';
import { shippingSchemaLive } from './shippingConfig.js';
import { orderShippingOf, type OrderShipping, type ShippingQuote } from '$lib/shop/shipping';

/**
 * How a reported order travels, priced again on our side
 * (docs/inprogress/PLAN_SHOP_SHIPPING.md §5).
 *
 * The storefront charged a delivery fee; the rikma's config says what that
 * option costs. They should agree — the storefront asked the same quote a
 * minute earlier — and when they do not (the config changed in between, an
 * old storefront without zones) the order is **never refused**: the buyer has
 * paid. The difference goes on the order's note, where the members see it.
 */

const round2 = (n: number) => Math.round(n * 100) / 100;

export interface ShippingRecord {
  record: OrderShipping;
  /** A fact for the order's note, in the rikma's working language. */
  note: string | null;
}

/** The pure half — the quote is already in hand. */
export function shippingRecordFrom(
  quote: ShippingQuote,
  delivery: { preference: string | null; optionId: string | null; fee: number | null }
): ShippingRecord {
  const wanted =
    delivery.optionId ??
    quote.options.find((o) => o.kind === (delivery.preference ?? 'contact'))?.id ??
    delivery.preference ??
    'contact';
  const option = quote.options.find((o) => o.id === wanted) ?? null;
  const record = orderShippingOf(option, wanted, delivery.fee);
  let note: string | null = null;
  if (!option && delivery.optionId) {
    note = `שיטת המשלוח שנבחרה באתר (${delivery.optionId}) לא מוצעת היום לכתובת הזו לפי הגדרות המשלוח של הרקמה.`;
  } else if (option && delivery.fee !== null && round2(delivery.fee) !== round2(option.fee)) {
    note = `דמי המשלוח שנגבו (${round2(delivery.fee)}) שונים מהמחיר בהגדרות הרקמה לשיטה "${option.name || option.kind}" (${round2(option.fee)}).`;
  }
  return { record, note };
}

/**
 * Null when shipping is not deployed or not set up — the order then stores
 * only what it always did (preference, address, fee in the total).
 */
export async function shippingRecordOf(
  run: ProbeRun,
  projectId: string,
  delivery: { preference: string | null; optionId: string | null; fee: number | null; address: Record<string, string> | null },
  lines: Array<{ productId: string; variantId: string | null; quantity: number; unitPrice: number }>,
  fetchFn?: typeof fetch
): Promise<ShippingRecord | null> {
  try {
    if (!(await shippingSchemaLive(run))) return null;
    // Loaded here, not at the top: it reaches the catalog, and through it the
    // action registry that imports this action's config.
    const { quoteForRikma } = await import('./shipping.js');
    const r = await quoteForRikma(run, projectId, lines, delivery.address, fetchFn);
    if (!r.configured || !r.quote) return null;
    return shippingRecordFrom(r.quote, delivery);
  } catch (e) {
    // The order is recorded either way; its shipping record is a nicety.
    console.warn('[shipping] order shipping could not be priced:', (e as Error)?.message ?? e);
    return null;
  }
}
