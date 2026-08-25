/**
 * coinLayout — where every coin sits in the heart's field, and in what order.
 *
 * This replaces `checkLine()`/`checkLines()` in `newcoinui.svelte`, which walked
 * outward ring by ring ("how many fit in ring 1, ring 2, …") until it passed the
 * item's index. That had three problems, and all three are the reason the coin
 * view feels heavy:
 *
 *   1. **Cost.** Placing item `i` re-derived every ring below it, and the whole
 *      field was re-placed from scratch inside an `$effect` keyed on `arr1` —
 *      an array the processed feeds hand out fresh on every tick. The field
 *      re-laid itself several times a minute while nothing had actually moved.
 *   2. **Holes.** The index was the item's position in the *unfiltered* feed, so
 *      hiding a kind left its slot empty instead of closing ranks.
 *   3. **Seams.** Ring `n` and ring `n+1` each distributed their own items
 *      evenly, so the boundary between them showed as a visible gap.
 *
 * A Vogel (sunflower / phyllotaxis) spiral fixes all three at once: `r = c·√i`
 * with each item turned by the golden angle. It is O(1) per item, it has no
 * rings to seam, and because position depends only on the item's **rank among
 * the visible items**, filtering closes ranks by construction.
 *
 * Nothing here is reactive and nothing here touches the DOM: it is a pure
 * module so `coinLayout.test.ts` can assert the packing properties directly.
 * See docs/PLAN_LEV_COINS.md §Stage 1.
 */

import { rowTimegrama, rowIsActionable } from '../cards/cardKinds.js';

/**
 * The golden angle, `2π(1 − 1/φ)` ≈ 137.507°. Turning by it means no two items
 * ever share a spoke, which is exactly why sunflowers use it.
 */
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/**
 * Empirical constant. With a centre hole of at least `1.8·c` the nearest pair
 * on this spiral sits `1.657·c` apart (measured, n ≤ 500 — and it is the same
 * number at n = 8 and at n = 500, because the spiral's density is uniform).
 * Dividing by a *smaller* number than that spreads the field further apart, so
 * 1.6 is the conservative choice that keeps a real gap between coins.
 */
const MIN_NEIGHBOUR_RATIO = 1.6;

export interface CoinLayoutOptions {
  /** Coin diameter in px. The only figure a caller normally has to pass. */
  size: number;
  /**
   * Breathing room between neighbouring coins, as a multiple of `size`.
   * 1 means "touching"; the default leaves a little over a tenth of a coin.
   */
  spacing?: number;
  /**
   * Radius kept clear in the middle for the heart itself (`midi`/`sv`).
   * Raised to `1.8·c` when it would otherwise be too small to keep the innermost
   * coins apart — see {@link MIN_NEIGHBOUR_RATIO}.
   */
  centerHole?: number;
}

/** A placed coin: the item, its rank, and where its centre goes. */
export interface CoinPlacement<T> {
  item: T;
  /** `coinlapach` — stable across re-renders, and the `{#each}` key. */
  id: string;
  /** Rank in the field: 0 is the coin nearest the heart. */
  index: number;
  /** Centre of the coin, relative to the centre of the field. */
  x: number;
  y: number;
  /** Polar form of the same point, kept for callers that want the angle. */
  r: number;
  angle: number;
}

interface ResolvedOptions {
  size: number;
  spacing: number;
  centerHole: number;
  /** Radial constant: `r = √(hole² + c²·i)`. */
  c: number;
}

/** Fill in the defaults and derive the radial constant. */
function resolve(options: CoinLayoutOptions): ResolvedOptions {
  const size = Math.max(1, options.size);
  const spacing = Math.max(1, options.spacing ?? 1.12);
  const c = (size * spacing) / MIN_NEIGHBOUR_RATIO;
  // Below 1.8·c the innermost coins crowd each other; the hole is also what
  // keeps the field clear of the heart in the middle.
  const centerHole = Math.max(options.centerHole ?? size * 1.6, c * 1.8);
  return { size, spacing, centerHole, c };
}

/**
 * Where the coin ranked `index` sits, relative to the centre of the field.
 *
 * `r = √(hole² + c²·i)` rather than the textbook `c·√i`: adding the hole under
 * the root keeps the *density* uniform while clearing the middle, where the
 * plain form would pile the first few coins on top of the heart.
 */
export function placeIndex(
  index: number,
  options: CoinLayoutOptions
): { x: number; y: number; r: number; angle: number } {
  const { centerHole, c } = resolve(options);
  const i = Math.max(0, index);
  const r = Math.sqrt(centerHole * centerHole + c * c * i);
  const angle = i * GOLDEN_ANGLE;
  return { x: r * Math.cos(angle), y: r * Math.sin(angle), r, angle };
}

/**
 * Sort key for "how badly does this want the member's attention", most urgent
 * first. The comparator below reads it top to bottom.
 *
 * The deadline is kept as an **absolute** timestamp, never as "time left". Both
 * shrink at the same rate, so absolute time gives the same order while being
 * completely stable: the field must not resort itself once a second. A coin
 * therefore drifts inward only when something nearer the heart is resolved and
 * leaves — which is the movement that means something.
 */
function sortKey(item: any, feedIndex: number) {
  const deadline = rowTimegrama(item);
  const at = deadline ? new Date(deadline).getTime() : NaN;
  return {
    // A vote the member has already cast is not urgent, whatever its clock
    // says, so it never belongs in the inner ring.
    actionable: rowIsActionable(item) ? 0 : 1,
    timed: Number.isFinite(at) ? 0 : 1,
    at: Number.isFinite(at) ? at : Number.POSITIVE_INFINITY,
    // `pl` is the feed's own priority band (see mergeAndSort in levProcessors).
    pl: Number(item?.pl ?? 999),
    feedIndex,
    id: String(item?.coinlapach ?? '')
  };
}

/**
 * Rank items by urgency: actionable before settled, timed before undated,
 * soonest deadline first, then the feed's own priority, then feed order.
 *
 * Every tie is broken by `coinlapach`, so the result is a total order — two
 * renders of the same set can never disagree about who sits where.
 */
export function rankCoins<T>(items: readonly T[]): T[] {
  return items
    .map((item, feedIndex) => ({ item, key: sortKey(item, feedIndex) }))
    .sort((a, b) => {
      const x = a.key;
      const y = b.key;
      return (
        x.actionable - y.actionable ||
        x.timed - y.timed ||
        x.at - y.at ||
        x.pl - y.pl ||
        x.feedIndex - y.feedIndex ||
        (x.id < y.id ? -1 : x.id > y.id ? 1 : 0)
      );
    })
    .map((entry) => entry.item);
}

/**
 * Rank the visible items and place them. This is the whole public surface the
 * coin view needs: hand it the already-filtered list, get back what to render.
 */
export function layoutCoins<T>(
  items: readonly T[],
  options: CoinLayoutOptions
): CoinPlacement<T>[] {
  const opts = resolve(options);
  return rankCoins(items).map((item, index) => {
    const { x, y, r, angle } = placeIndex(index, opts);
    return {
      item,
      id: String((item as any)?.coinlapach ?? index),
      index,
      x,
      y,
      r,
      angle
    };
  });
}

/**
 * How big the scrollable field has to be to hold `count` coins, in px.
 *
 * Square and centred, because the spiral is: the caller places the heart at
 * `width/2, height/2` and every placement is relative to that point.
 */
export function fieldExtent(
  count: number,
  options: CoinLayoutOptions
): { width: number; height: number; radius: number } {
  const opts = resolve(options);
  const outer = count > 0 ? placeIndex(count - 1, opts).r : opts.centerHole;
  // Half a coin for the outermost one, then a coin of margin so the last ring
  // is not glued to the edge of the scroll area.
  const radius = outer + opts.size * 1.5;
  return { width: radius * 2, height: radius * 2, radius };
}
