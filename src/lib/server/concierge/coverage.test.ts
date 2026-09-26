import { describe, it, expect } from 'vitest';
import { detectGaps, selectGaps, needKey, type CoverageNeed } from './coverage';

const photographer: CoverageNeed = { kind: 'mission', idx: 0, name: 'צלם אירועים', importance: 'must' };
const tent: CoverageNeed = { kind: 'resource', idx: 0, name: 'אוהל גדול', importance: 'nice' };
const catering: CoverageNeed = { kind: 'mission', idx: 1, name: 'קייטרינג חלבי', importance: 'nice' };

const person = (skills: string[], distanceKm: number | null = null) => ({
  id: '1',
  username: 'x',
  avatar: null,
  skills,
  matchedSkills: [],
  projects: [],
  distanceKm
});

describe('detectGaps', () => {
  it('a need nothing inside relates to is uncovered', () => {
    const [c] = detectGaps([photographer], { people: [person(['נגרות'])] });
    expect(c.coverage).toBe('uncovered');
    expect(c.internalCount).toBe(0);
    expect(c.key).toBe('m:0');
  });

  it('a member whose skill names the need covers it', () => {
    const [c] = detectGaps([photographer], { people: [person(['צלם'])] });
    expect(c.coverage).toBe('covered');
  });

  it('a live proposal on the row covers it, by idx or by component id', () => {
    const byIdx = detectGaps([photographer], null, [
      { status: 'suggested', missionKeys: ['0'], resourceKeys: [] }
    ]);
    expect(byIdx[0].coverage).toBe('covered');
    const byId = detectGaps([{ ...photographer, componentId: 77 }], null, [
      { status: 'accepted', missionKeys: ['77'], resourceKeys: [] }
    ]);
    expect(byId[0].coverage).toBe('covered');
  });

  it('a rejected proposal does not count', () => {
    const [c] = detectGaps([photographer], null, [
      { status: 'rejected', missionKeys: ['0'], resourceKeys: [] }
    ]);
    expect(c.coverage).toBe('uncovered');
  });

  it('a mission proposal does not cover the resource row with the same idx', () => {
    const [c] = detectGaps([tent], null, [{ status: 'suggested', missionKeys: ['0'], resourceKeys: [] }]);
    expect(c.coverage).toBe('uncovered');
  });

  it('a loose relation is weak', () => {
    const [c] = detectGaps([{ ...photographer, name: 'צלם אירועים ורחפן' }], {
      people: [person(['רחפן'])]
    });
    // 1 of 3 words — related, below the strong bar.
    expect(c.coverage).toBe('weak');
    expect(c.internalCount).toBe(1);
  });

  it('with a place, an unlocated provider is only weak', () => {
    const place = { lat: 32.8, lng: 35.0, radius: 10, isOnline: false };
    const unlocated = detectGaps([photographer], { people: [person(['צלם'], null)] }, [], place);
    expect(unlocated[0].coverage).toBe('weak');
    const near = detectGaps([photographer], { people: [person(['צלם'], 3.2)] }, [], place);
    expect(near[0].coverage).toBe('covered');
  });

  it('free resources answer resource rows, not mission rows', () => {
    const enrichment = {
      resources: [
        {
          id: '9',
          name: 'אוהל גדול לאירועים',
          template: null,
          price: null,
          kindOf: null,
          ownerId: null,
          ownerName: null,
          ownerAvatar: null,
          project: null,
          matchedTerm: 'אוהל'
        }
      ]
    };
    const out = detectGaps([tent, { ...photographer, name: 'אוהל' }], enrichment);
    expect(out[0].coverage).toBe('covered');
    expect(out[1].coverage).toBe('uncovered');
  });

  it('skips nameless needs', () => {
    expect(detectGaps([{ ...photographer, name: '  ' }], null)).toEqual([]);
  });
});

describe('selectGaps', () => {
  it('spends the budget on musts, then uncovered, then plan order', () => {
    const all = detectGaps([catering, tent, photographer], null);
    const picked = selectGaps(all, 2);
    expect(picked.map((g) => g.key)).toEqual([needKey('mission', 0), needKey('mission', 1)]);
  });

  it('never selects covered needs', () => {
    const all = detectGaps([photographer], { people: [person(['צלם'])] });
    expect(selectGaps(all, 4)).toEqual([]);
  });
});
