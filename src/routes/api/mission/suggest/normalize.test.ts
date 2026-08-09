import { describe, it, expect } from 'vitest';
import {
  buildCategory,
  clampNumber,
  HOURS_RANGE,
  VALPH_RANGE,
  type MatchAll
} from './normalize.js';

/** A `matchAllCategories` answer — grouped by STATUS first, category second. */
function matchAll(overrides: Partial<MatchAll> = {}): MatchAll {
  const empty = { skills: [], roles: [], methods: [], missions: [], vallues: [] };
  return {
    matched: { ...empty },
    suggestions: { ...empty },
    newItems: { ...empty },
    ...overrides
  } as MatchAll;
}

describe('buildCategory', () => {
  it('reads the categories out of the status-first shape', () => {
    // The bug this guards: indexing the answer by category instead of status
    // returned undefined, so every suggestion the AI made reached the member's
    // panel as an empty list and "apply all" applied nothing.
    const results = matchAll({
      matched: {
        skills: [{ input: 'ריאקט', status: 'matched', existingId: '7', existingLabel: 'React' }],
        roles: [],
        methods: [],
        missions: [],
        vallues: []
      },
      suggestions: {
        skills: [{ input: 'עיצוב', status: 'suggestion', existingId: '9', existingLabel: 'עיצוב גרפי' }],
        roles: [],
        methods: [],
        missions: [],
        vallues: []
      },
      newItems: {
        skills: [{ input: 'תלת ממד', status: 'new' }],
        roles: [],
        methods: [],
        missions: [],
        vallues: []
      }
    });

    const skills = buildCategory('skills', results, ['ריאקט', 'עיצוב', 'תלת ממד']);

    expect(skills.matched.map((r) => r.existingLabel)).toEqual(['React']);
    expect(skills.suggestions.map((r) => r.existingId)).toEqual(['9']);
    expect(skills.newItems.map((r) => r.input)).toEqual(['תלת ממד']);
  });

  it('maps work-ways through the `methods` namespace', () => {
    const results = matchAll({
      matched: {
        skills: [],
        roles: [],
        methods: [{ input: 'מרחוק', status: 'matched', existingId: '3', existingLabel: 'מרחוק' }],
        missions: [],
        vallues: []
      }
    });

    expect(buildCategory('methods', results, ['מרחוק']).matched).toHaveLength(1);
    expect(buildCategory('skills', results, []).matched).toHaveLength(0);
  });

  it('treats every extracted term as new when there are no match results', () => {
    const skills = buildCategory('skills', null, ['בישול', 'אפייה']);

    expect(skills.matched).toEqual([]);
    expect(skills.suggestions).toEqual([]);
    expect(skills.newItems.map((r) => r.input)).toEqual(['בישול', 'אפייה']);
    // Terms must appear once, not in two buckets: the client concatenates them.
    expect(skills.newItems).toHaveLength(2);
  });
});

describe('clampNumber', () => {
  it('keeps a sensible estimate as-is', () => {
    expect(clampNumber(120, VALPH_RANGE)).toBe(120);
    expect(clampNumber(8, HOURS_RANGE)).toBe(8);
  });

  it('pulls a hallucinated estimate back into the band', () => {
    expect(clampNumber(9_000_000, VALPH_RANGE)).toBe(VALPH_RANGE.max);
    expect(clampNumber(0.01, VALPH_RANGE)).toBe(VALPH_RANGE.min);
    expect(clampNumber(100_000, HOURS_RANGE)).toBe(HOURS_RANGE.max);
  });

  it('reads a number the model wrote as money text', () => {
    expect(clampNumber('₪150', VALPH_RANGE)).toBe(150);
    expect(clampNumber('120 ש"ח', VALPH_RANGE)).toBe(120);
  });

  it('answers null for anything that is not a usable number', () => {
    expect(clampNumber(undefined, VALPH_RANGE)).toBeNull();
    expect(clampNumber(null, VALPH_RANGE)).toBeNull();
    expect(clampNumber('', VALPH_RANGE)).toBeNull();
    expect(clampNumber('לא ידוע', VALPH_RANGE)).toBeNull();
    expect(clampNumber(0, VALPH_RANGE)).toBeNull();
    expect(clampNumber(-5, VALPH_RANGE)).toBeNull();
    expect(clampNumber(Number.NaN, VALPH_RANGE)).toBeNull();
    expect(clampNumber(Number.POSITIVE_INFINITY, VALPH_RANGE)).toBeNull();
  });
});
