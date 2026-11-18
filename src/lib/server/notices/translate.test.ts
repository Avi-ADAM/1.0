import { describe, it, expect } from 'vitest';
import { fillTemplate, serverTranslator } from './translate';

const plural = '{{count; 1:one mission; default:{{count}} missions;}}';
const ru =
  '{{count; 1:{{count}} задача; 2:{{count}} задачи; 3:{{count}} задачи; 4:{{count}} задачи; default:{{count}} задач;}}';

describe('fillTemplate — the page parser on the server', () => {
  it('plain {{name}} placeholders, as before', () => {
    expect(fillTemplate('Hi {{name}}, {{count}} left', { name: 'Dana', count: 3 }, 'en')).toBe(
      'Hi Dana, 3 left'
    );
  });

  it('a missing or null value prints nothing, never "null" or the braces', () => {
    expect(fillTemplate('[{{name}}]', {}, 'en')).toBe('[]');
    expect(fillTemplate('[{{name}}]', { name: null }, 'en')).toBe('[]');
  });

  it('eq / default modifiers pick singular and plural', () => {
    expect(fillTemplate(plural, { count: 1 }, 'en')).toBe('one mission');
    expect(fillTemplate(plural, { count: 0 }, 'en')).toBe('0 missions');
    expect(fillTemplate(plural, { count: 7 }, 'en')).toBe('7 missions');
  });

  it('carries the Russian 1 / 2-4 / 5+ forms', () => {
    expect(fillTemplate(ru, { count: 1 }, 'ru')).toBe('1 задача');
    expect(fillTemplate(ru, { count: 3 }, 'ru')).toBe('3 задачи');
    expect(fillTemplate(ru, { count: 5 }, 'ru')).toBe('5 задач');
  });

  it('the shared `plural` modifier follows the locale’s CLDR rules', () => {
    const tpl =
      '{{count:plural; one:{{count}} час; few:{{count}} часа; many:{{count}} часов; other:{{count}} часа;}}';
    expect(fillTemplate(tpl, { count: 1 }, 'ru')).toBe('1 час');
    expect(fillTemplate(tpl, { count: 3 }, 'ru')).toBe('3 часа');
    expect(fillTemplate(tpl, { count: 11 }, 'ru')).toBe('11 часов');
    expect(fillTemplate(tpl, { count: 21 }, 'ru')).toBe('21 час');
    expect(fillTemplate(tpl, { count: 1.5 }, 'ru')).toBe('1.5 часа');
  });

  it('reads the converted strings from the real JSON, singular and plural', () => {
    const en = serverTranslator('en');
    expect(en('lev.list.fact.hours', { value: 1 })).toBe('1 hour');
    expect(en('lev.list.fact.hours', { value: 6 })).toBe('6 hours');
    expect(en('notices.lev.addHours', { who: 'Dana', count: 1, item: 'X', rikma: 'R' })).toBe(
      'Request from Dana to add 1 hour to "X" in the rikma "R"'
    );
    expect(en('server.error.wishUnassignedParts', { count: 1 })).toMatch(/^1 part still has /);
    expect(en('server.error.wishUnassignedParts', { count: 2 })).toMatch(/^2 parts still have /);
    expect(en('shop.cancel.inSplit', { count: 1 })).toMatch(/^1 sale is already in a split\. It won't change/);

    const ru = serverTranslator('ru');
    expect(ru('lev.list.fact.members', { value: 1 })).toBe('1 партнёр');
    expect(ru('lev.list.fact.members', { value: 3 })).toBe('3 партнёра');
    expect(ru('lev.list.fact.members', { value: 5 })).toBe('5 партнёров');
  });

  it('no braces left in any string the server namespaces render with a count', () => {
    for (const lang of ['en', 'ru']) {
      const out = serverTranslator(lang)('lev.list.fact.hours', { value: 1, count: 1 });
      expect(out).not.toMatch(/[{}]/);
    }
  });
});
