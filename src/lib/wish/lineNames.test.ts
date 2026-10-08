import { describe, expect, it } from 'vitest';
import { lineIsPart, lineNames } from './lineNames';

const product = {
  matanot_recipe_missions: {
    data: [
      { id: 55, attributes: { notes: 'עיצוב', pendm: { data: { attributes: { name: 'עיצוב האתר' } } } } },
      { id: 56, attributes: { notes: '', pendm: { data: null } } }
    ]
  },
  matanot_recipe_resources: { data: [{ id: 70, attributes: { notes: 'אחסון', pmash: { data: { attributes: { name: 'אחסון' } } } } }] }
};

describe('lineNames — from a BOM line back to its part of the plan', () => {
  it('collects the names a line answers to, per kind', () => {
    expect(lineNames(product)).toEqual({ 'm:55': ['עיצוב', 'עיצוב האתר'], 'r:70': ['אחסון'] });
  });

  it('matches a proposal’s line to the part by name, case and spacing aside', () => {
    const names = lineNames(product);
    expect(lineIsPart(names, 'm', '55', ' עיצוב ')).toBe(true);
    expect(lineIsPart(names, 'm', 55, 'עיצוב האתר')).toBe(true);
    expect(lineIsPart(names, 'r', '70', 'אחסון')).toBe(true);
    // the other kind, another line, no name, no map
    expect(lineIsPart(names, 'r', '55', 'עיצוב')).toBe(false);
    expect(lineIsPart(names, 'm', '56', '')).toBe(false);
    expect(lineIsPart(names, 'm', '99', 'עיצוב')).toBe(false);
    expect(lineIsPart(null, 'm', '55', 'עיצוב')).toBe(false);
  });
});
