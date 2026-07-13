const RESTIME_HOURS: Record<string, number> = { feh: 48, sth: 72, nsh: 96, sevend: 168 };

export function calcDeadlineMs(restime: string): number {
  return (RESTIME_HOURS[restime] ?? 48) * 3600000;
}

const RESTIME_LABEL: Record<string, { he: string; en: string }> = {
  feh: { he: 'יומיים (48 שעות)', en: '48 hours' },
  sth: { he: 'שלושה ימים (72 שעות)', en: '72 hours' },
  nsh: { he: 'ארבעה ימים (96 שעות)', en: '96 hours' },
  sevend: { he: 'שבוע', en: 'one week' }
};

/** Human-readable duration of the rikma's response time (restime). */
export function restimeLabel(restime: string | null | undefined, lang: 'he' | 'en'): string {
  return (RESTIME_LABEL[restime ?? 'feh'] ?? RESTIME_LABEL.feh)[lang];
}

/**
 * Deep link to the focused single-entity vote page
 * (`/moach/[projectId]/votes/[kind]/[id]`). Relative path on purpose: the
 * socket client `goto()`s it and the service-worker resolves it against the
 * site origin for push clicks.
 */
export function voteUrl(
  projectId: string | number,
  kind: 'pendm' | 'pmash' | 'ask' | 'askm' | 'tosplit' | 'decision',
  id: string | number
): string {
  return `/moach/${projectId}/votes/${kind}/${id}`;
}

/**
 * Extract a plain relation ID from a value that may be either a scalar
 * (`"1"` / `1`) or a populated GraphQL relation (`{ data: { id } }` / `{ id }`).
 * Returns `null` when no ID can be resolved.
 */
export function extractRelationId(value: any): string | null {
  if (value == null) return null;
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (value?.data?.id != null) return String(value.data.id);
  if (value?.id != null) return String(value.id);
  return null;
}

export interface RawLocation {
  location_mode?: string | null;
  isOnline?: boolean | null;
  lat?: number | null;
  lng?: number | null;
  radius?: number | null;
  location_hint?: string | null;
}

/**
 * Convert a raw location object (from the client or a stored snapshot) into a
 * `ComponentNewLocationInput`. Drops `isOnline` (not part of the component input),
 * rounds `radius` to an integer (Strapi `Long`), and omits empty fields.
 * Returns `null` when there is nothing meaningful to store.
 */
export function normalizeLocationInput(loc?: RawLocation | null): Record<string, any> | null {
  if (!loc) return null;
  const out: Record<string, any> = {};
  if (loc.location_mode) out.location_mode = loc.location_mode;
  if (loc.lat != null) out.lat = loc.lat;
  if (loc.lng != null) out.lng = loc.lng;
  if (loc.radius != null) out.radius = Math.round(loc.radius);
  if (loc.location_hint) out.location_hint = loc.location_hint;
  return Object.keys(out).length > 0 ? out : null;
}
