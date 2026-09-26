import { describe, expect, it } from 'vitest';
import { matchCategories, normalizeCategoryName } from './categories.js';

const catalog = [
  { id: '1', names: ['אירועים', 'Events', 'فعاليات'] },
  { id: '2', names: ['אוכל', 'Food', 'الطعام'] },
  { id: '3', names: ['בריאות'] }
];

describe('normalizeCategoryName', () => {
  it('folds case, spacing, punctuation and a definite article', () => {
    expect(normalizeCategoryName('  EVENTS! ')).toBe('events');
    expect(normalizeCategoryName('האירועים')).toBe(normalizeCategoryName('אירועים'));
    expect(normalizeCategoryName('الطعام')).toBe('طعام');
    // A short word keeps its first letter: "הר" is not "ר".
    expect(normalizeCategoryName('הר')).toBe('הר');
  });
});

describe('matchCategories', () => {
  it('matches in any language to the default-locale id, once', () => {
    expect(matchCategories(['Events', 'האירועים', 'food'], catalog)).toEqual({ ids: ['1', '2'], missing: [] });
    expect(matchCategories(['طعام'], catalog).ids).toEqual(['2']);
  });

  it('returns what matches nothing, deduplicated, first spelling kept', () => {
    expect(matchCategories(['טיולים', 'Travel', 'טיולים ', 'בריאות'], catalog)).toEqual({
      ids: ['3'],
      missing: ['טיולים', 'Travel']
    });
  });

  it('ignores blanks', () => {
    expect(matchCategories(['', '  ', '!!'], catalog)).toEqual({ ids: [], missing: [] });
  });
});
