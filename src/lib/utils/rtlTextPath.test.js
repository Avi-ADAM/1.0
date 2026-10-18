import { describe, it, expect } from 'vitest';
import { hasRtl } from './rtlTextPath.js';

/**
 * The one thing every WebKit workaround in this module agrees on is *which*
 * strings need it, and that decision is `hasRtl` — it gates the profile
 * badges' pre-reversed text and the heart's centre plaque (which drops its
 * letter-spacing for a name that reads right to left, because WebKit splits a
 * tracked RTL run into per-character fragments and paints it backwards).
 *
 * It is the text's own script that decides, never the locale: a Latin name
 * inside a Hebrew session must keep the designed tracking.
 */
describe('hasRtl', () => {
  it('sees Hebrew and Arabic, including with a name that also has Latin in it', () => {
    expect(hasRtl('אבי')).toBe(true);
    expect(hasRtl('אבי אדום')).toBe(true);
    expect(hasRtl('אבי Adam')).toBe(true);
    expect(hasRtl('محمد')).toBe(true);
  });

  it('is false for Latin, digits, and anything that is not a string', () => {
    expect(hasRtl('Avi Adam')).toBe(false);
    expect(hasRtl('Avi 2')).toBe(false);
    expect(hasRtl('')).toBe(false);
    expect(hasRtl(undefined)).toBe(false);
    expect(hasRtl(null)).toBe(false);
  });
});
