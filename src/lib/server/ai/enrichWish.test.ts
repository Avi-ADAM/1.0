import { describe, expect, it, vi } from 'vitest';

vi.mock('../../embed/matcher', () => ({ matchCategory: vi.fn(async () => null) }));

import { fallbackTokens } from './enrichWish';

describe('fallbackTokens (QA C-7)', () => {
  it('splits multi-word terms into the words a skill name may contain', () => {
    expect(fallbackTokens(['טכנאי מחשבים'])).toEqual([
      { token: 'טכנאי', term: 'טכנאי מחשבים' },
      { token: 'מחשבים', term: 'טכנאי מחשבים' }
    ]);
  });

  it('skips single-word terms (already searched whole), short words and repeats', () => {
    expect(fallbackTokens(['נגרות', 'עץ מלא', 'עץ מלא'])).toEqual([{ token: 'מלא', term: 'עץ מלא' }]);
  });

  it('is capped', () => {
    expect(fallbackTokens(['aaa bbb ccc ddd', 'eee fff ggg hhh'], 3)).toHaveLength(3);
  });
});
