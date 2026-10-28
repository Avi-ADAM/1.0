import { describe, expect, it } from 'vitest';
import { layoutRing, type RingLayout } from './ringLayout';

const ring = (o: Parameters<typeof layoutRing>[0]) => {
  const r = layoutRing(o);
  if (r.mode !== 'ring') throw new Error('expected a ring');
  return r as RingLayout;
};
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

describe('layoutRing', () => {
  it.each([3, 5, 8])('%i circles touch the photo and never each other', (count) => {
    const r = ring({ width: 1600, height: 1000, count, gap: 10 });
    for (const p of r.orbs) {
      // centre-to-centre = photo radius + orb radius + gap
      expect(dist(p, r.center)).toBeCloseTo(r.center.size / 2 + r.size / 2 + 10, 5);
    }
    for (let i = 0; i < count; i++) {
      expect(dist(r.orbs[i], r.orbs[(i + 1) % count])).toBeGreaterThanOrEqual(r.size + 10 - 1e-6);
    }
    expect(r.center.size).toBeGreaterThanOrEqual(r.size * 1.2 - 1e-6);
  });

  it('fits inside the field', () => {
    const r = ring({ width: 1400, height: 900, reserveTop: 60, reserveBottom: 40, count: 8 });
    for (const p of r.orbs) {
      expect(p.y - r.size / 2).toBeGreaterThanOrEqual(60 - 1e-6);
      expect(p.y + r.size / 2).toBeLessThanOrEqual(900 - 40 + 1e-6);
    }
  });

  it('starts at the top', () => {
    const r = ring({ width: 1600, height: 1000, count: 4 });
    expect(r.orbs[0].x).toBeCloseTo(r.center.x, 5);
    expect(r.orbs[0].y).toBeLessThan(r.center.y);
  });

  it('keeps a readable ring on a short laptop screen and grows the field', () => {
    const r = ring({ width: 1280, height: 495, reserveTop: 64, count: 7 });
    expect(r.size).toBe(150);
    expect(r.fieldHeight).toBeGreaterThan(495);
    for (const p of r.orbs) {
      expect(p.y - r.size / 2).toBeGreaterThanOrEqual(64 - 1e-6);
      expect(p.y + r.size / 2).toBeLessThanOrEqual(r.fieldHeight + 1e-6);
    }
  });

  it('stacks when the circles would be unreadable', () => {
    expect(layoutRing({ width: 390, height: 800, count: 8 }).mode).toBe('stack');
    expect(layoutRing({ width: 1600, height: 1000, count: 0 }).mode).toBe('stack');
  });
});
