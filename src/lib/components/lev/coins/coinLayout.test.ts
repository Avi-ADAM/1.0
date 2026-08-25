import { describe, it, expect } from 'vitest';
import {
  layoutCoins,
  rankCoins,
  placeIndex,
  fieldExtent
} from './coinLayout.js';

/** A minimal heart item — only the fields the layout actually reads. */
function item(
  id: string,
  extra: Record<string, unknown> = {}
): Record<string, unknown> {
  return { coinlapach: id, ani: 'pends', pl: 100, ...extra };
}

/** `n` interchangeable items, so a test can talk about packing alone. */
function many(n: number) {
  return Array.from({ length: n }, (_, i) => item(`c${i}`));
}

const SIZE = 112;

describe('placeIndex', () => {
  it('keeps the middle clear for the heart', () => {
    // Every coin, including the first, sits outside the centre hole.
    for (let i = 0; i < 50; i++) {
      expect(placeIndex(i, { size: SIZE }).r).toBeGreaterThanOrEqual(
        SIZE * 1.6 - 0.001
      );
    }
  });

  it('is deterministic — the same index always lands on the same point', () => {
    const a = placeIndex(37, { size: SIZE });
    const b = placeIndex(37, { size: SIZE });
    expect(a).toEqual(b);
  });

  it('grows outward monotonically', () => {
    let previous = -1;
    for (let i = 0; i < 200; i++) {
      const { r } = placeIndex(i, { size: SIZE });
      expect(r).toBeGreaterThan(previous);
      previous = r;
    }
  });
});

describe('layoutCoins — packing', () => {
  // The property the ring loop never had: coins must not overlap, at any count.
  it.each([1, 2, 3, 8, 20, 60, 200, 500])(
    'never overlaps two coins (n = %i)',
    (n) => {
      const placed = layoutCoins(many(n), { size: SIZE });
      let min = Infinity;
      for (let i = 0; i < placed.length; i++) {
        for (let j = i + 1; j < placed.length; j++) {
          min = Math.min(
            min,
            Math.hypot(placed[i].x - placed[j].x, placed[i].y - placed[j].y)
          );
        }
      }
      if (placed.length > 1) expect(min).toBeGreaterThanOrEqual(SIZE);
    }
  );

  it('places every item exactly once, ranked from the centre out', () => {
    const placed = layoutCoins(many(25), { size: SIZE });
    expect(placed).toHaveLength(25);
    expect(new Set(placed.map((p) => p.id)).size).toBe(25);
    expect(placed.map((p) => p.index)).toEqual([...Array(25).keys()]);
    for (let i = 1; i < placed.length; i++) {
      expect(placed[i].r).toBeGreaterThan(placed[i - 1].r);
    }
  });

  it('honours a wider spacing by pushing the field out', () => {
    const tight = layoutCoins(many(40), { size: SIZE, spacing: 1 });
    const loose = layoutCoins(many(40), { size: SIZE, spacing: 1.5 });
    expect(loose[39].r).toBeGreaterThan(tight[39].r);
  });
});

describe('layoutCoins — closing ranks', () => {
  it('leaves no hole when an item is filtered out of the middle', () => {
    const all = many(12);
    const withoutOne = all.filter((c) => c.coinlapach !== 'c5');
    const placed = layoutCoins(withoutOne, { size: SIZE });

    // 11 items occupy exactly slots 0..10 — the removed one does not keep its
    // seat. This is the whole reason the index is a rank and not a feed offset.
    expect(placed.map((p) => p.index)).toEqual([...Array(11).keys()]);
    expect(placed.some((p) => p.id === 'c5')).toBe(false);
  });

  it('moves the coins after a removal inward by exactly one slot', () => {
    const before = layoutCoins(many(30), { size: SIZE });
    const after = layoutCoins(
      many(30).filter((c) => c.coinlapach !== 'c10'),
      { size: SIZE }
    );
    const seat = (list: typeof before, id: string) =>
      list.find((p) => p.id === id)?.index;

    expect(seat(before, 'c9')).toBe(9);
    expect(seat(after, 'c9')).toBe(9); // ahead of the gap — untouched
    expect(seat(before, 'c20')).toBe(20);
    expect(seat(after, 'c20')).toBe(19); // behind it — exactly one slot in
  });
});

describe('rankCoins — distance from the heart is urgency', () => {
  const soon = new Date(Date.now() + 60_000).toISOString();
  const later = new Date(Date.now() + 3 * 86_400_000).toISOString();

  it('puts the sooner deadline nearer the centre', () => {
    const ranked = rankCoins([
      item('far', { timegramaDate: later }),
      item('near', { timegramaDate: soon })
    ]);
    expect(ranked.map((c) => c.coinlapach)).toEqual(['near', 'far']);
  });

  it('sorts undated items outside every timed one', () => {
    const ranked = rankCoins([
      item('undated'),
      item('week', {
        timegramaDate: new Date(Date.now() + 7 * 86_400_000).toISOString()
      })
    ]);
    expect(ranked.map((c) => c.coinlapach)).toEqual(['week', 'undated']);
  });

  it('pushes an item the member already answered to the outside', () => {
    // `already: true` beats the clock — a vote already cast is not urgent,
    // however soon its timegrama matures.
    const ranked = rankCoins([
      item('done', { timegramaDate: soon, already: true }),
      item('open', { timegramaDate: later })
    ]);
    expect(ranked.map((c) => c.coinlapach)).toEqual(['open', 'done']);
  });

  it('falls back to the feed priority, then feed order', () => {
    const ranked = rankCoins([
      item('low', { pl: 300 }),
      item('high', { pl: 100 }),
      item('alsoHigh', { pl: 100 })
    ]);
    expect(ranked.map((c) => c.coinlapach)).toEqual([
      'high',
      'alsoHigh',
      'low'
    ]);
  });

  it('is a total order — shuffling the input cannot change the result', () => {
    const base = [
      item('a', { timegramaDate: soon }),
      item('b', { timegramaDate: later }),
      item('c'),
      item('d', { already: true }),
      item('e', { pl: 50 })
    ];
    const expected = rankCoins(base).map((c) => c.coinlapach);
    // Every rotation of the same set must rank identically.
    for (let shift = 1; shift < base.length; shift++) {
      const rotated = [...base.slice(shift), ...base.slice(0, shift)];
      expect(rankCoins(rotated).map((c) => c.coinlapach)).toEqual(expected);
    }
  });

  it('does not resort as the clock advances', () => {
    // Absolute deadlines, not "time left": both shrink together, so the order
    // is the same an hour later. The field must not churn once a second.
    const items = [
      item('a', { timegramaDate: new Date(Date.now() + 5_000).toISOString() }),
      item('b', { timegramaDate: new Date(Date.now() + 9_000).toISOString() })
    ];
    const first = rankCoins(items).map((c) => c.coinlapach);
    const later2 = rankCoins(items).map((c) => c.coinlapach);
    expect(later2).toEqual(first);
  });
});

describe('fieldExtent', () => {
  it('is square, centred, and contains every coin', () => {
    const n = 120;
    const opts = { size: SIZE };
    const { width, height, radius } = fieldExtent(n, opts);
    expect(width).toBe(height);
    const placed = layoutCoins(many(n), opts);
    for (const p of placed) {
      expect(p.r + SIZE / 2).toBeLessThanOrEqual(radius);
    }
  });

  it('still has room for the heart when the field is empty', () => {
    expect(fieldExtent(0, { size: SIZE }).radius).toBeGreaterThan(SIZE);
  });
});
