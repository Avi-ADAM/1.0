/**
 * The demand-pool panel on a wish's review page — PLAN_SHARED_PURCHASE §5/§9.
 *
 * Lev's extraction can judge that a wish only happens at volume (a weekly
 * basket, a minibus route: `ai_meta.volume`). The owner then gets what the
 * plan promised the composer would offer first: join a pool that already
 * wants the same thing nearby, or open one and be its first member. Nothing
 * here acts on its own — the panel only lists; joining and opening are her
 * taps (§2.1: a wish is never pooled without its owner).
 *
 * Pure: the loader hands in the raw qid answers (440, 223) and gets the panel.
 */

import { haversineKm } from '../geo/haversine.js';
import { nameSimilarity, similarity } from './clustering.js';

export interface WishVolume {
  minPeople: number | null;
  why: string;
}

export interface PoolRow {
  id: string;
  name: string;
  /** interested + signed + active */
  members: number;
  distanceKm: number | null;
}

export interface WishPoolPanel {
  volume: WishVolume | null;
  /** The pool this wish is already in, or was invited to (`suggested`). */
  mine: (PoolRow & { memberStatus: string }) | null;
  /** Open pools that fit the wish, best first. Empty once she is in one. */
  similar: PoolRow[];
  /** openMaagad needs a point for a physical wish (§10). */
  canOpen: boolean;
}

export interface PoolWish {
  id: string;
  name: string;
  status: string;
  fulfilled: boolean;
  isOnline: boolean;
  lat: number | null;
  lng: number | null;
  radius: number | null;
  frequency: string | null;
  categoryIds: string[];
}

/** A wish still looking for someone — the only kind a pool can help. */
const LIVE_STATUSES = new Set(['open', 'matching', 'negotiating']);
const JOINABLE_POOL = new Set(['forming', 'visible', 'offered']);
/** A physical wish with no radius on either side still means "near me". */
const DEFAULT_RADIUS_KM = 15;
const SIM_THRESHOLD = 0.34;
const MAX_SIMILAR = 3;

/** `ai_meta.volume` as saved by the composer → a WishVolume, or null. */
export function volumeOf(aiMeta: unknown): WishVolume | null {
  const v = (aiMeta as any)?.volume;
  if (!v || typeof v !== 'object') return null;
  const n = Number(v.minPeople);
  return {
    minPeople: Number.isFinite(n) && n >= 2 ? Math.round(n) : null,
    why: typeof v.why === 'string' ? v.why : ''
  };
}

function num(v: unknown): number | null {
  const n = typeof v === 'string' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
}

function poolOf(node: any) {
  const a = node?.attributes ?? {};
  return {
    id: String(node?.id ?? ''),
    name: String(a.name ?? ''),
    status: String(a.status_maagad ?? ''),
    global: a.scope === 'global',
    lat: num(a.lat),
    lng: num(a.lng),
    radius: num(a.radius),
    frequency: a.frequency ?? null,
    categoryIds: (a.categories?.data ?? []).map((c: any) => String(c.id)),
    members: (a.members?.data ?? []).length
  };
}

type Pool = ReturnType<typeof poolOf>;

/**
 * Does this pool want what the wish wants, where the wish wants it? Same hard
 * gates as clustering (§5.3), relaxed only where a pool opened by hand carries
 * no categories: then the name alone decides.
 */
export function poolFit(wish: PoolWish, pool: Pool): { score: number; distanceKm: number | null } | null {
  if ((wish.frequency || 'one_time') !== (pool.frequency || 'one_time')) return null;

  const bothCategorised = wish.categoryIds.length > 0 && pool.categoryIds.length > 0;
  if (bothCategorised && !wish.categoryIds.some((c) => pool.categoryIds.includes(c))) return null;

  let distanceKm: number | null = null;
  if (wish.isOnline !== pool.global) return null;
  if (!wish.isOnline) {
    if (wish.lat == null || wish.lng == null || pool.lat == null || pool.lng == null) return null;
    const radii = [wish.radius, pool.radius].filter((r): r is number => r != null && r > 0);
    const reach = radii.length ? Math.min(...radii) : DEFAULT_RADIUS_KM;
    distanceKm = haversineKm(wish.lat, wish.lng, pool.lat, pool.lng);
    if (distanceKm > reach) return null;
  }

  const score = bothCategorised
    ? similarity(wish, { ...pool, isOnline: pool.global })
    : nameSimilarity(wish.name, pool.name);
  if (score < SIM_THRESHOLD) return null;
  return { score, distanceKm: distanceKm == null ? null : Math.round(distanceKm * 10) / 10 };
}

export function buildWishPoolPanel(input: {
  wish: PoolWish;
  aiMeta: unknown;
  /** qid 440 → maagadMembers.data */
  memberships: any[];
  /** qid 223 → maagads.data */
  pools: any[];
}): WishPoolPanel | null {
  const { wish } = input;
  if (wish.fulfilled || !LIVE_STATUSES.has(wish.status)) return null;

  const volume = volumeOf(input.aiMeta);
  const row = (input.memberships ?? []).find((m) => m?.attributes?.maagad?.data?.id != null);
  const mine = row
    ? (() => {
        const p = poolOf(row.attributes.maagad.data);
        return {
          id: p.id,
          name: p.name,
          members: p.members,
          distanceKm: null,
          memberStatus: String(row.attributes.status_member ?? '')
        };
      })()
    : null;

  // Lev did not judge it a volume wish and nobody pooled it: nothing to say.
  if (!volume && !mine) return null;

  const canOpen = wish.isOnline || (wish.lat != null && wish.lng != null);
  if (mine) return { volume, mine, similar: [], canOpen };

  const similar = (input.pools ?? [])
    .map(poolOf)
    .filter((p) => p.id && JOINABLE_POOL.has(p.status))
    .map((p) => ({ p, fit: poolFit(wish, p) }))
    .filter((x): x is { p: Pool; fit: { score: number; distanceKm: number | null } } => !!x.fit)
    .sort((a, b) => b.fit.score - a.fit.score || b.p.members - a.p.members)
    .slice(0, MAX_SIMILAR)
    .map(({ p, fit }) => ({ id: p.id, name: p.name, members: p.members, distanceKm: fit.distanceKm }));

  return { volume, mine: null, similar, canOpen };
}
