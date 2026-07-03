/**
 * Shared (client-safe) types for the discovery map — PLAN_DISCOVERY_MAP §3.
 * Normalization from Strapi shapes happens server-side in
 * `src/lib/server/map/normalizeMapItems.ts`; the client only ever sees these.
 */

export type MapItemKind = 'wish' | 'maagad' | 'offer' | 'mission' | 'resource';

export type MapItem = {
  id: string;
  kind: MapItemKind;
  /** Rounded to a ~1km grid for privacy-sensitive kinds (wish/maagad). */
  lat: number | null;
  lng: number | null;
  /** Declared range in km, for context circles. */
  radius: number | null;
  title: string;
  hint: string | null;
  isOnline: boolean;
  /** Originated from a concierge wish (open-mission/mashaabim with ratson). */
  concierge: boolean;
  href: string | null;
  /** Kind-specific display extras (joiners counts, skills, quorum progress…). */
  meta: Record<string, unknown>;
};

export type MapLayerId = 'wishes' | 'maagadim' | 'offers' | 'missions' | 'resources';

export type MapLayer = {
  id: MapLayerId;
  color: string;
  items: MapItem[];
};

export type DiscoveryLens = 'join' | 'supply';

/** Which layers each lens shows (PLAN_DISCOVERY_MAP §1). */
export const LENS_LAYERS: Record<DiscoveryLens, MapLayerId[]> = {
  join: ['wishes', 'maagadim', 'offers'],
  supply: ['missions', 'resources', 'maagadim']
};

export const LAYER_COLORS: Record<MapLayerId, string> = {
  wishes: '#ec4899',
  maagadim: '#8b5cf6',
  offers: '#f97316',
  missions: '#3b82f6',
  resources: '#10b981'
};
