/**
 * ringLayout — the public profile's picture: the member's photo as one large
 * circle in the middle, and every list they have as a circle pressed against
 * it, all the way round.
 *
 * Given the field and how many circles ring the photo, it returns the biggest
 * ring that fits: one diameter for every ring circle, a ring radius, and the
 * photo filling the space the ring leaves in the middle — so the circles
 * always touch the photo (one `gap` away), whether there are three of them or
 * eight. A short screen (a laptop) does not shrink the circles below `minOrb`
 * — a circle that holds a list is unreadable below that — it keeps the ring
 * and makes the field taller than the screen (`fieldHeight`), so the page
 * scrolls a little. Only when even the width cannot hold a readable ring (a
 * phone) does it answer `mode: 'stack'`, and the page lays the circles out in
 * a scrolling grid under the photo instead.
 *
 * Pure and DOM-free; `ringLayout.test.ts` asserts the geometry.
 */

export interface RingOptions {
  width: number;
  height: number;
  /** Kept clear at the top (the header / the guest pill). */
  reserveTop?: number;
  /** Kept clear at the bottom (the footer bar). */
  reserveBottom?: number;
  count: number;
  /** Reading direction: the ring runs from the top towards the start side. */
  rtl?: boolean;
  gap?: number;
  minOrb?: number;
  maxOrb?: number;
  /** The photo is never smaller than this many ring-circle diameters. */
  minCenterRatio?: number;
}

export interface RingLayout {
  mode: 'ring';
  center: { x: number; y: number; size: number };
  /** Ring-circle diameter. */
  size: number;
  radius: number;
  orbs: { x: number; y: number }[];
  /** The field's height: the screen's, or taller when the ring needs it. */
  fieldHeight: number;
}

export function layoutRing({
  width,
  height,
  reserveTop = 0,
  reserveBottom = 0,
  count,
  rtl = true,
  gap = 10,
  minOrb = 150,
  maxOrb = 270,
  minCenterRatio = 1.2
}: RingOptions): RingLayout | { mode: 'stack' } {
  if (count < 1 || width <= 0 || height <= 0) return { mode: 'stack' };

  // radius = a·s + b: the larger of "the photo is at least minCenterRatio·s"
  // and "neighbours on the ring do not overlap".
  const sin = count > 1 ? Math.sin(Math.PI / count) : 1;
  const byCenter = { a: (minCenterRatio + 1) / 2, b: gap };
  const byNeighbours = { a: 1 / (2 * sin), b: gap / (2 * sin) };
  // The whole ring spans 2·radius + s ≤ D; solve for s under each constraint
  // and keep the one that binds.
  const sizeIn = (D: number) =>
    Math.min(
      ...[byCenter, ...(count > 1 ? [byNeighbours] : [])].map(({ a, b }) => (D - 2 * b) / (2 * a + 1))
    );

  const availH = height - reserveTop - reserveBottom;
  let size = Math.min(sizeIn(Math.min(width, availH) - 2 * gap), maxOrb);
  if (size < minOrb) {
    // Too short, not too narrow: keep a readable ring and let the page scroll.
    if (sizeIn(width - 2 * gap) < minOrb) return { mode: 'stack' };
    size = minOrb;
  }

  const radius = Math.max(
    byCenter.a * size + byCenter.b,
    count > 1 ? byNeighbours.a * size + byNeighbours.b : 0
  );
  const ringH = 2 * (radius + size / 2 + gap);
  const fieldH = Math.max(availH, ringH);
  const cx = width / 2;
  const cy = reserveTop + fieldH / 2;
  const dir = rtl ? 1 : -1;
  const orbs = Array.from({ length: count }, (_, i) => {
    const ang = -Math.PI / 2 + dir * ((2 * Math.PI * i) / count);
    return { x: cx + radius * Math.cos(ang), y: cy + radius * Math.sin(ang) };
  });

  return {
    mode: 'ring',
    center: { x: cx, y: cy, size: 2 * (radius - size / 2 - gap) },
    size,
    radius,
    orbs,
    // A page that scrolls gets the footer's reserve as body padding already.
    fieldHeight: Math.max(height, reserveTop + ringH)
  };
}
