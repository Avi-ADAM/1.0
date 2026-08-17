import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';

vi.mock('$app/environment', () => ({ browser: true, dev: true, building: false }));

import {
  a11y,
  a11yTouched,
  TEXT_SCALES,
  cycleTextScale,
  toggleA11y,
  resetA11y,
  A11Y_COOKIE
} from './a11y.js';

/*
 * These settings are the ones the vendored NagishLi widget was supposed to
 * offer and never did. The cookie round trip matters most: it is what carries
 * a visitor's choice across page loads, and it is user-writable, so decoding
 * has to survive junk without producing an undefined CSS variable.
 */

describe('a11y store', () => {
  beforeEach(() => {
    resetA11y();
  });

  it('starts at the site’s own presentation', () => {
    expect(get(a11y)).toEqual({
      textScale: 0,
      contrast: false,
      highlightLinks: false,
      readableFont: false
    });
    expect(get(a11yTouched)).toBe(false);
  });

  it('steps through the text sizes and wraps back to normal', () => {
    expect(TEXT_SCALES[0]).toBe(1);

    cycleTextScale();
    expect(get(a11y).textScale).toBe(1);
    expect(get(a11yTouched)).toBe(true);

    cycleTextScale();
    expect(get(a11y).textScale).toBe(2);

    cycleTextScale();
    expect(get(a11y).textScale).toBe(0);
    expect(get(a11yTouched)).toBe(false);
  });

  it('toggles each display preference independently', () => {
    toggleA11y('contrast');
    expect(get(a11y).contrast).toBe(true);
    expect(get(a11y).highlightLinks).toBe(false);
    expect(get(a11y).readableFont).toBe(false);

    toggleA11y('highlightLinks');
    toggleA11y('readableFont');
    expect(get(a11y)).toMatchObject({
      contrast: true,
      highlightLinks: true,
      readableFont: true
    });

    toggleA11y('contrast');
    expect(get(a11y).contrast).toBe(false);
  });

  it('writes the choices onto <html> for the stylesheet to read', () => {
    const root = document.documentElement;

    toggleA11y('contrast');
    toggleA11y('highlightLinks');
    cycleTextScale();

    expect(root.classList.contains('a11y-contrast')).toBe(true);
    expect(root.classList.contains('a11y-links')).toBe(true);
    expect(root.classList.contains('a11y-font')).toBe(false);
    expect(root.style.getPropertyValue('--a11y-text-scale')).toBe(String(TEXT_SCALES[1]));

    resetA11y();
    expect(root.classList.contains('a11y-contrast')).toBe(false);
    expect(root.classList.contains('a11y-links')).toBe(false);
    expect(root.style.getPropertyValue('--a11y-text-scale')).toBe('1');
  });

  it('persists the choices to a cookie', () => {
    cycleTextScale();
    toggleA11y('readableFont');

    const cookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${A11Y_COOKIE}=`));
    expect(cookie).toContain('t1c0l0f1');
  });

  it('resets everything at once', () => {
    cycleTextScale();
    toggleA11y('contrast');
    toggleA11y('highlightLinks');
    toggleA11y('readableFont');
    expect(get(a11yTouched)).toBe(true);

    resetA11y();
    expect(get(a11yTouched)).toBe(false);
    expect(get(a11y).textScale).toBe(0);
  });

  it('never lets the text scale index run past the table', () => {
    // The cookie is user-writable; an out-of-range step would put `undefined`
    // into --a11y-text-scale and collapse every font size on the page.
    for (let i = 0; i < TEXT_SCALES.length * 3; i++) {
      cycleTextScale();
      const { textScale } = get(a11y);
      expect(textScale).toBeGreaterThanOrEqual(0);
      expect(textScale).toBeLessThan(TEXT_SCALES.length);
      expect(TEXT_SCALES[textScale]).toBeTypeOf('number');
    }
  });
});
