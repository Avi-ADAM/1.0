import {
  assertTenant,
  authenticateRead,
  errorResponse,
  type ApiAuth
} from './http.js';
import { resolveRikmaFromPath } from './rikmaPath.js';
import { fetchRikmaRef, refOf, strapiRun, type ApiRun } from './catalog.js';
import { isHiddenProject } from '$lib/server/discovery/hiddenProjects.js';
import type { ShippingConfig } from '$lib/shop/shipping';
import { lowestFreeOver } from '$lib/shop/shipping';
import type { CartLine } from '$lib/server/shop/shipping.js';

/**
 * The checks the shipping endpoints share with the catalog, in the catalog's
 * order: who is asking, which rikma, key ↔ path, does it exist
 * (docs/inprogress/PLAN_SHOP_SHIPPING.md §4).
 */
export type ShippingRouteStart =
  | { kind: 'ok'; auth: ApiAuth; run: ApiRun; projectId: string; rikma: ReturnType<typeof refOf> }
  | { kind: 'response'; response: Response };

export async function startShippingRoute(args: {
  params: { rikma: string };
  url: URL;
  request: Request;
  fetch: typeof fetch;
  suffix: string;
}): Promise<ShippingRouteStart> {
  const run = strapiRun(args.fetch);
  const authResult = await authenticateRead(args.request, args.fetch);
  if (authResult.kind === 'deny') return { kind: 'response', response: authResult.response };
  const { auth } = authResult;

  const resolved = await resolveRikmaFromPath(args.params.rikma, run, { search: args.url.search, suffix: args.suffix });
  if (resolved.kind === 'notFound') return { kind: 'response', response: errorResponse(404, 'RIKMA_NOT_FOUND', 'No such rikma') };
  if (resolved.kind === 'redirect') {
    return {
      kind: 'response',
      response: new Response(null, {
        status: 301,
        headers: {
          Location: resolved.location,
          ...(resolved.canonicalPath ? { 'X-1lev1-Rikma-Canonical': resolved.canonicalPath } : {})
        }
      })
    };
  }
  const mismatch = assertTenant(auth, resolved.projectId);
  if (mismatch) return { kind: 'response', response: mismatch };

  const rikmaRow = await fetchRikmaRef(run, resolved.projectId);
  if (!rikmaRow || (auth.kind === 'anonymous' && isHiddenProject(rikmaRow.id))) {
    return { kind: 'response', response: errorResponse(404, 'RIKMA_NOT_FOUND', 'No such rikma') };
  }
  return { kind: 'ok', auth, run, projectId: resolved.projectId, rikma: refOf(rikmaRow) };
}

/**
 * What a storefront may know of the config: the zones and their prices, the
 * pickup points and the product rules — everything it shows a buyer. Who
 * saved it last is the rikma's business.
 */
export function publicShippingOf(config: ShippingConfig, currency: string) {
  return {
    enabled: config.enabled,
    currency,
    handlingDays: config.handlingDays,
    freeOver: lowestFreeOver(config),
    zones: config.zones.map((z) => ({
      id: z.id,
      name: z.name,
      everywhere: z.everywhere,
      countries: z.countries,
      districts: z.districts,
      cities: z.cities,
      postalPrefixes: z.postalPrefixes,
      methods: z.methods.map((m) => ({
        id: m.id,
        name: m.name,
        fee: m.fee,
        freeOver: m.freeOver,
        minSubtotal: m.minSubtotal,
        etaMinDays: m.etaMinDays,
        etaMaxDays: m.etaMaxDays,
        days: m.days,
        note: m.note
      }))
    })),
    pickupPoints: config.pickupPoints,
    products: config.products.map((p) => ({ productId: p.productId, kinds: p.kinds }))
  };
}

export const SHIPPING_CORS = { 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };

const MAX_LINES = 50;

/** `{ lines: [{ productId, variantId?, quantity, unitPrice }] }` → clean lines, or a reason. */
export function quoteLinesOf(raw: unknown): { ok: true; lines: CartLine[] } | { ok: false; message: string } {
  if (!Array.isArray(raw) || raw.length === 0) return { ok: false, message: 'lines must be a non-empty array' };
  if (raw.length > MAX_LINES) return { ok: false, message: `at most ${MAX_LINES} lines` };
  const lines: CartLine[] = [];
  for (const [i, r] of raw.entries()) {
    const productId = String((r as any)?.productId ?? '');
    const v = (r as any)?.variantId;
    const variantId = v == null || v === '' ? null : String(v);
    const quantity = Number((r as any)?.quantity);
    const unitPrice = Number((r as any)?.unitPrice ?? 0);
    if (!/^\d{1,12}$/.test(productId) || (variantId !== null && !/^\d{1,12}$/.test(variantId))) {
      return { ok: false, message: `lines[${i}] has an invalid id` };
    }
    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 100000) {
      return { ok: false, message: `lines[${i}].quantity must be a positive whole number` };
    }
    if (!Number.isFinite(unitPrice) || unitPrice < 0) return { ok: false, message: `lines[${i}].unitPrice must be ≥ 0` };
    lines.push({ productId, variantId, quantity, unitPrice });
  }
  return { ok: true, lines };
}

