import { describe, it, expect } from 'vitest';
import { layoutOrbit, type OrbitLayout } from './orbitLayout.js';

function orbit(width: number, height: number, count = 10, rtl = true): OrbitLayout {
  const l = layoutOrbit({ width, height, count, rtl });
  if (l.mode !== 'orbit') throw new Error(`expected orbit at ${width}×${height}`);
  return l;
}

/** Every packing property the page relies on, for one layout. */
function assertPacked(l: OrbitLayout, width: number, height: number) {
  const r = l.size / 2;
  for (const p of l.orbs) {
    // Inside the field.
    expect(p.x - r).toBeGreaterThanOrEqual(-0.5);
    expect(p.y - r).toBeGreaterThanOrEqual(-0.5);
    expect(p.x + r).toBeLessThanOrEqual(width + 0.5);
    expect(p.y + r).toBeLessThanOrEqual(height + 0.5);
    // Clear of the badge: the nearest point of its box is outside the circle.
    const { x, y, w, h } = l.center;
    const nx = Math.max(x, Math.min(p.x, x + w));
    const ny = Math.max(y, Math.min(p.y, y + h));
    expect(Math.hypot(p.x - nx, p.y - ny)).toBeGreaterThanOrEqual(r - 0.5);
  }
  // No two circles touch.
  for (let i = 0; i < l.orbs.length; i++) {
    for (let j = i + 1; j < l.orbs.length; j++) {
      const a = l.orbs[i];
      const b = l.orbs[j];
      expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(l.size - 0.5);
    }
  }
}

describe('layoutOrbit', () => {
  it('orbits a full-HD screen with large circles', () => {
    const l = orbit(1920, 900);
    expect(l.orbs).toHaveLength(10);
    expect(l.size).toBeGreaterThanOrEqual(220);
    expect(l.size).toBeLessThanOrEqual(250);
    assertPacked(l, 1920, 900);
  });

  it('orbits a laptop screen', () => {
    const l = orbit(1366, 590);
    assertPacked(l, 1366, 590);
  });

  it('orbits a portrait tablet in single columns', () => {
    const l = orbit(768, 950);
    assertPacked(l, 768, 950);
  });

  it('packs odd counts without overlap', () => {
    for (const count of [7, 9, 11]) {
      const l = orbit(1920, 900, count);
      expect(l.orbs).toHaveLength(count);
      assertPacked(l, 1920, 900);
    }
  });

  it('stacks on a phone instead of shrinking circles', () => {
    expect(layoutOrbit({ width: 390, height: 760, count: 10 }).mode).toBe('stack');
    expect(layoutOrbit({ width: 844, height: 340, count: 10 }).mode).toBe('stack');
  });

  it('never returns a circle below the readable minimum', () => {
    for (const [w, h] of [
      [1024, 600],
      [1280, 480],
      [1440, 700],
      [2560, 1300]
    ]) {
      const l = layoutOrbit({ width: w, height: h, count: 10 });
      if (l.mode === 'orbit') expect(l.size).toBeGreaterThanOrEqual(160);
    }
  });

  it('puts the first half on the reading-start side', () => {
    const rtl = orbit(1920, 900, 10, true);
    const ltr = orbit(1920, 900, 10, false);
    for (let i = 0; i < 5; i++) {
      expect(rtl.orbs[i].x).toBeGreaterThan(960);
      expect(ltr.orbs[i].x).toBeLessThan(960);
    }
    for (let i = 5; i < 10; i++) {
      expect(rtl.orbs[i].x).toBeLessThan(960);
      expect(ltr.orbs[i].x).toBeGreaterThan(960);
    }
  });

  it('keeps the badge above the footer bar while the sides run past it', () => {
    const l = layoutOrbit({ width: 1280, height: 551, reserveBottom: 72, count: 10 });
    if (l.mode !== 'orbit') throw new Error('expected orbit on a 1280×551 laptop');
    expect(l.center.y + l.center.h).toBeLessThanOrEqual(551 - 72);
    // At least one circle uses the height beside the bar.
    expect(Math.max(...l.orbs.map((p) => p.y + l.size / 2))).toBeGreaterThan(551 - 72);
    assertPacked(l, 1280, 551);
  });

  it('is deterministic', () => {
    expect(orbit(1600, 820)).toEqual(orbit(1600, 820));
  });

  it('stacks when there is nothing to place', () => {
    expect(layoutOrbit({ width: 1920, height: 900, count: 0 }).mode).toBe('stack');
  });
});
