import { describe, it, expect } from 'vitest';
import { coinFace, FACES, RIM_GILT, RIM_STROKE } from './coinSkin.js';
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
});
