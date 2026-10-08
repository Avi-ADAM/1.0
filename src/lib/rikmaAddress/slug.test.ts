import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  formerSlugList,
  formerSlugToken,
  nextFormerSlugs,
  normalizeSlugInput,
  slugFromPath,
  suggestSlug,
  validateSlug
} from './slug.js';
import { RESERVED_SLUGS } from './reserved.js';
import { rikmaPath, rikmaUrl } from './rikmaUrl.js';

describe('validateSlug', () => {
  it.each([
    ['bees', 'bees'],
    ['  Bees Of Galilee ', 'bees-of-galilee'],
    ['hadar_2026', 'hadar-2026'],
    ['a1b', 'a1b'],
    // punycode's double hyphen is collapsed before it can mean anything
    ['xn--bees', 'xn-bees']
  ])('accepts %j as %j', (raw, slug) => {
    expect(validateSlug(raw)).toEqual({ ok: true, slug });
  });

  it.each([
    ['', 'empty'],
    ['ab', 'tooShort'],
    ['x'.repeat(41), 'tooLong'],
    ['דבורים', 'chars'],
    [`b${String.fromCharCode(0x435)}es`, 'chars'], // a Cyrillic look-alike e
    ['-bees', 'edgeHyphen'],
    ['bees-', 'edgeHyphen'],
    ['2026', 'digitsOnly'],
    ['www', 'reserved'],
    ['consensus', 'reserved'],
    ['he', 'tooShort'],
    ['leumi-help', 'review'],
    ['my-bank', 'review'],
    ['securepay', 'review']
  ])('refuses %j (%s)', (raw, problem) => {
    expect(validateSlug(raw)).toMatchObject({ ok: false, problem });
  });

  it('does not flag a short review word inside an ordinary word', () => {
    expect(validateSlug('habit-tracker')).toMatchObject({ ok: true });
    expect(validateSlug('rabbit-farm')).toMatchObject({ ok: true });
  });

  it('never accepts a non-ASCII, punycode, edge-hyphen or reserved slug', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 50 }), (raw) => {
        const r = validateSlug(raw);
        if (!r.ok) return true;
        return (
          /^[a-z0-9-]{3,40}$/.test(r.slug) &&
          !r.slug.includes('--') &&
          !r.slug.startsWith('-') &&
          !r.slug.endsWith('-') &&
          !RESERVED_SLUGS.has(r.slug) &&
          slugFromPath(r.slug) === r.slug
        );
      })
    );
  });

  it('is idempotent through normalizeSlugInput', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 50 }), (raw) => {
        const once = normalizeSlugInput(raw);
        return normalizeSlugInput(once) === once;
      })
    );
  });
});

describe('slugFromPath', () => {
  it('lowercases and refuses what cannot be a slug', () => {
    expect(slugFromPath('Bees')).toBe('bees');
    expect(slugFromPath('a--b')).toBeNull();
    expect(slugFromPath('../x')).toBeNull();
    expect(slugFromPath('')).toBeNull();
  });
});

describe('former slugs', () => {
  it('adds the previous address and drops the new one', () => {
    expect(nextFormerSlugs(null, null, 'bees')).toBeNull();
    expect(nextFormerSlugs(null, 'bees', 'bees-galil')).toBe(' bees ');
    expect(nextFormerSlugs(' bees ', 'bees-galil', 'bees')).toBe(' bees-galil ');
    expect(formerSlugList(' a-1 b-2 ')).toEqual(['a-1', 'b-2']);
  });

  it('every stored former slug is found by its token', () => {
    fc.assert(
      fc.property(
        fc.array(fc.stringMatching(/^[a-z0-9]{3,10}$/), { maxLength: 6 }),
        (slugs) => {
          let stored: string | null = null;
          let current: string | null = null;
          for (const s of slugs) {
            stored = nextFormerSlugs(stored, current, s);
            current = s;
          }
          return formerSlugList(stored).every((s) => (stored ?? '').includes(formerSlugToken(s)));
        }
      )
    );
  });
});

describe('suggestSlug', () => {
  it('transliterates a name into a valid starting point, or gives up', () => {
    expect(suggestSlug('Bees of Galilee!')).toBe('bees-of-galilee');
    expect(suggestSlug('Пчёлы')).toMatch(/^[a-z-]+$/);
    expect(validateSlug(suggestSlug('רקמת הדבורים')).ok || suggestSlug('רקמת הדבורים') === '').toBe(true);
    expect(suggestSlug('!!!')).toBe('');
  });
});

describe('rikmaPath / rikmaUrl', () => {
  it('uses the slug when there is one', () => {
    expect(rikmaPath({ id: 7, slug: 'bees' })).toBe('/r/bees');
    expect(rikmaPath({ id: 7, slug: null })).toBe('/project/7');
    expect(rikmaPath({ id: 7, slug: 'Not Valid' })).toBe('/project/7');
    expect(rikmaUrl({ id: 7, slug: 'bees' }, { lang: 'en' })).toBe('https://www.1lev1.com/r/bees?lang=en');
    expect(rikmaUrl({ id: 7, slug: 'bees' }, { lang: 'he' })).toBe('https://www.1lev1.com/r/bees');
  });
});
