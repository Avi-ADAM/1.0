import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { get } from 'svelte/store';

// Both modules under test are browser-only by design: `motionSpeed()` returns 0
// on the server (nothing is animating during SSR) and the cookie/matchMedia
// wiring is skipped. happy-dom gives us a real window, so tell them so —
// otherwise every timing assertion below would pass trivially against 0.
vi.mock('$app/environment', () => ({ browser: true, dev: true, building: false }));

import { theme, THEMES } from './theme.js';
import {
  motionChoice,
  motionMode,
  sceneVisible,
  sceneAnimates,
  MOTION_MODES,
  setMotionChoice,
  nextMotionMode,
  motionSpeed,
  noteMotionActivity
} from './motion.js';

/*
 * These cover the decision the homepage's 3D scene asks this module to make.
 * The regression that matters most is the last group: before it, three scene
 * components each read `prefers-reduced-motion` once at module load, so a
 * visitor had no way to quieten the movement and the OS preference could never
 * change anything after the first paint.
 */

describe('motion store', () => {
  beforeEach(() => {
    setMotionChoice('auto');
    theme.set(THEMES.personal);
  });

  describe('nextMotionMode', () => {
    it('cycles playing → paused → hidden → playing', () => {
      expect(nextMotionMode(MOTION_MODES.full)).toBe(MOTION_MODES.calm);
      expect(nextMotionMode(MOTION_MODES.calm)).toBe(MOTION_MODES.off);
      expect(nextMotionMode(MOTION_MODES.off)).toBe(MOTION_MODES.full);
    });

    it('sends an undecided visitor to full motion, so the cycle is closed', () => {
      expect(nextMotionMode('auto')).toBe(MOTION_MODES.full);
    });
  });

  describe('resolution', () => {
    it('animates by default', () => {
      expect(get(motionMode)).toBe(MOTION_MODES.full);
      expect(get(sceneVisible)).toBe(true);
      expect(get(sceneAnimates)).toBe(true);
    });

    it('settles the scene in the professional (business) theme', () => {
      theme.set(THEMES.business);
      expect(get(motionMode)).toBe(MOTION_MODES.calm);
      // "calm" is pause, not hide — the artwork has to survive it.
      expect(get(sceneVisible)).toBe(true);
      expect(get(sceneAnimates)).toBe(false);
    });

    it('lets an explicit choice override the theme default', () => {
      theme.set(THEMES.business);
      setMotionChoice(MOTION_MODES.full);
      expect(get(motionMode)).toBe(MOTION_MODES.full);
    });

    it('unmounts the scene entirely when hidden, so its models never load', () => {
      setMotionChoice(MOTION_MODES.off);
      expect(get(sceneVisible)).toBe(false);
      expect(get(sceneAnimates)).toBe(false);
    });

    it('returns to the automatic decision when the choice is cleared', () => {
      theme.set(THEMES.business);
      setMotionChoice(MOTION_MODES.full);
      expect(get(motionMode)).toBe(MOTION_MODES.full);

      setMotionChoice('auto');
      expect(get(motionChoice)).toBe('auto');
      expect(get(motionMode)).toBe(MOTION_MODES.calm);
    });

    it('ignores a junk cookie value rather than inheriting off Object.prototype', () => {
      // `motion=constructor` resolves to a function through a bare lookup.
      setMotionChoice('constructor' as never);
      expect(get(motionChoice)).toBe('auto');
      expect(get(motionMode)).toBe(MOTION_MODES.full);
    });
  });

  describe('idle ramp', () => {
    // IDLE_AFTER_MS = 6000, RAMP_MS = 5000, IDLE_FLOOR = 0.12
    const T = 1_000_000;
    let now = T;

    beforeEach(() => {
      now = T;
      vi.spyOn(performance, 'now').mockImplementation(() => now);
      setMotionChoice(MOTION_MODES.full);
      noteMotionActivity();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('runs at full speed while the visitor is engaging', () => {
      expect(motionSpeed()).toBe(1);
    });

    it('holds full speed right up to the idle threshold', () => {
      now = T + 6000;
      expect(motionSpeed()).toBe(1);
    });

    it('eases down rather than cutting out', () => {
      now = T + 6000 + 2500; // halfway through the ramp
      const mid = motionSpeed();
      expect(mid).toBeLessThan(1);
      expect(mid).toBeGreaterThan(0.12);
      // smoothstep(0.5) = 0.5  →  1 - (1 - 0.12) * 0.5
      expect(mid).toBeCloseTo(0.56, 5);
    });

    it('settles at a slow drift instead of freezing', () => {
      now = T + 6000 + 5000;
      expect(motionSpeed()).toBeCloseTo(0.12, 5);
      now = T + 600_000;
      expect(motionSpeed()).toBeCloseTo(0.12, 5);
    });

    it('wakes back to full speed when the visitor returns', () => {
      now = T + 600_000;
      expect(motionSpeed()).toBeCloseTo(0.12, 5);

      noteMotionActivity();
      expect(motionSpeed()).toBe(1);
    });

    it('reports no movement at all once paused, however long the visitor stays', () => {
      setMotionChoice(MOTION_MODES.calm);
      expect(motionSpeed()).toBe(0);
      now = T + 600_000;
      expect(motionSpeed()).toBe(0);
    });

    it('reports no movement when the scene is hidden', () => {
      setMotionChoice(MOTION_MODES.off);
      expect(motionSpeed()).toBe(0);
    });
  });
});
