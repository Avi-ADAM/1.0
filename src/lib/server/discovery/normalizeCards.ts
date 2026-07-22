/**
 * Server-side normalizers for the public discovery directories
 * (/project and /gift index pages). Same contract as the map normalizers
 * (src/lib/server/map/normalizeMapItems.ts): raw Strapi nodes come in, only
 * these flat card shapes ever leave the server — relation slices are reduced
 * to aggregate counts here, never in the browser.
 */

import { resolveLocation } from '../map/normalizeMapItems.js';

type StrapiNode = { id: string | number; attributes?: Record<string, any> | null };

function num(v: unknown): number | null {
  const n = typeof v === 'string' ? Number(v) : (v as number);
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
}

function picUrlOf(pic: any): string | null {
  const attrs = pic?.data?.attributes;
  if (!attrs) return null;
  return attrs.formats?.small?.url || attrs.formats?.thumbnail?.url || attrs.url || null;
}

export type ProjectCard = {
  id: string;
  name: string;
  description: string | null;
  city: string | null;
  picUrl: string | null;
  lat: number | null;
  lng: number | null;
  radius: number | null;
  hint: string | null;
  isOnline: boolean;
  membersCount: number;
  openMissionsCount: number;
  openResourcesCount: number;
  productsCount: number;
  createdAt: string | null;
};

/** Projects directory (QID 281). A rikma is a public entity — its location is
 *  shown as-is, same as the mission/product fallbacks on the map. */
export function normalizeProjectCard(node: StrapiNode): ProjectCard | null {
  const a = node?.attributes;
  if (!a || !a.projectName) return null;
  const loc = resolveLocation(a.location);
  return {
    id: String(node.id),
    name: a.projectName,
    description: a.publicDescription ?? null,
    city: a.city ?? null,
    picUrl: picUrlOf(a.profilePic),
    lat: loc.lat,
    lng: loc.lng,
    radius: loc.radius,
    hint: loc.hint,
    isOnline: a.location?.location_mode === 'online' || loc.lat === null,
    membersCount: a.user_1s?.data?.length ?? 0,
    openMissionsCount: a.open_missions?.data?.length ?? 0,
    openResourcesCount: a.open_mashaabims?.data?.length ?? 0,
    productsCount: a.matanotofs?.data?.length ?? 0,
    createdAt: a.createdAt ?? null
  };
}

export type ProductCard = {
  id: string;
  name: string;
  price: number | null;
  quant: number | null;
  kindOf: string | null;
  personal: boolean;
  sellerName: string | null;
  projectId: string | null;
  projectName: string | null;
  picUrl: string | null;
  categories: string[];
  lat: number | null;
  lng: number | null;
  radius: number | null;
  hint: string | null;
  isOnline: boolean;
  createdAt: string | null;
};

/** Products directory (QID 282). Location fallback chain and seller rules are
 *  identical to normalizeProduct on the map (own location → project location);
 *  unlocated non-online products are kept here — a directory, unlike a map,
 *  should list everything. */
export function normalizeProductCard(node: StrapiNode): ProductCard | null {
  const a = node?.attributes;
  if (!a || !a.name) return null;
  const project = a.projectcreates?.data?.[0] ?? null;
  const own = { lat: a.lat, lng: a.lng, radius: a.radius, location_hint: null };
  const loc = resolveLocation(a.location, own, project?.attributes?.location);
  const personal = a.origin === 'personal';
  return {
    id: String(node.id),
    name: a.name,
    price: num(a.price),
    quant: num(a.quant),
    kindOf: a.kindOf ?? null,
    personal,
    sellerName: personal
      ? (a.owner_user?.data?.attributes?.username ?? null)
      : (project?.attributes?.projectName ?? null),
    projectId: project ? String(project.id) : null,
    projectName: project?.attributes?.projectName ?? null,
    picUrl: picUrlOf(a.pic),
    categories: (a.categories?.data ?? [])
      .map((c: any) => c?.attributes?.name)
      .filter(Boolean),
    lat: loc.lat,
    lng: loc.lng,
    radius: loc.radius,
    hint: loc.hint,
    isOnline: a.location?.location_mode === 'online',
    createdAt: a.createdAt ?? null
  };
}
