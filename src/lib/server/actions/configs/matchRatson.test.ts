import { describe, it, expect } from 'vitest';
import { scoreCandidate } from './matchRatson';
import { productPlace } from '../../concierge/localMatch';

const TIBERIAS = { lat: 32.7922, lng: 35.5312 };
const TEL_AVIV = { lat: 32.0853, lng: 34.7818 };

const wish = {
  needs: [
    { name: 'משלוח מצרכים עד הבית', isResource: false, idx: 0 },
    { name: 'עגלת קניות', isResource: true, idx: 0 }
  ],
  place: { ...TIBERIAS, radius: 10 },
  categoryIds: [],
  categoryLabels: ['מזון'],
  vallues: []
};

function cand(name: string, attrs: any, categoryNames: string[] = []) {
  return {
    name,
    place: productPlace(attrs),
    categoryIds: [],
    categoryNames,
    projectVallues: []
  };
}

describe('matchRatson scoreCandidate', () => {
  it('suggests the local grocery, attached to the delivery need', () => {
    const s = scoreCandidate(cand('משלוח מכולת טבריה', { location: { ...TIBERIAS, radius: 15 } }), wish);
    expect(s).not.toBeNull();
    expect(s!.need).toEqual({ name: 'משלוח מצרכים עד הבית', isResource: false, idx: 0 });
    expect(s!.score).toBeGreaterThanOrEqual(0.25);
  });

  it('never suggests a product that shares no word with any need', () => {
    expect(scoreCandidate(cand('שיעור יוגה', { location: TIBERIAS }, ['מזון']), wish)).toBeNull();
  });

  it('drops a physical product whose delivery area does not reach her', () => {
    expect(
      scoreCandidate(cand('משלוח מצרכים', { location: { ...TEL_AVIV, radius: 20 } }), wish)
    ).toBeNull();
  });

  it('ranks the nearby grocery above the same product with no known place', () => {
    const near = scoreCandidate(cand('משלוח מכולת', { location: { ...TIBERIAS, radius: 15 } }), wish)!;
    const unknown = scoreCandidate(cand('משלוח מכולת', {}), wish)!;
    expect(near.score).toBeGreaterThan(unknown.score);
  });

  it('counts a category label match', () => {
    const plain = scoreCandidate(cand('משלוח מכולת', {}), wish)!;
    const food = scoreCandidate(cand('משלוח מכולת', {}, ['מזון ומשקאות']), wish)!;
    expect(food.catScore).toBe(1);
    expect(food.score).toBeGreaterThan(plain.score);
  });
});
