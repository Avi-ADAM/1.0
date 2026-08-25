import { describe, it, expect } from 'vitest';
import {
  coinFace,
  FACES,
  RIM_GILT,
  RIM_STROKE,
  RIM_WELL,
  RIM_WELL_ALPHA,
  RIM_WELL_LIFT,
  RIM_WELL_WIDTH
} from './coinSkin.js';
import { RENDERABLE_ANIS } from '../cards/cardKinds.js';

/**
 * The classic skin's whole premise is that it is a *skin* — the same coin, a
 * different face — so it must cover exactly what the plate covers. The failure
 * this guards against is the one the original coin view actually suffered: nine
 * money and consent kinds were added over a year, none of them got a coin, and
 * a member who preferred coins simply never saw a sale claim or a stipend
 * confirmation. That was missed consent, not a missing picture.
 */
describe('coinSkin', () => {
  const faces = new Set(Object.values(FACES));

  it('gives every renderable kind a face', () => {
    for (const ani of RENDERABLE_ANIS) {
      const face = coinFace(ani);
      expect(face, `${ani} has no face`).toBeTruthy();
      expect(faces.has(face), `${ani} points at a face that is not in FACES`).toBe(true);
    }
  });

  it('falls back rather than returning nothing for an unknown kind', () => {
    expect(faces.has(coinFace('somethingNobodyHasWrittenYet'))).toBe(true);
    expect(faces.has(coinFace(undefined))).toBe(true);
  });

  it('keeps the eleven originals on the artwork they were painted with', () => {
    // Harvested from the `{#if cards == false}` branches; when Stage 7 deletes
    // those, this is the only record that these pairings were not invented.
    expect(coinFace('haluk')).toBe(FACES.prismatic); // halukaask
    expect(coinFace('vidu')).toBe(FACES.prismatic); // didiget
    expect(coinFace('mtaha')).toBe(FACES.diamond); // missionInProgress
    expect(coinFace('pmashes')).toBe(FACES.nice); // pmas
    expect(coinFace('pends')).toBe(FACES.pink); // pandingMesima
    expect(coinFace('wegets')).toBe(FACES.flower); // weget
    expect(coinFace('fiapp')).toBe(FACES.newcoin); // fiappru
    expect(coinFace('askedcoin')).toBe(FACES.coin); // reqtojoin
    expect(coinFace('askedm')).toBe(FACES.coinnn); // reqtom
    expect(coinFace('meData')).toBe(FACES.cleen); // projectSuggestor
    expect(coinFace('huca')).toBe(FACES.turkiz); // mashsuggest
    expect(coinFace('hachla')).toBe(FACES.coinnn); // decisionMaking
  });

  it('serves every face over https', () => {
    for (const url of faces) expect(url.startsWith('https://')).toBe(true);
  });

  it('has a gilt ramp the rim gradient can be built from', () => {
    expect(RIM_GILT.length).toBeGreaterThanOrEqual(2);
    for (const stop of RIM_GILT) expect(stop).toMatch(/^#[0-9a-f]{6}$/i);
    expect(RIM_STROKE).toBeTruthy();
  });

  // The rim label is 11px of curved text sitting on a photograph. What makes it
  // readable is not the stroke — it is that every stop of the gilt clears AA
  // against the well, which is the one ground all eleven faces share. A stop
  // quietly darkened back toward the original bronze would look fine in a
  // screenshot of the pale faces and vanish on `diamond`, so it is asserted
  // rather than eyeballed.
  describe('the rim reads on any face', () => {
    /** WCAG relative luminance of a #rrggbb. */
    const lum = (hex: string) => {
      const ch = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
      const lin = ch.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
      return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
    };
    const ratio = (a: number, b: number) =>
      (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

    // The well at RIM_WELL_ALPHA over the brightest face there is (`diamond`
    // is near-white): the worst ground the gilt is ever asked to sit on.
    const worstGround = (() => {
      // sRGB compositing happens on the encoded channels, so composite the
      // channels and take the luminance of the result — not the other way
      // round, which would flatter the dark side by a wide margin.
      const ch = [1, 3, 5].map((i) => {
        const w = parseInt(RIM_WELL.slice(i, i + 2), 16) / 255;
        return w * RIM_WELL_ALPHA + (1 - RIM_WELL_ALPHA); // over white
      });
      const lin = ch.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
      return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
    })();

    it('every gilt stop clears AA against the well on the brightest face', () => {
      for (const stop of RIM_GILT) {
        expect(ratio(lum(stop), worstGround)).toBeGreaterThanOrEqual(4.5);
      }
    });

    it('still alternates, so it reads as metal and not as flat yellow', () => {
      const ls = RIM_GILT.map(lum);
      const swings = ls.slice(1).filter((l, i) => Math.abs(l - ls[i]) > 0.05);
      expect(swings.length).toBeGreaterThanOrEqual(2);
    });

    it('sizes the well from the label, and wide enough to cover a glyph', () => {
      // The label hangs below the path, so the band's centre must move inward.
      expect(RIM_WELL_LIFT).toBeGreaterThan(0);
      // Hanging baseline to descender is ~0.95em; the band covers that plus the
      // stroke, with a little outward for Latin ascender overshoot.
      expect(RIM_WELL_WIDTH).toBeGreaterThan(1.1);
      // …and never so wide that it reaches the middle, where the words are.
      expect(RIM_WELL_WIDTH).toBeLessThan(2);
    });
  });
});
