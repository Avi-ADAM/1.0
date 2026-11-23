/**
 * "Supplier in a minute" (docs/inprogress/PLAN_SUPPLIER_GROWTH.md SG1).
 *
 * A guest on /join/supplier drafts their business with /api/analyze-business,
 * sees it, and then leaves a name and an email. That is the whole form: the
 * draft becomes a pending assistant session through the same `prepareSignup`
 * an agent uses, and the person continues on the studio link — the full review
 * screen, editable, with sign-up-and-create at its end. Nothing is created in
 * their name before they sign the agreement there.
 *
 * Pure: the request schema and the one change this page makes to the draft —
 * the service area the person drew on the map, which the analysis cannot know.
 */

import { z } from 'zod';

export const ServiceAreaSchema = z.object({
  isOnline: z.boolean().optional(),
  lat: z.number().min(-90).max(90).nullish(),
  lng: z.number().min(-180).max(180).nullish(),
  /** km, as LocationPicker gives it. */
  radius: z.number().min(0).max(20_000).nullish(),
  hint: z.string().trim().max(200).nullish()
});

export type ServiceArea = z.infer<typeof ServiceAreaSchema>;

export const SupplierJoinSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email().max(200),
  lang: z.enum(['he', 'en', 'ar', 'ru', 'es']).optional(),
  /** What the analysis read — the address or the paragraph. */
  sourceText: z.string().trim().max(8000).optional(),
  blueprint: z.record(z.string(), z.unknown()),
  area: ServiceAreaSchema.optional()
});

export type SupplierJoinInput = z.infer<typeof SupplierJoinSchema>;

/**
 * The service area as the blueprint's `fields.location` (the rikma's location;
 * a product without its own inherits it — PLAN_LOCATION_MAPS §6). An area with
 * neither a point nor "online" says nothing, and is left out rather than
 * written as an empty location.
 */
export function areaToLocation(area: ServiceArea | undefined): Record<string, unknown> | undefined {
  if (!area) return undefined;
  const hasPoint = typeof area.lat === 'number' && typeof area.lng === 'number';
  if (area.isOnline && !hasPoint) return { isOnline: true };
  if (!hasPoint) return undefined;
  const out: Record<string, unknown> = { lat: area.lat, lng: area.lng };
  if (typeof area.radius === 'number') out.radius = area.radius;
  if (area.isOnline) out.isOnline = true;
  if (area.hint) out.hint = area.hint;
  return out;
}

/**
 * The draft with the person's service area, always on the business track.
 * Returns a copy; a location the analysis already produced is replaced only
 * when the person actually drew one.
 */
export function withServiceArea(blueprint: Record<string, unknown>, area: ServiceArea | undefined): Record<string, unknown> {
  const fields = { ...((blueprint.fields as Record<string, unknown> | undefined) ?? {}) };
  fields.track = 'business';
  const loc = areaToLocation(area);
  if (loc) fields.location = loc;
  return { ...blueprint, fields };
}

/** The products a guest sees before leaving their email — names only, a few. */
export function previewProducts(blueprint: unknown, max = 6): { name: string; price?: number; currency?: string }[] {
  const products = (blueprint as { products?: unknown })?.products;
  if (!Array.isArray(products)) return [];
  return products
    .filter((p): p is Record<string, unknown> => !!p && typeof p === 'object' && typeof (p as any).name === 'string')
    .slice(0, max)
    .map((p) => ({
      name: String(p.name),
      ...(typeof p.price === 'number' ? { price: p.price } : {}),
      ...(typeof p.currency === 'string' ? { currency: p.currency } : {})
    }));
}

/** A same-site path from one of prepareSignup's absolute www links, so dev and previews stay on their own host. */
export function sitePath(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    return `${u.pathname}${u.search}`;
  } catch {
    return undefined;
  }
}
